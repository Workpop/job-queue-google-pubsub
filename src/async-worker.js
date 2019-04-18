import { partial } from 'lodash';
// eslint-disable-next-line no-unused-vars
import { PubSub, Subscription, Message } from '@google-cloud/pubsub';
// eslint-disable-next-line no-unused-vars
import { ClientConfig } from '@google-cloud/pubsub/build/src/pubsub';
import { log as logger } from './log';
import { JobProcessedStatus } from './status';

/** @type {Function} */
const log = partial(logger, 'JOB-WORKER');

// eslint-disable-next-line import/prefer-default-export
export class AsyncWorker {
  /** @type { PubSub } */
  _pubsubClient;
  /** @type { Subscription } */
  _subscription;
  /** @type { (arg0: any) => Promise<{ status: number }> } */
  _jobHandler;
  /** @type { boolean } */
  _stopped;
  /** @type { (arg0: (value?: any) => void) => void } */
  _processingRateConfigUpdateCallback;
  /** @type { number } */
  _batchSize;
  /** @type { (message: Message) => void } */
  _listener;
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
  constructor(queueConfig, subscriptionConfig, jobHandler) {
    this._pubsubClient = new PubSub(queueConfig);
    this._batchSize = subscriptionConfig.batchSize || 1;
    const topic = this._pubsubClient.topic(subscriptionConfig.topic);
    this._subscription = topic.subscription(subscriptionConfig.subscription, {
      ackDeadline: this._ackDeadline,
      flowControl: {
        maxMessages: this._batchSize,
        allowExcessMessages: false,
      },
    });
    this._jobHandler = jobHandler;
    this._stopped = true;
  }

  start() {
    this._stopped = false;
    // add listener to the message event
    if (this._startPromise === undefined) {
      this._listener = (message) => { return this._processNextMessage(message); };
      this._subscription.on('message', this._listener);
      this._startPromise = new Promise((resolve) => {
        this._workerResolve = resolve;
      });
    }
    return this._startPromise;
  }

  stop() {
    this._stopped = true;
    if (this._listener !== undefined) {
      this._subscription.removeListener('message', this._listener);
      this._listener = undefined;
      this._subscription.close();
    }
    if (this._workerResolve !== undefined) {
      this._workerResolve('Worker has been stopped');
      this._workerResolve = undefined;
    }
    this._startPromise = undefined;
    log('WARN', 'Stop worker has been issued');
  }

  /**
   * @param {Message} message
   */
  static _ack(message) {
    log('TRACE', 'ack', message.ackId);
    message.ack();
  }

  /**
   * @param {Message} message
   */
  static _nack(message) {
    log('TRACE', 'nack', message.ackId);
    message.nack();
  }

  /**
   * @param {Message} message
   */
  _processNextMessage(message) {
    // parse the message data if json
    let contents = message.data.toString();
    if (contents.length > 0 &&
      (contents[0] === '{' || contents[0] === '[' || contents[0] === '"')) {
      contents = JSON.parse(contents);
    }
    // process the job
    this._jobHandler(contents).then(() => {
      // handled job successfully
      AsyncWorker._ack(message);
    }).catch((result) => {
      // there was an error processing the job

      log('ERROR', 'Error Processing Job', result);
      // if we don't want to retry job, then remove from queue
      if (result.status !== JobProcessedStatus.failedRetryRequested) {
        AsyncWorker._ack(message);
      } else {
        AsyncWorker._nack(message);
      }
    });
  }
}
