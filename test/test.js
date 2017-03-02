import { times } from 'lodash';
import { JobQueuePublisher, JobQueueWorker, JobProcessedStatus } from '../src/index';
import { queueConfig, workerConfig, topic } from './test-config';

const publisher = new JobQueuePublisher(queueConfig);

const messagesToPublish = 100;
let messageCount = 0;
function publishMessage() {
  const messageContent = `test message ${messageCount}`;
  publisher.publish(topic, messageContent).then(() => {
    console.log(`Published message: ${messageContent}`);
    if (++messageCount < messagesToPublish) {
      return new Promise((resolve) => {
        setTimeout(() => {
          publishMessage();
          resolve();
        }, 5000);
      });
    }
  }).catch((err) => {
    console.log('Error:', err);
  });
}

publishMessage();

// create the first worker
const worker1 = new JobQueueWorker(queueConfig, workerConfig, function({id, data}) {
  console.log('>>worker1 handling message', id, data);
  return new Promise((resolve) => {
    setTimeout(function() {
      resolve({status: JobProcessedStatus.ok, message: 'success'});
    }, 1000);
  });
});

// create the second worker
const worker2 = new JobQueueWorker(queueConfig, workerConfig, function({id, data}) {
  console.log('>>worker2 handling message', id, data);
  return new Promise((resolve) => {
    setTimeout(function() {
      resolve({status: JobProcessedStatus.ok, message: 'success'});
    }, 1000);
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
}, 600000);
setTimeout(function() {
  worker2.stop();
}, 600000);
