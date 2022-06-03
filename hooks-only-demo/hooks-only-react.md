

# hooks
  useState
  useEffect
  Context.useProvider 在同一fiber下同类型覆盖,因为在字典上
  Context.useConsumer
  useMemo 可以延伸出useRef的用法
  useFiber 接受两个参数,带fiber的回调与props,初衷是作为dom的扩展
    useDom
    useSvg
    useFragment 类似于原来createElement的用法,是接受函数与其参数的部分
    useMap
    useGuard
      useIf
      useSwitch 匹配的第一个入参是具体值,用浅比较
      useGuardString 第二个参数是字典,用字符串key比较
    
