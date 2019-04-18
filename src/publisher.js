import { isString, isObject } from 'lodash';
import { PubSub } from '@google-cloud/pubsub';
// eslint-disable-next-line no-unused-vars
import { ClientConfig } from '@google-cloud/pubsub/build/src/pubsub';

export class JobQueuePublisher {

  /**
   * @param {ClientConfig} queueConfig
   */
  constructor(queueConfig) {
    this.pubsubClient = new PubSub(queueConfig);
  }

  /**
   * @param {string} topicId
   * @param {any} message
   */
  publish(topicId, message) {
    const topic = this.pubsubClient.topic(topicId);
    return topic.publish(
      Buffer.from(
        !isString(message) && isObject(message)
          ? JSON.stringify(message)
          : message));
  }
}
