import { beforeEach, describe, expect, test } from "vitest";
import { Change, injestObjects, ObjectPool } from "./pool";
import { User } from "./user";
import { Team } from "./team";

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
      lastModifiedDate: (new Date()).toISOString(),
      __class: "User",
    },
    {
      id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
      name: "Paul",
      email: "paul@pbardea.com",
      teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
      lastModifiedDate: (new Date()).toISOString(),
      __class: "User",
    },
    {
      id: "279592c1-2334-430b-b97f-a8f9265d4805",
      name: "Team A",
      lastModifiedDate: (new Date()).toISOString(),
      __class: "Team",
    },
    {
      id: "8949e0a4-357b-4a42-b6a3-ec90699197e7",
      name: "Orphan",
      email: "paul@pbardea.com",
      lastModifiedDate: (new Date()).toISOString(),
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
        lastModifiedDate: (new Date()).toISOString(),
        boom: "bar",
        __class: "Team",
      }
    ];

    injestObjects(bootstrapJson);
    const team = (ObjectPool.getInstance().getRoot() as Team)
    expect((team as any)["boom"]).toEqual("bar");
  });

  test("gracefully handles missing reference", () => {
    const bootstrapJson = [
      {
        id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
        name: "Paul Bardea",
        teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
        lastModifiedDate: (new Date()).toISOString(),
        __class: "User",
      }
    ];

    expect(() => injestObjects(bootstrapJson))
      .toThrow("Referencing object that doesn't exist");
  });

  test("can bootstrap out of order", () => {
    const pool = ObjectPool.getInstance();

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

  // TODO: I'm not sure if we actually need this method anymore
  test("can ingest events", () => {
    const u = new User();

    const change: Change = {
      id: "1",
      type: "update",
      modelClass: "User",
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
    ObjectPool.getInstance().apply(change);
    expect(u.name).toEqual("Paul");
  });

  test("injest change records", () => {
    const pool = ObjectPool.getInstance();
    // Using getUser because the client should be using MobX to always select
    // the right object from the graph.
    const getUser = (email = "paul@pbardea.com") => {
      const team = (pool.getRoot() as Team);
      const u = team.members.find(x => x.email === email);
      expect(u).toBeDefined();
      const user = u!;
      return user;
    }

    // Startup
    injestObjects(bootstrapJson);
    expect(getUser().name).toEqual("Paul");

    const staleUpdate = {
      id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
      name: "Old Change - Never See Me",
      email: "paul@pbardea.com",
      teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
      lastModifiedDate: "2024-08-21T15:30:00Z",
      __class: "User",
    }
    pool.applyServerUpdate("update", staleUpdate);
    expect(getUser().name).toEqual("Paul");

    const serverUpdate = {
      id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
      name: "Updated Name",
      email: "paul@pbardea.com",
      teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
      lastModifiedDate: (new Date()).toISOString(),
      __class: "User",
    }

    pool.applyServerUpdate("update", serverUpdate);
    expect(getUser().name).toEqual("Updated Name");

    const newUser = {
      id: "7465a9aa-5812-488c-a2de-dfc55c89bca7",
      name: "New User",
      email: "new@pbardea.com",
      teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
      lastModifiedDate: (new Date()).toISOString(),
      __class: "User",
    }
    pool.applyServerUpdate("create", newUser);
    expect(getUser("new@pbardea.com").name).toEqual("New User");

    // TODO: We might want deletes to be formatted differently and just specify
    // the ID.
    pool.applyServerUpdate("delete", newUser);
    const missingUser = (pool.getRoot() as Team).members.find(x => x.email === "new@pbardea.com");
    expect(missingUser).toBeUndefined();

    // TODO: Test invalid payloads...
  });
});
