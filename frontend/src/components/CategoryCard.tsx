import { Link } from "react-router-dom";

interface CategoryCardProps {
  category: string;
  title: string;
  description: string;
  formats: string[];
  accent: string;
}

const renderIcon = (category: string) => {
  switch (category) {
    case "images":
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="5"
            y="7"
            width="22"
            height="18"
            rx="4"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
          />
          <circle cx="13" cy="13" r="2.5" fill="rgba(255,255,255,0.85)" />
          <path
            d="M9 22L14.5 16.5L19 21L23 17L26 20.5"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "audio":
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 10.5C12 9.11929 13.1193 8 14.5 8H20C20.5523 8 21 8.44772 21 9V20"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 14.5V22.5C12 24.433 10.433 26 8.5 26C6.567 26 5 24.433 5 22.5C5 20.567 6.567 19 8.5 19C9.59822 19 10.5784 19.4436 11.2881 20.158M21 16.5C21 14.567 22.567 13 24.5 13C26.433 13 28 14.567 28 16.5C28 18.433 26.433 20 24.5 20C23.4018 20 22.4216 19.5564 21.7119 18.842"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "video":
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="5"
            y="7"
            width="18"
            height="18"
            rx="3"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
          />
          <path
            d="M23 13.5L27 11.5V20.5L23 18.5"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 13L18 16L14 19V13Z"
            fill="rgba(255,255,255,0.85)"
          />
        </svg>
      );
    default:
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="6"
            y="8"
            width="20"
            height="16"
            rx="4"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
          />
          <path
            d="M12 14H20"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 18H20"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
  }
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
        {renderIcon(category)}
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
