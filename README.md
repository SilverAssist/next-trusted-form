# @silverassist/trusted-form

TrustedForm certificate integration for Next.js apps. Deferred-loading
`<TrustedForm />` component that generates a compliance certificate for lead
forms without blocking the critical rendering path.

## Status

Extracted from `family-nextjs` and `cc-nextjs`'s near-identical
hand-rolled implementations (part of the fleet-wide third-party-integration
package effort described in `nextjs-boilerplate/docs/NEXTJS_CORE_PACKAGE_PLAN.md`).
Not yet published. `@silverassist/quirobot` depends on this package's output
(the certificate hidden field it writes to the DOM), not on it as an npm
dependency — see [Integrating with `@silverassist/quirobot`](#integrating-with-silverassistquirobot)
below.

## Why this exists

TrustedForm needs its script loaded, and a certificate generated, before a
lead form is submitted — but loading it eagerly costs ~400ms of Total
Blocking Time for a certificate most visitors won't need for several
seconds. This component defers loading until the first user interaction
(scroll, mousemove, touchstart, click, focus) or a timeout, whichever comes
first, using `@silverassist/next-script-loader` instead of a hand-rolled
`document.createElement("script")` call.

## Install

```bash
npm install @silverassist/trusted-form
```

## Usage

```tsx
import TrustedForm from "@silverassist/trusted-form";

export function LeadForm() {
  return (
    <form action={submitLead}>
      <TrustedForm />
      <input name="email" type="email" required />
      <button type="submit">Submit</button>
    </form>
  );
}
```

Mount it once per page — not once per form. If a page renders more than one
lead form, a single `<TrustedForm />` still populates the one
`xxTrustedFormCertUrl` hidden field every form on the page can read.

### Props

| Prop               | Type     | Default | Description                                                              |
| ------------------ | -------- | ------- | -------------------------------------------------------------------------- |
| `autoLoadDelayMs`  | `number` | `5000`  | Ceiling before the script loads even without user interaction.           |

## Integrating with `@silverassist/quirobot`

`@silverassist/quirobot`'s chat widget waits for the `xxTrustedFormCertUrl`
hidden input this component writes before it initializes, so its context
includes a valid certificate. Mount both on the same page — there is no npm
dependency edge between the two packages, only this documented DOM contract
(the field name is exported as `TRUSTEDFORM_CERT_FIELD_NAME` if you need to
reference it):

```tsx
import TrustedForm from "@silverassist/trusted-form";
import Quirobot from "@silverassist/quirobot";

export function Layout() {
  return (
    <>
      <TrustedForm />
      <Quirobot botScript={{ use: "...", scriptUrl: "..." }} context={{}} />
    </>
  );
}
```

## License

PolyForm Noncommercial 1.0.0 — see [LICENSE](./LICENSE).
