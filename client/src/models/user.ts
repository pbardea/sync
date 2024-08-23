import { v4 } from "uuid";
import { ClientModel, ManyToOne, Model, Property } from "./base";
import { ObjectPool } from "./pool";
import { Team } from "./team";
import { observable } from "mobx";

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

    constructor(pool = ObjectPool.getInstance(), id = v4()) {
        super(pool, id);
        this.name = "";
        this.email = "";
    }
}
