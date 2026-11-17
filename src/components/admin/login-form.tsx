"use client";
import { useActionState } from "react";
import { login } from "@/app/login/actions";
export function LoginForm({
  configured,
  next = "/admin",
}: {
  configured: boolean;
  next?: string;
}) {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action} className="editor-form auth-form">
      <input type="hidden" name="next" value={next} />
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          disabled={!configured}
        />
      </label>
      <label>
        Kata sandi
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
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button className="button" disabled={pending || !configured}>
        {pending ? "Memeriksa..." : "Masuk sebagai Admin"}
      </button>
    </form>
  );
}
