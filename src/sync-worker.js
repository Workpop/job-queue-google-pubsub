import { get, first, isFunction, map, partial } from 'lodash';
// eslint-disable-next-line no-unused-vars
import { ClientConfig } from '@google-cloud/pubsub/build/src/pubsub';
import { log as logger } from './log';
import { JobProcessedStatus } from './status';

const pubsub = require('@google-cloud/pubsub');

/** @type {Function} */
const _log = partial(logger, 'JOB-WORKER');

// eslint-disable-next-line import/prefer-default-export
export class SyncWorker {
  /**
   * @summary Deadline to acknoledge message in seconds
   *          before it is re-delivered to another subscriber
   **/
  _ackDeadline = 30;

  /**
    * @param { ClientConfig } queueConfig
    * @param { {topic: string, subscription: string, batchSize?: number} } subscriptionConfig
    * @param { (arg0: any) => Promise<{ status: number }> } jobHandler
    */
  constructor(queueConfig, subscriptionConfig, jobHandler, processingRateConfigUpdateCallback) {
    // @ts-ignore
    this._client = new pubsub.v1.SubscriberClient(queueConfig);
    this._batchSize = subscriptionConfig.batchSize || 1;
    this._delayTimeMS = 100;
    this._subscription = subscriptionConfig.subscription;
    this._jobHandler = jobHandler;
    this._stopped = true;
    this._processingRateConfigUpdateCallback = processingRateConfigUpdateCallback;

    this._updateProcessingRateConfig = this._updateProcessingRateConfig.bind(this);
  }

  /**
   * @param {string} ackId
   */
  _acknowledge(ackId) {
    _log('TRACE', 'ack', ackId);
    const ackRequest = {
      subscription: this._subscription,
      ackIds: [ackId],
    };
    //..acknowledges the message.
    this._client.acknowledge(ackRequest).catch((reason) => {
      _log('ERROR', 'ack', reason);
    });
  }

  _updateProcessingRateConfig() {
    if (isFunction(this._processingRateConfigUpdateCallback)) {
      return new Promise((resolve) => {
        this._processingRateConfigUpdateCallback(resolve);
      }).then((newConfig) => {
        this._delayTimeMS = get(newConfig, 'delayTimeMS', this._delayTimeMS);
        this._batchSize = get(newConfig, 'batchSize', this._batchSize);
      },
      (e) => {
        _log('ERROR', 'Unexpected error from processingRateConfigUpdateCallback, continuing.', e);
      });
    }
    return Promise.resolve();
  }

  _processNextMessages() {
    const reschedule = () => {
      if (this._stopped) {
        if (this._workerResolve !== undefined) {
          this._workerResolve('Worker has been stopped');
        }
      } else {
        setTimeout(() => { return this._processNextMessages(); }, this._delayTimeMS);
      }
    };

    this._updateProcessingRateConfig()
      .then(() => {
        const request = {
          subscription: this._subscription,
          maxMessages: this._batchSize,
          returnImmediately: false,
        };
        return this._client.pull(request);
      })
      .then((data) => {
        const response = first(data);
        return Promise.all(
          map(response.receivedMessages, (message) => {
            return this._processMessage(message);
          }));
      })
      .then(reschedule,
      (err) => {
        if (err.code === 4) {
          // timeout waiting for a message
          reschedule();
          return;
        }
        _log('ERROR', 'Exiting:', err);
      });
  }

  /**
   * @param {{ ackId: string; message: { messageId: string; data: any; }}} message
   */
  _processMessage(message) {
    const ackId = message.ackId;
    let contents = message.message.data.toString();
    if (contents.length > 0 &&
      (contents[0] === '{' || contents[0] === '[' || contents[0] === '"')) {
      contents = JSON.parse(contents);
    }
    let completed = false;
    // make sure to extend the deadline while message is still being processed
    const extendAckDeadline = () => {
      if (!completed) {
        // If the message is not yet processed..
        const modifyAckRequest = {
          subscription: this._subscription,
          ackIds: [ackId],
          ackDeadlineSeconds: this._ackDeadline,
        };

        //..reset its ack deadline.
        this._client.modifyAckDeadline(modifyAckRequest)
          .catch((reason) => {
            _log('ERROR', 'modifyAck', reason);
          });

        _log('TRACE',
          `Reset ack deadline for "${message.message.messageId}" for ${this._ackDeadline}s.`
        );
        // Re-schedule this every 10 seconds until processing the message completes
        setTimeout(() => { return extendAckDeadline(); }, 10000);
      }
    };
    // Schedule the extendAckDeadline helper
    setTimeout(() => { return extendAckDeadline(); }, 10000);

    // process the job
    return this._jobHandler(contents).then(
      (result) => {
        completed = true;
        // handled job successfully
        this._acknowledge(ackId);
        return result;
      },
      (error) => {
        completed = true;
        // there was an error processing the job

        _log('ERROR', 'Error Processing Job', error);
        // if we don't want to retry job, then remove from queue
        if (error.status !== JobProcessedStatus.failedRetryRequested) {
          this._acknowledge(ackId);
        }

        return Promise.resolve(error);
      });
  }

  start() {
    this._stopped = false;
    this._processNextMessages();
    return new Promise((resolve) => {
      this._workerResolve = resolve;
    });
  }

  stop() {
    this._stopped = true;
    _log('WARN', 'Stop worker has been issued');
  }
}