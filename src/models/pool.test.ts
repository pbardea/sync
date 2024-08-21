import { beforeEach, describe, expect, test } from "vitest";
import { injestObjects, ObjectPool } from "./pool";
import { User } from "./user";
import { Team } from "./team";

describe("object pool", () => {
  beforeEach(() => {
    ObjectPool.reset();
  });

  test("can bootstrap out of order", () => {
    const pool = ObjectPool.getInstance();
    const bootstrapJson = [
      {
        id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
        name: "Paul Bardea",
        teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
        __class: "User",
      },
      {
        id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
        name: "Paul",
        email: "paul@pbardea.com",
        teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
        __class: "User",
      },
      {
        id: "279592c1-2334-430b-b97f-a8f9265d4805",
        name: "Team A",
        __class: "Team",
      },
      {
        id: "8949e0a4-357b-4a42-b6a3-ec90699197e7",
        name: "Orphan",
        email: "paul@pbardea.com",
        __class: "User",
      },
    ];

    injestObjects(bootstrapJson);
    const team = pool.getRoot() as Team;
    expect(team.constructor.name).toEqual("Team");
    expect(team.members.length).toEqual(2);
    expect(team.members[0].name).toEqual("Paul Bardea");
    expect(team.members[1].name).toEqual("Paul");
    expect(team.members[1].email).toEqual("paul@pbardea.com");
  });

  test("can bootstrap", () => {
    const pool = ObjectPool.getInstance();
    const bootstrapJson = [
      {
        id: "279592c1-2334-430b-b97f-a8f9265d4805",
        name: "Team A",
        __class: "Team",
      },
      {
        id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
        name: "Paul Bardea",
        teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
        __class: "User",
      },
      {
        id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
        name: "Paul",
        email: "paul@pbardea.com",
        teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
        __class: "User",
      },
      {
        id: "8949e0a4-357b-4a42-b6a3-ec90699197e7",
        name: "Orphan",
        email: "paul@pbardea.com",
        __class: "User",
      },
    ];

    injestObjects(bootstrapJson);
    const team = pool.getRoot() as Team;
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
      id: "1",
      type: "create",
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

  test("can delete", () => {});
});
