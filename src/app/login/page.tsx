"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const res = await loginAction(formData);
      return res ?? { error: "Login failed" };
    },
    null
  );

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <h1 className="text-[48px] font-bold tracking-tighter text-black leading-none">
            Harsh
          </h1>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em]">
            <span className="bg-[var(--acid)] px-2 py-1 text-black">why not you?</span>
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          <input
            name="passcode"
            type="password"
            autoFocus
            autoComplete="current-password"
            placeholder="passcode"
            className="w-full border-2 border-black bg-white px-4 py-3 text-[14px] font-medium text-black placeholder:text-black/30 outline-none focus:bg-[var(--acid)]/10"
          />
          {state?.error && (
            <p className="text-[13px] font-bold text-black bg-[var(--acid)] inline-block px-2 py-1">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-black px-4 py-3 text-[14px] font-bold uppercase tracking-wider text-white transition hover:bg-[var(--acid)] hover:text-black disabled:opacity-50"
          >
            {pending ? "…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
