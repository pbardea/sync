/* eslint-disable @typescript-eslint/no-explicit-any */

import { ApiIface, JsonModel } from "./api";
import { Model } from "./base";
import { action, computed, observable } from "mobx";
import { localDB } from "./localdb";
import { SyncResolver } from "./sync_resolver";
import { Change, TransactionQueue } from "./transaction_queue";

// ObjectPool is where we put models from the network.
// Models register their changes in the pool so that their changes are sent to the sync system.
// The pool is also responsible for initializing an object graph.
export class ObjectPool {
    syncResolver: SyncResolver;
    txnQueue: TransactionQueue;

    protected static instance: ObjectPool;
    protected constructor(apiClient: ApiIface) {
        const syncResolver = new SyncResolver(apiClient, this);
        const txnQueue = new TransactionQueue(apiClient, this);
        this.syncResolver = syncResolver;
        this.txnQueue = txnQueue;
    }
    static models: Record<string, any> = {};

    public static async init(apiClient: ApiIface) {
        const pool = new ObjectPool(apiClient);
        ObjectPool.instance = pool;
        await pool.syncResolver.bootstrap();
        await pool.txnQueue.bootstrap();
    }

    public static getInstance() {
        if (!ObjectPool.instance) {
            throw new Error("ObjectPool not initialized");
        }
        return ObjectPool.instance;
    }

    get(id: string): Model {
        return this.pool[id];
    }

    @observable
    accessor pool: Record<string, Model> = {};

    @observable
    private accessor root: Model | undefined;

    @computed
    get getRoot(): Model {
        if (this.root === undefined) {
            throw new Error("Root must be defined");
        }
        return this.root;
    }

    @action
    async addFromJson(json: JsonModel) {
        if (localDB.active) {
            await localDB.saveJson(json);
        }

        const constr: any = ObjectPool.models[json.__class];
        // Constr adds itself to the pool.
        const o = new constr(json.id);
        for (const key of Object.keys(json)) {
            if (key === "__class") {
                // Don't write the __class property.
                // That's only included to find the right constructor.
                // Consider nulling this out.
                continue;
            }
            if (key === "id") {
                continue;
            }
            if (key.endsWith("Id")) {
                const foreignO = this.pool[json[key]];
                const prop = key.slice(0, -2);
                o[prop] = foreignO;
                // This needs to be set to re-trigger the mapping.
                o.setProperty(prop, foreignO);
                // Lookup this ID in the pool
            } else {
                o[key] = json[key];
            }
        }
        // Save and don't flush this as a change.
        // Not flushing the change is only safe when we know user code won't
        // run concurrently.
        o._save();
    }

    @action
    delete(id: string): void {
        if (this.pool[id] === undefined) {
            return;
        }
        delete this.pool[id];
    }

    @action
    add(model: Model): void {
        if (this.root === undefined || this.root.id === model.id) {
            this.root = model;
        }
        this.pool[model.id] = model;
    }

    // rollback undoes a change on the txn queue stack. This will happen
    // if a change is rejected by the server.
    @action
    async rollback(change: Change) {
        switch (change.changeType) {
            case "update": {
                const target = this.pool[change.modelId];
                if (!target) {
                    // If we deleted the object, an undo to an edit doesn't make sense.
                    break;
                }
                for (const property in change.changeSnapshot.changes) {
                    const changeSnapshot = change.changeSnapshot.changes[property];
                    // TODO: Probably a better way to do this.
                    (target as any)[property] = changeSnapshot.original;
                }
                break;
            }
            case "create": {
                const o = this.pool[change.model.id];
                o.delete(true); // We don't need to send the delete to the server.
                break;
            }
            case "delete": {
                const modelCopy = JSON.parse(JSON.stringify(change.model));
                modelCopy["__class"] = change.modelType;
                this.addFromJson(modelCopy);
                break;
            }
        }
        if (localDB.active) {
            await localDB.removeTxn(change.id);
        }
    }

    @action
    async apply(change: Change) {
        switch (change.changeType) {
            case "update": {
                const target = this.pool[change.modelId];
                if (!target) {
                    // If we deleted the object, an undo to an edit doesn't make sense.
                    break;
                }
                for (const property in change.changeSnapshot.changes) {
                    const changeSnapshot = change.changeSnapshot.changes[property];
                    // TODO: Probably a better way to do this.
                    (target as any)[property] = changeSnapshot.updated;
                }
                break;
            }
            case "create": {
                const modelCopy = JSON.parse(JSON.stringify(change.model));
                modelCopy["__class"] = change.modelType;
                this.addFromJson(modelCopy);
                break;
            }
            case "delete": {
                const o = this.pool[change.model.id];
                if (o === undefined) {
                    break;
                }
                o.delete(true); // We don't need to send the delete to the server.
                break;
            }
        }
    }
}
