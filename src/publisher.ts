import { PubSub } from '@google-cloud/pubsub';
import { IPublisher, IQueueConfig } from './types';

export class JobQueuePublisher implements IPublisher {

  private pubsubClient: PubSub;

  constructor(queueConfig: IQueueConfig) {
    this.pubsubClient = new PubSub(queueConfig);
  }

  public publish(topicId: string, message: any): Promise<string> {
    const topic = this.pubsubClient.topic(topicId);
    return topic.publishJSON(message, {
      'content-type': 'application/json',
    });
  }
}
