
/**
 * 以js为宏,鸭辩类型
 * 实现以类型为值的集合类型.
 * 类型本身也是一种值
 * 
 * 类型是否包含自身?作为集合的类型是集合域的,作为值是值域的.类型也是集合.
 * 
 * 偶数集合,属于数的自然集合,但声明构造却要在自然数之下.
 * 
 * 虽然在自然表达中集合有包含关系
 * 但在实现中,类型只是集合表示的一个标签.
 */


class TypeCreater {
  constructor(
    /**
     * 类型才有include方法,普通值没有
     * 将普通值声明成类型,只有联合类型
     */
    public readonly include: (v: any) => boolean
  ) { }
}

/**
 * 总类型的自然类型
 */
export const Type = new TypeCreater(v => {
  return v instanceof TypeCreater
})

export const StringType = new TypeCreater(v => {
  return typeof (v) == 'string'
})

export const NumberType = new TypeCreater(v => {
  return typeof (v) == 'number'
})

export const BooleanType = new TypeCreater(v => {
  return typeof (v) == 'boolean'
})

function baseInclude(thisType: any, otherType: any) {
  if (thisType instanceof TypeCreater) {
    return thisType.include(otherType)
  }
  return thisType == otherType
}
/**
 * 手动联合类型
 * 联合类型,由多种类型构造而成,需要判断入参类型满足任何一种类型
 * 如果对方也是联合类型,需要解开进一步判断,
 * 只针对有限的联合,不针对字符串、数字这种无限的联合.
 * @param vs 
 * @returns 
 */
class ManualUnionTypeCreater extends TypeCreater {
  public readonly subTypes: any[]
  constructor(...vs: any[]) {
    super((v: any) => {
      if (v instanceof ManualUnionTypeCreater) {
        return v.subTypes.every(subType => {
          //子集类型的每一个,都属于这种类型,是一种递归
          this.include(subType)
        })
      } else {
        return this.subTypes.some(x => {
          return baseInclude(x, v)
        })
      }
    })
    this.subTypes = vs
  }
}
/**
 * 联合类型的自然类型
 */
export const ManualUnionType = new TypeCreater(v => {
  return v instanceof ManualUnionTypeCreater
})

/**
 * 结构体类型,声明即是自身,不考虑鸭辩.
 * 值可能为普通值,可能为类型
 * 结构体是有自己的实例
 */
class StructTypeCreater extends TypeCreater {
  constructor(
    public readonly map: {
      [key: string]: any
    },
    public readonly equal: (a: StructCreater, b: StructCreater) => boolean = (a, b) => a == b
  ) {
    super(v => {
      if (v instanceof StructCreater) {
        return v.type == this
      }
      return false
    })
  }
  create(map: {
    [key: string]: any
  }) {
    return new StructCreater(this, map)
  }

}

/**
 * 结构体的实例.两者是否相等,在
 */
class StructCreater extends TypeCreater {
  constructor(
    public readonly type: StructTypeCreater,
    public readonly map: {
      [key: string]: any
    }
  ) {
    super(x => {
      if (x instanceof StructCreater && x.type == this.type) {
        //同一类型
        return this.type.equal(this, x)
      }
      return false
    })
  }
}
/**
 * 结构体类型的自然类型
 */
export const StructType = new TypeCreater(v => {
  return v instanceof StructTypeCreater
})

function includeArray(thisMemberTypes: any[], otherMemberTypes: any[]) {
  if (otherMemberTypes.length <= thisMemberTypes.length) {
    for (let i = 0; i < otherMemberTypes.length; i++) {
      const thisMember = thisMemberTypes[i]
      const member = otherMemberTypes[i]
      if (!baseInclude(thisMember, member)) {
        return false
      }
    }
    return true
  }
  return false
}
/**
 * 元组类型
 */
class TurpleTypeCreater extends TypeCreater {
  public readonly memberTypes: any[]
  constructor(...vs: any[]) {
    super(x => {
      if (x instanceof TurpleTypeCreater) {
        return includeArray(this.memberTypes, x.memberTypes)
      }
      return false
    })
    this.memberTypes = vs
  }
}
export const TurpleType = new TypeCreater(x => {
  return x instanceof TurpleTypeCreater
})
class FunctionTypeCreater extends TypeCreater {
  constructor(
    public readonly parameterTypes: any[],
    public readonly returnType: any
  ) {
    super(v => {
      if (v instanceof FunctionTypeCreater) {
        //同是函数类型,对方的需求类型比自己小,返回类型比自己大,是自己的子类型
        return includeArray(this.parameterTypes, v.parameterTypes) && baseInclude(v.returnType, this.returnType)
      }
      return false
    })
  }
}
/**
 * 函数的自然集合类型
 */
export const FunctionType = new TypeCreater(x => {
  return x instanceof FunctionTypeCreater
})