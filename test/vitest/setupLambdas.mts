import { testTmpDir } from '@test/vitest/config.mts'
import { build } from 'esbuild'
import semver from 'semver'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'

import { createFunction } from '@lifeomic/test-tool-lambda'

import packageJson from '../../package.json' with { type: 'json' }
const { engines } = packageJson

const nodeVersion = semver.minVersion(engines.node, { loose: false })?.version
if (!nodeVersion) {
  throw new Error('Missing engines.node version from package.json')
}

const lambdaDir = path.resolve(import.meta.dirname, 'lambda')
const zipFilePath = path.join(testTmpDir, 'test.zip')

const sourceFiles = fs.globSync('*.ts', { cwd: lambdaDir })

export const setupLambdas = async () => {
  await build({
    bundle: true,
    sourcemap: false,
    platform: 'node',
    target: `node${nodeVersion}`,
    outdir: testTmpDir,
    format: 'cjs',
    tsconfig: path.resolve(import.meta.dirname, '../tsconfig.json'),
    entryPoints: sourceFiles.map((file) => path.join(lambdaDir, file)),
  })
  const output = fs.createWriteStream(zipFilePath)
  const archive = archiver('zip')
  archive.pipe(output)
  archive.glob('*.js', { cwd: testTmpDir })
  await archive.finalize()

  for (const filename of sourceFiles) {
    const file = path.basename(filename, '.ts')
    await createFunction({
      zipFilePath,
      FunctionName: file,
      Handler: `${file}.handler`,
      MemorySize: 512,
      Timeout: 15,
      Runtime: 'nodejs22.x',
    })
  }
}
