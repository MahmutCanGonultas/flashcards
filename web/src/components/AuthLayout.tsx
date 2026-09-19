import type { ReactNode } from "react";
import Logo from "./Logo";
import Mascot from "./Mascot";
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
 * The shared shell behind Sign in and Sign up: on wide screens a solid ink
 * panel like a magazine's inside cover, and beside it the paper column
 * holding the form as a raised sheet.
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-ink text-paper-lift">
        <CardStackArt className="pointer-events-none absolute -bottom-16 -right-10 h-96 w-96 text-paper-lift/10" />

        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="[&_span]:text-paper-lift">
            <Logo size={36} withText />
          </div>

          <div>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              {headline}
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-paper-lift/75">{subline}</p>
          </div>

          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-paper-lift/60">
            Günde üç kelime · aralıklı tekrar
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size={36} withText />
          </div>

          <div className="rounded-[28px] bg-paper-lift p-7 ring-1 ring-rule shadow-print paper-grain animate-rise-in sm:p-9">
            <div className="mb-6 flex items-end gap-3">
              {/* TODO(tonton): pass `greet` once Mascot has it, so the wave is only here. */}
              <Mascot mood="happy" size={72} className="shrink-0" />
              <div className="relative min-w-0 flex-1 rounded-3xl rounded-bl-md border-l-2 border-tonton bg-paper-lift px-4 py-3 ring-1 ring-rule shadow-bubble">
                <h1 className="text-xl font-extrabold tracking-tight text-ink">
                  {title} <span aria-hidden="true">{emoji}</span>
                </h1>
                <p className="mt-0.5 text-sm text-graphite">{subtitle}</p>
              </div>
            </div>

            {children}
          </div>

          <p className="mt-6 text-center text-sm text-graphite">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
