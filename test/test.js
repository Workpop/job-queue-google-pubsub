import { JobQueuePublisher, JobQueueWorker, JobProcessedStatus } from '../src/index';

import { queueConfig, publisherConfig, workerConfig, topic } from './test-config';

const publisher = new JobQueuePublisher(queueConfig, publisherConfig);

publisher.publish(topic, 'hello').then((result) => {
  console.log(`Publish result: ${result}`);
}).catch((err) => {
  console.log('Error:', err);
});

publisher.publish(topic, 'goodbye').then((result) => {
  console.log(`Publish result: ${result}`);
}).catch((err) => {
  console.log('Error:', err);
});

function handler({id, data}) {
  console.log('>>handling message', id, data);
  return Promise.resolve({status: JobProcessedStatus.ok, message: 'success'});
}

// create the first worker
const worker1 = new JobQueueWorker(queueConfig, workerConfig, function({id, data}) {
  console.log('>>worker1 handling message', id, data);
  return new Promise((resolve) => {
    setTimeout(function() {
      resolve({status: JobProcessedStatus.ok, message: 'success'});
    }, 3000);
  });
});

// create the second worker
const worker2 = new JobQueueWorker(queueConfig, workerConfig, function({id, data}) {
  console.log('>>worker2 handling message', id, data);
  return new Promise((resolve) => {
    setTimeout(function() {
      resolve({status: JobProcessedStatus.ok, message: 'success'});
    }, 3000);
  });
});

// start worker 1
worker1.start().then((result) => {
  console.log('completed');
});

// start worker 2
worker2.start().then((result) => {
  console.log('completed');
});

setTimeout(function() {
  worker1.stop();
}, 60000);
setTimeout(function() {
  worker2.stop();
}, 60000);
