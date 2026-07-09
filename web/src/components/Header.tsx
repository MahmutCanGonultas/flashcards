import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Logo from "./Logo";
import Button from "./Button";
import { clearToken } from "../lib/api";

function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = () => {
    clearToken();
    // Drop every cached query so the next user never sees the last one's decks.
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-10 bg-[#FDF9F3]/80 backdrop-blur border-b border-amber-900/5">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/decks" aria-label="Go to your decks">
          <Logo size={32} withText />
        </Link>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}

export default Header;
