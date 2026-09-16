import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/kartlar", label: "Kartlarım" },
  { to: "/kurs", label: "Kurs" },
];

/**
 * The two halves of the app, one tab each. Flashcards live on the left,
 * the course on the right, and nothing about one leaks into the other.
 */
function AppTabs() {
  return (
    <nav
      aria-label="Bölümler"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-md grid-cols-2 px-4">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex min-h-14 items-center justify-center text-[11px] font-extrabold uppercase tracking-[0.14em] transition ${
                isActive ? "text-ink" : "text-graphite hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <span className={`border-b-2 pb-0.5 ${isActive ? "border-ink" : "border-transparent"}`}>{tab.label}</span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default AppTabs;
