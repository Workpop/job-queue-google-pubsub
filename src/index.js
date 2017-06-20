// @flow

import JobQueuePublisher from './publisher';
import { JobQueueWorker, JobProcessedStatus } from './worker';

function JobQueue(config: Object) {
  this.config = config;
}

JobQueue.prototype.createPublisher = function createPublisher(): Object {
  return new JobQueuePublisher(this.config);
};

JobQueue.prototype.createWorker = function createWorker(workerConfig: Object, jobHandler: Function, batchDelayMS: number = 0, batchSize: number = 1): Object {
  return new JobQueueWorker(this.config, workerConfig, jobHandler, batchDelayMS, batchSize);
};

export {
  JobQueue,
  JobProcessedStatus,
};

