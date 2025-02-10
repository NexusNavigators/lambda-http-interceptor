import type { APIGatewayProxyResult } from 'aws-lambda'
import { randomInt, randomUUID } from 'node:crypto'

import { toResponse } from '@src/apiGatewayProxyV1/response.ts'
import { stream2String } from '@src/utils/index.ts'

test('will ignore missing headers', async () => {
  const response: APIGatewayProxyResult = {
    statusCode: randomInt(200, 600),
    body: randomUUID(),
  }
  const actual = toResponse(response)
  await expect(stream2String(actual.body)).resolves.toBe(response.body)
  expect(actual.headers.entries).toHaveLength(0)
  expect(actual).toStrictEqual(expect.objectContaining({
    status: response.statusCode,
    statusText: `${response.statusCode}`,
  }))
})

test('will convert all headers to strings', () => {
  const response: APIGatewayProxyResult = {
    statusCode: randomInt(200, 600),
    body: randomUUID(),
    headers: {
      number: 123,
      boolean: true,
      string: 'string',
    },
  }
  const actual = toResponse(response)
  expect(actual.headers.has('number')).toBe(true)
  expect(actual.headers.get('number')).toBe('123')
  expect(actual.headers.has('boolean')).toBe(true)
  expect(actual.headers.get('boolean')).toBe('true')
  expect(actual.headers.has('string')).toBe(true)
  expect(actual.headers.get('string')).toBe('string')
})

test('will create a proper body for all response types', () => {
  for (let statusCode = 200; statusCode < 600; ++statusCode) {
    const response: APIGatewayProxyResult = {
      statusCode,
      body: randomUUID(),
      headers: {
        string: 'string',
      },
    }
    const actual = toResponse(response)
    expect(actual.status).toBe(statusCode)
    expect(actual.statusText).toBe(`${statusCode}`)
    expect(actual.headers.has('string')).toBe(true)
    expect(actual.headers.get('string')).toBe('string')
  };
})
