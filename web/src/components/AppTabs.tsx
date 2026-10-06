import { NavLink, useLocation } from "react-router-dom";
import { BookIcon, CardsIcon, PathIcon } from "./icons";

/**
 * Three tabs: the cards (and the word list behind them), the week of the
 * programme (its texts, the test, the exercises, the numbers) and the
 * grammar. The course is hidden while the programme runs (its pages still
 * open by address). The active tab sits in a blue key, the way a pressed
 * button looks here.
 */
function AppTabs() {
  const { pathname } = useLocation();
  const grammar = /^\/gramer/.test(pathname);
  const week = /^\/hafta/.test(pathname);
  const tabs = [
    { to: "/kartlar", label: "Kartlar", icon: CardsIcon, active: !grammar && !week },
    { to: "/hafta", label: "Hafta", icon: PathIcon, active: week },
    { to: "/gramer", label: "Gramer", icon: BookIcon, active: grammar },
  ];
  return (
    <nav aria-label="Bölümler" className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-rule bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2 px-3 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            aria-current={tab.active ? "page" : undefined}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 text-[12px] font-black uppercase tracking-[0.1em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30 ${
              tab.active ? "border-ocean bg-ocean-soft text-ocean-ink" : "border-transparent text-graphite hover:bg-paper-deep"
            }`}
          >
            <tab.icon className={`h-6 w-6 ${tab.active ? "text-ocean" : "text-hare"}`} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default AppTabs;
