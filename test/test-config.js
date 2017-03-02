const projectId = 'pubsubtest-159421';

const credentials = require('./test-creds.json');

export const topic = 'projects/pubsubtest-159421/topics/abc';

export const queueConfig = {
  projectId,
  credentials,
};

export const publisherConfig = {
};

export const workerConfig = {
  subscription: 'projects/pubsubtest-159421/subscriptions/testpush',
  topic,
};
