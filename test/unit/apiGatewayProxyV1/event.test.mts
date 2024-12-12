import { registerInterception } from '@src/apiGatewayProxyV1/setup.ts'
import { randomBytes, randomUUID } from 'node:crypto'
import supertest from 'supertest'
import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest'

import type { APIGatewayProxyEventParams } from '@src/apiGatewayProxyV1/event.ts'

import { createServer } from '@test/testServers/fastifyServerless.mts'

const { handler, app, routeHandler } = await createServer()

let request: ReturnType<typeof supertest>
const clientInterceptor = new ClientRequestInterceptor()
clientInterceptor.apply()

beforeEach(() => {
  request = supertest(app.server)
})

describe('toLambdaEvent', () => {
  test('will create the request with defaults', async () => {
    registerInterception({
      once: true,
      eventParams: {
        binaryTypes: [],
      },
      contextParams: {
        functionName: 'test',
      },
      eventHandler: handler,
      interceptor: clientInterceptor,
    })
    await request.get('/test?query=1').expect(200, 'OK')
    expect(routeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ query: { query: '1' } }),
      expect.any(Object),
    )
  })
  test('will create the request specified parameters', async () => {
    const authorizer: APIGatewayProxyEventParams['authorizer'] = {
      principalId: randomUUID(),
    }
    const pathParameters: APIGatewayProxyEventParams['pathParameters'] = { [randomUUID()]: randomUUID() }
    const stageVariables: APIGatewayProxyEventParams['stageVariables'] = { [randomUUID()]: randomUUID() }
    const resource: APIGatewayProxyEventParams['resource'] = randomUUID()
    registerInterception({
      once: true,
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
      interceptor: clientInterceptor,
    })
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
    registerInterception({
      once: true,
      eventParams: {
        binaryTypes: ['application/base64'],
      },
      contextParams: {
        functionName: 'test',
      },
      eventHandler: handler,
      interceptor: clientInterceptor,
    })
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
