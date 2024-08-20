import { ClientModel, Model, Property } from "./base";
import { User } from "./user";

@ClientModel("Team")
export class Team extends Model {
  @Property()
  name: string = "";

  // Derived
  public members: User[] = [];
}
