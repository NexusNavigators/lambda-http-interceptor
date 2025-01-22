import type { HttpRequestEventMap, Interceptor } from '@mswjs/interceptors'
import type { APIGatewayProxyEvent, APIGatewayProxyHandler, Context } from 'aws-lambda'
import type { AWSLambdaClient } from './aws.ts'

export type HostMatcher = string | RegExp
export type BinaryTypeMatchers = (string | RegExp)[]

type RequiredContext = Pick<Context, 'functionName'>
type OptionalContext = Omit<Context,
  | 'done'
  | 'fail'
  | 'succeed'
  | 'logGroupName'
  | 'getRemainingTimeInMillis'
  | 'callbackWaitsForEmptyEventLoop'
  | keyof RequiredContext
>

export type PartialContext = RequiredContext & Partial<OptionalContext> & {
  timeout?: number
}

export type ListenerType = 'handler' | 'sdk'
export type EventType = 'apiGatewayProxyV1'

export interface APIGatewayProxyV1EventParams {
  binaryTypes?: BinaryTypeMatchers
  authorizer?: APIGatewayProxyEvent['requestContext']['authorizer']
  pathParameters?: APIGatewayProxyEvent['pathParameters']
  stageVariables?: APIGatewayProxyEvent['stageVariables']
  resource?: APIGatewayProxyEvent['resource']
}

export interface ListenerOptions {
  eventType: EventType
  listenerType: ListenerType
  hostMatcher?: HostMatcher
  binaryTypes?: BinaryTypeMatchers
  timeout?: number
}

export interface InvokeSDKOptions extends ListenerOptions {
  listenerType: 'sdk'
  awsLambdaClient: AWSLambdaClient
  functionName: string
  qualifier?: string
}

/**
 * API Gateway Proxy v1 Listener
 */
export interface APIGatewayProxyV1Options extends ListenerOptions {
  eventType: 'apiGatewayProxyV1'
  eventParams: APIGatewayProxyV1EventParams
}

export interface APIGatewayProxyV1ListenerHandler extends APIGatewayProxyV1Options {
  listenerType: 'handler'
  contextParams: PartialContext
  eventHandler: APIGatewayProxyHandler
}

export interface APIGatewayProxyV1ListenerSdk extends APIGatewayProxyV1Options, InvokeSDKOptions {
  listenerType: 'sdk'
}

export type CreateAPIGatewayV1Listener = APIGatewayProxyV1ListenerHandler | APIGatewayProxyV1ListenerSdk

/**
 * Root register interceptor
 */

export interface RegisterInterceptorHandler {
  once?: boolean
  interceptor: Interceptor<HttpRequestEventMap>
}

export type RegisterInterceptOptions = Omit<RegisterInterceptorHandler, 'interceptor'> & (
  | CreateAPIGatewayV1Listener
)
