import { Link } from "react-router-dom";

interface CategoryCardProps {
  category: string;
  title: string;
  description: string;
  formats: string[];
  accent: string;
}

const ICON_MAP: Record<string, string> = {
  images: "\uD83D\uDDBC\uFE0F", // framed picture
  audio: "\uD83C\uDFA7", // headphones
  video: "\uD83C\uDFAC", // clapper board
};

export const CategoryCard = ({
  category,
  title,
  description,
  formats,
  accent,
}: CategoryCardProps) => {
  return (
    <Link to={`/convert/${category}`} className="category-card">
      <div className="category-icon" aria-hidden style={{ background: accent }}>
        {ICON_MAP[category] ?? "\uD83D\uDCC4"}
      </div>
      <div className="category-content">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="chip-list">
          {formats.slice(0, 4).map((format) => (
            <span key={format} className="chip">
              {format.toUpperCase()}
            </span>
          ))}
          {formats.length > 4 && <span className="chip neutral">+{formats.length - 4}</span>}
        </div>
      </div>
      <span className="category-cta">Convert</span>
    </Link>
  );
};
