# job-queue-google-pubsub

Job Queue implementation backed by Google PubSub

## Publishing a job to the queue

```
import { JobQueue } from '@workpop/job-queue-google-pubsub';

const q = new JobQueue(queueConfig);
const publisher = q.createPublisher();
publisher.publish(topic, messageContent);
```

## Creating a job queue worker

A worker requires a function which will process the job from the queue.

```
import { JobQueue, JobProcessedStatus } from '@workpop/job-queue-google-pubsub';

const q = new JobQueue(queueConfig);
const worker = q.createWorker(workerConfig, function({id, data}) {
  return new Promise((resolve) => {
    // do your processing here
    resolve({status: JobProcessedStatus.ok, message: 'success'});
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
