/* Enumerating and exercising the registered datapath tree.

   This is the bridge's regression oracle for path.ux bumps: walkPaths() lists
   every path the api knows about, sweepPaths() resolves and reads each one, and
   playwright/datapaths.spec.ts holds both to a recorded baseline.  A path that
   disappears is a real break. */

import { DataList, DataStruct } from "../../path.ux/scripts/pathux.js";

import { errorText, getApi, getCtx } from "./app.js";

import type { DataAPI, DataPath } from "../../path.ux/scripts/pathux.js";

/* Mirror of path.ux's DataTypes. Duplicated on purpose: the walker below is
   duck-typed so it keeps working across path.ux API churn. */
const DataTypes = {
  STRUCT        : 0,
  DYNAMIC_STRUCT: 1,
  PROP          : 2,
  ARRAY         : 3,
};

/* One row of walkPaths(): a registered datapath and what it points at. */
interface PathEntry {
  path: string;
  kind: "prop" | "struct" | "dynamicStruct" | "list";
  propType?: string;
  structName?: string;
}

function getListElementStruct(api: DataAPI, dpath: DataPath): DataStruct | undefined {
  let data = dpath ? dpath.data : undefined;
  let cb = data instanceof DataList ? data.cb : undefined;

  if (!cb || typeof cb.getStruct !== "function") {
    return undefined;
  }

  try {
    let st: DataStruct | undefined = cb.getStruct(api, undefined, 0);
    return st && Array.isArray(st.members) ? st : undefined;
  } catch (error) {
    return undefined;
  }
}

function structName(st: DataStruct | undefined) {
  return st && st.name && st.name !== "unnamed" ? st.name : undefined;
}

function walkStruct(
  api: DataAPI,
  struct: DataStruct,
  prefix: string,
  depth: number,
  maxDepth: number,
  out: PathEntry[],
  visited: Set<object>
) {
  if (!struct || !Array.isArray(struct.members)) {
    return;
  }

  for (let dpath of struct.members) {
    let seg = dpath.apiname || dpath.path || "";
    if (!seg) {
      continue;
    }

    let path = prefix ? `${prefix}.${seg}` : seg;

    if (dpath.type === DataTypes.PROP) {
      out.push({
        path,
        kind    : "prop",
        propType: dpath.data && dpath.data.constructor ? dpath.data.constructor.name : "unknown",
      });
    } else if (dpath.type === DataTypes.STRUCT || dpath.type === DataTypes.DYNAMIC_STRUCT) {
      let dynamic = dpath.type === DataTypes.DYNAMIC_STRUCT;
      let data = dpath.data;
      let child = data instanceof DataStruct ? data : undefined;

      out.push({
        path,
        kind      : dynamic ? "dynamicStruct" : "struct",
        structName: structName(child),
      });

      if (child && !visited.has(child) && depth + 1 <= maxDepth) {
        walkStruct(api, child, path, depth + 1, maxDepth, out, new Set(visited).add(child));
      }
    } else if (dpath.type === DataTypes.ARRAY) {
      let elem = getListElementStruct(api, dpath);

      out.push({
        path,
        kind      : "list",
        structName: structName(elem),
      });

      if (elem && !visited.has(elem) && depth + 1 <= maxDepth) {
        walkStruct(api, elem, `${path}[n]`, depth + 1, maxDepth, out, new Set(visited).add(elem));
      }
    }
  }
}

/* Enumerate the entire registered datapath tree from the root context struct.
   This is the regression oracle: a path that disappears is a real break. */
export function walkPaths(maxDepth = 6) {
  let api = getApi();
  let root = api ? api.rootContextStruct : undefined;
  let out: PathEntry[] = [];

  if (!api || !root) {
    return out;
  }

  walkStruct(api, root, "", 0, maxDepth, out, new Set([root]));
  out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  return out;
}

/* Attempt to resolve (and, for props, read) every enumerated path.
   Many legitimately fail — no active object, empty list. What matters is that
   the pass/fail split stays stable across a path.ux bump. */
export function sweepPaths(maxDepth = 6) {
  let api = getApi(),
    ctx = getCtx();
  let entries = walkPaths(maxDepth);

  let ok: string[] = [],
    failed: { path: string; error: string }[] = [];

  for (let entry of entries) {
    if (entry.path.includes("[n]")) {
      continue; /* not a concrete path */
    }

    try {
      /* walkPaths() returns nothing at all unless the api exists, so entries is
         empty in the only case where these could be undefined. */
      let res = api!.resolvePath(ctx!, entry.path, true);

      if (res === undefined) {
        failed.push({ path: entry.path, error: "unresolved" });
        continue;
      }

      if (entry.kind === "prop") {
        api!.getValue(ctx!, entry.path);
      }

      ok.push(entry.path);
    } catch (error) {
      failed.push({ path: entry.path, error: errorText(error) });
    }
  }

  return { total: entries.length, ok, failed };
}
