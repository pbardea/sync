import { makeObservable, observable } from "mobx";
import { ClientModel, ManyToOne, Model, Property } from "./slib/base";
import { v4 } from "uuid";
import { AttractionType } from "./fact_attraction";
import { TripCity } from "./trip_city";
import { Trip } from "./trip";

@ClientModel("UserAttraction")
export class UserAttraction extends Model {
    @observable
    @Property()
    accessor nameOverride: string = "";

    @observable
    @Property()
    accessor typeOverride: AttractionType | undefined;

    @observable
    @ManyToOne("attractions")
    accessor city: TripCity | undefined;

    @observable
    @ManyToOne("attractions")
    accessor trip: Trip | undefined;

    @observable
    @Property()
    accessor rating: number | undefined;

    @observable
    @Property()
    accessor review: string = "";

    @observable
    @Property()
    accessor pictures: string[] = [];

    constructor(id = v4()) {
        super(id);
        // I don't know if this is needed with the decorators.
        makeObservable(this);
    }
}