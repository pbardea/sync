import { IDBPDatabase, openDB } from "idb";
import { Model } from "./base";
import { Change } from "./transaction_queue";
import { JsonModel } from "./api";

class LocalDB {
    private db: IDBPDatabase | undefined;
    active: boolean = false;

    // Store connection locally.
    constructor() { }

    static async init(): Promise<LocalDB> {
        const instance = new LocalDB();
        try {
            // Setup connection to IndexDB.
            instance.db = await openDB("sync_testing", 9, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains("_transactions")) {
                        db.createObjectStore("_transactions", { keyPath: "id" });
                    }
                    if (!db.objectStoreNames.contains("_meta")) {
                        db.createObjectStore("_meta", { keyPath: "name" });
                    }
                    if (!db.objectStoreNames.contains("Home")) {
                        db.createObjectStore("Home", { keyPath: "id" });
                    }
                    if (!db.objectStoreNames.contains("User")) {
                        db.createObjectStore("User", { keyPath: "id" });
                    }
                    if (!db.objectStoreNames.contains("Trip")) {
                        db.createObjectStore("Trip", { keyPath: "id" });
                    }
                    if (!db.objectStoreNames.contains("TripCity")) {
                        db.createObjectStore("TripCity", { keyPath: "id" });
                    }
                    if (!db.objectStoreNames.contains("UserAttraction")) {
                        db.createObjectStore("UserAttraction", { keyPath: "id" });
                    }
                    if (!db.objectStoreNames.contains("FactAttraction")) {
                        db.createObjectStore("FactAttraction", { keyPath: "id" });
                    }
                },
            });
            instance.active = true;
        } catch {
            // Noop
        }
        return instance;
    }

    async getLatestTs(): Promise<string> {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        // return await this.db.get("_meta", "latest_ts");
        return ((await this.db.get("_meta", "latest_ts")) as { ts: string })["ts"];
    }

    async saveLatestTs(ts: string) {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        await this.db.put("_meta", { name: "latest_ts", ts: ts });
    }

    async saveTxn(txn: Change) {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        await this.db.put("_transactions", txn);
    }

    async removeTxn(id: string) {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        await this.db.delete("_transactions", id);
    }

    async removeObject(object: string, id: string) {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        await this.db.delete(object, id);
    }

    async getAllTxn(): Promise<Change[]> {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        const all = await this.db.getAll("_transactions");
        return all.sort((a, b) => a.oid - b.oid);
    }

    async getAllObjects(): Promise<JsonModel[]> {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        const all = [];
        const objs = ["User", "Home", "Trip", "TripCity", "UserAttraction", "FactAttraction"];
        for (const obj of objs) {
            const a = await this.db.getAll(obj);
            all.push(...a);
        }
        return all;
    }

    async saveObject(obj: Model) {
        await this.saveJson(obj.getJson());
    }

    async saveJson(jsonObj: JsonModel) {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        try {
            await this.db.put(jsonObj.__class, jsonObj);
        } catch (e) {
            console.error(e);
        }
    }
}

export const localDB = await LocalDB.init();
