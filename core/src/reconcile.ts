import { EnvModel, IEnvModel } from './commitWork'
import { Fiber } from './Fiber'
import { AskNextTimeWork, NextTimeWork, EmptyFun, SetValue } from 'wy-helper'

//优先级,1是及时,2是Layout,3是普通,4是延迟
export type LoopWorkLevel = 1 | 2 | 3 | 4
type LoopWork = {
  type: 'loop'
  level: LoopWorkLevel
  work: SetValue<IEnvModel>
}
const WorkLevel = {
  Flush: 1,
  Layout: 2,
  Normal: 3,
  Low: 4,
} as const
export class WorkUnits {
  workList: LoopWork[] = []
  workListMinLevel: LoopWorkLevel = WorkLevel.Low
  constructor(
    readonly rootFiber: Fiber,
    getAsk: AskNextTimeWork<IEnvModel>,
  ) {
    this.askNextTimeWork = getAsk({
      //供scheduler调度
      askNextWork: this.getNextWork,
      getArg: () => {
        return this.currentEnvModel!
      },
      realTime: () => {
        return this.workListMinLevel < WorkLevel.Normal
      },
    })
  }
  private readonly askNextTimeWork: EmptyFun
  reconcile = (work: SetValue<IEnvModel>): void => {
    this.appendWork({
      type: 'loop',
      level: currentTaskLevel,
      work,
    })
    this.askNextTimeWork()
  }

  currentEnvModel?: EnvModel
  private commitWork = () => {
    for (let i = 0; i < this.currentEnvModel!.index; i++) {
      //提交生效了
      this.workList.shift()
    }
    this.workListMinLevel = WorkLevel.Normal
    for (let i = this.currentEnvModel!.index; i < this.workList.length; i++) {
      this.workListMinLevel = Math.min(
        this.workList[i].level,
        this.workListMinLevel,
      ) as LoopWorkLevel
    }
    if (this.workList.length) {
      console.log('不正常，理论上应该是空的', this.workList.length)
    }
    this.currentEnvModel = undefined
  }
  appendWork(work: LoopWork) {
    this.workList.push(work)
    this.workListMinLevel = Math.min(
      work.level,
      this.workListMinLevel,
    ) as LoopWorkLevel
  }

  getNextWork = (): NextTimeWork<IEnvModel> | void => {
    if (this.currentEnvModel?.level != this.workListMinLevel) {
      const item = this.workList[0]
      if (!item) {
        return
      }
      this.currentEnvModel?.discared()
      this.currentEnvModel = new EnvModel(
        this.workListMinLevel as LoopWorkLevel,
        this.rootFiber,
        this.commitWork,
        this.reconcile,
      )
      return item.work
    }
    //仍然保持
    const item = this.workList[this.currentEnvModel.index]
    if (item) {
      if (this.currentEnvModel.hasRender()) {
        //重新跑一遍
        this.currentEnvModel.discared()
        this.currentEnvModel = undefined
        return this.getNextWork()
      }
      return this.nextWork
    } else {
      //进行内部的迭代
      return this.currentEnvModel.render()
    }
  }

  nextWork = () => {
    const env = this.currentEnvModel!
    //需要保证执行后才生成副作用。
    //如果在render片段时，中间出现了新的setState，则会重新render
    const work = this.workList[env.index]
    env.index++
    work.work(env)
  }
}

let currentTaskLevel: LoopWorkLevel = WorkLevel.Normal
/**
 * 按理说,与flushSync相反,这个是尽量慢
 * 但fun里面仍然是setState,不会减少触发呢
 * @param fun
 */
export function startTransition(fun: () => void) {
  const old = currentTaskLevel
  currentTaskLevel = WorkLevel.Low
  fun()
  currentTaskLevel = old
}

export function layoutEffect(fun: EmptyFun) {
  const old = currentTaskLevel
  currentTaskLevel = WorkLevel.Layout
  fun()
  currentTaskLevel = old
}

export function flushSync(fun: () => void) {
  const old = currentTaskLevel
  currentTaskLevel = WorkLevel.Flush
  fun()
  currentTaskLevel = old
  //这里必须加个实时处理
}
