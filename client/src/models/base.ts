/* eslint-disable @typescript-eslint/no-explicit-any */

import { Change, ObjectPool } from "./pool";
import { JsonModel } from "../api";
import { action, makeObservable, observable } from "mobx";
(Symbol as any).metadata ??= Symbol.for("Symbol.metadata");
// TODO: Figure out how to polyfill this w/ build system.

const propKey = Symbol("properties");
const refKey = Symbol("references");
const originalKey = Symbol("original");

// TODO: Increase type safety w/ generic.
export function ManyToOne(fkName: string) {
  return (_: any, { kind, name, metadata, addInitializer }: any) => {
    if (kind !== "accessor") {
      throw new Error("ManyToOne can only be used on accessors");
    }
    const idKey = name + "Id";

    // TODO: A lot of this is wrong as shared member names will be shared here.
    if (metadata[propKey] === undefined) {
      metadata[propKey] = {};
    }
    metadata[propKey][idKey] = true;

    if (metadata[refKey] === undefined) {
      metadata[refKey] = {};
    }
    metadata[refKey][idKey] = true;

    addInitializer(function () {
      let entity: any = undefined;
      Object.defineProperty(this, name, {
        get: () => entity,
        set: (newVal: any) => {
          const oldId = this[idKey];
          const newId = newVal?.id;

          // Note: No need to save the foreign object as the reference isn't defined
          // in data there.
          if (oldId) {
            const oldObj = this._pool.get(oldId);
            oldObj.setProperty(
              fkName,
              oldObj[fkName].filter((x: any) => x.id !== this.id),
            );
          }

          if (newId) {
            const newObj = this._pool.get(newId);
            if (newObj === undefined) {
              // console.log('Could not find object ' + newId)
              // console.log(this._pool)
            }
            newObj[fkName].push(this);
            newObj.setProperty(fkName, newObj[fkName]);
          }

          this.setProperty(idKey, newVal?.id);
          entity = newVal;
        },
        enumerable: true,
        configurable: true,
      });
    });
  };
}

// The receiving end of a ManyToOne relationship.
export function OneToMany(_name: string) {
  return function dec(_value: any, _c: any): void {
    // No-op
    // The corresponding ManyToOne should be responsible for persisting the data.
  };
}

export function Property() {
  return function dec(
    _value: any,
    { kind, name, metadata, addInitializer }: any,
  ) {
    if (kind !== "accessor") {
      throw new Error("Property can only be used on accessors");
    }
    if (metadata[propKey] === undefined) {
      metadata[propKey] = {};
    }

    metadata[propKey][name] = true;
    addInitializer(function () {
      let entity: any = undefined;
      Object.defineProperty(this, name, {
        get: () => entity,
        set: (newVal: any) => {
          entity = newVal;
        },
        enumerable: true,
        configurable: true,
      });
    });
  };
}

export function ClientModel(modelName: string) {
  return function dec(target: any, { metadata, addInitializer }: any) {
    // Reigster the constructor
    ObjectPool.models[modelName] = target;

    addInitializer(() => {
      let stored: any = undefined;
      Object.defineProperty(target, originalKey, {
        get: () => stored,
        set: (newVal: any) => {
          stored = newVal;
        },
        enumerable: true,
        configurable: true,
      });
    });

    const refKeys = Object.keys(metadata[refKey] ?? {});

    target.prototype.delete = function () {
      // For each ManyToOne, go find the FK and filter yourself out.
      for (const idKey of refKeys) {
        // E.g. turns teamId -> team
        const refKey = idKey.slice(0, -2);
        this[refKey] = undefined;
      }
    };

    target.prototype.getJson = function () {
      // Remove all references.
      const o = JSON.parse(
        JSON.stringify(this, (key, value) => {
          if (key && (key.startsWith("_") || key.endsWith("Id"))) {
            return undefined;
          }
          return value;
        }),
      );
      o["__class"] = target.name;
      return o;
    };

    target.prototype._save = function (serverChange: boolean) {
      let change: Change;
      const original = this[originalKey];

      if (original === undefined) {
        const copyThis = this.getJson();
        change = {
          id: "1",
          type: "create",
          modelType: modelName,
          modelId: copyThis.id,
          model: JSON.parse(JSON.stringify(copyThis)),
        };
        this[originalKey] = copyThis;
      } else {
        const changes: Record<string, { original: any; updated: any }> = {};
        const props = Object.keys(metadata[propKey] ?? {});
        props.forEach((property: any) => {
          if (original[property] !== this[property]) {
            changes[property] = {
              original: original[property],
              updated: this[property],
            };
            original[property] = this[property];
          }
        });

        change = {
          id: "1",
          type: "update",
          modelType: modelName,
          modelId: this.id,
          changeSnapshot: { changes },
        };
      }

      if (this._pool === null) {
        throw new Error("No pool set");
      }
      if (!serverChange) {
        this._pool.addChange(change);
      }
    };

    target.prototype.save = function () {
      this._save(false);
    };
  };
}

// Base class.
export class Model {
  static init() {}

  @observable
  @Property()
  accessor id: string;

  // Changes to this value are not emitted. We update this as we injest
  // the json from the server.
  lastModifiedDate?: Date;

  save(): void {
    throw new Error("Not implemented");
  }
  getJson(): JsonModel {
    throw new Error("Not implemented");
  }
  delete(): void {
    throw new Error("Not implemented");
  }
  _save(): void {
    throw new Error("Not implemented");
  }

  @action
  setProperty(key: any, value: any) {
    (this as any)[key] = value;
  }

  // Internal. Should be a hash.
  _pool: ObjectPool;

  // Rather than passing in, the ObjectPool should be able to choose the current client.
  // id can then be assigned afterwards as long as it's before initial save
  constructor(pool: ObjectPool, id: string) {
    makeObservable(this);
    this.id = id;
    // Connect to the singleton.
    this._pool = pool;
    this._pool.add(this);
  }
}
