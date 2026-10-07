import { NavLink, useLocation } from "react-router-dom";
import { BookIcon, CardsIcon, PencilIcon, SearchIcon } from "./icons";

/**
 * Four tabs: the cards, the words (each with when it comes back), the
 * notebook of the learner's own words, and the grammar. The course is
 * hidden while the programme runs (its pages still open by address). The
 * active tab sits in a blue key, the way a pressed button looks here.
 */
function AppTabs() {
  const { pathname } = useLocation();
  const grammar = /^\/gramer/.test(pathname);
  const words = /^\/kelimelerim/.test(pathname);
  const notebook = /^\/defter/.test(pathname);
  const tabs = [
    { to: "/kartlar", label: "Kartlar", icon: CardsIcon, active: !grammar && !words && !notebook },
    { to: "/kelimelerim", label: "Kelimeler", icon: SearchIcon, active: words },
    { to: "/defter", label: "Defter", icon: PencilIcon, active: notebook },
    { to: "/gramer", label: "Gramer", icon: BookIcon, active: grammar },
  ];
  return (
    <nav aria-label="Bölümler" className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-rule bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5 px-2 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            aria-current={tab.active ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-[0.08em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30 ${
              tab.active ? "border-ocean bg-ocean-soft text-ocean-ink" : "border-transparent text-graphite hover:bg-paper-deep"
            }`}
          >
            <tab.icon className={`h-5 w-5 ${tab.active ? "text-ocean" : "text-hare"}`} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default AppTabs;
