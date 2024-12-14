import path from 'path'
import fs, { promises as fsp } from 'fs'

export const testTmpDir = path.join(import.meta.dirname, 'tmp')
export const sharedConfigFile = path.join(testTmpDir, 'test.config.json')

fs.mkdirSync(testTmpDir, { recursive: true })

export interface TestConfig {
  endpoint: string
  containerId: string
}

export const writeConfig = async (config: TestConfig) => fsp.writeFile(sharedConfigFile, JSON.stringify(config))
export const readConfig = async () => JSON.parse(await fsp.readFile(sharedConfigFile, 'utf-8')) as TestConfig
