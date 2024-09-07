import { v4 } from "uuid";
import { ClientModel, ManyToOne, Model, Property } from "./slib/base";
import { Home } from "./home";
import { makeObservable, observable } from "mobx";

@ClientModel("User")
export class User extends Model {
    @observable
    @Property()
    accessor name: string;

    @observable
    @Property()
    accessor email: string;

    // TODO: This should probably eventually be a many to many situation.
    @observable
    @ManyToOne("members")
    public accessor home: Home | undefined = undefined;

    constructor(id = v4()) {
        super(id);
        this.name = "";
        this.email = "";
        makeObservable(this);
    }
}
