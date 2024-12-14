import { Interceptor } from '@mswjs/interceptors'
import { mock } from 'vitest-mock-extended'

import { enable, clear, registerIntercept } from '@src/index.ts'
import {
  registerInterceptListener as registerApiGatewayProxyV1Intercept,
} from '@src/apiGatewayProxyV1/index.ts'
import type { AWSLambdaClient } from '@src/utils/aws.ts'
import type { RegisterInterceptOptions } from '@src/utils/index.ts'

vitest.mock('@src/apiGatewayProxyV1/index.ts')

test('will enable and dispose the interceptor', () => {
  expect(enable).not.toThrow()
  expect(clear).not.toThrow()
})

test('will set up the interceptor', () => {
  const options: RegisterInterceptOptions = {
    eventType: 'apiGatewayProxyV1',
    listenerType: 'sdk',
    hostMatcher: 'http://localhost:8080',
    eventParams: {
      binaryTypes: [],
    },
    awsLambdaClient: mock<AWSLambdaClient>(),
    functionName: 'test',
  }
  registerIntercept(options)
  expect(registerApiGatewayProxyV1Intercept).toHaveBeenCalledWith({
    interceptor: expect.any(Interceptor),
    once: undefined,
  },
  options,
  )
})
