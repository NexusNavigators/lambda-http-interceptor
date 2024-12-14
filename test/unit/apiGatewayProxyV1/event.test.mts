import { registerInterceptListener } from '@src/apiGatewayProxyV1/setup.ts'
import { randomBytes, randomUUID } from 'node:crypto'
import supertest from 'supertest'
import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest'

import type { APIGatewayProxyV1EventParams } from '@src/utils/index.ts'

import { createServer } from '@test/testServers/fastifyServerless.mts'

const { handler, routeHandler } = await createServer()

const request = supertest('http://junk.junk')
const clientInterceptor = new ClientRequestInterceptor()
clientInterceptor.apply()

describe('toLambdaEvent', () => {
  test('will create the request with defaults', async () => {
    registerInterceptListener(
      {
        once: true,
        interceptor: clientInterceptor,
      }, {
        eventType: 'apiGatewayProxyV1',
        listenerType: 'handler',
        eventParams: {
          binaryTypes: [],
        },
        contextParams: {
          functionName: 'test',
        },
        eventHandler: handler,
      },
    )
    await request.get('/test?query=1').expect(200, 'OK')
    expect(routeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ query: { query: '1' } }),
      expect.any(Object),
    )
  })
  test('will create the request specified parameters', async () => {
    const authorizer: APIGatewayProxyV1EventParams['authorizer'] = {
      principalId: randomUUID(),
    }
    const pathParameters: APIGatewayProxyV1EventParams['pathParameters'] = { [randomUUID()]: randomUUID() }
    const stageVariables: APIGatewayProxyV1EventParams['stageVariables'] = { [randomUUID()]: randomUUID() }
    const resource: APIGatewayProxyV1EventParams['resource'] = randomUUID()
    registerInterceptListener(
      {
        once: true,
        interceptor: clientInterceptor,
      },
      {
        eventType: 'apiGatewayProxyV1',
        listenerType: 'handler',
        eventParams: {
          binaryTypes: [],
          authorizer,
          pathParameters,
          stageVariables,
          resource,
        },
        contextParams: {
          functionName: 'test',
        },
        eventHandler: handler,
      },
    )
    const expectedRequest = expect.objectContaining({
      requestContext: expect.objectContaining({
        authorizer,
      }),
      stageVariables,
      pathParameters,
      resource,
    })
    await request.get('/test?query=1').expect(200, 'OK')
    expect(routeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ query: { query: '1' } }),
      expectedRequest,
    )
  })

  test('will base64 encode the body', async () => {
    registerInterceptListener(
      {
        once: true,
        interceptor: clientInterceptor,
      },
      {
        eventType: 'apiGatewayProxyV1',
        listenerType: 'handler',
        eventParams: {
          binaryTypes: ['application/base64'],
        },
        contextParams: {
          functionName: 'test',
        },
        eventHandler: handler,
      },
    )
    const bodyBytes = randomBytes(100)
    await request
      .post('/test')
      .send(bodyBytes)
      .responseType('arraybuffer')
      .set('content-type', 'application/base64')
      .expect(200, bodyBytes)
      .catch((err) => {
        console.error(err)
        throw err
      })
    expect(routeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ body: bodyBytes.toString('base64') }),
      expect.any(Object),
    )
  })
})
