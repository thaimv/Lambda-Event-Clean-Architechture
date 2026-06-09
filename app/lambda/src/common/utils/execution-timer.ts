/**
 * Timer class to manage execution time
 */
export class ExecutionTimer {
  /**
   * Real start time (epoch millis) captured at construction.
   */
  private readonly startTime: number;
  /**
   * Timeout duration in milliseconds.
   */
  private readonly timeoutMs: number;

  /**
   * @param timeoutMs Timeout in milliseconds
   */
  constructor(timeoutMs: number) {
    this.timeoutMs = timeoutMs;
    this.startTime = Date.now();
  }

  /**
   * Check if within time limit
   */
  isWithinTimeLimit(): boolean {
    return Date.now() - this.startTime < this.timeoutMs;
  }
}
