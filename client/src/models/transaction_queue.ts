import { v4 } from "uuid";
import { ApiIface, JsonModel } from "../api";
import { localDB } from "./localdb";
import { ObjectPool } from "./pool";

export type Change = BaseChange &
  (CreateChange | UpdateChange | DeletionChange);

type JsonLiteral = string | number | boolean

type ChangeSnapshot = {
  changes: Record<string, { original: JsonLiteral; updated: JsonLiteral }>;
};

interface BaseChange {
  id: string;
  oid: number;
  modelType: string;
  modelId: string;
}

class UpdateChange implements BaseChange {
  id = v4();
  oid: number = 0;
  changeType = "update" as const;
  modelType: string;
  modelId: string;
  changeSnapshot: ChangeSnapshot;

  constructor(
    modelType: string,
    modelId: string,
    changeSnapshot: ChangeSnapshot,
  ) {
    this.modelType = modelType;
    this.modelId = modelId;
    this.changeSnapshot = changeSnapshot;
  }
}

class CreateChange implements BaseChange {
  id = v4();
  oid: number = 0;
  changeType = "create" as const;
  modelType: string;
  modelId: string;
  model: JsonModel;

  constructor(modelType: string, model: JsonModel) {
    this.modelType = modelType;
    this.model = model;
    this.modelId = model.id;
  }
}

class DeletionChange implements BaseChange {
  id = v4();
  oid = 0;
  changeType = "delete" as const;
  modelType: string;
  modelId: string;
  model: JsonModel;

  constructor(modelType: string, model: JsonModel) {
    this.modelType = modelType;
    this.model = model;
    this.modelId = model.id;
  }
}


// TransactionQueue is responsible for managing the state of local transactions.
export class TransactionQueue {
  txns: Change[] = [];
  running_txns: Change[] = [];
  apiClient: ApiIface;
  pool: ObjectPool;

  constructor(apiClient: ApiIface, pool: ObjectPool) {
    this.apiClient = apiClient;
    this.pool = pool;
  }

  // Bootstrap is part of the startup protocol. This loads any persisted txns and applies
  // them to the pool.
  async bootstrap() {
    // Load txns from disk.
    const offlineChanges = await localDB.getAllTxn();
    for (const change of offlineChanges) {
      // Re-apply offline changes. This will send out the updates.
      // TODO: If safe, we can optimize this with batching.
      // This also applies them to the in-memory state
      await this.pool.apply(change);
      await this.addChange(change);
    }
  }

  async addChange(change: Change): Promise<void> {
    const local = await localDB.getAllTxn();
    change.oid = local.length;
    if (localDB.active) {
      await localDB.saveTxn(change);
    }
    this.txns.push(change);

    await this.drainLocalTxns();
  }

  async drainLocalTxns() {
    if (!this.apiClient) {
      // TODO: Premeptiely check if we're offline.
      // Offline mode for testing.
      return;
    }
    if (this.running_txns.length > 0) {
        // Effiectively a lock.
        return;
    }
    this.running_txns = [...this.txns].sort((a, b) => a.oid - b.oid);
    this.txns = [];
    // Safe to process now.
    for (const change of this.running_txns) {
      try {
        // Make an async request to change?.
        await this.apiClient.change(change);
        if (change.changeType === "delete") {
            if (localDB.active) {
                try {
                    await localDB.removeObject(change.modelType, change.modelId);
                } catch (e) {
                    console.error(e);
                }
            }
        }

        // I don't think that we need the server version with Lamport timestamps.

        // TODO: Get a timestamp from the server acc'ing. This should be the timestamp
        // set on the local model. This way it doesn't need to wait for the updates coming
        // over the websocket.

        // If we get a success, that means that the change was accepted. We can
        // remove this from the local persistance because if we refresh we'll
        // get the latest from the server.
        if (localDB.active) {
          await localDB.removeTxn(change.id);
        }
        // Remove this txn from the persisted txns.
      } catch (e) {
        if ((e as Error).message === "Failed to fetch") {
          // TODO: Type this better
          // If it failed due not being able to connect (ie offline),
          // then just leave it on the queue.

          this.txns.push(change);
          break;
        } else if ((e as Error).message.includes("rollback")) {
          await this.pool.rollback(change);
          if (localDB.active) {
            await localDB.removeTxn(change.id);
          }
          // We did not successfully make a request so keep it in the local queue.
          console.error(e);
        } else {
          if (localDB.active) {
            await localDB.removeTxn(change.id);
          }
          // We did not successfully make a request so keep it in the local queue.
          console.error(e);
        }
      }
    }
    // Free lock
    this.running_txns = [];
  }
}
