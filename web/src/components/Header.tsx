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
      className="sticky top-0 z-10 border-b border-ink/10 bg-paper/85 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/kartlar" aria-label="Kartlarına git">
          <Logo size={32} withText />
        </Link>
        <div className="flex items-center gap-1">
          <MusicToggle />
          {streak > 0 && (
            <span
              className="flex items-center gap-1 rounded-full bg-paper px-3 py-1.5 text-sm font-extrabold text-ink ring-1 ring-ink/15 tabular-nums"
              title={`${streak} günlük seri`}
            >
              <FlameIcon className="h-4 w-4 text-accent" />
              {streak}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
