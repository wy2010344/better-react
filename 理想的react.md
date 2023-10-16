

理想的代码格式
感觉其实跟svelte结构相同....
svelte只是没有局部变量,这种每次render运行时变化,是通过特殊的绑定.
传递jsx就是传递slot.
portal就是render到根id.
context传递仍然可行,因为有fiber树.
portal是受控——状态,绑定到dom树上.

如果不限定每次从根render,则状态可为任意
但因为有所限定,所以render局部节点,并批量提交.
如果context不是通知者模式,则整体子树渲染.
如果context是通知者模式,当然只是将子fiber标记为dirty,在遍历时处理
通过memo使局部节点未变脏
因为变量都在作用域上,访问的都是实时的——不动态生成事件——没有react的各种问题.
因为diff困难,没有轻松diff的data类型

if语句可以更内聚化id.


svelte除了无原生portal,还不支持动态传递jsx?
即组件本身,无法作参数传递?
动态传递组件的本质,是特定地方需要动态创建组件.FC与JSX.Element,JSX.Element是Fiber节点.
Fiber节点是不能动态传递的,因为render很频繁,Fiber不应该频繁动态生成,只能传递组件.
它不是react状态同步数据,没有useEffect状态驱动成事件.但是也可以在状态中变出事件,只要一定的幂等处理,可以实时改变全局的弹窗.因为这个值不是状态,而是受计算而得的状态.
重要是的去除react的虚拟dom概念.
状态驱动去改变全局状态(逆向),会再造成一次render,只是因为幂等而不死循环.

solid也是无虚拟dom的,通过对jsx特定方式的编译,实现了diff更新.这么精确?似乎是vue依赖统计那一套.果然是vue那一套,点击一次触发两次.


不能动态传递组件.因为组件不仅包括数据,还有slot,event等属性.只有在portalTarget上考虑
```
//组件
Component{
  abc=98
  bbc=89
  renderBody(args){
    //每次render,args是从外部传入的参数
    abc=9
    bbc=8
  }
  //暴露的固定参数
  components:[
    div{
      //临时定义的局部变量,有必要?
      abc=98
      bcd=89
      renderParams(){
        //每次render生成参数
        return {
          a:98,
          b:89
        }
      }
      //slot,组件层的
      chidren:[
        div{
          children:[
            delayIf{
              renderParams(){
                return ['a1']
              }
              map:{
                a1:div{

                },
                a2:div{

                }
              }
            }
            delayMap{
              renderParams(){
                return []
              }
              generate(a){
                return {

                }
              }
            }
          ]
        }
      ]
    }
  ]
}

```

不能区分事件/slot,必须是幂等的,才能动态向父祖传递组件

```
function ComponentA({}){

  const [a,setA]=useState(0)
  const [b,setB]=useState(0)

  useComponent(C,{
    a:98,
    b:89,
    children(){

    }
  })
}
```
slot部分,是函数,在内部调用的时候,需要通过Fragment展开,才能保证不被diff影响.
或者一开始就在外面包成Fragment,在内部只管延时调用.即在内部只能是函数被调用,不知道内部细节
不是函数被调用,函数调用会影响到hooks的展开,必须在内部展开,作为匿名展开的成员,拥有自己的hooks
所以在声明的地方,仍然是函数,方便内部特定地方按规则展开.

但是在jsx里却不是函数,是一片东西,只是在一个函数平面.

为了不造成直接调用,声明时封装得不可见,需要特定方式展开的访问者模式

但是jetpack是直接变形成普通函数在使用,虽然使用,不干涉父组件的hooks,是因为在组件声明的类型时,进行了变形.
即通过传递,幂等地进行了变形.
其实还是相当于延后处理.将函数延迟到具体地方去处理.延迟到具体地方当Fragment处理.
但是jetpack是不区分类型的吗?


```
(@Component ()
  (div 
    children (@Fragment
      (div f 9 x 8)
      (@if (< x 7)
        (
          (div f 87)
          (div a 88)
        )
        ( 
          (div f 89)
          (div a 90)
        )
      )
    )
  )
)

```

为了方便DSL翻译,需要不那么多为当前语言而简化的糖.为当前语言简化,就不要翻译成DSL.
特别是JSX/XML本来就类似Lisp.除了children这部分.
也许应该先专注于翻译,再专注于语法高亮等.

不像jetpack一样通过注解变形,也不延迟变形,而通过构造尽早变形,在构造中,还能约束内部的表达方式.
通过构造器,可以获得运行时类型.函数是一种构造器,现在扩展出很多类似函数的构造器.枚举联合,也是需要构造到特定的表里面的.
而且这种类似函数的构造器,重要的是作用域的享有.


至于startTrranstaction,多半是无法实现的.

如果扩展jsx为组件,在局部仍然js,组件成为xml,有相应的useState/useEffect/useMemo

现在纠结一点,是否能改成现有的jsx

不需要type去diff,这一点跟jetpack一样.


# 性能优化

useEvent,禁止在render期间执行
useMemo/useEffect,回调函数的参数即是依赖参数,使其全局化
useMap/useOne——组件大写,不再用use
独立组件声明默认memo,即浅对比,是列表级.但可能需要zod.本来是浅对比的,一个函数有多个参数,只是js不支持参数命名化.全局函数,或非闭包函数,const函数,没法memo



有更新未到npm:
better-react-helper:
  usePromise等的cancel
better-react-dom-helper:
  增加code-editable