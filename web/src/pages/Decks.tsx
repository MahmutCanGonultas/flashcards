import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

const fetchDecks = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:3000/api/v1/decks", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Desteler alınamadı");
  }

  const data = await res.json();
  return data.decks;
};

type Deck = {
  id: number;
  name: string;
  created_at: string;
};

const themes = [
  {
    bg: "bg-violet-100",
    ring: "ring-violet-200",
    icon: "bg-violet-500",
    text: "text-violet-700",
    soft: "bg-violet-200/60",
  },
  {
    bg: "bg-sky-100",
    ring: "ring-sky-200",
    icon: "bg-sky-500",
    text: "text-sky-700",
    soft: "bg-sky-200/60",
  },
  {
    bg: "bg-rose-100",
    ring: "ring-rose-200",
    icon: "bg-rose-500",
    text: "text-rose-700",
    soft: "bg-rose-200/60",
  },
  {
    bg: "bg-emerald-100",
    ring: "ring-emerald-200",
    icon: "bg-emerald-500",
    text: "text-emerald-700",
    soft: "bg-emerald-200/60",
  },
  {
    bg: "bg-amber-100",
    ring: "ring-amber-200",
    icon: "bg-amber-500",
    text: "text-amber-700",
    soft: "bg-amber-200/60",
  },
  {
    bg: "bg-fuchsia-100",
    ring: "ring-fuchsia-200",
    icon: "bg-fuchsia-500",
    text: "text-fuchsia-700",
    soft: "bg-fuchsia-200/60",
  },
];

function Decks() {
  const { data, isLoading, isError } = useQuery<Deck[]>({
    queryKey: ["decks"],
    queryFn: fetchDecks,
  });

  return (
    <div className="min-h-screen bg-[#FDF9F3]">
      {/* Üst bar */}
      <header className="sticky top-0 z-10 bg-[#FDF9F3]/80 backdrop-blur border-b border-amber-900/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size={32} withText />
          <button className="text-sm font-medium text-stone-500 hover:text-stone-800 transition">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Başlık */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight flex items-center gap-2">
              My Decks <span className="text-2xl">📚</span>
            </h1>
            <p className="text-stone-500 mt-1.5">
              Pick a deck and keep your streak going!
            </p>
          </div>
          <button className="bg-violet-500 hover:bg-violet-600 active:scale-95 text-white font-bold px-5 py-3 rounded-2xl shadow-[0_4px_0_0_theme(colors.violet.700)] hover:shadow-[0_2px_0_0_theme(colors.violet.700)] hover:translate-y-0.5 transition-all flex items-center gap-2">
            <span className="text-xl leading-none">+</span> New deck
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-3xl bg-stone-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-3xl bg-rose-100 text-rose-700 p-6 font-medium">
            Desteler yüklenirken bir hata oluştu.
          </div>
        )}

        {/* Boş durum */}
        {data && data.length === 0 && (
          <div className="rounded-3xl bg-white border-2 border-dashed border-stone-200 p-16 text-center">
            <div className="text-5xl mb-3">🗂️</div>
            <h3 className="font-bold text-lg text-stone-800">No decks yet</h3>
            <p className="text-stone-500 mt-1">
              Create your first deck and start learning!
            </p>
          </div>
        )}

        {/* Kartlar */}
        {data && data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((deck, i) => {
              const t = themes[i % themes.length];
              return (
                <Link
                  key={deck.id}
                  to={`/decks/${deck.id}`}
                  className={`group relative ${t.bg} rounded-3xl p-6 ring-2 ${t.ring} hover:-translate-y-1 transition-transform overflow-hidden`}
                >
                  <div
                    className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full ${t.soft}`}
                  />

                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl ${t.icon} flex items-center justify-center shadow-sm`}
                    >
                      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                        <rect
                          x="4"
                          y="6"
                          width="12"
                          height="14"
                          rx="2.5"
                          className="fill-white/50"
                        />
                        <rect
                          x="8"
                          y="4"
                          width="12"
                          height="14"
                          rx="2.5"
                          className="fill-white"
                        />
                      </svg>
                    </div>

                    <h3 className="font-extrabold text-lg text-stone-800 mt-5">
                      {deck.name}
                    </h3>
                    <p className={`text-sm font-medium ${t.text} mt-1`}>
                      Ready to study
                    </p>

                    <div className="flex items-center gap-1.5 mt-5 font-bold text-stone-700">
                      <span>Study</span>
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Decks;
