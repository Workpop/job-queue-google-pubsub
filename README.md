# job-queue-google-pubsub

Job Queue implementation backed by Google PubSub

## Publishing a job to the queue

```
import { JobQueue } from '@workpop/job-queue-google-pubsub';

// get the topic from your Google PubSub dashboard
const topic = 'projects/pubsubtest-123456/topics/myawesometopic';

const q = new JobQueue(queueConfig);
const publisher = q.createPublisher();
publisher.publish(topic, 'Hello from Workpop');
```

## Creating a job queue worker

A worker requires a function which will process the job from the queue.

```
import { JobQueue, JobProcessedStatus } from '@workpop/job-queue-google-pubsub';

const q = new JobQueue(queueConfig)e
const worker = q.createWorker(workerConfig, function(message) {
  return new Promise((resolve, reject) => {
    // do your processing here

    // if processing succeeded
    resolve({status: JobProcessedStatus.ok, message: 'success'});

    // or if something bad happened
    //reject({status: JobProcessedStatus.failed, message: 'oh this is bad'});

    // or if something bad happened but you want to retry
    //reject({status: JobProcessedStatus.failedRetryRequested, message: 'oh this is bad but lets try it again (requeue)'});
  });
});
worker.start().then((stoppedReason) => {
  console.log(`The worker has stopped: ${stoppedReason}`);
});
```

The promise value must contain a status property and an optional message property.

| Job processing succeeded | Requires retry | Promise resolved/rejected | Promise status        |
| ------------------------ | -------------- | ------------------------- | --------------------- |
| Yes                      | N/A            | Resolved                  | JobProcessedStatus.ok |
| No                       | No             | Rejected                  | JobProcessedStatus.failed |
| No                       | Yes            | Rejected                  | JobProcessedStatus.failedRetryRequested |


## Stopping a job queue worker
To stop the job queue worker (on the next poll):
```
worker.stop();
```
