import { v4 } from "uuid";
import { ClientModel, ManyToOne, Model, OneToMany, Property } from "./slib/base";
import { makeObservable, observable } from "mobx";
import { Trip } from "./trip";

@ClientModel("TripCity")
export class TripCity extends Model {
    @observable
    @Property()
    accessor name: string = "";

    @observable
    @ManyToOne("cities")
    public accessor trip: Trip | undefined;

    @observable
    @Property()
    public accessor headlinePicture: string | undefined;

    @observable
    @Property()
    public accessor subHeading: string | undefined;

    @observable
    @Property()
    public accessor userDescription: string | undefined;

    @observable
    @Property()
    public accessor about: string | undefined;

    @observable
    @Property()
    public accessor lat: number | undefined;

    @observable
    @Property()
    public accessor lon: number | undefined;

    @observable
    @Property()
    public accessor zoomLevel: number | undefined;

    @observable
    @OneToMany("city")
    public accessor attractions: undefined;

    constructor(id = v4()) {
        super(id);
        // I don't know if this is needed with the decorators.
        makeObservable(this);
    }
}
