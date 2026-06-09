/* eslint-disable max-lines-per-function */

import { Pipeline } from '@common/lambda/pipeline';
import type { NextFunction } from '@common/lambda/pipeline';
import { describe, test, expect, vi, beforeEach } from 'vitest';

describe('Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('send', () => {
    test('should set passable and return this for chaining', () => {
      const pipeline = new Pipeline<number>();
      const result = pipeline.send(5);

      expect(result).toBe(pipeline);
    });
  });

  describe('through', () => {
    test('should accept array of pipes', () => {
      const pipeline = new Pipeline<number>();
      const pipe1 = vi.fn();
      const pipe2 = vi.fn();

      const result = pipeline.through([pipe1, pipe2]);

      expect(result).toBe(pipeline);
    });

    test('should accept single pipe', () => {
      const pipeline = new Pipeline<number>();
      const pipe = vi.fn();

      const result = pipeline.through(pipe);

      expect(result).toBe(pipeline);
    });
  });

  describe('via', () => {
    test('should set custom method name and return this for chaining', () => {
      const pipeline = new Pipeline<number>();
      const result = pipeline.via('process');

      expect(result).toBe(pipeline);
    });
  });

  describe('then', () => {
    test('should throw error if passable is not set', async () => {
      const pipeline = new Pipeline<number>();

      await expect(async () => pipeline.then((value) => value)).rejects.toThrow(
        'Pipeline passable is not set. Call send() before then().',
      );
    });

    test('should execute destination with passable when no pipes', async () => {
      const result = await new Pipeline<number>().send(5).then((value) => value * 2);

      expect(result).toBe(10);
    });

    test('should execute function pipes in order', async () => {
      const result = await new Pipeline<number>()
        .send(5)
        .through([
          (value, next) => next(value + 1), // 5 + 1 = 6
          (value, next) => next(value * 2), // 6 * 2 = 12
          (value, next) => next(value - 3), // 12 - 3 = 9
        ])
        .then((value) => value);

      expect(result).toBe(9);
    });

    test('should execute pipe objects with handle method', async () => {
      class AddPipe {
        constructor(private amount: number) {}
        handle(value: number, next: NextFunction<number>) {
          return next(value + this.amount);
        }
      }

      class MultiplyPipe {
        constructor(private factor: number) {}
        handle(value: number, next: NextFunction<number>) {
          return next(value * this.factor);
        }
      }

      const result = await new Pipeline<number>()
        .send(10)
        .through([new AddPipe(5), new MultiplyPipe(2)])
        .then((value) => value);

      expect(result).toBe(30); // (10 + 5) * 2 = 30
    });

    test('should execute pipe objects with custom method via()', async () => {
      class CustomPipe {
        process(value: string, next: NextFunction<string>) {
          return next(`${value} processed`);
        }
      }

      const result = await new Pipeline<string>()
        .send('data')
        .through([new CustomPipe()])
        .via('process')
        .then((value) => value);

      expect(result).toBe('data processed');
    });

    test('should handle async pipes', async () => {
      const asyncPipe = async (value: number, next: NextFunction<number>) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return next(value * 2);
      };

      const result = await new Pipeline<number>()
        .send(5)
        .through([asyncPipe])
        .then((value) => value);

      expect(result).toBe(10);
    });

    test('should handle async destination', async () => {
      const result = await new Pipeline<number>()
        .send(5)
        .through([(value, next) => next(value + 1)])
        .then(async (value) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return value * 2;
        });

      expect(result).toBe(12); // (5 + 1) * 2 = 12
    });

    test('should throw error for invalid pipe', async () => {
      const invalidPipe = { invalid: true };

      await expect(
        new Pipeline<number>()
          .send(5)
          .through([invalidPipe])
          .then((value) => value),
      ).rejects.toThrow("Pipe must be a function or an object with a 'handle' method.");
    });

    test('should throw error for pipe object without specified method', async () => {
      const pipeWithWrongMethod = {
        wrongMethod: (value: number, next: NextFunction<number>) => next(value),
      };

      await expect(
        new Pipeline<number>()
          .send(5)
          .through([pipeWithWrongMethod])
          .via('process')
          .then((value) => value),
      ).rejects.toThrow("Pipe must be a function or an object with a 'process' method.");
    });
  });

  describe('thenReturn', () => {
    test('should return processed data without destination transform', async () => {
      const result = await new Pipeline<number>()
        .send(100)
        .through([
          (value, next) => next(value / 2), // 100 / 2 = 50
          (value, next) => next(value + 10), // 50 + 10 = 60
        ])
        .thenReturn();

      expect(result).toBe(60);
    });

    test('should throw error if passable is not set', async () => {
      const pipeline = new Pipeline<number>();

      await expect(pipeline.thenReturn()).rejects.toThrow(
        'Pipeline passable is not set. Call send() before then().',
      );
    });
  });

  describe('mixed pipes', () => {
    test('should handle mix of function and object pipes', async () => {
      class DoublePipe {
        handle(value: number, next: NextFunction<number>) {
          return next(value * 2);
        }
      }

      const result = await new Pipeline<number>()
        .send(5)
        .through([
          (value, next) => next(value + 1), // 5 + 1 = 6
          new DoublePipe(), // 6 * 2 = 12
          (value, next) => next(value - 2), // 12 - 2 = 10
        ])
        .then((value) => value);

      expect(result).toBe(10);
    });
  });

  describe('error propagation', () => {
    test('should propagate errors from pipes', async () => {
      const errorPipe = () => {
        throw new Error('Pipe error');
      };

      await expect(
        new Pipeline<number>()
          .send(5)
          .through([errorPipe])
          .then((value) => value),
      ).rejects.toThrow('Pipe error');
    });

    test('should propagate errors from async pipes', async () => {
      const asyncErrorPipe = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async pipe error');
      };

      await expect(
        new Pipeline<number>()
          .send(5)
          .through([asyncErrorPipe])
          .then((value) => value),
      ).rejects.toThrow('Async pipe error');
    });

    test('should propagate errors from destination', async () => {
      await expect(
        new Pipeline<number>()
          .send(5)
          .through([(value, next) => next(value)])
          .then(() => {
            throw new Error('Destination error');
          }),
      ).rejects.toThrow('Destination error');
    });
  });

  describe('data transformation', () => {
    test('should transform data types through pipeline', async () => {
      interface User {
        name: string;
        age: number;
      }

      interface UserDTO {
        fullName: string;
        isAdult: boolean;
      }

      const result = await new Pipeline<User, UserDTO>()
        .send({ name: 'John', age: 25 })
        .through([])
        .then((user) => ({
          fullName: user.name,
          isAdult: user.age >= 18,
        }));

      expect(result).toEqual({
        fullName: 'John',
        isAdult: true,
      });
    });

    test('should pass modified data to next pipe', async () => {
      const executionOrder: number[] = [];

      await new Pipeline<{ value: number }>()
        .send({ value: 1 })
        .through([
          (data, next) => {
            executionOrder.push(1);
            data.value = 10;
            return next(data);
          },
          (data, next) => {
            executionOrder.push(2);
            expect(data.value).toBe(10);
            data.value = 20;
            return next(data);
          },
          (data, next) => {
            executionOrder.push(3);
            expect(data.value).toBe(20);
            return next(data);
          },
        ])
        .then((data) => {
          executionOrder.push(4);
          expect(data.value).toBe(20);
          return data;
        });

      expect(executionOrder).toEqual([1, 2, 3, 4]);
    });
  });
});
