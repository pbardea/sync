/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * v1
 * Bootstrap Protocol
 * - Start consuming websocket updates
 * - Opening the websocket connection should give a current timestamp from the server
 * - Start queueing these requests into the BOOTSTRAP_UPDATES_QUEUE
 * - Request a bootstrap to give you the current state of the world (do we need timestamp?)
 * - Load bootstrap into memory
 * - Drain the BOOTSTRAP_UPDATES_QUEUE
 * - Move to immediately applying changes that are ingesting them.
 *
 * From the perspective of the live inestor:
 * - Open a websocket connection
 * - Call bootstrap with the timestamp received from the first message
 * const conn = new Conn(); // This is a websocket setup request.
 * let isQueueing = true;
 * for message in conn.messages {
 *   switch (message.type) {
 *     init:
 *       // Eventually we also want to add a check to load local state.
 *       // we will also need to process the in-memory queue of rquests.
 *       // Then this can be a delta sync that just gets the updates in the
 *       // time period. Or just the records that were modified in the ts.
 *       // Maybe start time is just null.
 *       await bootstrap(message.ts)
 *       break;
 *     default:
 *       if (isQueueing) {
 *         addToBootstrapQueue(message);
 *       } else {
 *         process(message);
 *       }
 *   }
 * }
 *
 * function bootstrap(ts) {
 *   const initState = requestBootstrap(ts) // this is a network request
 *   injestInitState(initState);
 *   isQueueing = false
 *   // Drain the queue
 *   for (const message in queue) {
 *     process(message);
 *   }
 * }
 *
 */

import { v4 } from "uuid";
import { ApiIface, JsonModel } from "../api";
import { Model } from "./base";
import { computed, makeObservable, observable } from "mobx";

// TODO: Is BaseChange needed here?
export type Change = BaseChange &
    (CreateChange | UpdateChange | DeletionChange);

export type ServerUpdate = {
    type: "create" | "update" | "delete";
    jsonObject: JsonModel;
};

type IdModel = { id: string };

type ChangeSnapshot = {
    changes: Record<string, { original: any; updated: any }>;
};

interface BaseChange {
    id: string;
    modelType: string;
    modelId: string;
}

class UpdateChange implements BaseChange {
    id = v4();
    changeType = "update" as const;
    modelType: string;
    modelId: string;
    changeSnapshot: ChangeSnapshot;

    constructor(
        modelType: string,
        modelId: string,
        changeSnapshot: ChangeSnapshot,
    ) {
        makeObservable(this);
        this.modelType = modelType;
        this.modelId = modelId;
        this.changeSnapshot = changeSnapshot;
    }
}

class CreateChange implements BaseChange {
    id = v4();
    changeType = "create" as const;
    modelType: string;
    modelId: string;
    model: any;

    constructor(modelType: string, model: any) {
        this.modelType = modelType;
        this.model = model;
        this.modelId = model.id;
    }
}

class DeletionChange implements BaseChange {
    id = v4();
    changeType = "delete" as const;
    modelType: string;
    modelId: string;
    model: any;

    constructor(modelType: string, model: any) {
        this.modelType = modelType;
        this.model = model;
        this.modelId = model.id;
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

export function injestObjects(
    jsons: JsonModel[],
    pool = ObjectPool.getInstance(),
): void {
    const ordered = topologicalSort(jsons);
    for (const json of ordered) {
        pool.addFromJson(json);
    }
}

// ObjectPool is where we put models from the network.
// Models register their changes in the pool so that their changes are sent to the sync system.
// The pool is also responsible for initializing an object graph.
export class ObjectPool {
    protected static instance: ObjectPool;
    protected constructor(api?: ApiIface) {
        this.apiClient = api;
    }
    static models: Record<string, any> = {};
    private apiClient?: ApiIface;

    public static getInstance(apiClient: ApiIface | undefined = undefined) {
        if (!ObjectPool.instance) {
            ObjectPool.instance = new ObjectPool(apiClient);
        }
        return ObjectPool.instance;
    }

    public static reset(apiClient: ApiIface | undefined = undefined) {
        ObjectPool.instance = new ObjectPool(apiClient);
    }

    get(id: string): Model {
        return this.pool[id];
    }

    pool: Record<string, Model> = {};
    txns: Change[] = [];

    @observable
    private accessor root: IdModel | undefined;

    @computed
    get getRoot(): IdModel {
        if (this.root === undefined) {
            throw new Error("Root must be defined");
        }
        return this.root;
    }

    applyServerUpdate({ type, jsonObject }: ServerUpdate) {
        switch (type) {
            case "create": {
                // This might be a good reason to do the lazy initialization of the
                // references. This way if updates come in out of order we're not
                // dependent on that.
                if (this.pool[jsonObject["id"]] !== undefined) {
                    // Record is already created so we have a more up to date record.
                    return;
                }
                this.addFromJson(jsonObject);
                break;
            }
            case "update": {
                const elem = this.pool[jsonObject.id];
                if (!elem) {
                    // If we try to update an object that's not here it might have been
                    // deleted. We could introduce some tombstone process here...
                    //
                    // If we miss this update because it wasn't created yet, we should
                    // eventually catch up on the next update.
                    // console.debug(`Couldn't find element when applying`);
                    return;
                }
                const serverDate = new Date(jsonObject.lastModifiedDate);
                const localDate = new Date(elem.lastModifiedDate ?? 0);
                if (serverDate.getTime() < localDate.getTime()) {
                    // Server change is outdated. Ignore.
                    // console.debug("Ignoring update from server - I have a more recent v");
                    return;
                }

                // To update top references, I need to support that lazy sorting I
                // was talkign about. Let's try a user.
                elem.delete(true);
                this.addFromJson(jsonObject);
                break;
            }
            case "delete": {
                const elem = this.pool[jsonObject.id];
                if (!elem) {
                    return;
                }
                elem.delete();
                break;
            }
        }
        // TODO: Persist to local storage.
    }

    addFromJson(json: JsonModel): void {
        const constr: any = ObjectPool.models[json.__class];
        // Constr adds itself to the pool.
        const o = new constr(this, json["id"]);
        for (const key of Object.keys(json)) {
            if (key === "__class") {
                // Don't write the __class property.
                // That's only included to find the right constructor.
                // Consider nulling this out.
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
        // Not flushing the change is only safe when we know user code won't
        // run concurrently.
        o._save(true);
    }

    delete(id: string): void {
        if (this.pool[id] === undefined) {
            return;
        }
        delete this.pool[id];
    }

    add(model: Model): void {
        if (this.root === undefined) {
            this.root = model;
        }
        this.pool[model.id] = model;
    }

    async addChange(change: Change): Promise<void> {
        this.txns.push(change);
        if (!this.apiClient) {
            // Offline mode.
            return;
        }
        try {
            // Make an async request to change?.
            await this.apiClient.change(change);
            // If we get a success, that means that the change was accepted. We can
            // remove this from the local persistance because if we refresh we'll
            // get the latest from the server.
            this.txns = this.txns.filter((x) => x.id !== change.id);
            // TODO: Persist.
        } catch (e) {
            this.rollback(change);
            // TODO: Make a helper and persist.
            this.txns = this.txns.filter((x) => x.id !== change.id);
            // We did not successfully make a request so keep it in the local queue.
            console.error(e);
        }
    }

    // rollback undoes a change on the txn queue stack. This will happen
    // if a change is rejected by the server.
    rollback(change: Change) {
        switch (change.changeType) {
            case "update": {
                const target = this.pool[change.modelId];
                for (const property in change.changeSnapshot.changes) {
                    const changeSnapshot = change.changeSnapshot.changes[property];
                    // TODO: Probably a better way to do this.
                    (target as any)[property] = changeSnapshot.original;
                }
                break;
            }
            case "create": {
                const o = this.pool[change.model.id];
                o.delete();
                break;
            }
            case "delete": {
                const modelCopy = JSON.parse(JSON.stringify(change.model));
                modelCopy["__class"] = change.modelType;
                this.addFromJson(modelCopy);
                break;
            }
        }
        // TODO: For this to work we need to ensure that all txns have unique IDs.
        this.txns = this.txns.filter((x) => x.id !== change.id);
    }
}

// This is kinda just a big hack. Probably a very bad idea.
//
// TestingPool is used to simulate a backend.
// It keeps objects in-memory. Instead of sending requests to the backend it
// applies the changes directly to the in-memory state. The addChange method
//
export class ApiTestingPool extends ObjectPool {
    protected static testInstance: ApiTestingPool;

    public static override getInstance(apiClient = undefined) {
        if (!ApiTestingPool.testInstance) {
            ApiTestingPool.testInstance = new ApiTestingPool(apiClient);
        }
        return ApiTestingPool.testInstance;
    }
    // TODO: Figure out if this is needed.
    apply(change: Change) {
        // This is a change that we receive from a websocket.
        switch (change.changeType) {
            case "update": {
                const target = this.pool[change.modelId];
                if (!target) {
                    throw new Error("Trying to update. Cannot find " + change.modelId);
                }
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
                break;
            }
            case "delete": {
                const o = this.pool[change.model.id];
                if (o === undefined) {
                    return;
                }
                o.delete();
                delete this.pool[change.model.id];
                break;
            }
        }
    }
}

// TODO: Refactor this as just another helper on objectpool that returns a new instance.
export class SecondTestInstance extends ObjectPool {
    public static override getInstance(
        apiClient: ApiIface | undefined = undefined,
    ) {
        return new SecondTestInstance(apiClient);
    }
}
