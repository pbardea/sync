/* eslint-disable @typescript-eslint/no-explicit-any */

import { v4 as uuid } from "uuid";
import { Change, ObjectPool } from "./pool";
import { JsonModel } from "../api";
import { observable } from "mobx";

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

        // TODO: A lot of this is wrong as shared member names will be shared here.
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
                        if (newObj === undefined) {
                            console.log("Could not find object " + newId);
                            console.log(this._pool);
                        }
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
        addInitializer(function() {
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

        // This should be called whenever an ID is updated in the pool (add or update).
        const handleOrphans = (id: string) => {
            const entries = this._pool.orphans[id] ?? [];
            for (const orphanEntry of entries) {
                const obj = orphanEntry.obj;
                obj[orphanEntry.propName] = this;
            }
            delete this.getOrphans[id];
        };

        // Delete can orphan elements.
        // For each element that it referenced that is still in the pool, make a note.
        // This is because one way we can do "updates" is to delete the object and add it back.
        // It also saves us from needing to sort all of the objects up-front so we
        // can ingest them in a streaming fasion and don't need to hold them all
        // in memory.
        //
        // Here's an example:
        // We first ingest User1 that references Team1, but team does not exist
        // We fail the lookup to Team1 in the object pool, we make a note of that
        // in the orphan pool.
        // TODO: Orphan pool shouldn't be in metadata. It should be at the pool level.
        // When inserting Team, we check if my ID is in the orphan pool. If it is,
        // someone tried to reference me. The value of the key map is an array of all
        // of the objects that tried to reference me and the key by which they referenced me by.
        // We can actually just store an array of references to those objects.
        //
        // Example entry:
        // {
        //   "123-123-123": [{
        //     "obj": #ref<User>,
        //     "propName": "team",
        //   }]
        // }
        //
        // For each element in the array, loop through and do:
        //
        // I think that we also need to do this whenever an ID changes.
        // I'm not sure we should allow ID changes?
        //
        // const entries = this.getOrphans[id];
        // for (const orphanEntry of entries) {
        //   const obj = orphanEntry.obj;
        //   obj[orphanEntry.propName] = this;
        // }
        // delete this.getOrphans[id]
        //
        // Then, when something is deleted:
        // E.g. [members] for teams
        target.prototype.delete = function() {
            const id = this["id"];
            // For each of your OneToMany's filter yourself out.
            // for (const { prop, revFkName } of this._pool.reverseLookups[modelName]) {
            //   for (const ref of this[prop]) {
            //     this._pool.orphans[id] = this._pool.orphans[id] ?? [];
            //     this._pool.orphans[id].push({
            //       obj: ref,
            //       propName: revFkName,
            //     });
            //   }
            // }
            // For each ManyToOne, go find the FK and filter yourself out.
            for (const idKey of refKeys) {
                // E.g. turns teamId -> team
                const refKey = idKey.slice(0, -2);
                this[refKey] = undefined;
            }
        };

        target.prototype.getJson = function() {
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

        target.prototype._save = function(serverChange: boolean) {
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

        target.prototype.save = function() {
            this._save(false);
        };
    };
}

// Base class.
export class Model {
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

    // Internal. Should be a hash.
    _pool: ObjectPool;

    // Rather than passing in, the ObjectPool should be able to choose the current client.
    // id can then be assigned afterwards as long as it's before initial save
    constructor(pool: ObjectPool, id: string) {
        this.id = id;
        // Connect to the singleton.
        this._pool = pool;
        this._pool.add(this);
    }
}
