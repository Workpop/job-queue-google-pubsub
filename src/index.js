import { JobQueuePublisher } from './publisher';
import { AsyncWorker } from './async-worker';
import { JobProcessedStatus } from './status';
import { SyncWorker } from './sync-worker';

class JobQueue {
  /**
   * @param {{ projectId: string; credentials: any; }} config
   */
  constructor(config) {
    this.config = config;
  }

  createPublisher() {
    return new JobQueuePublisher(this.config);
  }

  /**
   * @param { {topic: string, subscription: string, batchSize?: number} } workerConfig
   * @param { (message: any) => Promise<any> } jobHandler
   * @param { (cb: (arg0: any) => void) => void } [configCallback]
   */
  createWorker(workerConfig, jobHandler, configCallback) {
    if (configCallback === null || configCallback === undefined) {
      return new AsyncWorker(this.config, workerConfig, jobHandler);
    }
    return new SyncWorker(this.config, workerConfig, jobHandler, configCallback);
  }
}

export {
  JobQueue,
  JobProcessedStatus,
};
