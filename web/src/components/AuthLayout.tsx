import type { ReactNode } from "react";
import Logo from "./Logo";
import { CardStackArt } from "./icons";

type AuthLayoutProps = {
  /** Marketing copy on the brand panel. */
  headline: ReactNode;
  subline: string;
  title: string;
  emoji: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * The shared shell behind Sign in and Sign up: a brand panel carrying the
 * logo's indigo-to-fuchsia gradient, and a cream column holding the form card.
 */
function AuthLayout({
  headline,
  subline,
  title,
  emoji,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[#FDF9F3]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl" />
        <CardStackArt className="pointer-events-none absolute -bottom-16 -right-10 h-96 w-96 text-white/15" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="[&_span]:text-white">
            <Logo size={36} withText />
          </div>

          <div>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              {headline}
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-white/80">{subline}</p>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/70">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-amber-300 ring-2 ring-violet-500" />
              <div className="h-8 w-8 rounded-full bg-emerald-300 ring-2 ring-violet-500" />
              <div className="h-8 w-8 rounded-full bg-rose-300 ring-2 ring-violet-500" />
            </div>
            <span>Join thousands of learners</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size={36} withText />
          </div>

          <div className="rounded-3xl bg-white p-7 sm:p-9 ring-2 ring-stone-100 shadow-[0_6px_0_0_var(--color-stone-100)]">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-stone-800">
              {title}
              <span aria-hidden="true">{emoji}</span>
            </h1>
            <p className="mt-1.5 mb-7 text-sm text-stone-500">{subtitle}</p>

            {children}
          </div>

          <p className="mt-6 text-center text-sm text-stone-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
