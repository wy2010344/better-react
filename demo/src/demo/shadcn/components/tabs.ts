import { tw } from "@/utils";

export const tabsList = tw`
inline-flex h-9 items-center 
justify-center rounded-lg 
bg-muted p-1 text-muted-foreground
`

/**
 * tab的按钮
 */
export const tabsTrigger = tw`
inline-flex items-center justify-center 
whitespace-nowrap text-sm font-medium 
ring-offset-background transition-all 

focus-visible:outline-none focus-visible:ring-2 
focus-visible:ring-ring focus-visible:ring-offset-2 

disabled:pointer-events-none disabled:opacity-50
`

export const tabsContent = tw`
mt-2 ring-offset-background 
focus-visible:outline-none 
focus-visible:ring-2 
focus-visible:ring-ring 
focus-visible:ring-offset-2
`