/* eslint-disable @typescript-eslint/no-explicit-any */

import { v4 as uuid } from "uuid";
import { Change, ObjectPool } from "./pool";

// TODO: Figure out how to polyfill this w/ build system.
(Symbol as any).metadata ??= Symbol.for("Symbol.metadata");

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

    if (metadata[propKey] === undefined) {
      metadata[propKey] = {};
    }
    metadata[propKey][idKey] = true;

    if (metadata[refKey] === undefined) {
      metadata[refKey] = {};
    }
    metadata[refKey][idKey] = true;

    addInitializer(function() {
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
            oldObj[fkName] = oldObj[fkName].filter(
              (x: any) => x.id !== this.id,
            );
          }

          if (newId) {
            const newObj = this._pool.get(newId);
            newObj[fkName].push(this);
          }

          this[idKey] = newVal?.id;
          entity = newVal;
        },
        enumerable: true,
        configurable: true,
      });
    });
  };
}

// The receiving end of a ManyToOne relationship.
export function OneToMany() {
  return function dec(): void {
    // No-op
    // The corresponding ManyToOne should be responsible for persisting the data.
  };
}

export function Property() {
  return function dec(_value: any, { name, metadata }: any) {
    if (metadata[propKey] === undefined) {
      metadata[propKey] = {};
    }

    metadata[propKey][name] = true;
  };
}

export function ClientModel(modelName: string) {
  return function dec(target: any, { metadata, addInitializer }: any) {
    // Reigster the constructor
    ObjectPool.models[modelName] = target;

    addInitializer(() => {
      let original: any = undefined;
      Object.defineProperty(target, originalKey, {
        get: () => original,
        set: (newVal: any) => {
          original = newVal;
        },
        enumerable: true,
        configurable: true,
      });

    });

    const props = Object.keys(metadata[propKey] ?? {});
    const refKeys = Object.keys(metadata[refKey] ?? {});

    target.prototype.delete = function() {
      // For each ManyToOne, go find the FK and filter yourself out.
      for (const key of refKeys) {
        this[key.slice(0, -2)] = undefined;
      }
    }

    target.prototype._save = function(serverChange: boolean) {
      let change: Change;
      const original = this[originalKey];

      if (original === undefined) {
        const copyThis = JSON.parse(
          JSON.stringify(this, (key, value) => {
            if (key && typeof value === "object") {
              return undefined;
            }
            return value;
          }),
        );
        change = {
          id: "1",
          type: "create",
          modelType: modelName,
          model: JSON.parse(JSON.stringify(copyThis)),
        };
        this[originalKey] = copyThis;
      } else {
        const changes: Record<string, { original: any; updated: any }> = {};
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
          modelClass: modelName,
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

    target.prototype.save = function() {
      this._save(false);
    };
  };
}

// Base class.
export class Model {
  @Property()
  id: string = uuid();

  // Changes to this value are not emitted. We update this as we injest
  // the json from the server.
  lastModifiedDate?: Date;

  save(): void { }
  delete(): void { }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _save(_serverChange: boolean): void { }

  // Internal
  _pool: ObjectPool;

  constructor() {
    // Connect to the singleton.
    this._pool = ObjectPool.getInstance();
    this._pool.add(this);
  }
}

