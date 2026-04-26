import { Suspense } from "react";
import { LoginContent } from "./LoginContent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-400">
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
