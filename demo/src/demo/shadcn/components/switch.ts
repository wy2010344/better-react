import { cn, tw } from "@/utils";
import { cva } from "class-variance-authority";



const switchCls = tw`
peer inline-flex h-5 w-9 shrink-0 
cursor-pointer items-center 
rounded-full border-2 border-transparent shadow-sm 
transition-colors focus-visible:outline-none 
focus-visible:ring-2 focus-visible:ring-ring 
focus-visible:ring-offset-2 focus-visible:ring-offset-background 
disabled:cursor-not-allowed disabled:opacity-50
`

const switchThumbCls = tw`
pointer-events-none block 
h-4 w-4 rounded-full 
bg-background shadow-lg 
ring-0 transition-transform 
`

/**
 * 生成switch的按钮
 * @param checked 
 * @returns 
 */
export function getSwitchCls(checked?: any) {
  if (checked) {
    return [
      cn(
        switchCls,
        'bg-primary'
      ),
      cn(
        switchThumbCls,
        'translate-x-4'
      )
    ] as const
  } else {
    return [
      cn(
        switchCls,
        'bg-input'
      ),
      cn(
        switchThumbCls,
        'translate-x-0'
      )
    ] as const
  }
}