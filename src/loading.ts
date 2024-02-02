import { _ProgressEvent, SafeInteger } from "../deps.ts";

const _ProgressEventName = {
  ABORT: "abort",
  ERROR: "error",
  LOAD: "load",
  LOAD_END: "loadend",
  LOAD_START: "loadstart",
  PROGRESS: "progress",
  TIMEOUT: "timeout",
} as const;
type _ProgressEventName =
  typeof _ProgressEventName[keyof typeof _ProgressEventName];

export namespace Loading {
  /**
   * The loading status.
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
   * The loading options.
   */
  export type Options = {
    /** The total length of loading, if loading has a computable length. Otherwise `undefined`. */
    total?: SafeInteger;

    /** The `AbortSignal` to abort loading. */
    signal?: AbortSignal;
  };

  /**
   * The loading task.
   */
  export abstract class Task<T> extends EventTarget {
    /** The total length of loading. */
    readonly #total?: SafeInteger;

    /** The `AbortSignal` to abort loading. */
    protected readonly _signal?: AbortSignal;

    /** The loading status. */
    protected _status: Loading.Status;

    /** The read length. */
    protected _loaded: SafeInteger;

    /** The timestamp of when the `ProgressEvent` with name `"progress"` was last dispatched. */
    #lastProgressNotifiedAt: number;

    /**
     * @param options - The loading options.
     */
    protected constructor(options?: Options) {
      super();

      const total: SafeInteger | undefined = options?.total;
      if (typeof total === "number") {
        if (SafeInteger.isNonNegativeSafeInteger(total) !== true) {
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
      this.#lastProgressNotifiedAt = -1;

      // Object.seal(this);
    }

    /** The total length of loading. */
    get total(): SafeInteger {
      return this.#total ?? 0;
    }

    /** Whether the loading has no computable length. */
    get indeterminate(): boolean {
      return (SafeInteger.isNonNegativeSafeInteger(this.#total) !== true);
    }

    /** The loading status. */
    get status(): Status {
      return this._status;
    }

    /** The read length. */
    get loaded(): SafeInteger {
      return this._loaded;
    }

    /**
     * Dispatch the `ProgressEvent` to notify progress.
     * @param name - The name of `ProgressEvent`.
     */
    protected _notifyProgress(name: _ProgressEventName): void {
      if (name === _ProgressEventName.PROGRESS) {
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
     * Run this loading task.
     * @returns The `Promise` that fulfills with a read value.
     */
    abstract run(): Promise<T>;
  }
}
