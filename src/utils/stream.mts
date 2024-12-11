export const stream2buffer = async (
  stream: ReadableStream
): Promise<Buffer> => {
  const buffers = []
  for await (const data of stream) {
    buffers.push(data)
  }
  return Buffer.concat(buffers)
}

export const stream2String = async (
  stream: ReadableStream | null,
  encodeBase64 = false,
): Promise<string | null> => {
  if (!stream) {
    return null
  }

  const buffer = await stream2buffer(stream)

  return buffer.toString(encodeBase64 ? 'base64' : 'utf-8')
}
