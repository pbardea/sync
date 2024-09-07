import { v4 } from "uuid";
import { ClientModel, Model, OneToMany, Property } from "./slib/base";
import { User } from "./user";
import { makeObservable, observable } from "mobx";

@ClientModel("Home")
export class Home extends Model {
    @observable
    @Property()
    accessor name: string;

    @observable
    @OneToMany("home")
    public accessor members: User[] = [];

    constructor(id = v4()) {
        super(id);
        this.name = "";
        makeObservable(this);
    }
}
