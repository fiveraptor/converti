import { CategoryCard } from "../components/CategoryCard";
import { JobHistory } from "../components/JobHistory";
import { useCategories } from "../hooks/useCategories";
import { useJobHistory } from "../hooks/useJobHistory";

const CATEGORY_COPY: Record<string, { title: string; description: string; accent: string }> = {
  images: {
    title: "Images",
    description: "Optimise and convert PNG, JPEG, WebP, and more.",
    accent: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(14,165,233,0.4))",
  },
  audio: {
    title: "Audio",
    description: "Transcode audio formats such as MP3, WAV, or AAC.",
    accent: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.4))",
  },
  video: {
    title: "Video",
    description: "Convert video for any platform, from mobile to 4K.",
    accent: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(59,130,246,0.4))",
  },
};

export const HomePage = () => {
  const { categories, loading, error } = useCategories();
  const history = useJobHistory();

  return (
    <div className="home-page">
      <section className="hero">
        <span className="badge">All round file converter</span>
        <h1>Transform files in seconds</h1>
        <p>
          Converti supports images, audio, and video. Upload your files, choose a target format, and
          let the platform handle the rest. No installation, modern UI, full control.
        </p>
      </section>

      <section className="category-grid">
        {loading && <p>Loading available categories...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading &&
          categories &&
          Object.entries(categories).map(([key, formats]) => {
            const copy = CATEGORY_COPY[key] ?? {
              title: key,
              description: "Convert the files that belong to this category.",
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
