# @nexus-navigators/lambda-http-interceptor

# Node.js http interceptor for Lambda HTTP APIs


[![npm version](https://badgen.net/npm/v/@nexus-navigators/lambda-http-interceptor)](https://www.npmjs.com/package/@nexus-navigators/lambda-http-interceptor)
[![npm downloads](https://badgen.net/npm/dm/@nexus-navigators/lambda-http-interceptor)](https://www.npmjs.com/package/@nexus-navigators/lambda-http-interceptor)
[![npm version](https://badge.fury.io/js/@nexus-navigators%2Freadme-generate.svg)](https://badge.fury.io/js/@nexus-navigators%2Flambda-http-interceptor)
[![Continuous Integration](https://github.com/NexusNavigators/lambda-http-interceptor/actions/workflows/release.yaml/badge.svg)](https://github.com/NexusNavigators/lambda-http-interceptor/actions/workflows/release.yaml)
[![codecov](https://codecov.io/github/NexusNavigators/lambda-http-interceptor/graph/badge.svg?token=3H6CVWAYSY)](https://codecov.io/github/NexusNavigators/lambda-http-interceptor)
![GitHub issues](https://img.shields.io/github/issues/NexusNavigators/lambda-http-interceptor)
![GitHub pull requests](https://img.shields.io/github/issues-pr/NexusNavigators/lambda-http-interceptor)
![GitHub Repo stars](https://img.shields.io/github/stars/NexusNavigators/lambda-http-interceptor?style=social)
![GitHub forks](https://img.shields.io/github/forks/NexusNavigators/lambda-http-interceptor?style=social)


Intercept HTTP calls that are intended to hit a Lambda that resolves API Gateway requests.
Use cases include unit tests, integration tests, or connecting directly to a Lambda while bypassing API Gateway.

# Installation
------------

```bash
npm i --save @nexus-navigators/lambda-http-interceptor
```

# Usage
------------

```typescript

import { enable, clear, registerIntercept } from '@nexus-navigators/lambda-http-interceptor'

const handler = (event: APIGatewayProxyEventV2) => {
  console.log(event)
  return {
    status: 200,
    body: { out: 'OK' },
  }
}

enable()
registerIntercept({
  eventType: 'apiGatewayProxyV1',
  listenerType: 'handler',
  eventHandler: handler,
  hostMatch: /.*lambda-function\.com.*/,
  eventParams: {
    binaryTypes: [],
  },
  contextParams: {
    functionName: 'testFunction',
    timeout: 1,
  }
})

const response = await fetch('https://lambda-function.com/test')

assert.equal(response.status, 200)
const json = await response.json()
assert.equal(json.out, 'OK')
```

## API
------------

### Register Options

| Option          | Description                                                                                                                           |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `eventType`     | The type of event to be sent to the Lambda function. Can be `apiGatewayProxyV1` or `apiGatewayProxyV2`.                               |
| `listenerType`  | The type of listener to be used for invoking the Lambda function. Can be `handler` or `sdk`.                                          |
| `eventHandler`  | When `listenerType` is `handler` then a Lambda handler function must be provided                                                      |
| `hostMatch`     | A string or RegExp used to match hosts for requests.  Can be blank if all HTTP requests should be sent to the function.               |
| `eventParams`   | An object containing API Gateway parameters to be passed to the Lambda function.                                                      |
| `contextParams` | An object containing Lambda context parameters to be passed to the Lambda function. Required when setting `listenerType` to `handler` |


### Event Parameters

| Parameter                   | Description                                                                                                                                                    |
|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `binaryTypes`               | An array of binary types to be passed to the Lambda function. The interceptor will convert these kinds of requests to base64 and set the APIGateway event flag |
| `authorizer` (optional)     | Any authorization parameters that the API Gateway would have added to the event                                                                                |
| `pathParameters` (optional) | Any path parameters that the API Gateway would have added to the event                                                                                         |
| `stageVariables` (optional) | Any query stage variables that the API Gateway would have added to the event                                                                                   |
| `resource` (optional)       | The resource value API gateway would have added to the event                                                                                                   |


### Context Parameters

Context parameters are only used when `listenerType` is `handler`.  These help fill out the `context` parameter when executing the handler.

| Parameter                       | Description                                                    |
|---------------------------------|----------------------------------------------------------------|
| `functionName` (required)       | The name of the Lambda function.                               |
| `timeout` (optional)            | The timeout for the Lambda function.                           |
| `awsRequestId` (optional)       | A requestID that is typically a UUID.                          |
| `memoryLimitInMB` (optional)    | The memory size for the Lambda function.                       |
| `functionVersion` (optional)    | The version of the Lambda function.                            |
| `logStreamName` (optional)      | A log stream name for CloudWatch Logs.                         |
| `invokedFunctionArn` (optional) | The ARN for the function                                       |
| `clientContext` (optional)      | Any clientContext that would be sent, matches `ClientContext`. |
| `identity` (optional)           | A `CognitoIdentity` object that would be set by Lambda.        |

