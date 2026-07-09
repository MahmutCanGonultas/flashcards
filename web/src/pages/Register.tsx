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
      return "We could not create that account. That email may already be registered.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
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
      navigate("/decks", { replace: true });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (signUp.isPending) return;

    const nextErrors: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
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
          Build a habit,
          <br />
          one card at a time.
        </>
      }
      subline="Start with a single deck today. Five minutes a day is all it takes to make it stick."
      title="Create your account"
      emoji="✨"
      subtitle="It takes about ten seconds. No credit card, obviously."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-violet-600 hover:text-violet-700 hover:underline"
          >
            Sign in
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
          disabled={signUp.isPending}
        />

        <TextField
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          disabled={signUp.isPending}
        />

        {submitError && (
          <div
            role="alert"
            className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200"
          >
            {submitError}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={signUp.isPending}
          loadingText="Creating account..."
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Register;
