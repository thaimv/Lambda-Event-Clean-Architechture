export type TNewable<T> = new (...args: any[]) => T;

/**
 * Use this type to define a class that can be instantiated
 */
export type TProviderMetadata =
  | {
      provide: string | symbol;
      useClass?: TNewable<unknown>;
      useValue?: unknown;
      useFactory?: (...args: unknown[]) => unknown;
    }
  | TNewable<unknown>;
