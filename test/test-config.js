// from your google cloud console
const projectId = 'pubsubtest-159421';

// get your credentials from your google cloud console and put them in the file test-creds.json
const credentials = require('./test-creds.json');

// use the topic from your google cloud pubsub console
export const topic = 'projects/pubsubtest-159421/topics/abc';

export const queueConfig = {
  projectId,
  credentials,
};

export const workerConfig = {
  subscription: 'projects/pubsubtest-159421/subscriptions/testpush',
  topic,
};
