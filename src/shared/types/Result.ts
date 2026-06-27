// src/shared/types/Result.ts

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
  readonly error?: undefined;
}

export interface Failure<E = Error> {
  readonly ok: false;
  readonly value?: undefined;
  readonly error: E;
}

/**
 * A type-safe container for either a successful result or an error.
 * Follows functional programming patterns from Rust/C# Result types.
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export namespace Result {
  /** Create a successful result */
  export function success<T, E = Error>(value: T): Result<T, E> {
    return { ok: true, value };
  }

  /** Create a failed result */
  export function failure<T = never, E = Error>(error: E): Result<T, E> {
    return { ok: false, error };
  }

  /** Check if result is successful */
  export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
    return result.ok;
  }

  /** Check if result is a failure */
  export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
    return !result.ok;
  }

  /** Execute function, convert exceptions to failure */
  export function tryCatch<T, E = Error>(
    fn: () => T,
    errorHandler: (e: unknown) => E = (e) => e as E
  ): Result<T, E> {
    try {
      return success(fn());
    } catch (e) {
      return failure(errorHandler(e));
    }
  }

  /** Map success value, preserve errors */
  export function map<T, U, E = Error>(
    result: Result<T, E>,
    mapper: (value: T) => U
  ): Result<U, E> {
    return result.ok ? success(mapper(result.value)) : (result as Result<U, E>);
  }

  /** Chain async functions, propagate first error */
  export async function andThen<T, U, E = Error>(
    result: Result<T, E>,
    fn: (value: T) => Promise<Result<U, E>>
  ): Promise<Result<U, E>> {
    if (isFailure(result)) return result;
    return await fn(result.value);
  }
}