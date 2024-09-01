// /* eslint-disable @typescript-eslint/no-explicit-any */
//
// import { ApiIface, BootstrapData } from ".";
// import { Model } from "../models/base";
// import { Change, ObjectPool, ServerUpdate } from "../models/pool";
//
// // This is kinda just a big hack. Probably a very bad idea.
// //
// // TestingPool is used to simulate a backend.
// // It keeps objects in-memory. Instead of sending requests to the backend it
// // applies the changes directly to the in-memory state. The addChange method
// //
// export class ApiTestingPool extends ObjectPool {
//   protected static testInstance: ApiTestingPool;
//
//   public static override getInstance(apiClient = undefined) {
//     if (!ApiTestingPool.testInstance) {
//       ApiTestingPool.testInstance = new ApiTestingPool(apiClient);
//     }
//     return ApiTestingPool.testInstance;
//   }
//   // TODO: Figure out if this is needed.
//   async apply(change: Change) {
//     // This is a change that we receive from a websocket.
//     switch (change.changeType) {
//       case "update": {
//         const target = this.pool[change.modelId];
//         if (!target) {
//           throw new Error("Trying to update. Cannot find " + change.modelId);
//         }
//         for (const property in change.changeSnapshot.changes) {
//           const changeSnapshot = change.changeSnapshot.changes[property];
//           (target as any)[property] = changeSnapshot.updated;
//         }
//         // I think this will eventually stabilize.
//         (target as any).save();
//         break;
//       }
//       case "create": {
//         const modelCopy = JSON.parse(JSON.stringify(change.model));
//         modelCopy["__class"] = change.modelType;
//         this.addFromJson(modelCopy);
//         break;
//       }
//       case "delete": {
//         const o = this.pool[change.model.id];
//         if (o === undefined) {
//           return;
//         }
//         o.delete();
//         delete this.pool[change.model.id];
//         break;
//       }
//     }
//   }
// }
//
// export class MockApi implements ApiIface {
//   pool?: ApiTestingPool;
//   messagesToSend: ServerUpdate[] = [];
//
//   async login(_username: string, _password: string): Promise<void> {}
//   async bootstrap(): Promise<BootstrapData> {
//     return {
//       objects: [
//         {
//           id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
//           name: "Paul Bardea",
//           teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
//           lastModifiedDate: new Date().toISOString(),
//           version: 1,
//           __class: "User",
//         },
//         {
//           id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
//           name: "Paul",
//           email: "paul@pbardea.com",
//           teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
//           lastModifiedDate: new Date().toISOString(),
//           version: 1,
//           __class: "User",
//         },
//         {
//           id: "279592c1-2334-430b-b97f-a8f9265d4805",
//           name: "Team A",
//           lastModifiedDate: new Date().toISOString(),
//           version: 1,
//           __class: "Team",
//         },
//         {
//           id: "8949e0a4-357b-4a42-b6a3-ec90699197e7",
//           name: "Orphan",
//           email: "paul@pbardea.com",
//           lastModifiedDate: new Date().toISOString(),
//           version: 1,
//           __class: "User",
//         },
//       ],
//       tombstones: [],
//     };
//   }
//
//   async deltaBootstrap(_start: Date): Promise<BootstrapData> {
//     return {
//       objects: [
//         {
//           id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
//           name: "Paul Bardea",
//           teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
//           lastModifiedDate: new Date().toISOString(),
//           version: 1,
//           __class: "User",
//         },
//       ],
//       tombstones: [],
//     };
//   }
//
//   async change(change: Change): Promise<Model> {
//     if (!this.pool) {
//       this.pool = ApiTestingPool.getInstance();
//     }
//     const oldVersion = this.pool.get(change.modelId).version;
//     this.pool.apply(change);
//     if (!this.pool) {
//       this.pool = ApiTestingPool.getInstance();
//     }
//     const changeObject = this.pool.get(change.modelId);
//     if (changeObject === undefined) {
//       throw new Error("Entity was deleted");
//     }
//     changeObject.version = Math.max(oldVersion, changeObject.version) + 1;
//     changeObject.lastModifiedDate = new Date();
//     const changedRecord = changeObject.getJson();
//     this.messagesToSend.push({
//       type: change.changeType,
//       jsonObject: changedRecord,
//     });
//     return changeObject;
//   }
//
//   #clients: ObjectPool[] = [];
//   setupSync(client: ObjectPool): void {
//     this.#clients.push(client);
//   }
//
//   // Test helper: Runs the websocket server until drained.
//   async runWorker(): Promise<void> {
//     for (const message of this.messagesToSend) {
//       for (const client of this.#clients) {
//         client.syncResolver.applyServerUpdate(message);
//       }
//     }
//   }
// }
// export const mockApi = new MockApi();
