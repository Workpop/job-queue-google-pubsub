# Cutie
![](http://images.freeimages.com/images/premium/large-thumbs/3675/36752438-orange-slice.jpg)

A Job Queue implementation backed by Google PubSub.

## Getting Started

`yarn`

To get started using Cutie, you will need to set up a [Google Cloud Platform
Project](https://cloud.google.com/resource-manager/docs/creating-managing-projects) as well as create a [Google Pub/Sub topic and subscriber](https://cloud.google.com/pubsub/docs/overview).

## Configuring the queue
The following shows building configuration for the JobQueue:
```javascript
// from your google cloud console
const projectId = 'pubsubtest-12345';

// get your credentials from your google cloud console and put them in the file test-creds.json
const credentials = require('./test-creds.json');

// use the topic from your google cloud pubsub console
const topic = 'projects/pubsubtest-12345/topics/abc';

const queueConfig = {
  projectId,
  credentials,
};

const workerConfig = {
  subscription: 'projects/pubsubtest-159421/subscriptions/mysub',
  topic,
};

const q = new JobQueue(queueConfig);
```

## Publishing a job to the queue

```javascript
import { JobQueue } from '@workpop/job-queue-google-pubsub';

// get the topic from your Google PubSub dashboard
const topic = 'projects/pubsubtest-123456/topics/myawesometopic';

const q = new JobQueue(queueConfig);
const publisher = q.createPublisher();
publisher.publish(topic, 'Hello from Workpop');
```

## Creating a job queue worker

A worker requires a function which will process the job from the queue.

```javascript
import { JobQueue, JobProcessedStatus } from '@workpop/job-queue-google-pubsub';

const q = new JobQueue(queueConfig);
const worker = q.createWorker(workerConfig, function(message) {
  return new Promise((resolve, reject) => {
    // do your processing here

    // if processing succeeded
    resolve({status: JobProcessedStatus.ok, message: 'yay it worked'});

    // or if something bad happened
    //reject({status: JobProcessedStatus.failed, message: 'oh this is bad'});

    // or if something bad happened but you want to retry (requeue the message)
    //reject({status: JobProcessedStatus.failedRetryRequested, message: 'oh this is bad but lets try it again'});
  });
});
worker.start().then((stoppedReason) => {
  console.log(`The worker has stopped: ${stoppedReason}`);
});
```

The promise value must contain a status property and an optional message property.

| Job processing succeeded | Requires retry | Promise resolved/rejected | Promise status        |
| ------------------------ | -------------- | ------------------------- | --------------------- |
| Yes                      | N/A            | resolve                   | JobProcessedStatus.ok |
| No                       | No             | reject                    | JobProcessedStatus.failed |
| No                       | Yes            | reject                    | JobProcessedStatus.failedRetryRequested |


## Stopping a job queue worker
To stop the job queue worker (on the next poll):
```javascript
worker.stop();
```
