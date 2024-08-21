import { expect, test } from "vitest";
import { Change, ObjectPool } from "./pool";
import { User } from "./user";

// Maybe move to pool.
test("can ingest events", () => {
  const u = new User();

  const networkChange: Change = {
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
  ObjectPool.getInstance().apply(networkChange);
  expect(u.name).toEqual("Paul");
});

//Generate fake events to ingest
