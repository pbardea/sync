/* eslint-disable @typescript-eslint/no-explicit-any */

import { Team } from "./team";
import { User } from "./user";

export type Change = { id: string } & (CreateChange | UpdateChange | DeletionChange);

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

export type JsonModel = { __class: string, id: string } & Record<string, any>;

export function injestObjects(jsons: JsonModel[]): void {
  // TODO: Top sort
  const pool = ObjectPool.getInstance();
  for (const json of jsons) {
    pool.addFromJson(json);
  }
}

// ObjectPool is where we put models from the network.
// Models register their changes in the pool so that their changes are sent to the sync system.
// The pool is also responsible for initializing an object graph.
export class ObjectPool {
  private static instance: ObjectPool;
  private constructor() { }

  static getInstance() {
    if (!ObjectPool.instance) {
      ObjectPool.instance = new ObjectPool();
    }
    return ObjectPool.instance;
  }

  static reset() {
    ObjectPool.instance = new ObjectPool();
  }

  get(id: string): { id: string } {
    return this.pool[id];
  }

  pool: Record<string, IdModel> = {};
  txns: Change[] = [];
  private root: IdModel | undefined;
  getRoot(): IdModel {
    if (this.root === undefined) {
      throw new Error("Root must be defined");
    }
    return this.root;
  }

  addFromJson(json: { __class: string, id: string } & Record<string, any>): void {
    // TODO: Make this a dynamic lookup that's populated from the decorators.
    let constr: any = User;
    switch (json.__class) {
      case "Team": {
        constr = Team;
        break;
      }
      case "User": {
        constr = User;
        break;
      }
    }
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

  add(model: IdModel) {
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

        // An update was issued?
        // this.updateInPool(target);
        break;
      }
      case "create": {
        // this.removeFromPool(change.model.id);
        break;
      }
    }
  }

  // When we register a new objct in the pool, any save() call that it makes
  // should register it's txn with us.
  // We should give the Model a reference to us and then the save() method
  // should create the transaction for the change that happened and apped
  // it to the txn log.
  //
  // Then there should be a "thread" that reads off of this queue. Ideally
  // when a new txn is added it's triggered (or triggered on size/time triggers in batches).
  //
  // Need some concept of a Rollback of a txn.
  //
  // The return value of the commit call needs to say the txn ID to de-dup changes.
  //
  // On error of committing, then the save function can rollback the txn automatically?

  // objects need to be inserted into the pool in the right order
  //

  // insertToPool(model: Model): void {
  //     // Something to resolve IDs to references.
  //     // All of the IDs referenced should be somewhere in the pool before initialized?
  // }
  // removeFromPool(modelId: string): void { }
  // updateInPool(model: Model): void {
  //     // Remove then insert.
  // }
}
