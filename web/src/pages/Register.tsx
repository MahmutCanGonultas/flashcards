import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, setToken } from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import Button from "../components/Button";

type Credentials = {
  email: string;
  password: string;
};

type FieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    // A duplicate email makes the backend throw; Express answers 500 with an
    // HTML body, so there's no useful server text to surface here.
    if (error.status === 500) {
      return "Bu hesabı oluşturamadık. Bu e-posta zaten kayıtlı olabilir.";
    }
    return error.message;
  }
  return "Bir şeyler ters gitti. Tekrar dener misin?";
}

function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const signUp = useMutation({
    mutationFn: async ({ email, password }: Credentials): Promise<string> => {
      await api.post<{ user: { id: number; email: string; created_at: string } }>(
        "/auth/register",
        { email, password },
      );
      const { token } = await api.post<{ token: string }>("/auth/login", {
        email,
        password,
      });
      return token;
    },
    onSuccess: (token) => {
      setToken(token);
      // Whoever was signed in before, their cached decks must not survive.
      // removeQueries (not clear) leaves this in-flight mutation untouched.
      queryClient.removeQueries();
      navigate("/kartlar", { replace: true });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (signUp.isPending) return;

    const nextErrors: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Geçerli bir e-posta adresi gir.";
    }
    if (password.length < 6) {
      nextErrors.password = "Şifre en az 6 karakter olmalı.";
    }

    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    signUp.mutate({ email, password });
  };

  const submitError = signUp.isError ? describeError(signUp.error) : null;

  return (
    <AuthLayout
      headline={
        <>
          Alışkanlık edin,
          <br />
          kart kart.
        </>
      }
      subline="Bugün tek bir desteyle başla. Aklında kalması için günde beş dakika yeter."
      title="Hesabını oluştur"
      emoji="✨"
      subtitle="On saniye sürer. Kredi kartı yok, tabii ki."
      footer={
        <>
          Zaten hesabın var mı?{" "}
          <Link
            to="/login"
            className="font-bold text-ink underline decoration-ink underline-offset-4 hover:decoration-2"
          >
            Giriş yap
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
          disabled={signUp.isPending}
        />

        <TextField
          label="Şifre"
          type="password"
          placeholder="En az 6 karakter"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={signUp.isPending}
        />

        {submitError && (
          <div
            role="alert"
            className="rounded-xl bg-accent/8 px-4 py-3 text-sm font-semibold text-accent ring-1 ring-accent/30"
          >
            {submitError}
          </div>
        )}

        <Button
          type="submit"
          variant="ink"
          fullWidth
          size="lg"
          className="shadow-button"
          isLoading={signUp.isPending}
          loadingText="Hesap oluşturuluyor..."
        >
          Hesap oluştur
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Register;
