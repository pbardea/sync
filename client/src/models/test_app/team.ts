import { v4 } from "uuid";
import { ClientModel, Model, OneToMany, Property } from "../slib/base";
import { User } from "./user";
import { makeObservable, observable } from "mobx";

@ClientModel("Team")
export class Team extends Model {
  @observable
  @Property()
  accessor name: string;

  @observable
  @OneToMany("team")
  public accessor members: User[] = [];

  constructor(id = v4()) {
    super(id);
    this.name = "";
    makeObservable(this);
  }
}
