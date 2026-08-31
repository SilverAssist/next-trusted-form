/**
 * @packageDocumentation
 * TrustedForm certificate integration for Next.js — a deferred-loading
 * `TrustedForm` component built on `@silverassist/next-script-loader`.
 */

"use client";

import { ScriptLoader } from "@silverassist/next-script-loader";
import { useEffect, useState } from "react";

/**
 * Name of the hidden `<input>` TrustedForm's certificate callback writes to.
 * `@silverassist/quirobot` (and any other consumer that needs the
 * certificate URL) reads this exact field name — keep the two in sync if
 * this ever becomes configurable.
 */
export const TRUSTEDFORM_CERT_FIELD_NAME = "xxTrustedFormCertUrl";

const TRUSTEDFORM_VARIANT = "default";

/**
 * Module-level singleton: every `TrustedForm` instance on the page shares
 * one loader. In practice only one instance is ever mounted per page, but
 * sharing the loader (rather than instantiating one per component) keeps
 * the same "one script per vendor" contract every other package in this
 * family follows. Exported so tests can call `.reset()`.
 */
export const trustedFormLoader = new ScriptLoader();

export interface TrustedFormProps {
  /**
   * Delay, in milliseconds, before the script loads automatically if the
   * visitor hasn't interacted with the page yet. TrustedForm needs the
   * certificate generated before the surrounding form can be submitted, so
   * this is a ceiling, not an optimization knob — don't raise it past the
   * time a fast visitor could plausibly reach the submit button.
   *
   * @defaultValue 5000
   */
  autoLoadDelayMs?: number;
}

/**
 * TrustedForm integration with deferred loading.
 *
 * The script loads only after user interaction (scroll, mousemove,
 * touchstart, click, focus) or after {@link TrustedFormProps.autoLoadDelayMs},
 * whichever comes first — deferring it keeps it off the critical path for
 * Total Blocking Time while still guaranteeing the certificate exists by the
 * time a real visitor could submit a form.
 *
 * On load, TrustedForm calls back with a certificate URL, which this
 * component writes into a hidden `<input name="xxTrustedFormCertUrl">` for
 * the surrounding form to submit alongside its other fields.
 *
 * @example
 * ```tsx
 * <form action={submitLead}>
 *   <TrustedForm />
 *   <input name="email" type="email" required />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
export default function TrustedForm({ autoLoadDelayMs = 5000 }: TrustedFormProps = {}) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const handleInteraction = () => setShouldLoad(true);

    const events = ["scroll", "mousemove", "touchstart", "click", "focus"];
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    const timeout = setTimeout(() => setShouldLoad(true), autoLoadDelayMs);

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [autoLoadDelayMs]);

  useEffect(() => {
    if (!shouldLoad) return;

    (
      window as Window & { trustedFormCertUrlCallback?: (url: string) => void }
    ).trustedFormCertUrlCallback = (certificateUrl: string) => {
      const field = document.createElement("input");
      field.setAttribute("type", "hidden");
      field.setAttribute("name", TRUSTEDFORM_CERT_FIELD_NAME);
      field.setAttribute("id", `${TRUSTEDFORM_CERT_FIELD_NAME}_0`);
      field.setAttribute("value", certificateUrl);
      document.body.appendChild(field);
    };

    // Carried over as-is from the site implementations this was extracted
    // from: `identifier` is a literal, not a per-session value, and `l` is a
    // cache-busting timestamp+random pair TrustedForm's own script expects
    // on every load. Neither was changed in the port — TrustedForm's backend
    // matches on the certificate it issues, not on this query string, so
    // there's no independent way to verify a change here is safe.
    trustedFormLoader.configure({
      urls: {
        [TRUSTEDFORM_VARIANT]: `https://api.trustedform.com/trustedform.js?field=${TRUSTEDFORM_CERT_FIELD_NAME}&identifier=some-session-identifier&ping_field=xxTrustedFormPingUrl&l=${Date.now()}${Math.random()}`,
      },
    });

    trustedFormLoader.load(TRUSTEDFORM_VARIANT).catch(() => {
      // Silently degrade — a missing certificate shouldn't block the rest
      // of the form from being usable.
    });
  }, [shouldLoad]);

  return (
    <noscript>
      {/* Vendor tracking pixel -- next/image doesn't apply here, and this package isn't itself a Next.js app for eslint-config-next's rule to fire in. */}
      <img src="https://api.trustedform.com/ns.gif" alt="" />
    </noscript>
  );
}
