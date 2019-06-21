// tslint:disable: no-console
import assert from 'assert';
import { repeat } from 'lodash';
import { JobProcessedStatus, JobQueue } from '../src/index';
import { queueConfig, topic, workerConfig } from './test-config';

const q = new JobQueue(queueConfig);

const publisher = q.createPublisher();

let worker1Messages = 0;
let worker2Messages = 0;
const messagesToPublish = 100;
const timeToProcessJobMS = 1500;

let messageCount = 0;
let messagesHandled = 0;
let batchSize = 1;
const delayTimeMS = 1000;

// create the first worker
const worker1 = q.createWorker(workerConfig, (message) => {
  worker1Messages += 1;
  messagesHandled += 1;
  console.log(`>>worker1 handling message #${worker1Messages}`, message);
  if (worker1Messages >= 10) {
    batchSize = 10;
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({status: JobProcessedStatus.ok, message: 'success'});
    }, timeToProcessJobMS);
  });
}, (cb) => cb({
    batchSize,
    delayTimeMS,
  }),
);

// create the second worker
const worker2 = q.createWorker(workerConfig, (message) => {
  worker2Messages += 1;
  messagesHandled += 1;
  console.log(`>>worker2 handling message #${worker2Messages}`, message);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({status: JobProcessedStatus.ok, message: 'failure'});
    }, timeToProcessJobMS);
  });
}, (cb) => cb({
    batchSize: 1,
    delayTimeMS: 1000,
  }),
);

function publishMessage() {
  const messageContent = {
    messageCount,
  };
  publisher.publish(topic, messageContent).then(() => {
    if (++messageCount < messagesToPublish) {
      return new Promise((resolve) => {
        setTimeout(() => {
          publishMessage();
          resolve();
        }, 10);
      });
    }
    console.log(`Published messages: ${messageCount}`);
    console.log('Starting Workers');
    worker1.start().then(() => {
      console.log('Worker 1 completed');
    });

    worker2.start().then(() => {
      console.log('Worker 2 completed');
    });

  }).catch((err) => {
    console.log('Error:', err);
  });
}

// start publishing messages
console.log('Publishing messages...');
publishMessage();

setTimeout(() => worker1.stop(), 600000);

setTimeout(() => worker2.stop(), 600000);

function endMessage() {
  if (messagesHandled >= messagesToPublish) {
    const worker1token = 'x';
    const worker2token = 'o';
    const worker1progress = repeat(worker1token, worker1Messages);
    const worker2progress = repeat(worker2token, worker2Messages);
    console.log(`Worker1 ${worker1Messages} ${worker1progress}${worker2progress} ${worker2Messages} Worker2`);
    console.log(`Handled ${worker1Messages + worker2Messages}/${messagesToPublish} messages`);
    assert.ok(worker1Messages + worker2Messages === messagesToPublish);
    return;
  }
  setTimeout(endMessage, 1000);
}

endMessage();
