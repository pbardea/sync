import { v4 } from "uuid";
import { ClientModel, ManyToOne, Model, Property } from "../slib/base";
import { Team } from "./team";
import { action, makeObservable, observable } from "mobx";

@ClientModel("User")
export class User extends Model {
  @observable
  @Property()
  accessor name: string;

  @observable
  @Property()
  accessor email: string;

  @observable
  @ManyToOne("members")
  public accessor team: Team | undefined = undefined;

  @action
  setEmail(newEmail: string) {
    console.log("SETTING EMAIL");
    this.email = newEmail;
  }

  constructor(id = v4()) {
    super(id);
    this.name = "";
    this.email = "";
    makeObservable(this);
  }
}
