import { randomUUID } from 'node:crypto'
import type { Context } from 'aws-lambda'
import type { PartialContext } from './utils/index'

export const createContext = (
  {
    clientContext,
    functionName,
    identity,
    invokedFunctionArn = '',
    logStreamName,
    memoryLimitInMB = '256',
    awsRequestId = randomUUID(),
    functionVersion = '$LATEST',
    timeout = 3,
  }: PartialContext,
): Context => {
  const now = new Date()
  const endEpoch = now.getTime() + (timeout * 1e3)
  return {
    clientContext,
    done: () => undefined,
    fail: () => undefined,
    succeed: () => undefined,
    callbackWaitsForEmptyEventLoop: false,
    functionName,
    getRemainingTimeInMillis: () => endEpoch - Date.now(),
    identity,
    invokedFunctionArn,
    logGroupName: `/aws/lambda/${functionName}`,
    logStreamName: logStreamName ?? `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}/${functionName}/${randomUUID()}`,
    memoryLimitInMB,
    awsRequestId,
    functionVersion,
  }
}
