/* eslint-disable @typescript-eslint/no-explicit-any */

import { ObjectPool } from "./pool";
import { JsonModel } from "./api";
import { action, makeObservable, observable } from "mobx";
import { v4 } from "uuid";
import { Change } from "./transaction_queue";
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

        addInitializer(function() {
            const className = this.constructor.name;
            if (metadata[propKey] === undefined) {
                metadata[propKey] = {};
            }
            if (metadata[propKey][className] === undefined) {
                metadata[propKey][className] = {};
            }
            metadata[propKey][className][idKey] = true;

            if (metadata[refKey] === undefined) {
                metadata[refKey] = {};
            }
            if (metadata[refKey][className] === undefined) {
                metadata[refKey][className] = {};
            }
            metadata[refKey][className][idKey] = true;


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
                        if (!newObj[fkName].find((x: Model) => x.id === this.id)) {
                            newObj[fkName].push(this);
                            newObj.setProperty(fkName, newObj[fkName]);
                        }
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
        addInitializer(function() {
            const className = this.constructor.name;
            if (metadata[propKey] === undefined) {
                metadata[propKey] = {};
            }
            if (metadata[propKey]?.[className] === undefined) {
                metadata[propKey][className] = {};
            }
            metadata[propKey][className][name] = true;
        });
    };
}

export function ClientModel(modelName: string) {
    return function dec(target: any, { metadata, addInitializer }: any) {
        // Reigster the constructor
        ObjectPool.models[modelName] = target;

        // Create a field on this object to store the prior version the last time save() was called.
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

        target.prototype.delete = function(serverChange = false) {
            const className = this.constructor.name;
            const refKeys = Object.keys(metadata[refKey]?.[className] ?? {});

            // Remove it from the pool first
            this._pool.delete(this.id);

            const change = {
                id: v4(),
                oid: 0,
                changeType: "delete",
                modelType: modelName,
                modelId: this.id,
                model: this.getJson(),
            };
            if (!serverChange) {
                this._pool.txnQueue.addChange(change);
            }

            // Update the rest of the models.
            // For each ManyToOne, go find the FK and filter yourself out.
            for (const idKey of refKeys) {
                // E.g. turns teamId -> team
                // Set these fields to 0 so that we get removed from the parent
                // set.
                const refKey = idKey.slice(0, -2);
                this[refKey] = undefined;
            }
            this._save();
        };

        target.prototype.getJson = function() {
            const className = this.constructor.name;
            const refKeys = Object.keys(metadata[refKey]?.[className] ?? {});

            // Remove all references.
            const o = JSON.parse(
                JSON.stringify(this, (key, value) => {
                    if (
                        key &&
                        (key.startsWith("_") ||
                            refKeys.map((x) => x.slice(0, -2)).includes(key))
                    ) {
                        return undefined;
                    }
                    return value;
                }),
            );
            const props = Object.keys(metadata[propKey]?.[className] ?? {});
            for (const prop of props) {
                o[prop] = this[prop];
            }
            o["__class"] = modelName;
            return o;
        };

        target.prototype._save = function(serverChange: boolean = true) {
            let change: Change;
            const original = this[originalKey];

            if (original === undefined) {
                const copyThis = this.getJson();
                change = {
                    id: v4(),
                    oid: 0,
                    changeType: "create",
                    modelType: modelName,
                    modelId: copyThis.id,
                    model: JSON.parse(JSON.stringify(copyThis)),
                };
                this[originalKey] = copyThis;
            } else {
                const changes: Record<string, { original: any; updated: any }> = {};
                const className = this.constructor.name;
                const props = Object.keys(metadata[propKey]?.[className] ?? {});
                props.forEach((property: any) => {
                    if (original[property] !== this[property]) {
                        changes[property] = {
                            original: original[property] ?? null,
                            updated: this[property] ?? null,
                        };
                        this[originalKey][property] = this[property];
                    }
                });
                if (Object.keys(changes).length === 0) {
                    return;
                }

                change = {
                    id: v4(),
                    oid: 0,
                    changeType: "update",
                    modelType: modelName,
                    modelId: this.id,
                    changeSnapshot: { changes },
                };
            }

            if (this._pool === null) {
                throw new Error("No pool set");
            }
            if (!serverChange) {
                this._pool.txnQueue.addChange(change);
            }
        };

        target.prototype.save = function() {
            // A client has made a change.
            // On the server, if a new change comes in with an older version, it will
            // respond with the lastest version + 1
            this.version += 1;
            this._save(false);
        };
    };
}

// Base class.
export class Model {
    static init() { }

    @observable
    @Property()
    accessor id: string;

    @Property()
    accessor version: number = 0;

    // Changes to this value are not emitted. We update this as we injest
    // the json from the server.
    lastModifiedDate?: Date;

    save() {
        throw new Error("Not implemented");
    }
    _save() {
        throw new Error("Not implemented");
    }
    getJson(): JsonModel {
        throw new Error("Not implemented");
    }
    delete(_applyServerChange = false): void {
        throw new Error("Not implemented");
    }

    @action
    setProperty(key: any, value: any) {
        (this as any)[key] = value;
    }

    protected _pool: ObjectPool;

    // Rather than passing in, the ObjectPool should be able to choose the current client.
    // id can then be assigned afterwards as long as it's before initial save
    constructor(id: string) {
        this.id = id;
        this._pool = ObjectPool.getInstance();
        this._pool.add(this);
        makeObservable(this);
    }
}
