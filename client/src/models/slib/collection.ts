import { Model } from "./base";
import { ObjectPool } from "./pool";

export class Collection<T extends Model> {
  items: T[] = [];
  itemIds: string[] = [];

  // objId is the ID of the owning object. Ie for trip.members this is the trip ID.
  objId: string | undefined;
  fkName: string | undefined;

  register(objId: string, fkName: string) {
    this.objId = objId;
    this.fkName = fkName;
  }

  push(item: T) {
    this.items.push(item);
    this.itemIds.push(item.id);

    if (this.fkName && this.objId) {
      const parent = ObjectPool.getInstance().get(this.objId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item as any)[this.fkName].push(parent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item.setProperty(this.fkName, (item as any)[this.fkName])
    }
  }

  get(index: number): T {
    return this.items[index];
  }

  get getIds(): string[] {
    return this.itemIds;
  }

  filter(callback: (_value: T) => boolean) {
    this.items = this.items.filter(callback);
    this.itemIds = this.itemIds.filter((id) =>
      this.items.map((i) => i.id).includes(id),
    );
  }

  delete(item: T) {
    this.items = this.items.filter((i) => i.id !== item.id);
    this.itemIds = this.itemIds.filter((id) => id !== item.id);

    if (this.fkName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item as any)[this.fkName].filter((t: any) => t.id !== this.objId);
    }
  }

  get length(): number {
    return this.items.length;
  }
}
