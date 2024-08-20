import { ClientModel, ManyToOne, Model, Property } from "./base";

@ClientModel("User")
export class User extends Model {
  @Property()
  name: string = "";

  @Property()
  email: string = "";

  @ManyToOne("members")
  public accessor team: Team | undefined = undefined;
}
