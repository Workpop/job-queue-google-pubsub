const pubsub = require('@google-cloud/pubsub');

class JobQueuePublisher {


  constructor(queueConfig         = {}) {
    this.pubsubClient = pubsub(queueConfig);
  }

  publish(topicId, message        )             {
    const self = this;
    return new Promise((resolve, reject          ) => {
      const topic = self.pubsubClient.topic(topicId);
      topic.publish(message, (err, result     )      => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
    });
  }
}

export default JobQueuePublisher;
