import type { Context } from 'aws-lambda'
import { randomUUID } from 'node:crypto'
import { type InstalledClock, install } from '@sinonjs/fake-timers'

import { createContext } from '@src/context.ts'

process.env.TZ = 'UTC'

let clock: InstalledClock

beforeEach(() => {
  clock = install({
    now: 0,
    toFake: ['Date'],
  })
})

afterEach(() => {
  clock.uninstall()
})

test('context methods for coverage', () => {
  const context = createContext({
    functionName: randomUUID(),
  })

  expect(context.done()).toBeUndefined()
  expect(context.fail('')).toBeUndefined()
  expect(context.succeed('')).toBeUndefined()
  expect(context.getRemainingTimeInMillis()).toBe(3000)
  clock.tick(1000)

  expect(context.getRemainingTimeInMillis()).toBe(2000)

  const logStreamName = new RegExp(`1970/1/1/${context.functionName}/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`)
  expect(context).toStrictEqual(expect.objectContaining({
    clientContext: undefined,
    identity: undefined,
    invokedFunctionArn: '',
    logStreamName: expect.stringMatching(logStreamName),
    logGroupName: `/aws/lambda/${context.functionName}`,
    memoryLimitInMB: '256',
    functionVersion: '$LATEST',
    awsRequestId: expect.stringMatching(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/),
  }))
})

test('override fields', () => {
  const timeout = 15
  const invokedFunctionArn = randomUUID()
  const clientContext = {
    Custom: randomUUID(),
  } as Context['clientContext']

  const identity: Context['identity'] = {
    cognitoIdentityId: randomUUID(),
    cognitoIdentityPoolId: randomUUID(),
  }

  const logStreamName = randomUUID()

  const memoryLimitInMB = '512'
  const functionVersion = randomUUID()
  const awsRequestId = randomUUID()

  const context = createContext({
    functionName: randomUUID(),
    timeout,
    clientContext,
    identity,
    invokedFunctionArn,
    memoryLimitInMB,
    logStreamName,
    functionVersion,
    awsRequestId,
  })

  expect(context.getRemainingTimeInMillis()).toBe(timeout * 1e3)
  clock.tick(1000)
  expect(context.getRemainingTimeInMillis()).toBe(timeout * 1e3 - 1e3)

  expect(context).toStrictEqual(expect.objectContaining({
    clientContext,
    identity,
    invokedFunctionArn,
    logStreamName,
    logGroupName: `/aws/lambda/${context.functionName}`,
    memoryLimitInMB,
    functionVersion,
    awsRequestId,
  }))
})
