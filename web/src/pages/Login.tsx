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
      navigate("/decks", { replace: true });
    },
  });

  // Validate on submit rather than disabling the button: a greyed-out primary
  // action on an untouched form reads as broken.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginMutation.isPending) return;

    const nextErrors: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";

    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    loginMutation.mutate({ email, password });
  };

  // ApiError carries UI-ready English copy; anything else gets a safe fallback.
  const errorMessage = loginMutation.isError
    ? loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : "Something went wrong. Please try again."
    : null;

  return (
    <AuthLayout
      headline={
        <>
          Learn faster,
          <br />
          remember longer.
        </>
      }
      subline="Spaced repetition that shows each card exactly when you're about to forget it."
      title="Welcome back"
      emoji="👋"
      subtitle="Enter your details to pick up where you left off."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-bold text-violet-600 hover:text-violet-700 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          disabled={loginMutation.isPending}
        />

        <TextField
          label="Password"
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
          loadingText="Signing in..."
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Login;
