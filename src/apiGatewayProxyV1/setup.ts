import type { HttpRequestEventMap } from '@mswjs/interceptors'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import {
  aws,
  type RegisterInterceptorHandler,
  type CreateAPIGatewayV1Listener,
} from '../utils/index'

import { toLambdaEvent } from './event'
import { toResponse } from './response'

export const createInterceptListener = (
  {
    hostMatcher,
    eventParams,
    ...handlerOptions
  }: CreateAPIGatewayV1Listener,
) => async (
  {
    request,
    controller,
  }: HttpRequestEventMap['request'][0],
) => {
  if (hostMatcher && !request.url.match(hostMatcher)) {
    return
  }

  try {
    const event = await toLambdaEvent(eventParams, request)
    let promise: Promise<APIGatewayProxyResult>
    if (handlerOptions.listenerType === 'handler') {
      promise = aws.invokeHandler(
        event,
        handlerOptions,
      )
    } else {
      promise = handlerOptions.awsLambdaClient.invokeLambda<APIGatewayProxyEvent, APIGatewayProxyResult>(
        event,
        handlerOptions,
      )
    }
    const resp = await promise
    controller.respondWith(toResponse(resp))
  } catch (err) {
    controller.errorWith(err)
  }
}

export const registerInterceptListener = (
  {
    once = false,
    interceptor,
  }: RegisterInterceptorHandler,
  handlerOptions: CreateAPIGatewayV1Listener,
) => {
  if (!('eventHandler' in handlerOptions || 'awsLambdaClient' in handlerOptions)) {
    throw new Error('eventHandler or awsLambdaClient is required')
  }
  const handler = createInterceptListener(handlerOptions)
  if (once) {
    interceptor.once('request', handler)
  } else {
    interceptor.on('request', handler)
  }
}
