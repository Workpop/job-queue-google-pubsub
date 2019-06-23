// from your google cloud console
const projectId = 'workpop-develop';

// get your credentials from your google cloud console and put them in the file test-creds.json
const credentials = require('./test-creds.json');

// use the topic from your google cloud pubsub console
export const topic = 'projects/workpop-develop/topics/pubsubtest';

export const queueConfig = {
  projectId,
  credentials,
};

export const workerConfig = {
  subscription: 'projects/workpop-develop/subscriptions/pubsubtest',
  topic,
};
