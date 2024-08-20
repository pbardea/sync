/* eslint-disable @typescript-eslint/no-explicit-any */

import { v4 as uuid } from "uuid";
import { Change, ObjectPool } from "./pool";

// Decorators
// TODO:
//   - ClientModel
//   - Property
//   - ManyToOne
//   - OneToMany
//   - OneToOne
//   - ManyToMany

// TODO: Figure out how to polyfill this w/ build system.
(Symbol as any).metadata ??= Symbol.for("Symbol.metadata");

const propKey = Symbol("properties");

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
  let original: any = undefined;

  return function dec(target: any, { metadata }: any) {
    const props = metadata[propKey];

    target.prototype._save = function (serverChange = false) {
      let change: Change;

      if (original === undefined) {
        const copyThis = JSON.parse(
          JSON.stringify(this, (key, value) => {
            if (key === "_pool") {
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
        original = copyThis;
      } else {
        const properties = Object.keys(props);
        const changes: Record<string, { original: any; updated: any }> = {};
        properties.forEach((property: any) => {
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

    target.prototype.save = function () {
      this._save();
    };
  };
}

// Base class.
export class Model {
  @Property()
  id: string = uuid();

  save(): void {}

  // Internal
  _pool: ObjectPool;

  constructor() {
    // Connect to the singleton.
    this._pool = ObjectPool.getInstance();
    this._pool.pool[this.id] = this;
  }
}

