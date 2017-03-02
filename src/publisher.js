// @flow

const pubsub = require('@google-cloud/pubsub');

class JobQueuePublisher {
  pubsubClient: Object;

  constructor(queueConfig: Object = {}) {
    this.pubsubClient = pubsub(queueConfig);
  }

  publish(topicId: string, message: string): Promise<*> {
    const self = this;
    return new Promise((resolve: Function, reject: Function) => {
      const topic = self.pubsubClient.topic(topicId);
      topic.publish(message, (err: Error, result: any): any => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
    });
  }
}

export default JobQueuePublisher;
