import { NavLink, useLocation } from "react-router-dom";
import { CardsIcon, PathIcon } from "./icons";

/** Kartlarım holds the learner's own words and everything around them: the word list, the word pages, grammar. */
const OWN_ROUTES = [/^\/kartlar/, /^\/kelimelerim/, /^\/gramer/, /^\/decks\/\d+\/words\//];

/**
 * The two halves of the app, one tab each: the learner's own words on the
 * left, the course on the right. The active tab sits in a blue key, the
 * way a pressed button looks here.
 */
function AppTabs() {
  const { pathname } = useLocation();
  const own = OWN_ROUTES.some((r) => r.test(pathname));
  const tabs = [
    { to: "/kartlar", label: "Kartlarım", icon: CardsIcon, active: own },
    { to: "/kurs", label: "Kurs", icon: PathIcon, active: !own },
  ];
  return (
    <nav aria-label="Bölümler" className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-rule bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3 px-4 py-2">
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
