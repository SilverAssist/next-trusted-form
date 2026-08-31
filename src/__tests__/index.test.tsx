import { render, waitFor } from "@testing-library/react";

import TrustedForm, { trustedFormLoader } from "../index";

describe("TrustedForm", () => {
  afterEach(() => {
    trustedFormLoader.reset();
    document.querySelectorAll("input[name='xxTrustedFormCertUrl']").forEach((el) => el.remove());
    delete (window as Window & { trustedFormCertUrlCallback?: (url: string) => void })
      .trustedFormCertUrlCallback;
  });

  it("renders a noscript fallback element", () => {
    // React deliberately doesn't render <noscript>'s children client-side
    // (JS is running, by definition, wherever React is) -- the element
    // exists so a no-JS visitor's browser parses the raw HTML and shows the
    // fallback pixel; that content is never present in a client-rendered
    // tree, so this only asserts the element itself is there.
    const { container } = render(<TrustedForm />);
    expect(container.querySelector("noscript")).toBeInTheDocument();
  });

  it("loads the script after the auto-load timeout", async () => {
    jest.useFakeTimers();
    render(<TrustedForm autoLoadDelayMs={100} />);

    jest.advanceTimersByTime(100);
    jest.useRealTimers();

    await waitFor(() => {
      expect(document.querySelector("script[src*='trustedform.js']")).toBeInTheDocument();
    });
  });

  it("writes the certificate to a hidden input when the callback fires", async () => {
    jest.useFakeTimers();
    render(<TrustedForm autoLoadDelayMs={0} />);
    jest.advanceTimersByTime(0);
    jest.useRealTimers();

    await waitFor(() => {
      expect(
        (
          window as Window & {
            trustedFormCertUrlCallback?: (url: string) => void;
          }
        ).trustedFormCertUrlCallback,
      ).toBeInstanceOf(Function);
    });

    (
      window as Window & { trustedFormCertUrlCallback?: (url: string) => void }
    ).trustedFormCertUrlCallback?.("https://cert.trustedform.com/abc123");

    const field = document.querySelector<HTMLInputElement>("input[name='xxTrustedFormCertUrl']");
    expect(field?.value).toBe("https://cert.trustedform.com/abc123");
  });

  it("loads on interaction before the timeout elapses", async () => {
    render(<TrustedForm autoLoadDelayMs={60000} />);

    document.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(document.querySelector("script[src*='trustedform.js']")).toBeInTheDocument();
    });
  });
});
