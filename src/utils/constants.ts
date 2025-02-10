import type { BinaryTypeMatchers } from './types'

export const defaultBinaryTypes: BinaryTypeMatchers = [
  'application/octet-stream',
  'application/pdf',
  /image\/*/,
]

// https://github.com/nodejs/undici/blob/c7f3d77011234fe243c317ada1398044032342cc/lib/web/fetch/constants.js#L5C1-L6C67
export const nullBodyStatus = [101, 204, 205, 304]
