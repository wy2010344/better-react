import { Better } from "better-react-dom-helper";
import { useVersion } from "better-react-helper";

export function Counter({
  abc,
  children,
}: {
  abc: number;
  children?: Better.ChildrenElement;
}) {
  const [version, updateVersion] = useVersion();

  return (
    <button
      className="btn"
      onClick={() => {
        updateVersion();
      }}
    >
      {abc} {version}abc
      <span>{children}</span>
    </button>
  );
}
