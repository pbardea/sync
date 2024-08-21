/* eslint-disable @typescript-eslint/no-explicit-any */

import { Model } from "./base";

export type Change = { id: string } & (
  | CreateChange
  | UpdateChange
  | DeletionChange
);

type IdModel = { id: string };

type ChangeSnapshot = {
  changes: Record<string, { original: any; updated: any }>;
};

class UpdateChange {
  type = "update" as const;
  modelClass: string;
  modelId: string;
  changeSnapshot: ChangeSnapshot;

  constructor(
    modelClass: string,
    modelId: string,
    changeSnapshot: ChangeSnapshot,
  ) {
    this.modelClass = modelClass;
    this.modelId = modelId;
    this.changeSnapshot = changeSnapshot;
  }
}

class CreateChange {
  type = "create" as const;
  modelType: string;
  model: any;

  constructor(modelType: string, model: any) {
    this.modelType = modelType;
    this.model = model;
  }
}

class DeletionChange {
  type = "delete" as const;
  modelType: string;
  modelId: string;

  constructor(modelType: string, modelId: any) {
    this.modelType = modelType;
    this.modelId = modelId;
  }
}

function topologicalSort(objects: any[]): any[] {
  const objectsDict: { [key: string]: any } = {};
  const dependencies: { [key: string]: Set<string> } = {};

  objects.forEach((obj) => {
    objectsDict[obj.id] = obj;
    dependencies[obj.id] = new Set();
  });

  objects.forEach((obj) => {
    for (const key in obj) {
      if (key.endsWith("Id")) {
        dependencies[obj.id].add(obj[key]);
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
    dependencies[node].forEach((neighbor) => {
      dfs(neighbor);
    });
    result.push(node);
  }

  Object.keys(objectsDict).forEach((objId) => {
    dfs(objId);
  });

  return result.map((objId) => objectsDict[objId]);
}

export type JsonModel = { __class: string; id: string } & Record<string, any>;

export function injestObjects(jsons: JsonModel[]): void {
  const ordered = topologicalSort(jsons);
  const pool = ObjectPool.getInstance();
  for (const json of ordered) {
    pool.addFromJson(json);
  }
}

// ObjectPool is where we put models from the network.
// Models register their changes in the pool so that their changes are sent to the sync system.
// The pool is also responsible for initializing an object graph.
export class ObjectPool {
  private static instance: ObjectPool;
  private constructor() {}
  static models: Record<string, any> = {};

  public static getInstance() {
    if (!ObjectPool.instance) {
      ObjectPool.instance = new ObjectPool();
    }
    return ObjectPool.instance;
  }

  public static reset() {
    ObjectPool.instance = new ObjectPool();
  }

  get(id: string): { id: string } {
    return this.pool[id];
  }

  pool: Record<string, Model> = {};
  txns: Change[] = [];
  private root: IdModel | undefined;
  getRoot(): IdModel {
    if (this.root === undefined) {
      throw new Error("Root must be defined");
    }
    return this.root;
  }

  addFromJson(
    json: { __class: string; id: string } & Record<string, any>,
  ): void {
    const constr: any = ObjectPool.models[json.__class];
    // Constr adds itself to the pool.
    const o = new constr();
    for (const key of Object.keys(json)) {
      if (key === "__class") {
        continue;
      }
      if (key === "id") {
        // Hack to get around the constructor helper.
        delete this.pool[o.id];
        o[key] = json[key];
        this.pool[o.id] = o;
      } else if (key.endsWith("Id")) {
        // Lookup this ID in the pool
        const foreignO = this.pool[json[key]];
        const prop = key.slice(0, -2);
        o[prop] = foreignO;
      } else {
        o[key] = json[key];
      }
    }

    // Save and don't flush this as a change.
    o._save(true);
  }

  add(model: Model) {
    if (this.root === undefined) {
      this.root = model;
    }
    this.pool[model.id] = model;
  }

  addChange(change: Change) {
    this.txns.push(change);
    try {
      // Make a request to a server that can either accept or reject the change.
    } catch (e) {
      console.error(e);
    }
    // Process (ie send to server and accept or reject)
    // Should this be done in another worker in parallel?

    // Make a backend mutation request.
    // for (const change of this.txns) {
    //   if (failure) {
    //     showToast();
    //     this.rollback(change);
    //     continue;
    //   }
    // }
  }

  apply(change: Change) {
    // This is a change that we receive from a websocket.
    switch (change.type) {
      case "update": {
        const target = this.pool[change.modelId];
        for (const property in change.changeSnapshot.changes) {
          const changeSnapshot = change.changeSnapshot.changes[property];
          (target as any)[property] = changeSnapshot.updated;
        }
        // I think this will eventually stabilize.
        (target as any).save();
        break;
      }
      case "create": {
        const modelCopy = JSON.parse(JSON.stringify(change.model));
        modelCopy["__class"] = change.modelType;
        this.addFromJson(modelCopy);
      }
    }
  }

  // rollback undoes a change on the txn queue stack. This will happen
  // if a change is rejected by the server.
  rollback(change: Change) {
    switch (change.type) {
      case "update": {
        const target = this.pool[change.modelId];
        for (const property in change.changeSnapshot.changes) {
          const changeSnapshot = change.changeSnapshot.changes[property];
          // TODO: Probably a better way to do this.
          (target as any)[property] = changeSnapshot.original;
        }
        // Is it okay to not save here?
        break;
      }
      case "create": {
        // this.removeFromPool(change.model.id);
        break;
      }
    }
  }
}

// TODO:
