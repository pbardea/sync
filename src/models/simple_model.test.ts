import { expect, test } from "vitest";
import { ObjectPool } from "./pool";
import { User } from "./user";
import { Team } from "./team";

// TODO: Bootstrap objects.

test("emits change txns", () => {
  const pool = ObjectPool.getInstance();

  pool.txns = [];

  // TODO: Figure out object creation.
  // There should probably be a way to do this from
  // the client and a bootstrap version? Same thing?
  // Bootstrap events probably don't want to re-emit a bunch of
  // create events to sync.
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

test("concurrent changes w/ server", () => {
  const pool = ObjectPool.getInstance();

  const u = new User();
  u.name = "Paul";
  u.save();
  pool.txns = [];

  // Changes need some syncing ID or TS?
  //
  // Property should only be set if the property TS is less than the TS of the new change?

  // Case 1
  u.name = "Paul Bardea";
  // Server change comes in
  u.name = "pbardea";
  // Another client change
  u.email = "pbardea@gmail.com";
  // Client code saves
  u.save();
  // Server change saves
  u._save(true);

  // Case 2
  u.name = "Paul Bardea";
  // Server change comes in
  u.name = "pbardea";
  // Another client change
  u.email = "pbardea@gmail.com";
  // Server change saves
  u._save(true);
  // Client code saves. THIS DOES NOT EMIT THE RIGHT CHANGES.
  u.save();
});
