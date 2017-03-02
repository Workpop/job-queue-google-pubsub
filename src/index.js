// @flow

import JobQueuePublisher from './publisher';
import { JobQueueWorker, JobProcessedStatus } from './worker';

function JobQueue(config: Object) {
  this.config = config;
}

JobQueue.prototype.createPublisher = function createPublisher(): Object {
  return new JobQueuePublisher(this.config);
};

JobQueue.prototype.createWorker = function createWorker(workerConfig: Object, jobHandler: Function): Object {
  return new JobQueueWorker(this.config, workerConfig, jobHandler);
};

export {
  JobQueue,
  JobProcessedStatus,
};

