import { useEffect, useMemo } from "better-react-helper"
import { emptyArray } from "wy-helper";


export function useGetUrl(file: File | Blob) {
  const url = useMemo(() => {
    return URL.createObjectURL(file);
  }, [file]);
  useEffect(() => {
    return [undefined, () => {
      URL.revokeObjectURL(url);
    }];
  }, emptyArray);
  return url;
}