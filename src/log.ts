import Logger from '@workpop/simple-logger';

export const module = 'JOB-WORKER';
const logger = new Logger(module);

export function info(message: string, ...args: any[]) {
  logger.info(message, ...args);
}

export function error(message: string, ...args: any[]) {
  logger.error(message, ...args);
}

export function warn(message: string, ...args: any[]) {
  logger.warn(message, ...args);
}

export function trace(message: string, ...args: any[]) {
  logger.trace(message, ...args);
}
