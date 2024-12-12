import * as setup from '@src/index.ts'

test('initial test', () => {
  expect(setup).toHaveProperty('context')
  expect(setup).toHaveProperty('apiGatewayProxyV1')
})
