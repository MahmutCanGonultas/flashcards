import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Logo from "./Logo";
import Button from "./Button";
import { clearToken } from "../lib/api";
import { useStreak } from "../lib/streak";
import { FlameIcon } from "./icons";
import MusicToggle from "./MusicToggle";

function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const streakQuery = useStreak();
  const streak = streakQuery.data?.streak ?? 0;

  const handleSignOut = () => {
    clearToken();
    // Drop every cached query so the next user never sees the last one's decks.
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header
      className="sticky top-0 z-10 border-b-2 border-rule bg-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-5">
        <Link to="/kartlar" aria-label="Kartlarına git">
          <Logo size={32} withText />
        </Link>
        <div className="flex items-center gap-1">
          <MusicToggle />
          {streak > 0 && (
            // Keyed on the count so a new day's increment flashes once.
            <span
              key={streak}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[17px] font-black text-tangerine tabular-nums animate-gilt-flash"
              title={`${streak} günlük seri`}
            >
              <FlameIcon className="h-6 w-6 text-tangerine" />
              {streak}
            </span>
          )}
          <Button variant="ghost" size="sm" className="!px-2.5 !text-graphite hover:!text-ink" onClick={handleSignOut}>
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
