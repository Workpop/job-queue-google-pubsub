import { AsyncWorker } from './async-worker';
import { JobQueuePublisher } from './publisher';
import { JobProcessedStatus } from './status';
import { SyncWorker } from './sync-worker';
import { IPublisher, IQueueConfig, IWorker, IWorkerConfig } from './types';

class JobQueue {

  private config: IQueueConfig;

  /**
   * Create pubsub queue handler
   * @param config Required pubsub project and credentials
   */
  constructor(config: IQueueConfig) {
    this.config = config;
  }

  /**
   * Create a queue publisher
   */
  public createPublisher(): IPublisher {
    return new JobQueuePublisher(this.config);
  }

  /**
   * Create a worker object that handles queued messages
   * @param workerConfig subscriber config
   * @param jobHandler the message handler
   * @param configCallback callback to dynamically update the worker config
   */
  public createWorker(workerConfig: IWorkerConfig,
                      jobHandler: (message: any) => Promise<any>,
                      configCallback?: (cb: (arg0: any) => void) => void): IWorker {
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
