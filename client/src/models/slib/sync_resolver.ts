import { ApiIface, JsonModel } from "./api";
import { localDB } from "./localdb";
import { ObjectPool } from "./pool";
import { topologicalSort } from "./utils";

type ServerUpdate = {
  type: "create" | "update" | "delete";
  jsonObject: JsonModel;
};

export class SyncResolver {
  private apiClient: ApiIface;
  private pool: ObjectPool;

  private shouldQueueChanges = false;

  constructor(apiClient: ApiIface, pool: ObjectPool) {
    this.pool = pool;
    this.apiClient = apiClient;
  }

  async injestObjects(jsons: JsonModel[]) {
    const ordered = topologicalSort(jsons);
    for (const json of ordered) {
      await this.pool.addFromJson(json);
    }
  }

  async bootstrap() {
    // Mark that we shouldn't be applying changes during the bootstrap protocol.
    this.shouldQueueChanges = true;
    this.apiClient.setupSync(this);
    const localObjs = localDB.active ? await localDB.getAllObjects() : [];
    if (localObjs.length === 0) {
      // Full bootstrap
      const bootstrapJson = await this.apiClient.bootstrap();
      this.injestObjects(bootstrapJson.objects);
      if (localDB.active) {
        await localDB.saveLatestTs(bootstrapJson.latestTs.toISOString());
        for (const jsonObj of bootstrapJson.objects) {
          await localDB.saveJson(jsonObj);
        }
      }
    } else {
      // 1. Local objects load
      this.injestObjects(localObjs);

      // 2. Request a delta bootstrap and load those
      // TODO: Update this to look at the last sync ID from the last bootstrap.
      // We should have a global monotonically increasing ID whenever a change is
      // registered on the server.
      // const start = localObjs.reduce((acc: Date, m: JsonModel) => {
      //   const modelDate = new Date(m.lastModifiedDate ?? 0);
      //   acc = acc > modelDate ? acc : modelDate;
      //   return acc;
      // }, new Date(0));
      const tsString = (await localDB.getLatestTs()) ?? 0;
      const start = new Date(tsString);

      const deltaBootstrap = await this.apiClient.deltaBootstrap(start);
      if (localDB.active) {
          await localDB.saveLatestTs(deltaBootstrap.latestTs.toISOString());
      }
      this.injestObjects(deltaBootstrap.objects);
      for (const tombstone of deltaBootstrap.tombstones) {
        const o = this.pool.get(tombstone.id);
        if (o !== undefined) {
          if (localDB.active) {
            localDB.removeObject(tombstone.modelName, tombstone.id);
          }
          o.delete(true);
        }
      }

      for (const jsonObj of deltaBootstrap.objects) {
        await localDB.saveJson(jsonObj);
      }
    }

    // Done bootstraping so safe to resume injesting remote updates
    this.shouldQueueChanges = false;
    this.drainRemoteTxns();
  }

  private updates: ServerUpdate[] = [];
  async addServerChange(update: ServerUpdate) {
    this.updates.push(update);
    this.drainRemoteTxns();
  }

  async drainRemoteTxns() {
    if (!this.shouldQueueChanges) {
      const updatesToRun = [...this.updates];
      this.updates = [];
      for (const update of updatesToRun) {
        await this.applyServerUpdate(update);
      }
    }
  }

  async applyServerUpdate({ type, jsonObject }: ServerUpdate) {
    switch (type) {
      case "create": {
        // This might be a good reason to do the lazy initialization of the
        // references. This way if updates come in out of order we're not
        // dependent on that.
        if (this.pool.get(jsonObject["id"]) !== undefined) {
          // Record is already created so we have a more up to date record.
          return;
        }
        await this.pool.addFromJson(jsonObject);
        break;
      }
      case "update": {
        const elem = this.pool.get(jsonObject.id);
        if (!elem) {
          // If we try to update an object that's not here it might have been
          // deleted. We could introduce some tombstone process here...
          //
          // If we miss this update because it wasn't created yet, we should
          // eventually catch up on the next update.
          // console.debug(`Couldn't find element when applying`);
          return;
        }
        const serverVersion = jsonObject.version;
        const localVersion = elem.version;
        if (serverVersion <= localVersion) {
          // We already have this change applied
          console.log("Rejecting old update");
          return;
        }

        // This works better than removing and adding to a pool. To investigate.
        if (localDB.active) {
            await localDB.saveJson(elem.getJson())
        }
        for (const property in jsonObject) {
            if (property.startsWith("_")) {
                continue
            }
            elem.setProperty(property, jsonObject[property]);
        }

        // // To update top references, I need to support that lazy sorting I
        // // was talkign about. Let's try a user.
        // elem.delete(true);
        // await this.pool.addFromJson(jsonObject);
        // console.log("Updated object");
        // console.log(jsonObject);
        // console.log(this.pool.get(jsonObject.id));
        break;
      }
      case "delete": {
        if (localDB.active) {
          try {
            await localDB.removeObject(jsonObject.__class, jsonObject.id);
          } catch (e) {
            console.error(e);
          }
        }

        const elem = this.pool.get(jsonObject.id);
        if (!elem) {
          return;
        }
        elem.delete(true);
        break;
      }
    }
  }
}
