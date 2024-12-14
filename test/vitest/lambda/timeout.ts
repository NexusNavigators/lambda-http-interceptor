import type { Handler } from 'aws-lambda'

const resp = {
  body: 'hello',
  statusCode: 200,
}

export const handler: Handler = (evt, ctx, cb) => {
  setTimeout(() => cb(undefined, resp), 1000)
}
