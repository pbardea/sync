/* eslint-disable @typescript-eslint/no-explicit-any */
    import { uuid } from "uuidv4";


/* POOL */
    export type Change = { id: string } & (CreateChange | UpdateChange);

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

    constructor(modelType: string, model: Model) {
        this.modelType = modelType;
        this.model = model;
    }
}

export class ObjectPool {
    private static instance: ObjectPool;

    private constructor() {}

    static getInstance() {
        if (!ObjectPool.instance) {
            ObjectPool.instance = new ObjectPool();
        }
        return ObjectPool.instance;
    }

    get(id: string): Model {
        return this.pool[id];
    }

    // TODO: Consider if this should be a modelClass -> modelId -> Model map
    pool: Record<string, Model> = {};

txns: Change[] = [];

addChange(change: Change) {
    this.txns.push(change);
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



// Decorators
// TODO:
//   - ClientModel
//   - Property
//   - ManyToOne
//   - OneToMany
//   - OneToOne
//   - ManyToMany

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

                    if (oldId) {
                        const oldObj = this._pool.get(oldId);
                        oldObj[fkName] = oldObj[fkName].filter((x: any) => x.id !== this.id);
                    }

                    if (newId) {
                        const newObj= this._pool.get(newId)
                        newObj[fkName].push(this);
                    }

                    this[idKey] = newVal?.id;
                    entity = newVal;
              },
                enumerable: true,
                configurable: true
            });
        });
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
                const copyThis = JSON.parse(JSON.stringify(this, (key, value) => {
                    if (key === "_pool") {
                        return undefined;
                    }
                    return value;
                }));
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


@ClientModel("User")
export class User extends Model {
    @Property()
    name: string = "";

    @Property()
    email: string = "";

    @ManyToOne("members")
    public accessor team: Team | undefined = undefined;
}


@ClientModel("Team")
export class Team extends Model {
    @Property()
    name: string = "";

    // Derived
    public members: User[] = [];
}

