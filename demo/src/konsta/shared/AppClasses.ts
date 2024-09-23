import { cn } from "@/utils";
import { Theme } from "./context";

export const AppClasses = (props: {
  safeAreas?: boolean
}, currentTheme: Theme, classes: string) => {
  const { safeAreas } = props;
  return cn(
    currentTheme === 'ios' && `k-ios`,
    currentTheme === 'material' && 'k-material',
    'k-app w-full h-full min-h-screen',
    safeAreas && 'safe-areas',
    // positionClass('relative', classes),
    classes
  );
};
