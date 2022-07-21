import { _ProgressEvent, Integer } from "./deps.ts";

type int = number;

type _Internal = {
  state: Reading.State;
  loaded: int;
  lastProgressNotifiedAt: number;
};

// function _translateState(state: Reading.State): _ReaderReadyState {
//   switch (state) {
//     case Reading.State.READY:
//       return _ReaderReadyState.EMPTY;
//     case Reading.State.RUNNING:
//       return _ReaderReadyState.LOADING;
//     case Reading.State.COMPLETED:
//     case Reading.State.ABORTED:
//     case Reading.State.ERROR:
//       return _ReaderReadyState.DONE;
//     default:
//       throw new TypeError("state");
//   }
// }

namespace Reading {
  /**
   * @experimental
   */
  export const State = {
    READY: "ready",
    RUNNING: "running",
    COMPLETED: "completed",
    ABORTED: "aborted",
    ERROR: "error",
  } as const;
  export type State = typeof State[keyof typeof State];

  /**
   * @experimental
   */
  export type Progress = {
    loaded: int;
    total: int;
    lengthComputable: boolean;
  };

  /**
   * @experimental
   */
  export type Options = {
    total?: int;
    signal?: AbortSignal;
  };

  /**
   * @experimental
   */
  export abstract class Task<T> extends EventTarget {
    #total: int;
    #indeterminate: boolean;
    #signal: AbortSignal | undefined;
    #progress: Progress;
    #internal: _Internal;

    protected constructor(options?: Options) {
      super();

      const total: number | undefined = options?.total;
      if (typeof total === "number") {
        if (Integer.isNonNegativeInteger(total) !== true) {
          throw new RangeError("options.total");
        }
      } else if (total === undefined) {
        // ok
      } else {
        throw new TypeError("options.total");
      }

      this.#total = total ?? 0;
      this.#indeterminate = typeof total !== "number";
      this.#signal = options?.signal;

      // deno-lint-ignore no-this-alias
      const self = this;
      this.#progress = Object.freeze({
        get loaded() {
          return self.#internal.loaded;
        },
        get total() {
          return self.#total;
        },
        get lengthComputable() {
          return (self.#indeterminate !== true);
        },
      });

      this.#internal = Object.seal({
        state: State.READY,
        loaded: 0,
        lastProgressNotifiedAt: Number.MIN_VALUE,
      });

      // Object.freeze(this);
    }

    get state(): State {
      return this.#internal.state;
    }

    get progress(): Progress {
      return this.#progress;
    }

    // XXX 要るか？
    // get readyState(): _ReaderReadyState {
    //   return _translateState(this.#internal.state);
    // }

    protected _notify(name: string): void {
      if (name === "progress") {
        const now = globalThis.performance.now();
        if ((this.#internal.lastProgressNotifiedAt + 50) > now) {
          return;
        }
        this.#internal.lastProgressNotifiedAt = now;
      }

      const event = new _ProgressEvent(name, this.progress);
      this.dispatchEvent(event);
    }

    abstract run(): Promise<T>;
  }
}
Object.freeze(Reading);

export { Reading };
