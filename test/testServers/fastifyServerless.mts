import { vitest } from 'vitest'
import { fastify } from 'fastify'
import { awsLambdaFastify } from '@fastify/aws-lambda'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export const createServer = async () => {
  const app = fastify()

  const routeHandler = vitest.fn()

  const binaryType = 'application/base64'

  app.route({
    method: ['GET', 'POST'],
    url: '/test',
    handler: async (req, resp) => {
      const { event } = (req as any).awsLambda
      routeHandler(req, event)
      let respBody: Buffer | string = 'OK'
      if (req.body && req.headers['content-type'] === binaryType) {
        respBody = Buffer.from(req.body as string, 'base64')
      }
      await Promise.resolve()
      return resp
        .code(200)
        .type(req.headers['content-type'] ?? 'text/plain')
        .send(respBody)
    },
  })

  const handler = awsLambdaFastify<APIGatewayProxyEvent, APIGatewayProxyResult>(
    app,
    {
      binaryMimeTypes: [binaryType],
    },
  )
  app.addContentTypeParser(
    [binaryType],
    { parseAs: 'buffer' },
    (req, body: Buffer, done) => {
      done(null, body.toString('base64'))
    },
  )

  await app.ready()

  return {
    app,
    handler,
    routeHandler,
  }
}
