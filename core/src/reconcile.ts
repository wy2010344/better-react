import { EnvModel, IEnvModel } from './commitWork'
import { Fiber } from './Fiber'
import { AskNextTimeWork, NextTimeWork, EmptyFun, SetValue } from 'wy-helper'

//优先级,1是及时,2是普通,3是延迟
export type LoopWorkLevel = 2 | 3
const WorkLevel = {
  Normal: 2,
  Low: 3,
} as const

export interface AppState {
  reconcile(callback: SetValue<IEnvModel>): void
  flushSync(): void
  setRealTime(): void
}
export class WorkUnits implements AppState {
  private workList: EmptyFun[] = []
  private lowWorkList: EmptyFun[] = []
  private realTime = false
  setRealTime(): void {
    this.realTime = true
  }
  constructor(
    private readonly rootFiber: Fiber,
    getAsk: AskNextTimeWork<IEnvModel>,
  ) {
    this.askNextTimeWork = getAsk({
      //供scheduler调度
      askNextWork: this.getNextWork,
      getArg: () => {
        return this.currentEnvModel!
      },
      realTime: () => {
        return this.realTime
      },
    })
  }
  private readonly askNextTimeWork: EmptyFun
  reconcile = (work: SetValue<IEnvModel>): void => {
    if (currentTaskLevel == WorkLevel.Low) {
      this.lowWorkList.push(work)
    } else {
      this.workList.push(work)
    }
    this.askNextTimeWork()
  }

  private getWorkList() {
    if (this.currentEnvModel?.level == WorkLevel.Low) {
      return this.lowWorkList
    }
    return this.workList
  }
  /**
   * 全部提交，类似flushSync
   */
  flushSync(): void {
    let work = this.getNextWork()
    while (work) {
      work(this.currentEnvModel!)
      work = this.getNextWork()
    }
  }

  private currentEnvModel?: EnvModel
  private commitWork = () => {
    this.realTime = false
    const workList = this.getWorkList()
    if (workList.length != this.currentEnvModel!.getIndex()) {
      console.log(
        '不正常，理论上应该是空的',
        workList.length - this.currentEnvModel!.getIndex(),
      )
      for (let i = 0; i < this.currentEnvModel!.getIndex(); i++) {
        //提交生效了
        workList.shift()
      }
    } else {
      workList.length = 0
    }
    // console.log('结束任务', this.currentEnvModel?.level)
    this.currentEnvModel = undefined
  }
  private getNextWork = (): NextTimeWork<IEnvModel> | void => {
    if (!this.currentEnvModel) {
      const work = this.workList.at(0)
      if (work) {
        // console.log('开始任务', WorkLevel.Normal)
        this.currentEnvModel = new EnvModel(
          WorkLevel.Normal,
          this.rootFiber,
          this.commitWork,
          this,
        )
        return work
      }
      const lowWork = this.lowWorkList.at(0)
      if (lowWork) {
        // console.log('开始任务', WorkLevel.Low)
        this.currentEnvModel = new EnvModel(
          WorkLevel.Low,
          this.rootFiber,
          this.commitWork,
          this,
        )
        return lowWork
      }
      return
    }
    if (this.currentEnvModel.level == WorkLevel.Low && this.workList.length) {
      // console.log('中止任务', WorkLevel.Low)
      //中断回滚
      this.currentEnvModel.discared()
      this.currentEnvModel = undefined
      return this.getNextWork()
    }
    const work = this.getWorkList().at(this.currentEnvModel.getIndex())
    if (work) {
      if (this.currentEnvModel.hasRender()) {
        // console.log('中止任务', this.currentEnvModel.level)
        //中断回滚
        this.currentEnvModel.discared()
        this.currentEnvModel = undefined
        return this.getNextWork()
      }
      return this.nextWork
    }
    return this.currentEnvModel.render()
  }

  private nextWork = () => {
    const env = this.currentEnvModel!
    //需要保证执行后才生成副作用。
    //如果在render片段时，中间出现了新的setState，则会重新render
    const work = this.getWorkList()[env.getIndex()]
    env.addIndex()
    work(env)
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
