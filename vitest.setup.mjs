// vitest setup file
// Allow AWS SDK and CDK to use Date.now()

// Preserve the global Date object
const originalDate = Date;

beforeEach(() => {
  // Restore the Date object before each test
  global.Date = originalDate;
});
