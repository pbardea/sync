import { expect, test } from "vitest";
import { ObjectPool, User, Team } from "./base";

test("emits change txns", () => {
    const pool = ObjectPool.getInstance();

    // const teamA = new Team();
    // teamA.name = "Team A";
    // teamA.save();

    pool.txns = [];

    // TODO: Figure out object creation.
    const user = new User();
    user.name = "Paul";
    user.save();
    user.name = "Paul Bardea";
    user.email = "paul@pbardea.com";
    user.save();

    expect(pool.txns.length).toBe(2);
    expect(pool.txns[0]).toMatchObject({
        id: "1",
        type: "create",
        modelType: "User",
        model: {
            id: expect.any(String),
            name: "Paul",
            email: "",
        },
    });
    const id = user.id;
    expect(pool.txns[1]).toEqual({
        id: "1",
        type: "update",
        modelClass: "User",
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
            },
        },
    });

    const teamA = new Team();
    expect(teamA.members).toEqual([]);
    user.team = teamA;

    pool.txns = [];
    user.save();
    expect(pool.txns[0]).toEqual({
        id: "1",
        type: "update",
        modelClass: "User",
        modelId: id,
        changeSnapshot: {
            changes: {
                teamId: {
                    original: undefined,
                    updated: teamA.id,
                },
            },
        },
    });
    expect(teamA.members).toEqual([user]);
});
