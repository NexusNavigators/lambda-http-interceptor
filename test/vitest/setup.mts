import { readConfig } from '@test/vitest/config.mts'

const config = await readConfig()
process.env.LAMBDA_ENDPOINT = config.endpoint
process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ACCESS_KEY_ID = 'test'
process.env.AWS_SECRET_ACCESS_KEY = 'test'
