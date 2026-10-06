import { Link } from "react-router-dom";

/** Back to today's list, the way the week's pages start. */
function BackHome() {
  return (
    <Link to="/bugun" viewTransition className="-m-2 inline-block p-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink">
      ← Bugün
    </Link>
  );
}

export default BackHome;
