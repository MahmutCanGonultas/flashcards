import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, setToken } from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import Button from "../components/Button";

type FieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<{ token: string }>("/auth/login", credentials),
    onSuccess: (data) => {
      setToken(data.token);
      // Whoever was signed in before, their cached decks must not survive.
      // removeQueries (not clear) leaves this in-flight mutation untouched.
      queryClient.removeQueries();
      navigate("/kartlar", { replace: true });
    },
  });

  // Validate on submit rather than disabling the button: a greyed-out primary
  // action on an untouched form reads as broken.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginMutation.isPending) return;

    const nextErrors: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email)) nextErrors.email = "Geçerli bir e-posta adresi gir.";
    if (!password) nextErrors.password = "Şifreni gir.";

    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    loginMutation.mutate({ email, password });
  };

  // ApiError carries UI-ready copy; anything else gets a safe fallback.
  const errorMessage = loginMutation.isError
    ? loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : "Bir şeyler ters gitti. Tekrar dener misin?"
    : null;

  return (
    <AuthLayout
      headline={
        <>
          Daha hızlı öğren,
          <br />
          daha uzun hatırla.
        </>
      }
      subline="Aralıklı tekrar: her kartı tam unutmak üzereyken karşına çıkarır."
      title="Tekrar hoş geldin"
      emoji="👋"
      subtitle="Bilgilerini gir, kaldığın yerden devam et."
      footer={
        <>
          Hesabın yok mu?{" "}
          <Link
            to="/register"
            className="font-bold text-violet-600 hover:text-violet-700 hover:underline"
          >
            Hesap oluştur
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          label="E-posta"
          type="email"
          placeholder="sen@ornek.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={loginMutation.isPending}
        />

        <TextField
          label="Şifre"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={loginMutation.isPending}
        />

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200"
          >
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={loginMutation.isPending}
          loadingText="Giriş yapılıyor..."
        >
          Giriş yap
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Login;
