import type { APIGatewayProxyResult } from 'aws-lambda'
import { nullBodyStatus } from '../utils/index'

export const toResponse = (response: APIGatewayProxyResult): Response => {
  const body = nullBodyStatus.includes(response.statusCode)
    ? null
    : response.isBase64Encoded
      ? Buffer.from(response.body, 'base64')
      : response.body

  const headers: Record<string, string> = {}

  Object.entries(response.headers ?? {}).forEach(([key, value]) => {
    headers[key] = typeof value !== 'string' ? JSON.stringify(value) : value
  })

  return new Response(body, {
    headers,
    status: response.statusCode,
    statusText: `${response.statusCode}`,
  })
}
