import { assertStrictEquals } from "./deps.ts";
import { Reading } from "../mod.ts";

class TestTask extends Reading.Task<string> {
  constructor(o?: Reading.Options) {
    super(o);
  }
  async run(): Promise<string> {
    return await (() => {
      return new Promise((resolve) => {
        resolve("");
      });
    })();
  }
}

Deno.test("new Reading.Task()", () => {
  const t1 = new TestTask();
  assertStrictEquals(t1.total, 0);
  assertStrictEquals(t1.loaded, 0);
  assertStrictEquals(t1.indeterminate, true);
  assertStrictEquals(t1.status, Reading.Status.READY);
});

Deno.test("new Reading.Task({})", () => {
  const t1 = new TestTask({ total: 100 });
  assertStrictEquals(t1.total, 100);
  assertStrictEquals(t1.loaded, 0);
  assertStrictEquals(t1.indeterminate, false);
  assertStrictEquals(t1.status, Reading.Status.READY);
});
