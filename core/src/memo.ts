import { createUseBaseMemo } from 'wy-helper/state-function'
import { hookEnvModel, hookStateHoder } from './cache'

/**
 * 通过返回函数,能始终通过函数访问fiber上的最新值
 * @param effect
 * @param deps
 * @returns
 */
export const useBaseMemo = createUseBaseMemo(hookStateHoder, hookEnvModel)
