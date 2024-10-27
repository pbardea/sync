import { v4 } from "uuid";
import { ClientModel, ManyToMany, Model, OneToMany, Property } from "./slib/base";
import { makeObservable, observable } from "mobx";
import { User } from "./user";
import { Collection } from "./slib/collection";
import { TripCity } from "./trip_city";
import { UserAttraction } from "./user_attraction";

type TripStatus = "planning" | "in_progress" | "completed";

@ClientModel("Trip")
export class Trip extends Model {
    @observable
    @Property()
    accessor name: string = "";

    // This is the one to set.
    @observable
    @ManyToMany("trips")
    public accessor members = new Collection<User>();

    @observable
    @Property()
    public accessor description: string = "";
    
    @observable
    @Property()
    public accessor subHeading: string = "";

    @observable
    @Property()
    public accessor startDate: Date | undefined;

    @observable
    @Property()
    public accessor endDate: Date | undefined;

    @observable
    @Property()
    public accessor headlinePicture: string | undefined;

    @observable
    @Property()
    public accessor status: TripStatus | undefined;

    @observable
    @OneToMany("trip")
    public accessor attractions: UserAttraction[] = [];

    // TODO: Consider collection? Only really required for many to many operations.
    @observable
    @OneToMany("trip")
    public accessor cities: TripCity[] = [];

    @observable
    @Property()
    public accessor guide: string = "";

    constructor(id = v4()) {
        super(id);
        // I don't know if this is needed with the decorators.
        makeObservable(this);
    }

    async saveGuide(serializedGuide: string) {
        this.guide = serializedGuide;
        await this.save();
    }
}
