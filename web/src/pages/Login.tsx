import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    localStorage.setItem("token", data.token);
    navigate("/decks");
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sol panel — marka */}
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

      {/* Sağ panel — form */}
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

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <button
              onClick={handleLogin}
              className="group w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              Sign in
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>

          <p className="text-sm text-slate-500 mt-8">
            Don't have an account?{" "}
            <span className="text-slate-900 font-semibold cursor-pointer hover:underline">
              Create one
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
