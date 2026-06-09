import type { ILogCollector } from '@e2e/helpers/cloudwatch-logs';
import { expect } from 'vitest';

export interface ISensitiveLeakDetector {
  bootstrap(): Promise<void>;
  push(label: string, value: string): void;
  scan(obj: unknown): void;
  assert(collector: ILogCollector): void;
  terminate(collector: ILogCollector): Promise<void>;
  clear(): void;
}

type SensitiveEntry = { label: string; value: string };

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

export class SensitiveLeakDetector implements ISensitiveLeakDetector {
  private entries: SensitiveEntry[] = [];

  constructor(private readonly sensitiveFields: string[]) {}

  async bootstrap(): Promise<void> {
    this.clear();
  }

  push(label: string, value: string): void {
    this.entries.push({ label, value });
  }

  scan(obj: unknown): void {
    if (obj === null || obj === undefined || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (const item of obj) this.scan(item);
      return;
    }
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const normalised = toSnakeCase(key);
      if (
        this.sensitiveFields.includes(normalised) &&
        typeof value === 'string' &&
        value.length > 0
      ) {
        this.push(normalised, value);
      }
      this.scan(value);
    }
  }

  assert(collector: ILogCollector): void {
    const groups = collector.groups();
    console.log(`Asserting no sensitive values in CloudWatch log groups`, groups);

    for (const group of groups) {
      const lines = collector.get(group);
      if (lines.length === 0) {
        throw new Error(`No logs found in group [${group}]`);
      }
      for (const { label, value } of this.entries) {
        for (const line of lines) {
          expect(
            line,
            `raw "${label}" = "${value}" must not appear in [${group}] logs`,
          ).not.toContain(value);
        }
      }
    }

    console.log(`Assertion passed: no sensitive values in CloudWatch logs.`, groups);
  }

  async terminate(collector: ILogCollector): Promise<void> {
    this.assert(collector);
  }

  clear(): void {
    this.entries = [];
  }
}
