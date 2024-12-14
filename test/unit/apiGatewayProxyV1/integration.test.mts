import { BatchInterceptor, type HttpRequestEventMap, type Interceptor } from '@mswjs/interceptors'
// eslint-disable-next-line import-x/extensions
import nodejs from '@mswjs/interceptors/presets/node'
import supertest from 'supertest'

import { registerInterceptListener } from '@src/apiGatewayProxyV1/index.ts'
import { AWSLambdaClient } from '@src/utils/aws.ts'

const url = 'http://fastify.lambda'
const request = supertest(url)

const batchInterceptor = new BatchInterceptor({
  name: 'apiGatewayProxyV1IntegrationTest',
  interceptors: nodejs as unknown as ReadonlyArray<Interceptor<HttpRequestEventMap>>,
})

batchInterceptor.apply()

const awsLambdaClient = new AWSLambdaClient()

registerInterceptListener(
  {
    interceptor: batchInterceptor,
  },
  {
    eventType: 'apiGatewayProxyV1',
    listenerType: 'sdk',
    hostMatcher: url,
    eventParams: {
      binaryTypes: [],
    },
    awsLambdaClient,
    functionName: 'fastify',
  },
)

test('can invoke sdk', async () => {
  await expect(request.get('/test').expect(200, 'OK')).resolves.not.toThrow()
})
