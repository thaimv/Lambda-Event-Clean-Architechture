export type NextFunction<TInput, TOutput = TInput> = (
  passable: TInput,
) => TOutput | Promise<TOutput>;

export type PipeFunction<TInput, TOutput = TInput> = (
  passable: TInput,
  next: NextFunction<TInput, TOutput>,
) => TOutput | Promise<TOutput>;

export type PipeObject<TInput, TOutput = TInput> = object & {
  handle?: (passable: TInput, next: NextFunction<TInput, TOutput>) => TOutput | Promise<TOutput>;
};

export type Pipe<TInput, TOutput = TInput> =
  | PipeFunction<TInput, TOutput>
  | PipeObject<TInput, TOutput>;

/**
 * Pipeline inspired by Laravel's Pipeline.
 * Chains middleware pipes before a final destination callback.
 */
export class Pipeline<TInput = any, TOutput = TInput> {
  private passable: TInput | undefined;
  private pipes: Pipe<TInput, TOutput>[] = [];
  private method: string = 'handle';

  send(passable: TInput): this {
    this.passable = passable;
    return this;
  }

  through(pipes: Pipe<TInput, TOutput>[] | Pipe<TInput, TOutput>): this {
    this.pipes = Array.isArray(pipes) ? pipes : [pipes];
    return this;
  }

  via(method: string): this {
    this.method = method;
    return this;
  }

  then(destination: (passable: TInput) => TOutput | Promise<TOutput>): Promise<TOutput> {
    if (this.passable === undefined) {
      throw new Error('Pipeline passable is not set. Call send() before then().');
    }

    const pipelineChain = this.pipes.reduceRight<(passable: TInput) => TOutput | Promise<TOutput>>(
      (next, pipe) => {
        return (passable: TInput) => this.carry(pipe, next)(passable);
      },
      destination,
    );

    return Promise.resolve(pipelineChain(this.passable));
  }

  async thenReturn(): Promise<TOutput> {
    return this.then((passable) => passable as unknown as TOutput);
  }

  private carry(
    pipe: Pipe<TInput, TOutput>,
    next: (passable: TInput) => TOutput | Promise<TOutput>,
  ): (passable: TInput) => TOutput | Promise<TOutput> {
    return async (passable: TInput) => {
      if (typeof pipe === 'function') {
        return pipe(passable, next);
      }

      if (pipe && typeof pipe === 'object' && this.method in pipe) {
        const method = (pipe as Record<string, unknown>)[this.method];
        if (typeof method === 'function') {
          return (
            method as (
              passable: TInput,
              next: (passable: TInput) => TOutput | Promise<TOutput>,
            ) => TOutput | Promise<TOutput>
          ).call(pipe, passable, next);
        }
      }

      throw new Error(`Pipe must be a function or an object with a '${this.method}' method.`);
    };
  }
}
