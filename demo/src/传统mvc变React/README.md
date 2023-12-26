render期间的回滚是否仍然有必要?
比如旧的render没有完成,新的render被触发了——主要是从外部来的,如事件触发.
涉及哪些受影响?主要是effect,computed等.既然新的来了,省掉一次计算.
要回滚哪些?context等是观察到监听来源而变脏.
那私useModel只是变成useRefState,即能获得最新状态的数字、没有回滚.
全都用transition,react也能中断之前的transition