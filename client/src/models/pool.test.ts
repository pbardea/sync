import { beforeEach, describe, expect, test } from "vitest";
import {
    Change,
    injestObjects,
    ObjectPool,
    ApiTestingPool,
    SecondTestInstance,
} from "./pool";
import { User } from "./user";
import { Team } from "./team";
import { mockApi } from "../api/mock_api";

describe("object pool", () => {
    beforeEach(() => {
        ObjectPool.reset();
    });

    // Common bootstrap config.
    const bootstrapJson = [
        {
            id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
            name: "Paul Bardea",
            teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
            lastModifiedDate: new Date().toISOString(),
            version: 1,
            __class: "User",
        },
        {
            id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
            name: "Paul",
            email: "paul@pbardea.com",
            teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
            lastModifiedDate: new Date().toISOString(),
            version: 1,
            __class: "User",
        },
        {
            id: "279592c1-2334-430b-b97f-a8f9265d4805",
            name: "Team A",
            lastModifiedDate: new Date().toISOString(),
            version: 1,
            __class: "Team",
        },
        {
            id: "8949e0a4-357b-4a42-b6a3-ec90699197e7",
            name: "Orphan",
            email: "paul@pbardea.com",
            lastModifiedDate: new Date().toISOString(),
            version: 1,
            __class: "User",
        },
    ];

    // Just documenting how this works for now. Unsure if this is the desired
    // state.
    test("gracefully handles non-schema keys", () => {
        const bootstrapJson = [
            {
                id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
                name: "Paul Bardea",
                lastModifiedDate: new Date().toISOString(),
                boom: "bar",
                __class: "Team",
            },
        ];

        injestObjects(bootstrapJson);
        const team = ObjectPool.getInstance().getRoot as Team;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((team as any)["boom"]).toEqual("bar");
    });

    test("gracefully handles missing reference", () => {
        const bootstrapJson = [
            {
                id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
                name: "Paul Bardea",
                teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
                lastModifiedDate: new Date().toISOString(),
                __class: "User",
            },
        ];

        injestObjects(bootstrapJson);
        const user = ObjectPool.getInstance().getRoot as User;
        expect(user.team).toBeUndefined();
    });

    test("can bootstrap out of order", () => {
        const pool = ObjectPool.getInstance();

        injestObjects(bootstrapJson);
        const team = pool.getRoot as Team;
        expect(team.constructor.name).toEqual("Team");
        expect(team.members.length).toEqual(2);
        expect(team.members[0].name).toEqual("Paul Bardea");
        expect(team.members[1].name).toEqual("Paul");
        expect(team.members[1].email).toEqual("paul@pbardea.com");
    });

    test("can bootstrap", () => {
        const pool = ObjectPool.getInstance();
        injestObjects(bootstrapJson);
        const team = pool.getRoot as Team;
        expect(team.constructor.name).toEqual("Team");
        expect(team.members.length).toEqual(2);
        expect(team.members[0].name).toEqual("Paul Bardea");
        expect(team.members[1].name).toEqual("Paul");
        expect(team.members[1].email).toEqual("paul@pbardea.com");
    });

    test("emits change txns", () => {
        const pool = ObjectPool.getInstance();
        pool.txns = [];

        const user = new User();
        user.name = "Paul";

        expect(pool.txns.length).toBe(0);
        user.save();
        expect(pool.txns.length).toBe(1);
        expect(pool.txns[0]).toMatchObject({
            id: expect.any(String),
            changeType: "create",
            modelType: "User",
            model: {
                id: expect.any(String),
                name: "Paul",
                email: "",
            },
        });

        user.name = "Paul Bardea";
        user.email = "paul@pbardea.com";
        user.save();

        expect(pool.txns.length).toBe(2);
        const id = user.id;
        expect(pool.txns[1]).toEqual({
            id: expect.any(String),
            changeType: "update",
            modelType: "User",
            modelId: id,
            changeSnapshot: {
                changes: {
                    name: {
                        original: "Paul",
                        updated: "Paul Bardea",
                    },
                    email: {
                        original: "",
                        updated: "paul@pbardea.com",
                    },
                    version: {
                        original: "1",
                        updated: "2",
                    },
                },
            },
        });

        const teamA = new Team();
        expect(teamA.members).toEqual([]);
        user.team = teamA;

        pool.txns = [];
        user.save();
        expect(pool.txns[0]).toMatchObject({
            id: expect.any(String),
            changeType: "update",
            modelType: "User",
            modelId: id,
            changeSnapshot: {
                changes: {
                    teamId: {
                        original: null,
                        updated: teamA.id,
                    },
                    version: {
                        original: "2",
                        updated: "3",
                    },
                },
            },
        });
        expect(teamA.members).toEqual([user]);

        user.team = undefined;
        expect(teamA.members).toEqual([]);
        user.save();
        expect(pool.txns[1]).toMatchObject({
            id: expect.any(String),
            changeType: "update",
            modelType: "User",
            modelId: id,
            changeSnapshot: {
                changes: {
                    teamId: {
                        original: teamA.id,
                        updated: null,
                    },
                    version: {
                        original: "3",
                        updated: "4",
                    },
                },
            },
        });

        const teamB = new Team();
        expect(teamA.members).toEqual([]);
        expect(teamB.members).toEqual([]);
        user.team = teamB;
        expect(teamA.members).toEqual([]);
        expect(teamB.members).toEqual([user]);
        user.team = teamA;
        expect(teamA.members).toEqual([user]);
        expect(teamB.members).toEqual([]);
        user.save();
        expect(pool.txns[2]).toMatchObject({
            id: expect.any(String),
            changeType: "update",
            modelType: "User",
            modelId: id,
            changeSnapshot: {
                changes: {
                    teamId: {
                        original: null,
                        updated: teamA.id,
                    },
                    version: {
                        original: "4",
                        updated: "5",
                    },
                },
            },
        });

        user.team = teamB;
        expect(teamA.members).toEqual([]);
        expect(teamB.members).toEqual([user]);
        user.save();
        expect(pool.txns[3]).toMatchObject({
            id: expect.any(String),
            changeType: "update",
            modelType: "User",
            modelId: id,
            changeSnapshot: {
                changes: {
                    teamId: {
                        original: teamA.id,
                        updated: teamB.id,
                    },
                    version: {
                        original: "5",
                        updated: "6",
                    },
                },
            },
        });
    });

    test("can delete", () => {
        const t = new Team();
        t.name = "Team A";
        const u = new User();
        u.team = t;
        const u2 = new User();
        u2.team = t;
        expect(t.members).toEqual([u, u2]);
        u2.delete();
        expect(t.members).toEqual([u]);
        u.delete();
        expect(t.members).toEqual([]);
    });

    test("injest change records", () => {
        const pool = ObjectPool.getInstance();
        // Using getUser because the client should be using MobX to always select
        // the right object from the graph.
        const getUser = (id = "e86cd579-c61c-4f7b-ad53-d1f8670968dc") => {
            const team = pool.getRoot as Team;
            const u = team.members.find((x) => x.id === id);
            expect(u).toBeDefined();
            const user = u!;
            return user;
        };

        // Startup
        injestObjects(bootstrapJson);
        expect(getUser().name).toEqual("Paul");

        const staleUpdate = {
            id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
            name: "Old Change - Never See Me",
            email: "paul@pbardea.com",
            teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
            lastModifiedDate: "2024-08-21T15:30:00Z",
            version: 0,
            __class: "User",
        };
        pool.applyServerUpdate({ type: "update", jsonObject: staleUpdate });
        expect(getUser().name).toEqual("Paul");

        const serverUpdate = {
            id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
            name: "Updated Name",
            email: "paul@pbardea.com",
            teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
            lastModifiedDate: new Date().toISOString(),
            __class: "User",
        };

        pool.applyServerUpdate({ type: "update", jsonObject: serverUpdate });
        expect(getUser().name).toEqual("Updated Name");

        const newUser = {
            id: "7465a9aa-5812-488c-a2de-dfc55c89bca7",
            name: "New User",
            email: "new@pbardea.com",
            teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
            lastModifiedDate: new Date().toISOString(),
            __class: "User",
        };
        pool.applyServerUpdate({ type: "create", jsonObject: newUser });
        expect(getUser("7465a9aa-5812-488c-a2de-dfc55c89bca7").name).toEqual(
            "New User",
        );

        // TODO: We might want deletes to be formatted differently and just specify
        // the ID.
        pool.applyServerUpdate({ type: "delete", jsonObject: newUser });
        const missingUser = (pool.getRoot as Team).members.find(
            (x) => x.email === "new@pbardea.com",
        );
        expect(missingUser).toBeUndefined();

        // TODO: Test invalid payloads...
    });

    test("clients see each others changes", async () => {
        ObjectPool.reset(mockApi);
        const p1 = ObjectPool.getInstance();
        const p2 = SecondTestInstance.getInstance(mockApi);
        mockApi.setupSync(p1);
        mockApi.setupSync(p2);

        // TODO: We should probably use mobx in these tests.
        const getUser = (
            pool: ObjectPool,
            id = "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
        ): User => {
            const team = pool.getRoot as Team;
            const u = team.members.find((x) => x.id === id);
            expect(u).toBeDefined();
            const user = u!;
            return user;
        };

        // Bootstrap the API pool "server side".
        injestObjects(bootstrapJson, ApiTestingPool.getInstance());
        injestObjects(bootstrapJson, p1);
        injestObjects(bootstrapJson, p2);

        expect(getUser(p1).name).equals("Paul");
        expect(getUser(p2).name).equals("Paul");

        const p1User = getUser(p1);
        p1User.name = "Client 1 updated name";
        p1User.save();
        expect(getUser(p1).name).equals("Client 1 updated name");
        expect(getUser(p2).name).equals("Paul");

        await mockApi.runWorker();
        expect(getUser(p1).name).equals("Client 1 updated name");
        expect(getUser(p2).name).equals("Client 1 updated name");

        getUser(p2).name = "Client 2 updated name";
        getUser(p2).save();
        expect(getUser(p1).name).equals("Client 1 updated name");
        expect(getUser(p2).name).equals("Client 2 updated name");

        // await mockApi.runWorker();
        // expect(getUser(p1).name).equals("Client 2 updated name");
        // expect(getUser(p2).name).equals("Client 2 updated name");
        //
        // getUser(p1).name = "Client 1 race";
        // getUser(p2).name = "Client 2 race";
        // getUser(p1).save();
        // getUser(p2).save(); // Client 2 should win because it's saved 2nd.
        // expect(getUser(p1).name).equals("Client 1 race");
        // expect(getUser(p2).name).equals("Client 2 race");
        //
        // await mockApi.runWorker();
        // expect(getUser(p1).name).equals("Client 2 race");
        // expect(getUser(p2).name).equals("Client 2 race");
    });
});

describe("API Testing Pool", () => {
    // TODO: I'm not sure if we actually need this method anymore
    // This should move to it's own describe.
    test("can ingest events", () => {
        const pool = ApiTestingPool.getInstance();
        const u = new User(pool);

        const change: Change = {
            id: 1,
            changeType: "update",
            modelType: "User",
            modelId: u.id,
            changeSnapshot: {
                changes: {
                    name: {
                        original: "John",
                        updated: "Paul",
                    },
                },
            },
        };
        pool.apply(change);
        expect(u.name).toEqual("Paul");
    });
});
