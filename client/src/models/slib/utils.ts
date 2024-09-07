import { JsonModel } from "./api";

export function topologicalSort(objects: JsonModel[]): JsonModel[] {
  const objectsDict: { [key: string]: JsonModel } = {};
  const dependencies: { [key: string]: Set<string> } = {};

  objects.forEach((obj) => {
    objectsDict[obj.id] = obj;
    dependencies[obj.id] = new Set();
  });

  objects.forEach((obj) => {
    for (const key in obj) {
      if (key.endsWith("Id")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dependencies[obj.id].add((obj as any)[key]);
      }
    }
  });

  const visited: Set<string> = new Set();
  const result: string[] = [];

  function dfs(node: string) {
    if (visited.has(node)) {
      return;
    }
    visited.add(node);
    const deps = dependencies[node];
    if (!deps) {
      // TODO: Another approach to try here is that object creation can support
      // inserting objects out of order. At a high-level the way that this works is:
      //
      //  1. Mark these missing deps in an array
      //  2. When a new item is added, check this set and then go back and
      //     assign the prop
      //  3. If we finish the bootstrap and we're still missing some elements
      //     then we can either error or silently ignore.
      return;
    }
    deps.forEach((neighbor) => {
      dfs(neighbor);
    });
    result.push(node);
  }

  Object.keys(objectsDict).forEach((objId) => {
    dfs(objId);
  });

  return result.map((objId) => objectsDict[objId]);
}
