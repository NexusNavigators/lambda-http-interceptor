import type { BinaryTypeMatchers } from './types'

export const defaultBinaryTypes: BinaryTypeMatchers = [
  'application/octet-stream',
  'application/pdf',
  /image\/*/,
]
