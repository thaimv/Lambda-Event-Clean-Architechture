import { ExecutionTimer } from '@common/utils/execution-timer';
import { describe, expect, it } from 'vitest';

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

describe('ExecutionTimer', () => {
  describe('constructor', () => {
    it('should initialize with given timeout and current time as start time', () => {
      const timeoutMs = 5 * 60 * 1000; // 5 minutes

      const before = Date.now();
      const timer = new ExecutionTimer(timeoutMs);
      const after = Date.now();

      expect(timer).toBeInstanceOf(ExecutionTimer);
      expect(timer['timeoutMs']).toStrictEqual(timeoutMs);
      expect(timer['startTime']).toBeGreaterThanOrEqual(before);
      expect(timer['startTime']).toBeLessThanOrEqual(after);
    });
  });

  describe('isWithinTimeLimit', () => {
    it('should return false immediately when timeoutMs is 0', () => {
      const timer = new ExecutionTimer(0);

      expect(timer.isWithinTimeLimit()).toStrictEqual(false);
    });

    it('should return false immediately when timeoutMs is NaN', () => {
      const timer = new ExecutionTimer(Number.NaN);

      expect(timer.isWithinTimeLimit()).toStrictEqual(false);
    });

    it('should return true within time limit and false after time limit', async () => {
      const timeoutMs = 80;
      const timer = new ExecutionTimer(timeoutMs);

      expect(timer.isWithinTimeLimit()).toStrictEqual(true);

      await sleep(30);
      expect(timer.isWithinTimeLimit()).toStrictEqual(true);

      await sleep(80);
      expect(timer.isWithinTimeLimit()).toStrictEqual(false);
    });
  });
});
