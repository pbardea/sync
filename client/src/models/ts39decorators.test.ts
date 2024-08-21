/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from "vitest";

(Symbol as any).metadata ??= Symbol.for("Symbol.metadata");

function Property() {
  return function dec(_value: any, { name, metadata }: any) {
    metadata[name] = true;
  };
}

class User {
  @Property()
  accessor name: string = "";
}

test("demo", () => {
  const u = new User();
  u.name = "Paul";
  u.name = "Bardea";
  const u2 = new User();
  expect(u2.name).toBe("");
  const meta = (User as any)[Symbol.metadata];
  expect(meta).toEqual({
    name: true,
  });
  expect(u.name).toBe("Bardea");
});
