import { fastify } from 'fastify'
import { awsLambdaFastify, type LambdaFastifyOptions } from '@fastify/aws-lambda'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const app = fastify()

const binaryType = 'application/octet-stream'

app.route({
  method: ['GET', 'POST'],
  url: '/test',
  handler: async (req, resp) => {
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

export const handler = awsLambdaFastify<APIGatewayProxyEvent, LambdaFastifyOptions, APIGatewayProxyResult>(
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

app.ready()
