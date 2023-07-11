export default function useMotionDom() {

}

/**
 * 声明式布局动画
 * 只需要标注关键帧,自动过渡
 * 内部检查变化,使用useEffect幂等检查.或者useMemo.复合结构难检测相同性,需要有key,即自定义的renderMap/renderGuard(renderIf/useSwitch/useMatchString)
 * 渐变的动画,是在规定时间内,自动添加中间状态.尽量少操作尽量多的属性.颜色透明度高度.乃至自定义的参数组装、动画中增加、删除元素.
 * react的基础功能是最强大的,但需要的是封装出来的便利简洁的api.更符合人性.
 * 移除动画要更新到react上,仍然需要惰性移除.
 * 
 * 像framer-motion的移除,依赖父层级收集,是一种jsx应用,目前是做不到了
 * 只有将移除加成元素属性,属性移除
 * 但对于先出后入的影响?
 */