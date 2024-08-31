import { ApiIface, BootstrapData } from ".";
import { Model } from "../models/base";
import {
    ApiTestingPool,
    Change,
    ObjectPool,
    ServerUpdate,
} from "../models/pool";

export class MockApi implements ApiIface {
    pool?: ApiTestingPool;
    messagesToSend: ServerUpdate[] = [];

    async login(_username: string, _password: string): Promise<void> { }
    async bootstrap(): Promise<BootstrapData> {
        return {
            objects: [
                {
                    id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
                    name: "Paul Bardea",
                    teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
                    lastModifiedDate: new Date().toISOString(),
                    version: 1,
                    __class: "User",
                },
                {
                    id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
                    name: "Paul",
                    email: "paul@pbardea.com",
                    teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
                    lastModifiedDate: new Date().toISOString(),
                    version: 1,
                    __class: "User",
                },
                {
                    id: "279592c1-2334-430b-b97f-a8f9265d4805",
                    name: "Team A",
                    lastModifiedDate: new Date().toISOString(),
                    version: 1,
                    __class: "Team",
                },
                {
                    id: "8949e0a4-357b-4a42-b6a3-ec90699197e7",
                    name: "Orphan",
                    email: "paul@pbardea.com",
                    lastModifiedDate: new Date().toISOString(),
                    version: 1,
                    __class: "User",
                },
            ],
        };
    }

    async deltaBootstrap(_start: Date): Promise<BootstrapData> {
        return {
            objects: [
                {
                    id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
                    name: "Paul Bardea",
                    teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
                    lastModifiedDate: new Date().toISOString(),
                    version: 1,
                    __class: "User",
                },
            ],
        };
    }

    async change(change: Change): Promise<Model> {
        if (!this.pool) {
            this.pool = ApiTestingPool.getInstance();
        }
        const oldVersion = this.pool.get(change.modelId).version;
        this.pool.apply(change);
        if (!this.pool) {
            this.pool = ApiTestingPool.getInstance();
        }
        const changeObject = this.pool.get(change.modelId);
        if (changeObject === undefined) {
            throw new Error("Entity was deleted");
        }
        changeObject.version = Math.max(oldVersion, changeObject.version) + 1;
        changeObject.lastModifiedDate = new Date();
        const changedRecord = changeObject.getJson();
        this.messagesToSend.push({
            type: change.changeType,
            jsonObject: changedRecord,
        });
        return changeObject;
        // Accept the change and transform it as a message to send on the queue.
        // TODO: Create a copy of the pool and maintain one server side?
        // Then you can call apply()? Or maybe just move the apply defn here?
        // Keep the state in memory and then apply changes. Get the record that
        // we changed and then send that record to the
    }

    #clients: ObjectPool[] = [];
    setupSync(client: ObjectPool): void {
        this.#clients.push(client);
    }

    // Test helper: Runs the websocket server until drained.
    async runWorker(): Promise<void> {
        for (const message of this.messagesToSend) {
            for (const client of this.#clients) {
                client.applyServerUpdate(message);
            }
        }
    }
}
export const mockApi = new MockApi();
