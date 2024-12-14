import { AWSLambdaClient, invokeHandler, wrapWithTimeout } from '@src/utils/aws.ts'
import { TimeoutError } from '@src/utils/errors.ts'
import type { PartialContext } from '@src/utils/index.ts'
import { randomUUID } from 'node:crypto'

const eventHandler = vitest.fn()
const event = {
  [randomUUID()]: randomUUID(),
}
const contextParams: PartialContext = {
  functionName: 'test',
}

const invokeParams = {
  eventHandler,
  contextParams,
}

test('will return async response', async () => {
  const expected = randomUUID()
  eventHandler.mockResolvedValue(expected)
  await expect(invokeHandler(event, invokeParams)).resolves.toEqual(expected)
})

test('will return callback', async () => {
  const expected = randomUUID()
  eventHandler.mockImplementation((event, context, cb) => {
    cb(undefined, expected)
  })
  await expect(invokeHandler(event, invokeParams)).resolves.toEqual(expected)
})

test('wil throw if handler rejects', async () => {
  const error = new Error(randomUUID())
  eventHandler.mockRejectedValue(error)

  await expect(invokeHandler(event, invokeParams)).rejects.toThrow(error)
})

test('wil throw if handler calls callback with error', async () => {
  const error = new Error(randomUUID())
  eventHandler.mockImplementation((event, context, cb) => {
    cb(error)
  })

  await expect(invokeHandler(event, invokeParams)).rejects.toThrow(error)
})

test('will throw when no response available', async () => {
  eventHandler.mockResolvedValue(undefined)
  await expect(invokeHandler(event, invokeParams)).rejects.toThrow('No response from the Lambda handler')
})

test('will return results from a good call', async () => {
  const expected = randomUUID()
  const abortController = new AbortController()
  const promise = Promise.resolve(expected)
  await expect(wrapWithTimeout(promise, abortController)).resolves.toEqual(expected)
})

test('will cancel timeout if promise returns', async () => {
  const expected = randomUUID()
  const abortController = new AbortController()
  await expect(wrapWithTimeout(Promise.resolve(expected), abortController, 10)).resolves.toEqual(expected)
  await expect(wrapWithTimeout(Promise.reject(new Error(expected)), abortController, 10)).rejects.toThrow(expected)
})

test('will cause a timeout', async () => {
  const promise = new Promise(() => undefined)
  const abortController = new AbortController()
  await expect(wrapWithTimeout(promise, abortController, 1)).rejects.toThrow(TimeoutError)
})

test('will invoke a lambda function', async () => {
  const awsLambdaClient = new AWSLambdaClient()
  await expect(awsLambdaClient.invokeLambda(event, {
    functionName: 'echo',
  })).resolves.toStrictEqual(event)
})

test('will throw an error if not json', async () => {
  const awsLambdaClient = new AWSLambdaClient()
  await expect(awsLambdaClient.invokeLambda(0, {
    functionName: 'echo',
  })).rejects.toThrow(/Unexpected Payload shape from echo. The full response was.*/)
})

test('will cause a timeout with a message', async () => {
  const awsLambdaClient = new AWSLambdaClient()
  await expect(awsLambdaClient.invokeLambda(event, {
    functionName: 'timeout',
    timeout: 100,
  })).rejects.toThrow(TimeoutError)
})

test('will return errors when function errors', async () => {
  const awsLambdaClient = new AWSLambdaClient()
  await expect(awsLambdaClient.invokeLambda(event, {
    functionName: 'error',
  })).rejects.toThrow('Unhandled')
})
