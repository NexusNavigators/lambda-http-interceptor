import { BinaryTypeMatchers } from './types.mts'


export const isBinaryType = (
  request: Request,
  binaryTypes: BinaryTypeMatchers,
): boolean => {
  const contentType = request.headers.get('content-type') ?? ''
  const matched = binaryTypes.find((type) => contentType.match(type))
  return matched !== undefined
}
