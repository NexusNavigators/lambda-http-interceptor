import { setup } from '@src/index.ts'

test('initial test', () => {
  expect(setup()).toEqual('setup')
})
