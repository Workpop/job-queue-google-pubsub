import { v1 } from '@google-cloud/pubsub';
import { Status } from '@grpc/grpc-js/build/src/constants';
import { Backoff, fibonacci } from 'backoff';
import { GoogleAuth } from 'google-auth-library';
import {
  first, get, isFunction, map,
} from 'lodash';
import { getContent } from './get-content';
import { error, trace, warn } from './log';
import { JobProcessedStatus } from './status';
import { IQueueConfig, IWorkerConfig } from './types';

export class SyncWorker {
  /**
   * @summary Deadline to acknoledge message in seconds
   *          before it is re-delivered to another subscriber
   */
  private static _ackDeadline = 30;

  private _client: {
    pull(request: {}): Promise<[{receivedMessages: any[]}]>;
    acknowledge(request: {}): Promise<{}>;
    modifyAckDeadline(request: {}): Promise<{}>
  };

  private _subscription: string;

  private _jobHandler: (message: any) => Promise<{ status: number }>;

  private _stopped: boolean;

  private _batchSize: number;

  private _delayTimeMS: number;

  private _processingRateConfigUpdateCallback: (cb: (arg0: any) => void) => void;

  private _workerResolve: (value?: any | PromiseLike<any>) => void;

  private _backoff: Backoff;

  private _queueConfig: IQueueConfig;

  constructor(queueConfig: IQueueConfig,
              subscriptionConfig: IWorkerConfig,
              jobHandler: (message: any) => Promise<{ status: number }>,
              processingRateConfigUpdateCallback: (cb: (arg0: any) => void) => void) {
    this._queueConfig = queueConfig;
    this._batchSize = subscriptionConfig.batchSize || 1;
    this._delayTimeMS = 100;
    this._subscription = subscriptionConfig.subscription;
    this._jobHandler = jobHandler;
    this._stopped = true;
    this._processingRateConfigUpdateCallback = processingRateConfigUpdateCallback;
    this._backoff = fibonacci();
    this._backoff.on('backoff', this._backoffRetry.bind(this));

    this._updateProcessingRateConfig = this._updateProcessingRateConfig.bind(this);
  }

  public start() {
    this._stopped = false;
    this._initClient();
    this._processNextMessages();
    return new Promise((resolve) => {
      this._workerResolve = resolve;
    });
  }

  public stop() {
    this._stopped = true;
    warn('Stop worker has been issued');
  }

  private _acknowledge(ackId: string) {
    trace('ack', ackId);
    const ackRequest = {
      ackIds: [ackId],
      subscription: this._subscription,
    };
    // ..acknowledges the message.
    this._client.acknowledge(ackRequest)
      .catch((reason: any) => {
        error('ack', reason);
      });
  }

  private _updateProcessingRateConfig() {
    if (isFunction(this._processingRateConfigUpdateCallback)) {
      return new Promise((resolve) => {
        return this._processingRateConfigUpdateCallback(resolve);
      }).then((newConfig) => {
        this._delayTimeMS = get(newConfig, 'delayTimeMS', this._delayTimeMS);
        this._batchSize = get(newConfig, 'batchSize', this._batchSize);
      },
      (e) => {
        error('Unexpected error from processingRateConfigUpdateCallback, continuing.', e);
      });
    }
    return Promise.resolve();
  }

  private _processNextMessages() {

    this._updateProcessingRateConfig()
      .then(() => {
        const request = {
          maxMessages: this._batchSize,
          returnImmediately: false,
          subscription: this._subscription,
        };
        return this._client.pull(request);
      })
      .then((data) => {
        const response = first(data);
        return Promise.all(
          map(response.receivedMessages, (message) => {
            return this._processMessage(message);
          }),
        );
      })
      .then(() => this._reschedule(),
        (err) => {
          if (err.code === Status.DEADLINE_EXCEEDED ||
            err.code === Status.RESOURCE_EXHAUSTED ||
            err.code === Status.UNAVAILABLE) {
            // timeout waiting for a message or other transient error
            this._initClient();
            this._reschedule(err);
            return;
          }
          if (err.code === Status.INTERNAL ||
            err.code === Status.ABORTED ||
            err.code === Status.CANCELLED) {
            // unexpected transient error, log and continue
            error('Unexpected error: ', err.code, err);
            this._reschedule(err);
            return;
          }
          error('Exiting:', err);
          // mark the worker as stopped and resolve the worker promise with the error
          this._stopped = true;
          if (this._workerResolve !== undefined) {
            this._workerResolve(err);
          }
          this._workerResolve = undefined;
          this._backoff.reset();
        });
  }

  private _reschedule(err?: Error) {
    if (this._stopped) {
      if (this._workerResolve !== undefined) {
        this._workerResolve('Worker has been stopped');
      }
      this._backoff.reset();
    } else if (err) {
        this._backoff.backoff(err);
    } else {
      // reschedule after success call, reset backoff and set timeout
      this._backoff.reset();
      setTimeout(() => this._processNextMessages(), this._delayTimeMS);
    }
  }

  private _backoffRetry(retry: number, delay: number) {
    trace(`${retry} retrying after ${delay}ms`);
    this._processNextMessages();
  }

  /**
   * @param {{ ackId: string; message: { messageId: string; data: Buffer; attributes: any; }}} message
   */
  private _processMessage(message: { ackId: string; message: { messageId: string; data: Buffer; attributes: any; }}) {
    const { ackId } = message;
    const contents = getContent(message.message.data, message.message.attributes);
    let completed = false;
    // make sure to extend the deadline while message is still being processed
    const extendAckDeadline = () => {
      if (!completed) {
        // If the message is not yet processed..
        const modifyAckRequest = {
          ackDeadlineSeconds: SyncWorker._ackDeadline,
          ackIds: [ackId],
          subscription: this._subscription,
        };

        // ..reset its ack deadline.
        this._client.modifyAckDeadline(modifyAckRequest)
          .catch((reason: any) => {
            error('modifyAck', reason);
          });

        trace(`Reset ack deadline for "${message.message.messageId}" for ${SyncWorker._ackDeadline}s.`);
        // Re-schedule this every 10 seconds until processing the message completes
        setTimeout(() => extendAckDeadline(), 10000);
      }
    };
    // Schedule the extendAckDeadline helper
    setTimeout(() => extendAckDeadline(), 10000);

    // process the job
    return this._jobHandler(contents).then(
      (result) => {
        completed = true;
        // handled job successfully
        this._acknowledge(ackId);
        return result;
      },
      (err) => {
        completed = true;
        // there was an error processing the job

        error('Error Processing Job', err);
        // if we don't want to retry job, then remove from queue
        if (err.status !== JobProcessedStatus.failedRetryRequested) {
          this._acknowledge(ackId);
        }

        return Promise.resolve(error);
      },
    );
  }

  private _initClient() {
    // specify auth explicitly https://github.com/googleapis/nodejs-pubsub/issues/318#issuecomment-499915917
    this._client = new v1.SubscriberClient({ ...this._queueConfig, auth: new GoogleAuth(this._queueConfig) });
  }
}
