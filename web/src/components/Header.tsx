import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Logo from "./Logo";
import Button from "./Button";
import { clearToken } from "../lib/api";
import { useStreak } from "../lib/streak";
import { FlameIcon } from "./icons";

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
      className="sticky top-0 z-10 bg-[#FDF9F3]/80 backdrop-blur border-b border-amber-900/5"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/decks" aria-label="Go to your decks">
          <Logo size={32} withText />
        </Link>
        <div className="flex items-center gap-1">
          {streak > 0 && (
            <span
              className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-600 ring-1 ring-amber-200"
              title={`${streak}-day streak`}
            >
              <FlameIcon className="h-4 w-4" />
              {streak}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
