

export interface TempReal {
  reset(): void
  add(...vs: any[]): void
}
export abstract class AbsTempOps<T extends TempReal> {
  constructor(
    creater: () => T
  ) {
    this.data = creater()
  }
  public readonly data: T
  addNode(...n: any[]) {
    this.data.add(...n)
    this.notifyChange()
  }
  abstract notifyChange(): void
  abstract createSub(): TempSubOps<T>
}
export class TempOps<T extends TempReal> extends AbsTempOps<T> {
  constructor(
    public readonly creater: () => T,
    public notifyChange: () => void
  ) { super(creater) }
  createSub(): TempSubOps<T> {
    return new TempSubOps(this)
  }
}
export class TempSubOps<T extends TempReal> extends AbsTempOps<T> {
  constructor(
    public readonly belong: TempOps<T>
  ) {
    super(belong.creater)
  }

  createSub(): TempSubOps<T> {
    return new TempSubOps(this.belong)
  }

  notifyChange(): void {
    this.belong.notifyChange()
  }
}
