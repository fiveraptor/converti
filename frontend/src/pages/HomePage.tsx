import { CategoryCard } from "../components/CategoryCard";
import { JobHistory } from "../components/JobHistory";
import { useCategories } from "../hooks/useCategories";
import { useJobHistory } from "../hooks/useJobHistory";

const CATEGORY_COPY: Record<
  string,
  { title: string; description: string; accent: string }
> = {
  images: {
    title: "Bilder",
    description: "Optimieren und konvertieren von PNG, JPEG, WebP und mehr.",
    accent: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(14,165,233,0.4))",
  },
  audio: {
    title: "Audio",
    description: "Wandle Audioformate wie MP3, WAV oder AAC um.",
    accent: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.4))",
  },
  video: {
    title: "Video",
    description: "Konvertiere Videos fuer jede Plattform, vom Handy bis 4K.",
    accent: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(59,130,246,0.4))",
  },
};

export const HomePage = () => {
  const { categories, loading, error } = useCategories();
  const history = useJobHistory();

  return (
    <div className="home-page">
      <section className="hero">
        <span className="badge">Allround File Converter</span>
        <h1>Dateien sekundenschnell umwandeln</h1>
        <p>
          Converti unterstuetzt Bilder, Audio und Video – einfach hochladen, Zielformat waehlen und
          fertig. Keine Installation, moderne Oberflaeche, volle Kontrolle.
        </p>
      </section>

      <section className="category-grid">
        {loading && <p>Lade verfügbare Kategorien…</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading &&
          categories &&
          Object.entries(categories).map(([key, formats]) => {
            const copy = CATEGORY_COPY[key] ?? {
              title: key,
              description: "Konvertiere Dateien dieser Kategorie.",
              accent: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(14,165,233,0.4))",
            };
            return (
              <CategoryCard
                key={key}
                category={key}
                title={copy.title}
                description={copy.description}
                formats={formats}
                accent={copy.accent}
              />
            );
          })}
      </section>

      <JobHistory history={history} />
    </div>
  );
};
