import type { APIGatewayProxyEvent } from 'aws-lambda'
import { randomUUID } from 'node:crypto'

import {
  isBinaryType,
  stream2String,
  type BinaryTypeMatchers,
} from '../utils/index.mts'

export interface APIGatewayProxyEventParams {
  binaryTypes: BinaryTypeMatchers
  authorizer?: APIGatewayProxyEvent['requestContext']['authorizer']
  pathParameters?: APIGatewayProxyEvent['pathParameters']
  stageVariables?: APIGatewayProxyEvent['stageVariables']
  resource?: APIGatewayProxyEvent['resource']
}

export const toLambdaEvent = async (
  {
    binaryTypes,
    authorizer = undefined,
    pathParameters = null,
    stageVariables = null,
    resource = '',
  }: APIGatewayProxyEventParams,
  request: Request,
): Promise<APIGatewayProxyEvent> => {
  const url = new URL(request.url)
  const time = new Date()
  const isBase64Encoded = isBinaryType(request, binaryTypes)

  let body: string | null = null;
  if (request.body) {
    body = await stream2String(request.body, isBase64Encoded)
  }

  const requestContext: APIGatewayProxyEvent['requestContext'] = {
    accountId: '',
    apiId: '1.0',
    protocol: url.protocol.replace(':', ''),
    httpMethod: request.method.toUpperCase(),
    path: url.pathname,
    stage: '$default',
    requestId: randomUUID(),
    requestTime: time.toISOString(),
    requestTimeEpoch: time.getTime(),
    resourceId: '',
    resourcePath: '',
    authorizer,
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: '127.0.0.1',
      user: null,
      userAgent: request.headers.get('user-agent'),
      userArn: null,
    }
  };

  const headers: APIGatewayProxyEvent['headers'] = {}
  const multiValueHeaders: APIGatewayProxyEvent['multiValueHeaders'] = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
    if (!multiValueHeaders[key]) {
      multiValueHeaders[key] = []
    }
    multiValueHeaders[key].push(value)
  });

  const queryStringParameters: APIGatewayProxyEvent['queryStringParameters'] = {}
  const multiValueQueryStringParameters: APIGatewayProxyEvent['multiValueQueryStringParameters'] = {}
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value
    if (!multiValueQueryStringParameters[key]) {
      multiValueQueryStringParameters[key] = []
    }
    multiValueQueryStringParameters[key].push(value)
  });

  const event: APIGatewayProxyEvent = {
    body,
    headers,
    httpMethod: request.method.toUpperCase(),
    isBase64Encoded,
    multiValueHeaders,
    multiValueQueryStringParameters,
    path: url.pathname,
    pathParameters,
    queryStringParameters,
    resource,
    requestContext,
    stageVariables,
  }

  return event
}
