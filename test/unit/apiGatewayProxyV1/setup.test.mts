import { randomUUID } from 'node:crypto'
import { mock as mockType } from 'vitest-mock-extended'
import type { HttpRequestEventMap, Interceptor, RequestController } from '@mswjs/interceptors'

import {
  type APIGatewayProxyEventParams, createInterceptHandler,
} from '@src/apiGatewayProxyV1/index.ts'
import type { PartialContext } from '@src/context.ts'

import { registerInterception } from '@src/apiGatewayProxyV1/setup.ts'

const interceptor = mockType<Interceptor<HttpRequestEventMap>>()
const controller = mockType<RequestController>()
const eventHandler = vitest.fn()

const eventParams: APIGatewayProxyEventParams = {
  binaryTypes: [],
}

const contextParams: PartialContext = {
  functionName: 'test',
}

const handler = createInterceptHandler({ eventParams, contextParams, eventHandler })

const url = new URL('http://localhost:8080/some/path?with=query')
const request = new Request(url)

const invoke = () => expect(handler({ request, controller, requestId: randomUUID() })).resolves.not.toThrow()

test('will call once (%b)', () => {
  registerInterception({
    interceptor,
    eventParams,
    contextParams,
    eventHandler,
  })
  expect(interceptor.on).toHaveBeenCalledOnce()
  expect(interceptor.once).not.toHaveBeenCalledOnce()

  registerInterception({
    interceptor,
    eventParams,
    contextParams,
    eventHandler,
    once: false,
  })
  expect(interceptor.on).toHaveBeenCalledTimes(2)
  expect(interceptor.once).not.toHaveBeenCalledOnce()

  registerInterception({
    interceptor,
    eventParams,
    contextParams,
    eventHandler,
    once: true,
  })
  expect(interceptor.on).toHaveBeenCalledTimes(2)
  expect(interceptor.once).toHaveBeenCalledOnce()
})

test('will return async', async () => {
  eventHandler.mockResolvedValue({
    statusCode: 200,
    body: 'OK',
  })

  await invoke()

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

test('will return callback', async () => {
  eventHandler.mockImplementation((event, context, cb) => {
    cb(undefined, {
      statusCode: 200,
      body: 'OK',
    })
  })
  await invoke()
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

test('will call error if handler rejects', async () => {
  const error = new Error(randomUUID())
  eventHandler.mockRejectedValue(error)

  await invoke()

  expect(controller.errorWith).toHaveBeenCalledWith(error)
})

test('will call error if handler calls callback with an error', async () => {
  const error = new Error(randomUUID())
  eventHandler.mockImplementation((event, context, cb) => {
    cb(error)
  })

  await invoke()

  expect(controller.errorWith).toHaveBeenCalledWith(error)
})

test('will call error if the handler returns nothing', async () => {
  eventHandler.mockImplementation((event, context, cb) => {
    cb()
  })
  await invoke()

  expect(controller.errorWith).toHaveBeenCalledWith(new Error('No response from the Lambda handler'))
})
