import { _ProgressEvent } from "i-xi-dev/compat.es";
import { Integer } from "i-xi-dev/int.es";

type int = number;

//TODO 外に出す
type _ProgressEventName = "abort" | "error" | "load" | "loadend" | "loadstart" | "progress" | "timeout";

namespace Reading {
  /**
   * The reading status.
   */
  export const Status = {
    READY: "ready",
    RUNNING: "running",
    COMPLETED: "completed",
    ABORTED: "aborted",
    ERROR: "error",
  } as const;
  export type Status = typeof Status[keyof typeof Status];

  /**
   * The reading options.
   */
  export type Options = {
    /** The total length of reading, if reading has a computable length. Otherwise `undefined`. */
    total?: int;

    /** The `AbortSignal` to abort reading. */
    signal?: AbortSignal;
  };

  /**
   * The reading task.
   */
  export abstract class Task<T> extends EventTarget {
    /** The total length of reading. */
    readonly #total?: int;

    /** The `AbortSignal` to abort reading. */
    protected readonly _signal: AbortSignal | undefined;

    /** The reading status. */
    protected _status: Reading.Status;

    /** The read length. */
    protected _loaded: int;

    /** The timestamp of when the `ProgressEvent` with name `"progress"` was last dispatched. */
    #lastProgressNotifiedAt: number;

    /**
     * @param options - The reading options.
     */
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

      this.#total = total;
      this._signal = options?.signal;
      this._status = Status.READY;
      this._loaded = 0;
      this.#lastProgressNotifiedAt = Number.MIN_VALUE;

      // Object.seal(this);
    }

    /** The total length of reading. */
    get total(): int {
      return this.#total ?? 0;
    }

    /** Whether the reading has no computable length. */
    get indeterminate(): boolean {
      return (typeof this.#total !== "number");
    }

    /** The reading status. */
    get status(): Status {
      return this._status;
    }

    /** The read length. */
    get loaded(): int {
      return this._loaded;
    }

    /**
     * Dispatch the `ProgressEvent` to notify progress.
     * @param name - The name of `ProgressEvent`.
     */
    protected _notifyProgress(name: _ProgressEventName): void {
      if (name === "progress") {
        const now = globalThis.performance.now();
        if ((this.#lastProgressNotifiedAt + 50) > now) {
          return;
        }
        this.#lastProgressNotifiedAt = now;
      }

      const event = new _ProgressEvent(name, {
        total: this.#total,
        lengthComputable: (this.indeterminate !== true),
        loaded: this._loaded,
      });
      this.dispatchEvent(event);
    }

    /**
     * Run this reading task.
     * @returns The `Promise` that fulfills with a read value.
     */
    abstract run(): Promise<T>;
  }
}
Object.freeze(Reading);

export { Reading };
