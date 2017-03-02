import { JobQueue, JobProcessedStatus } from '../src/index';
import { queueConfig, workerConfig, topic } from './test-config';

const messagesToPublish = 100;
const delayBetweenPublishes = 3000;
const timeToProcessJob = 1000;

const q = new JobQueue(queueConfig);

const publisher = q.createPublisher();

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
        }, delayBetweenPublishes);
      });
    }
  }).catch((err) => {
    console.log('Error:', err);
  });
}

// create the first worker
const worker1 = q.createWorker(workerConfig, function({id, data}) {
  console.log('>>worker1 handling message', id, data);
  return new Promise((resolve) => {
    setTimeout(function() {
      resolve({status: JobProcessedStatus.ok, message: 'success'});
    }, timeToProcessJob);
  });
});

// create the second worker
const worker2 = q.createWorker(workerConfig, function({id, data}) {
  console.log('>>worker2 handling message', id, data);
  return new Promise((resolve) => {
    setTimeout(function() {
      resolve({status: JobProcessedStatus.ok, message: 'success'});
    }, timeToProcessJob);
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

// start publishing messages
publishMessage();

setTimeout(function() {
  worker1.stop();
}, 600000);
setTimeout(function() {
  worker2.stop();
}, 600000);
