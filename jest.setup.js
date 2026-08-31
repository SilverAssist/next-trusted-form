require("@testing-library/jest-dom");

// Suppress expected console.error logs from reCAPTCHA during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress expected reCAPTCHA error/warning logs
  jest.spyOn(console, "error").mockImplementation((...args) => {
    const message = args[0]?.toString?.() || "";
    // Suppress expected reCAPTCHA messages during tests
    if (message.includes("[reCAPTCHA]") || message.includes("not wrapped in act")) {
      return;
    }
    originalConsoleError.apply(console, args);
  });

  jest.spyOn(console, "warn").mockImplementation((...args) => {
    const message = args[0]?.toString?.() || "";
    if (message.includes("[reCAPTCHA]")) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});
