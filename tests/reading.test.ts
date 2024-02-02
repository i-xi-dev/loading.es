import { assertStrictEquals } from "./deps.ts";
import { Loading } from "../mod.ts";

class TestTask extends Loading.Task<string> {
  constructor(o?: Loading.Options) {
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

Deno.test("new Loading.Task()", () => {
  const t1 = new TestTask();
  assertStrictEquals(t1.total, 0);
  assertStrictEquals(t1.loaded, 0);
  assertStrictEquals(t1.indeterminate, true);
  assertStrictEquals(t1.status, Loading.Status.READY);
});

Deno.test("new Loading.Task({})", () => {
  const t1 = new TestTask({ total: 100 });
  assertStrictEquals(t1.total, 100);
  assertStrictEquals(t1.loaded, 0);
  assertStrictEquals(t1.indeterminate, false);
  assertStrictEquals(t1.status, Loading.Status.READY);
});
