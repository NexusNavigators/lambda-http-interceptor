import { randomBytes, randomUUID } from 'node:crypto'
import supertest from 'supertest'
import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest'

import { toResponse } from '@src/apiGatewayProxyV1/index.ts'
import { createContext } from '@src/context.ts'
import type { APIGatewayProxyEventParams } from '@src/apiGatewayProxyV1/event.ts'
import { toLambdaEvent } from '@src/apiGatewayProxyV1/event.ts'

import { createServer } from '@test/testServers/fastifyServerless.mts'

const { handler, app, routeHandler } = await createServer()

let request: ReturnType<typeof supertest>
const clientInterceptor = new ClientRequestInterceptor()
clientInterceptor.apply()

beforeEach(() => {
  request = supertest(app.server)
})

const setupInterceptor = (
  params: APIGatewayProxyEventParams = {
    binaryTypes: [],
  },
) => {
  clientInterceptor.once('request', async (
    {
      request,
      controller,
    },
  ) => {
    const event = await toLambdaEvent(params, request)
    const resp = await handler(
      event,
      createContext({
        functionName: 'test',
      }),
    )
    controller.respondWith(toResponse(resp))
  })
}

describe('toLambdaEvent', () => {
  test('will create the request with defaults', async () => {
    setupInterceptor()
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

    setupInterceptor({
      binaryTypes: [],
      authorizer,
      pathParameters,
      stageVariables,
      resource,
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
    setupInterceptor({ binaryTypes: ['application/base64'] })
    const bodyBytes = randomBytes(100)
    await request
      .post('/test')
      .send(bodyBytes)
      .responseType('arraybuffer')
      .set('content-type', 'application/base64')
      .expect(200, bodyBytes)
    expect(routeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ body: bodyBytes.toString('base64') }),
      expect.any(Object),
    )
  })
})
