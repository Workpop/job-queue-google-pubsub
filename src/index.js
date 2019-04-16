import JobQueuePublisher from './publisher';
import { JobQueueWorker, JobProcessedStatus } from './worker';

function JobQueue(config        ) {
  this.config = config;
}

JobQueue.prototype.createPublisher = function createPublisher()         {
  return new JobQueuePublisher(this.config);
};

JobQueue.prototype.createWorker = function createWorker(workerConfig, jobHandler, configCallback           )         {
  return new JobQueueWorker(this.config, workerConfig, jobHandler, configCallback);
};

export {
  JobQueue,
  JobProcessedStatus,
};

