import { _ProgressEvent } from "i-xi-dev/compat.es";
import { Integer } from "i-xi-dev/int.es";

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
    /** The estimated total amount. */
    protected readonly _total: int;

    protected readonly _indeterminate: boolean;
    protected readonly _signal: AbortSignal | undefined;
    readonly #progress: Progress;
    protected readonly _internal: _Internal;

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

      this._total = total ?? 0;
      this._indeterminate = typeof total !== "number";
      this._signal = options?.signal;

      // deno-lint-ignore no-this-alias
      const self = this;
      this.#progress = Object.freeze({
        get loaded() {
          return self._internal.loaded;
        },
        get total() {
          return self._total;
        },
        get lengthComputable() {
          return (self._indeterminate !== true);
        },
      });

      this._internal = Object.seal({
        state: State.READY,
        loaded: 0,
        lastProgressNotifiedAt: Number.MIN_VALUE,
      });

      // Object.freeze(this);
    }

    get state(): State {
      return this._internal.state;
    }

    get progress(): Progress {
      return this.#progress;
    }

    // XXX 要るか？
    // get readyState(): _ReaderReadyState {
    //   return _translateState(this._internal.state);
    // }

    protected _notify(name: string): void {
      if (name === "progress") {
        const now = globalThis.performance.now();
        if ((this._internal.lastProgressNotifiedAt + 50) > now) {
          return;
        }
        this._internal.lastProgressNotifiedAt = now;
      }

      const event = new _ProgressEvent(name, this.progress);
      this.dispatchEvent(event);
    }

    abstract run(): Promise<T>;
  }
}
Object.freeze(Reading);

export { Reading };
