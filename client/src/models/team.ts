import { v4 } from "uuid";
import { ClientModel, Model, OneToMany, Property } from "./base";
import { User } from "./user";
import { ObjectPool } from "./pool";
import { makeObservable, observable } from "mobx";

@ClientModel("Team")
export class Team extends Model {
  @observable
  @Property()
  accessor name: string;

  @observable
  @OneToMany("team")
  public accessor members: User[] = [];

  constructor(pool = ObjectPool.getInstance(), id = v4()) {
    super(pool, id);
    this.name = "";
    makeObservable(this);
  }
}
