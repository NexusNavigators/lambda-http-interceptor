import { promises as fs } from 'fs'
import Docker from 'dockerode'

import { startLocalstackDocker } from '@lifeomic/test-tool-localstack'

import {
  readConfig,
  writeConfig,
  testTmpDir,
} from '@test/vitest/config.mts'
import { setupLambdas } from '@test/vitest/setupLambdas.mts'

process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ACCESS_KEY_ID = 'test'
process.env.AWS_SECRET_ACCESS_KEY = 'test'

export const setup = async () => {
  let containerId = ''
  let endpoint = process.env.LAMBDA_ENDPOINT
  if (!endpoint) {
    ({
      containerId,
      config: { endpoint },
    } = await startLocalstackDocker({
      versionTag: '4.0.3',
      envVariables: {
        Services: 'lambda,s3',
        EAGER_SERVICE_LOADING: '1',
      },
    }))
    process.env.LAMBDA_ENDPOINT = endpoint
  }
  await Promise.all([
    setupLambdas(),
    writeConfig({ containerId, endpoint: endpoint as string }),
  ])
}

export const teardown = async () => {
  const config = await readConfig()
  await fs.rm(testTmpDir, { recursive: true, force: true })
  if (!config.containerId) {
    return
  }
  const docker = new Docker()
  const container = docker.getContainer(config.containerId)
  await container.stop()
}
