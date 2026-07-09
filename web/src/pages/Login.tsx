import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, setToken } from "../lib/api";
import Logo from "../components/Logo";
import TextField from "../components/TextField";
import Button from "../components/Button";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  // Trimmed guard so a form of only whitespace can't be submitted.
  const canSubmit = email.trim() !== "" && password.trim() !== "";

  // ApiError carries UI-ready English copy; anything else gets a safe fallback.
  const errorMessage = loginMutation.isError
    ? loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : "Something went wrong. Please try again."
    : null;

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
              Learn faster,
              <br />
              remember longer.
            </h2>
            <p className="mt-4 text-slate-300 max-w-sm leading-relaxed">
              Spaced repetition that shows each card exactly when you're about
              to forget it.
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
            Sign in
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm mb-8">
            Welcome back. Enter your details to continue.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSubmit || loginMutation.isPending) return;
              loginMutation.mutate({ email, password });
            }}
            className="space-y-5"
            noValidate
          >
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="dark"
              fullWidth
              disabled={!canSubmit}
              isLoading={loginMutation.isPending}
              loadingText="Signing in..."
            >
              Sign in <span aria-hidden>→</span>
            </Button>
          </form>

          <p className="text-sm text-slate-500 mt-8">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-slate-900 font-semibold cursor-pointer hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
