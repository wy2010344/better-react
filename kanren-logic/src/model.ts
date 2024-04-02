


export class KSymbol {

  private constructor(
    public readonly name: string
  ) { }
  toString() {
    return `$${this.name}`
  }
  static term = new KSymbol('term')
  static nat = new KSymbol("nat")
}