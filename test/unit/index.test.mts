import { setup } from '@/index.mts'

test('initial test', () => {
  expect(setup()).toEqual('setup')
})
