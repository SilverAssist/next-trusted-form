// NOTE: no "use client" here, deliberately. This page is a Server Component
// that imports the package -- if `TrustedForm` shipped without its own
// "use client" directive, `next build` would fail right here, a defect no
// unit test can see.
import TrustedForm from "@silverassist/trusted-form";

export default function Page() {
  return (
    <main>
      <h1>trusted-form fixture</h1>
      <TrustedForm />
    </main>
  );
}
