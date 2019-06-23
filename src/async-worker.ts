import { Message, PubSub, Subscription } from '@google-cloud/pubsub';
import { getContent } from './get-content';
import { error, trace, warn } from './log';
import { JobProcessedStatus } from './status';
import { IQueueConfig, IWorkerConfig } from './types';

export class AsyncWorker {
  /**
   * @summary Deadline to acknoledge message in seconds
   *          before it is re-delivered to another subscriber
   */
  private static _ackDeadline = 30;

  private static _ack(message: Message) {
    trace('ack', message.ackId);
    message.ack();
  }

  private static _nack(message: Message) {
    trace('nack', message.ackId);
    message.nack();
  }

  private _pubsubClient: PubSub;

  private _subscription: Subscription;

  private _jobHandler: (message: any) => Promise<{ status: number }>;

  private _stopped: boolean;

  private _batchSize: number;

  private _listener: (message: Message) => void;

  private _config: IWorkerConfig;

  private _startPromise: Promise<void>;

  private _workerResolve: (value?: void | PromiseLike<void>) => void;

  constructor(queueConfig: IQueueConfig,
              subscriptionConfig: IWorkerConfig,
              jobHandler: (message: any) => Promise<{ status: number }>) {
    this._pubsubClient = new PubSub(queueConfig);
    this._batchSize = subscriptionConfig.batchSize || 1;
    this._config = subscriptionConfig;
    const topic = this._pubsubClient.topic(subscriptionConfig.topic);
    this._subscription = topic.subscription(subscriptionConfig.subscription, {
      ackDeadline: AsyncWorker._ackDeadline,
      flowControl: {
        allowExcessMessages: false,
        maxMessages: this._batchSize,
      },
    });
    this._jobHandler = jobHandler;
    this._stopped = true;
    this._errorHandler = this._errorHandler.bind(this);
    this._closeHandler = this._closeHandler.bind(this);
  }

  public start() {
    this._stopped = false;
    // add listener to the message event
    if (this._startPromise === undefined) {
      this._startPromise = new Promise((resolve) => {
        this._workerResolve = resolve;
      });
      this._createSubscriptionAndAttachListeners();
    }
    return this._startPromise;
  }

  public stop() {
    this._stop('Worker has been stopped');
    this._closeHandler();
    this._subscription.close();
    warn('Stop worker has been issued');
  }

  private _stop(message: any) {
    this._stopped = true;
    if (this._workerResolve !== undefined) {
      this._workerResolve(message);
      this._workerResolve = undefined;
    }
    this._startPromise = undefined;
  }

  private _createSubscriptionAndAttachListeners() {
    this._listener = (message) => this._processNextMessage(message);
    this._subscription.get({ autoCreate: true })
      .then(() => {
        trace(`Started listening for messages on ${this._config.subscription}`);
        this._subscription.on('message', this._listener);
        this._subscription.on('error', this._errorHandler);
        this._subscription.on('close', this._closeHandler);
      }, (err) => {
        // Unable to get the subscription, bail out
        error('Error getting subscription', err);
        this._stop(error);
      });
  }

  private _processNextMessage(message: Message) {
    // parse the message data if json
    const contents = getContent(message.data, message.attributes);
    // process the job
    this._jobHandler(contents).then(() => {
      // handled job successfully
      AsyncWorker._ack(message);
    }).catch((err) => {
      // there was an error processing the job

      error('Error Processing Job', err);
      // if we don't want to retry job, then remove from queue
      if (err.status !== JobProcessedStatus.failedRetryRequested) {
        AsyncWorker._ack(message);
      } else {
        AsyncWorker._nack(message);
      }
    });
  }

  private _errorHandler(err: any) {
    error(`Error receiving messages for ${this._config.subscription}`, err);
  }

  private _closeHandler() {
    this._subscription.removeListener('error', this._errorHandler);
    this._subscription.removeListener('close', this._closeHandler);

    if (this._listener !== undefined) {
      this._subscription.removeListener('message', this._listener);
      this._listener = undefined;
    }

    // restart listener if not stopped
    if (!this._stopped) {
      this._createSubscriptionAndAttachListeners();
    }
  }
}
