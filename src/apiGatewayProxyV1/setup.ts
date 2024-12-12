import type { HttpRequestEventMap, Interceptor } from '@mswjs/interceptors'
import type { APIGatewayProxyHandler, APIGatewayProxyResult, Callback } from 'aws-lambda'
import { createContext, type PartialContext } from '../context'
import { type APIGatewayProxyEventParams, toLambdaEvent } from './event'
import { toResponse } from './response'

export interface APIGatewayProxyV1HandlerOptions {
  eventParams: APIGatewayProxyEventParams
  contextParams: PartialContext
  eventHandler: APIGatewayProxyHandler
}

export const createInterceptHandler = (
  {
    eventParams,
    contextParams,
    eventHandler,
  }: APIGatewayProxyV1HandlerOptions,
) => async (
  {
    request,
    controller,
  }: HttpRequestEventMap['request'][0],
) => {
  const event = await toLambdaEvent(eventParams, request)

  let callbackResolve: ((value: APIGatewayProxyResult | undefined) => void) = undefined as unknown as ((value: APIGatewayProxyResult | undefined) => void)
  let callbackReject: ((value: Parameters<Callback>[0] | undefined) => void) = undefined as unknown as ((value: Parameters<Callback>[0]) => void)

  const promise = new Promise<APIGatewayProxyResult | undefined>((resolve, reject) => {
    callbackResolve = resolve
    callbackReject = reject
  })

  const callback: Callback<APIGatewayProxyResult> = async (cbErr, cbResp) => {
    if (cbErr) {
      callbackReject(cbErr)
    } else {
      callbackResolve(cbResp)
    }
  }

  let resp: Awaited<ReturnType<APIGatewayProxyHandler>> = undefined

  try {
    resp = await eventHandler(
      event,
      createContext(contextParams),
      callback,
    )
    if (!resp) {
      resp = await promise
    } else {
      callbackResolve(resp)
    }
  } catch (err) {
    return controller.errorWith(err)
  }

  if (!resp) {
    return controller.errorWith(new Error('No response from the Lambda handler'))
  }
  controller.respondWith(toResponse(resp))
}

export interface APIGatewayProxyV1Options extends APIGatewayProxyV1HandlerOptions {
  interceptor: Interceptor<HttpRequestEventMap>
  once?: boolean
}

export const registerInterception = (
  {
    once = false,
    interceptor,
    ...handlerOptions
  }: APIGatewayProxyV1Options,
) => {
  const handler = createInterceptHandler(handlerOptions)
  if (once) {
    interceptor.once('request', handler)
  } else {
    interceptor.on('request', handler)
  }
}
