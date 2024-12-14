import { BatchInterceptor } from '@mswjs/interceptors'
import nodejs from '@mswjs/interceptors/presets/node'
import {
  type RegisterInterceptOptions,
} from './utils/index.ts'

import {
  registerInterceptListener as registerApiGatewayProxyV1Intercept,
} from './apiGatewayProxyV1/index.ts'

const interceptor = new BatchInterceptor({
  name: 'lambda-http-interceptor',
  interceptors: nodejs,
})

export const enable = () => {
  interceptor.apply()
}

export const clear = () => {
  interceptor.dispose()
}

export const registerIntercept = (
  { once, ...options }: RegisterInterceptOptions,
) => {
  if (options.eventType === 'apiGatewayProxyV1') {
    registerApiGatewayProxyV1Intercept(
      {
        once,
        interceptor,
      },
      options,
    )
  }
}
