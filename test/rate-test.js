import { JobQueue, JobProcessedStatus } from '../src/index';
import { queueConfig, workerConfig, topic } from './test-config';
import { repeat } from 'lodash';

const q = new JobQueue(queueConfig);

const publisher = q.createPublisher();

let worker1Messages = 0;
let worker2Messages = 0;
const messagesToPublish = 100;
const timeToProcessJobMS = 1500;

let messageCount = 0;
let messagesHandled = 0;
let batchSize = 1;
let delayTimeMS = 1000;

// create the first worker
const worker1 = q.createWorker(workerConfig, function(message) {
  worker1Messages += 1;
  messagesHandled += 1;
  console.log(`>>worker1 handling message #${worker1Messages}`);
  if (worker1Messages >= 10) {
    batchSize = 10;
  }
  return new Promise((resolve) => {
    setTimeout(function() {
      resolve({status: JobProcessedStatus.ok, message: 'success'});
    }, timeToProcessJobMS);
  });
}, delayTimeMS, batchSize, function() {
    return {
      delayTimeMS,
      batchSize,
    }
  });

// create the second worker
const worker2 = q.createWorker(workerConfig, function(message) {
  worker2Messages += 1;
  messagesHandled += 1;
  console.log(`>>worker2 handling message #${worker2Messages}`);
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve({status: JobProcessedStatus.ok, message: 'failure'});
    }, timeToProcessJobMS);
  });
}, delayTimeMS, batchSize);

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
    } else {
      console.log(`Published messages: ${messageCount}`);
      console.log('Starting Workers');
      worker1.start().then((result) => {
        console.log('Worker 1 completed');
      });

      worker2.start().then((result) => {
        console.log('Worker 2 completed');
      });
    }
  }).catch((err) => {
    console.log('Error:', err);
  });
}


// start publishing messages
publishMessage();

setTimeout(function() {
  worker1.stop();
}, 600000);

setTimeout(function() {
  worker2.stop();
}, 600000);

function endMessage() {
  if (messagesHandled >= messagesToPublish) {
    const worker1token = 'x';
    const worker2token = 'o';
    const worker1progress = repeat(worker1token, worker1Messages);
    const worker2progress = repeat(worker2token, worker2Messages);
    console.log(`Worker1 ${worker1Messages} ${worker1progress}${worker2progress} ${worker2Messages} Worker2`);
    console.log(`Handled ${worker1Messages + worker2Messages}/${messagesToPublish} messages`);
    return;
  }
  setTimeout(endMessage, 1000);
}

endMessage();
