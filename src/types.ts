/**
 * GCP project and credentials to authenticate to PubSub
 */
export interface IQueueConfig {
  /** The GCP project to authenticate with the provided credentials */
  projectId: string;
  /** Credentials to authenticate to GCP pub sub */
  credentials: any;
}

/**
 * Specific pubsub topic & subscription configuration
 */
export interface IWorkerConfig {
  /** Topic name to subscribe to */
  topic: string;
  /** Subscription name */
  subscription: string;
  /** Optional number of messages to be retrieved from the subscription in a batch */
  batchSize?: number;
}

/**
 * Queue worker that processes messages from the queue
 */
export interface IWorker {
  /**
   * Start the worker and return a promise that resolves when the worker stops
   */
  start(): Promise<any>;
  /**
   * Request the worker to stop processing queued messages
   */
  stop(): void;
}

/**
 * Queue publisher to submit new messages to the queue
 */
export interface IPublisher {
  /**
   * Publish the message on the specified topic
   * @param topicId Topic to publish this message on
   * @param message The actual object to be publishefd
   */
  publish(topicId: string, message: any): Promise<string>;
}
