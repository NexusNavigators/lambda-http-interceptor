import type { AWSLambdaClient } from '@src/utils/aws.ts'
import { randomInt } from 'crypto'
import { randomUUID } from 'node:crypto'
import { mock } from 'vitest-mock-extended'
import type { HttpRequestEventMap, Interceptor, RequestController } from '@mswjs/interceptors'

import {
  createInterceptListener,
} from '@src/apiGatewayProxyV1/index.ts'
import type { PartialContext, APIGatewayProxyV1EventParams } from '@src/utils/index.ts'

import { registerInterceptListener } from '@src/apiGatewayProxyV1/setup.ts'

const interceptor = mock<Interceptor<HttpRequestEventMap>>()
const controller = mock<RequestController>()
const awsLambdaClient = mock<AWSLambdaClient>()
const eventHandler = vitest.fn()

const eventParams: APIGatewayProxyV1EventParams = {
  binaryTypes: [],
}

const contextParams: PartialContext = {
  functionName: 'test',
}

const url = new URL('http://localhost:8080/some/path?with=query')
const request = new Request(url)

test('will call once (%b)', () => {
  registerInterceptListener({
    interceptor,
  },
  {
    eventType: 'apiGatewayProxyV1',
    listenerType: 'handler',
    eventParams,
    contextParams,
    eventHandler,
  },
  )
  expect(interceptor.on).toHaveBeenCalledOnce()
  expect(interceptor.once).not.toHaveBeenCalledOnce()

  registerInterceptListener({
    interceptor,
    once: false,
  },
  {
    eventType: 'apiGatewayProxyV1',
    listenerType: 'handler',
    eventParams,
    contextParams,
    eventHandler,
  })
  expect(interceptor.on).toHaveBeenCalledTimes(2)
  expect(interceptor.once).not.toHaveBeenCalledOnce()

  registerInterceptListener({
    interceptor,
    once: true,
  },
  {
    eventType: 'apiGatewayProxyV1',
    listenerType: 'handler',
    eventParams,
    contextParams,
    eventHandler,
  })
  expect(interceptor.on).toHaveBeenCalledTimes(2)
  expect(interceptor.once).toHaveBeenCalledOnce()
})

test('will throw with invalid configuration', () => {
  expect(() => registerInterceptListener({ } as any, {} as any)).toThrow('eventHandler or awsLambdaClient is required')
})

test('will return if host does not match', async () => {
  const hostMatcher = 'a bad match'
  const handler = createInterceptListener({ listenerType: 'handler', eventType: 'apiGatewayProxyV1', eventParams, contextParams, eventHandler, hostMatcher })
  await expect(handler({ request, controller, requestId: randomUUID() })).resolves.not.toThrow()
  expect(eventHandler).not.toHaveBeenCalled()
  expect(controller.respondWith).not.toHaveBeenCalled()
  expect(controller.errorWith).not.toHaveBeenCalled()
})

test('will throw if something throws', async () => {
  const error = new Error('some error')
  eventHandler.mockRejectedValue(error)
  const handler = createInterceptListener({ listenerType: 'handler', eventType: 'apiGatewayProxyV1', eventParams, contextParams, eventHandler })
  await expect(handler({ request, controller, requestId: randomUUID() })).resolves.not.toThrow()
  expect(controller.errorWith).toHaveBeenCalledWith(error)
})

test('will invoke the handler and return', async () => {
  eventHandler.mockResolvedValue({
    statusCode: 200,
    body: 'OK',
  })

  const handler = createInterceptListener({ listenerType: 'handler', eventType: 'apiGatewayProxyV1', eventParams, contextParams, eventHandler })
  await expect(handler({ request, controller, requestId: randomUUID() })).resolves.not.toThrow()

  expect(eventHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      httpMethod: 'GET',
      path: url.pathname,
      queryStringParameters: {
        with: 'query',
      },
    }),
    expect.objectContaining(contextParams),
    expect.any(Function),
  )
  expect(controller.respondWith).toHaveBeenCalledWith(expect.objectContaining({
    status: 200,
    body: expect.any(ReadableStream),
  }))
})

test('will invoke the SDK if provided', async () => {
  awsLambdaClient.invokeLambda.mockResolvedValue({
    statusCode: 200,
    body: 'OK',
  })
  const functionName = 'test'
  const qualifier = 'qualifier'
  const timeout = randomInt(1e3, 2e3)
  const handler = createInterceptListener({
    eventType: 'apiGatewayProxyV1',
    listenerType: 'sdk',
    eventParams,
    awsLambdaClient,
    functionName,
    qualifier,
    timeout,
  })
  await expect(handler({ request, controller, requestId: randomUUID() })).resolves.not.toThrow()
  expect(awsLambdaClient.invokeLambda).toHaveBeenCalledWith(
    expect.objectContaining({
      httpMethod: 'GET',
      path: url.pathname,
      queryStringParameters: {
        with: 'query',
      },
    }),
    expect.objectContaining({
      functionName,
      qualifier,
      timeout,
    }),
  )
})
