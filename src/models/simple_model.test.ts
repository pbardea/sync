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

    user.team = undefined;
    expect(teamA.members).toEqual([]);
    user.save();
    expect(pool.txns[1]).toEqual({
        id: "1",
        type: "update",
        modelClass: "User",
        modelId: id,
        changeSnapshot: {
            changes: {
                teamId: {
                    original: teamA.id,
                    updated: undefined,
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
    expect(pool.txns[2]).toEqual({
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

    user.team = teamB;
    expect(teamA.members).toEqual([]);
    expect(teamB.members).toEqual([user]);
    user.save();
    expect(pool.txns[3]).toEqual({
        id: "1",
        type: "update",
        modelClass: "User",
        modelId: id,
        changeSnapshot: {
            changes: {
                teamId: {
                    original: teamA.id,
                    updated: teamB.id,
                },
            },
        },
    });
});
