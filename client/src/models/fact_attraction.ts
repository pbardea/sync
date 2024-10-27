import { v4 } from "uuid";
import { ClientModel, Model, OneToMany, Property } from "./slib/base";
import { makeObservable, observable } from "mobx";
import { UserAttraction } from "./user_attraction";

export type AttractionType = "cafe" | "restaurant" | "hotel" | "attraction";

@ClientModel("FactAttraction")
export class FactAttraction extends Model {
    @observable
    @Property()
    accessor name: string = "";

    // All attractions start as a base attraction and can get more specific.
    @observable
    @Property()
    accessor type: AttractionType = "attraction";

    @observable
    @Property()
    accessor subtitle: string = "";

    @observable
    @Property()
    accessor description: string = "";

    @observable
    @Property()
    accessor about: string = "";

    @observable
    @Property()
    accessor website: string = "";

    @observable
    @Property()
    accessor instagram: string = "";

    @observable
    @Property()
    accessor address: string = "";

    @observable
    @Property()
    accessor lat: number | undefined;

    @observable
    @Property()
    accessor lon: number | undefined;

    @observable
    @Property()
    accessor hours: string = "";

    @observable
    @Property()
    accessor pictures: string[] = [];

    @observable
    @OneToMany("factAttraction")
    accessor userAttractions: UserAttraction[] = [];

    constructor(id = v4()) {
        super(id);
        // I don't know if this is needed with the decorators.
        makeObservable(this);
    }
}
