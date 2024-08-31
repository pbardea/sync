import { IDBPDatabase, openDB } from "idb";
import { Change } from "./pool";
import { Model } from "./base";
import { JsonModel } from "../api";

class LocalDB {
    private db: IDBPDatabase | undefined;
    active: boolean = false

    // Store connection locally.
    constructor() { }

    static async init(): Promise<LocalDB> {
        const instance = new LocalDB();
        try {
            // Setup connection to IndexDB.
            instance.db = await openDB("sync_testing", 4, {
                upgrade (db) {
                    if (!db.objectStoreNames.contains('_transactions')) {
                        db.createObjectStore('_transactions', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('Team')) {
                        db.createObjectStore('Team', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('User')) {
                        db.createObjectStore('User', { keyPath: 'id' });
                    }
                }
            });
            instance.active = true;
        } catch (_e) {
            // console.debug(e);
        }
        return instance
    }

    async saveTxn(txn: Change) {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        await this.db.put('_transactions', txn);
    }

    async removeTxn(id: number) {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        await this.db.delete('_transactions', id);
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
        return await this.db.getAll('_transactions');
    }

    async getAllObjects(): Promise<JsonModel[]> {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        const all = [];
        const objs = ["User", "Team"];
        for (const obj of objs) {
            const a = await this.db.getAll(obj);
            all.push(...a);
        }
        return all
    }

    async saveObject(obj: Model) {
        await this.saveJson(obj.getJson())
    }

    async saveJson(jsonObj: JsonModel) {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        try {
            await this.db.put(jsonObj.__class, jsonObj);
        } catch (e) {
            // TODO: Handle inserting duplicates
            console.error(e);
        }
    }
}

export const localDB = await LocalDB.init();
