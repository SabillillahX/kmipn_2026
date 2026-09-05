"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter(); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
        signal: controller.signal,
      });
      if (response.ok) {
        router.replace("/dashboard");
        return;
      }
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Tidak dapat masuk.");
    } catch {
      setError("Layanan login tidak merespons. Periksa koneksi database lalu coba lagi.");
    } finally {
      window.clearTimeout(timeout);
      setPending(false);
    }
  }
  return <form onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="email" required placeholder="admin@kecamatan.go.id" /></label><label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></label>{error && <div role="alert">{error}</div>}<button disabled={pending}>{pending ? "Memverifikasi…" : "Masuk ke dashboard"}</button></form>;
}
