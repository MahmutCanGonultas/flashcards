import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, setToken } from "../lib/api";
import Logo from "../components/Logo";
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
    <div className="min-h-screen flex bg-white">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.4),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.35),transparent_50%)]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="[&_span]:text-white">
            <Logo size={36} withText />
          </div>

          <div>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Build a habit,
              <br />
              one card at a time.
            </h2>
            <p className="mt-4 text-slate-300 max-w-sm leading-relaxed">
              Create your first deck in seconds and let spaced repetition handle
              the remembering for you.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-400 border-2 border-slate-900" />
              <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-slate-900" />
              <div className="w-8 h-8 rounded-full bg-pink-400 border-2 border-slate-900" />
            </div>
            <span>Join thousands of learners</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <Logo size={36} withText />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            It only takes a moment to start learning.
          </p>

          {submitError && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
            >
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              error={fieldErrors.email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
            />

            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              error={fieldErrors.password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
            />

            <Button
              type="submit"
              variant="dark"
              fullWidth
              isLoading={signUp.isPending}
              loadingText="Creating account..."
            >
              Create account
            </Button>
          </form>

          <p className="text-sm text-slate-500 mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-slate-900 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
