import {
  PairBranch,
  PairLeaf,
  PairNode,
  PairNotfound,
  TreeRoute,
} from "wy-helper/router";
import { cacheGet, EmptyFun, GetValue, quote } from "wy-helper";
import { useMemo } from "./useRef";
import { renderOne, renderOrKey } from "./renderOne";
import {
  useCallbackPromise,
  useCallbackPromiseState,
} from "./useRenderPromise";

export type BranchOrLeaf =
  | PairBranch<BranchLoader, LeafLoader, NotfoundLoader>
  | PairLeaf<LeafLoader>
  | PairNotfound<NotfoundLoader>;

export type BranchLoader = {
  default(
    branch: PairBranch<BranchLoader, LeafLoader, NotfoundLoader>,
    children: EmptyFun,
  ): void;
};
export type LeafLoader = {
  default(branch: PairLeaf<LeafLoader>): void;
};
export type NotfoundLoader = {
  default(branch: PairNotfound<NotfoundLoader>): void;
};

export type BranchAll = PairNode<BranchLoader, LeafLoader, NotfoundLoader>;

export type Branch =
  | BranchOrLeaf
  | {
      type: "error";
      value: any;
      loader?: never;
      query?: never;
      next?: never;
      nodes?: string[];
      index?: number;
      load?: never;
      // restNodes?: never
    };

export function createSimpleTree({
  prefix,
  pages,
  renderError,
}: {
  prefix: string;
  pages: Record<string, () => Promise<unknown>>;
  renderError(err: any): void;
}) {
  const tree = new TreeRoute<BranchLoader, LeafLoader, NotfoundLoader>(
    {},
    cacheGet,
  );

  tree.buildFromMap(pages, prefix);
  tree.finishBuild();

  function renderBranch(branch: Branch) {
    renderOrKey(branch, "type", function (key, branch) {
      if (key == "error") {
        return renderError(branch.value);
      } else {
        const { data } = useCallbackPromise(
          {
            body: branch.loader as GetValue<Promise<any>>,
          },
          [branch.loader],
        );

        renderOrKey(data, "type", function (type, data) {
          if (type == "success") {
            renderOne(data.value, function (l) {
              if (branch.type == "branch") {
                (l as BranchLoader).default(branch, function () {
                  renderBranch(branch.next);
                });
              } else if (branch.type == "leaf") {
                (l as LeafLoader).default(branch);
              } else if (branch.type == "notfound") {
                (l as NotfoundLoader).default(branch);
              }
            });
          }
          if (type == "error") {
            renderError(data.value);
          }
        });
      }
    });
  }
  return {
    renderBranch(path: string) {
      const branch = useMemo(() => {
        try {
          const nodes = path.split("/").filter(quote);
          const out = tree.matchNodes(nodes);
          return out;
        } catch (err) {
          return {
            type: "error",
            value: err,
          } as const;
        }
      }, [path]);
      renderBranch(branch);
      // return <LayoutComponent branch={branch} renderError={renderError} />
    },
  };
}
