"use client";
import { useActionState } from "react";
import { login } from "@/lib/admin/auth-actions";

export function LoginForm({
  configured,
  next = "/admin",
}: {
  configured: boolean;
  next?: string;
}) {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action} className="form-stack auth-form">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          disabled={!configured}
        />
      </label>
      <label className="field">
        <span>Kata sandi</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          disabled={!configured}
        />
      </label>
      {state.error && (
        <p role="alert" className="form-alert">
          {state.error}
        </p>
      )}
      <button className="button button-lg" disabled={pending || !configured}>
        {pending ? "Memeriksa..." : "Masuk sebagai Admin"}
      </button>
    </form>
  );
}
