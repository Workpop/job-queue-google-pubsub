// @flow
import { first, map, partial, isFunction, get } from 'lodash';
import log from './log';
import { msleep } from 'sleep';

const pubsub = require('@google-cloud/pubsub');

const _log = partial(log, 'JOB-WORKER');

export const JobProcessedStatus = {
  failed: -1,
  failedRetryRequested: 0,
  ok: 1,
};

export class JobQueueWorker {
  pubsubClient: Object;
  subscription: Object;
  jobHandler: Function;
  stopped: boolean;

  constructor(queueConfig: Object = {}, subscriptionConfig: Object = {}, jobHandler: Function, delayTimeMS: number, batchSize: number, delayCallback: ?Function) {
    this.pubsubClient = pubsub(queueConfig);
    const topic = this.pubsubClient.topic(subscriptionConfig.topic);
    this.subscription = topic.subscription(subscriptionConfig.subscription);
    this.jobHandler = jobHandler;
    this.stopped = false;
    this.delayCallback = delayCallback;
    this.batchSize = batchSize;
    this.delayTimeMS = delayTimeMS;
  }

  _acknowledge(ackId: string) {
    _log('TRACE', 'ack', ackId);
    this.subscription.ack(ackId);
  }

  _processNextMessages(): Promise<*> {
    const self = this;
    const opts = {
      maxResults: this.batchSize,
    };

    _log('TRACE', 'Polling Job Queue...');
    return self.subscription.pull(opts)
    .then((data: Array<*>): Promise<*> => {
      const messages = first(data);
      return Promise.all(map(messages, (message: Object): Promise<*> => {
        const ackId = message.ackId;
        const messageContent = message.data;
        // process the job
        return self.jobHandler(messageContent).then((result: Object): Promise<*> => {
          // handled job successfully

          self._acknowledge(ackId);
          return Promise.resolve(result);
        }).catch((result: Object): Promise<*> => {
          // there was an error processing the job

          _log('ERROR', 'Error Processing Job', result);
          // if we don't want to retry job, then remove from queue
          if (result.status !== JobProcessedStatus.failedRetryRequested) {
            self._acknowledge(ackId);
          }

          return Promise.resolve(result);
        });
      }));
    }).then((): Promise<*> => {

      if (self.stopped) {
        return Promise.reject('Worker has been stopped');
      }

      if (isFunction(this.delayCallback)) {
        const newConfig = this.delayCallback();
        this.delayTimeMS = get(newConfig, 'delayTimeMS', this.delayTimeMS);
        this.batchSize = get(newConfig, 'batchSize', this.batchSize);
      }

      return new Promise((resolve, reject) => {
        setTimeout(function () {
          resolve(self._processNextMessages());
        }, this.delayTimeMS);
      });
    }).catch((err: Error) => {
      _log('ERROR', 'Exiting:', err);
    });
  }

  start(): Promise<*> {
    this.stopped = false;
    return this._processNextMessages();
  }

  stop() {
    this.stopped = true;
    _log('WARN', 'Stop worker has been issued');
  }

  adjustRate(batchDelayMS: number, batchSize: number) {
    this.batchDelayMS = batchDelayMS;
    this.batchSize = batchSize;
  }
}
