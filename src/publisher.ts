import { PubSub } from '@google-cloud/pubsub';
import { isBuffer, isObject, toString } from 'lodash';
import { IPublisher, IQueueConfig } from './types';

export class JobQueuePublisher implements IPublisher {

  private pubsubClient: PubSub;

  constructor(queueConfig: IQueueConfig) {
    this.pubsubClient = new PubSub(queueConfig);
  }

  public publish(topicId: string, message: any): Promise<string> {
    const topic = this.pubsubClient.topic(topicId);
    if (isBuffer(message)) {
      return topic.publish(message);
    }
    if (!isObject(message)) {
      return topic.publish(Buffer.from(toString(message)));
    }
    return topic.publishJSON(message, {
      'content-type': 'application/json',
    });
  }
}
