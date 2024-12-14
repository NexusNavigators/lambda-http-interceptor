import {
  InvokeCommand, type InvokeCommandOutput,
  LambdaClient,
  type LambdaClientConfig,
} from '@aws-sdk/client-lambda'
import { NodeHttp2Handler } from '@aws-sdk/node-http-handler'
import type { Callback, Handler } from 'aws-lambda'
import { createContext } from '../context.ts'
import { RequestError, TimeoutError } from './errors.ts'
import type { PartialContext } from './types.ts'

export interface InvokeHandlerOptions<T, R> {
  contextParams: PartialContext
  eventHandler: Handler<T, R>
}

export const invokeHandler = async <T, R>(
  event: T,
  { contextParams, eventHandler }: InvokeHandlerOptions<T, R>,
): Promise<R> => {
  let callbackResolve: ((value: R | undefined) => void) = undefined as unknown as ((value: R | undefined) => void)
  let callbackReject: ((value: Parameters<Callback>[0] | undefined) => void) = undefined as unknown as ((value: Parameters<Callback>[0]) => void)

  const promise = new Promise<R | undefined>((resolve, reject) => {
    callbackResolve = resolve
    callbackReject = reject
  })

  const callback: Callback<R> = async (cbErr, cbResp) => {
    if (cbErr) {
      callbackReject(cbErr)
    } else {
      callbackResolve(cbResp)
    }
  }

  const result = eventHandler(
    event,
    createContext(contextParams),
    callback,
  )

  let resp: Awaited<ReturnType<typeof eventHandler>>
  if (typeof result?.then === 'function') {
    resp = await result
    callbackResolve(resp)
  } else {
    resp = await promise
  }

  if (!resp) {
    throw new Error('No response from the Lambda handler')
  }
  return resp
}

export const wrapWithTimeout = async <R>(
  promise: Promise<R>,
  abortController: AbortController,
  timeout?: number,
): Promise<R> => new Promise(async (resolve, reject) => {
  let njsTimeout: NodeJS.Timeout | undefined

  if (timeout) {
    njsTimeout = setTimeout(() => {
      reject(new TimeoutError())

      abortController.abort()
    }, timeout)
  }

  const clrTimeout = () => {
    if (timeout) {
      clearTimeout(timeout)
    }
  }

  const execute = async () => {
    const result = await promise
    if (njsTimeout) {
      clearTimeout(njsTimeout)
    }
    resolve(result)
  }
  try {
    await execute()
  } catch (error) {
    clrTimeout()
    reject(error)
  }
})

export class AWSLambdaClient {
  readonly #lambdaClass: typeof LambdaClient
  readonly #sdkOptions: LambdaClientConfig

  constructor(
    lambdaClass: typeof LambdaClient = LambdaClient,
    sdkOptions: LambdaClientConfig = {},
  ) {
    this.#lambdaClass = lambdaClass
    this.#sdkOptions = sdkOptions
  }

  createClient(timeout?: number) {
    const lambdaClientConfig = Object.assign(
      { endpoint: process.env.LAMBDA_ENDPOINT },
      this.#sdkOptions,
    )
    if (timeout) {
      lambdaClientConfig.requestHandler = new NodeHttp2Handler({
        sessionTimeout: timeout,
        requestTimeout: timeout,
      })
    }
    return new this.#lambdaClass(lambdaClientConfig)
  }

  async invokeLambda<T, R>(
    event: T,
    {
      timeout,
      functionName,
      qualifier,
    }: {
      functionName: string
      qualifier?: string
      timeout?: number
    },
  ): Promise<R> {
    const client = this.createClient(timeout)

    const cmd = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(event)),
      Qualifier: qualifier,
    })

    const abortController = new AbortController()
    const promise = client.send(cmd, { abortSignal: abortController.signal })
    let result: InvokeCommandOutput
    try {
      result = await wrapWithTimeout(promise, abortController, timeout)
    } finally {
      client.destroy()
    }

    const payload = result.Payload && JSON.parse(Buffer.from(result.Payload).toString('utf-8')) as R | undefined
    if (!payload) {
      const message = `Unexpected Payload shape from ${functionName}. The full response was\n${JSON.stringify(result, null, 2)}`
      throw new RequestError(message)
    }

    if (result.FunctionError) {
      throw new RequestError(`${result.FunctionError}\n${JSON.stringify(payload, null, 2)}`)
    }
    return payload
  }
}
