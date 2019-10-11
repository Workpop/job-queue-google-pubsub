import { PubSub, Topic } from '@google-cloud/pubsub';
import { StatusError } from '@google-cloud/pubsub/build/src/message-stream';
import { Status } from '@grpc/grpc-js/build/src/constants';
import { isBuffer, isObject, toString } from 'lodash';
import { error } from './log';
import { IPublisher, IQueueConfig } from './types';

export class JobQueuePublisher implements IPublisher {

  private _pubsubClient: PubSub;
  private _queueConfig: IQueueConfig;

  constructor(queueConfig: IQueueConfig) {
    this._queueConfig = queueConfig;
    this._initClient();
  }

  public publish(topicId: string, message: any): Promise<string> {
    if (isBuffer(message)) {
      return this._retryOnFailure(() =>
        this._getTopic(topicId).publish(message));
    }
    if (!isObject(message)) {
      return this._retryOnFailure(() =>
        this._getTopic(topicId).publish(Buffer.from(toString(message))));
    }
    return this._retryOnFailure(() =>
      this._getTopic(topicId).publishJSON(message, {
        'content-type': 'application/json',
    }));
  }

  private _retryOnFailure(operation: () => Promise<string>): Promise<string> {
    return new Promise((resolve, reject) => {
      operation().then(resolve,
        (err: StatusError) => {
          if (err.code === Status.DEADLINE_EXCEEDED ||
            err.code === Status.INTERNAL ||
            err.code === Status.RESOURCE_EXHAUSTED) {
              // re-create the client and try to publish again
              error(`Failed publishing message... retrying`, err);
              this._initClient();
              this._retryOnFailure(operation).then(resolve, reject);
              return;
          }
          // log the error and reject
          error('Failed publishing message', err);
          reject(err);
        });
    });
  }

  private _getTopic(topicId: string): Topic {
    return this._pubsubClient.topic(topicId);
  }

  private _initClient() {
    this._pubsubClient = new PubSub(this._queueConfig);
  }
}
