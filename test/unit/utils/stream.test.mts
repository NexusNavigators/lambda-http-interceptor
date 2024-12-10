import { stream2buffer, stream2String } from '@src/utils/stream.mts'
import { randomUUID } from 'node:crypto'

test('will convert a stream to a buffer', async () => {
  const expected = randomUUID()
  const buffer = Buffer.from(expected)
  await expect(stream2buffer(new Blob([buffer]).stream())).resolves.toEqual(buffer)
})

test('will return undefined if the stream is null', async () => {
  await expect(stream2String(null)).resolves.toBeNull()
})

test('will convert a stream to a string', async () => {
  const expected = randomUUID()
  const buffer = Buffer.from(expected)
  await expect(stream2String(new Blob([buffer]).stream())).resolves.toEqual(expected)
})

test('will convert a base64 stream to a string', async () => {
  const expected = randomUUID()
  const buffer = Buffer.from(expected)
  await expect(stream2String(new Blob([buffer]).stream(), true)).resolves
    .toEqual(Buffer.from(expected).toString('base64'))
})
