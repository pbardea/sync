import { ClientModel, Model, OneToMany, Property } from "./base";
import { User } from "./user";

@ClientModel("Team")
export class Team extends Model {
  @Property()
  name: string = "";

  @OneToMany()
  public members: User[] = [];
}
