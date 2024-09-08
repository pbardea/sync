import { v4 } from "uuid";
import { ClientModel, ManyToMany, Model, Property } from "./slib/base";
import { makeObservable, observable } from "mobx";
import { User } from "./user";
import { Collection } from "./slib/collection";

@ClientModel("Trip")
export class Trip extends Model {
    @observable
    @Property()
    accessor name: string = "";

    @observable
    @ManyToMany("trips")
    public accessor members = new Collection<User>();

    constructor(id = v4()) {
        super(id);
        // I don't know if this is needed with the decorators.
        makeObservable(this);
    }
}
