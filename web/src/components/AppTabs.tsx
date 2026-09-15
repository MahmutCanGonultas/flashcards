import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/kartlar", label: "Kartlarım", icon: "🃏" },
  { to: "/kurs", label: "Kurs", icon: "📚" },
];

/**
 * The two halves of the app, one tab each. Flashcards live on the left,
 * the course on the right, and nothing about one leaks into the other.
 */
function AppTabs() {
  return (
    <nav
      aria-label="Bölümler"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200/70 bg-[#FDF9F3]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-md grid-cols-2 px-4">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-xs font-extrabold transition ${
                isActive ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-14 items-center justify-center rounded-2xl text-xl transition ${isActive ? "bg-white shadow-sm ring-1 ring-stone-200" : ""}`}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default AppTabs;
