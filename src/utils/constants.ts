import type { BinaryTypeMatchers } from './types.ts'

export const defaultBinaryTypes: BinaryTypeMatchers = [
  'application/octet-stream',
  'application/pdf',
  /image\/*/,
]
