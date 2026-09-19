import { NavLink, useLocation } from "react-router-dom";

const TABS = [
  { to: "/kartlar", label: "Kartlarım" },
  { to: "/kurs", label: "Kurs" },
];

/**
 * The two halves of the app, one tab each. Flashcards live on the left,
 * the course on the right, and nothing about one leaks into the other.
 * One underline slides between them instead of each tab drawing its own.
 */
function AppTabs() {
  const { pathname } = useLocation();
  const kursActive = pathname.startsWith("/kurs");
  return (
    <nav
      aria-label="Bölümler"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper-deep/92 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="relative mx-auto grid max-w-md grid-cols-2 px-4">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex min-h-14 items-center justify-center pb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
                isActive ? "text-ink" : "text-graphite hover:text-ink"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-4 h-[2px] w-[calc(50%-2rem)] bg-ink transition-transform duration-[260ms] ease-spring"
          style={{ transform: kursActive ? "translateX(calc(100% + 2rem))" : "translateX(0)" }}
        />
      </div>
    </nav>
  );
}

export default AppTabs;
