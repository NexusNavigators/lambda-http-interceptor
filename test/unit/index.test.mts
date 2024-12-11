import { setup } from '@src/index.mts'

test('initial test', () => {
  expect(setup()).toEqual('setup')
})
