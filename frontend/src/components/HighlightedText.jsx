import React from "react";

/**
 * Highlights matches of `query` within `text`.
 * If `isCurrentMatch` is true, applies high-contrast active accent styling.
 */
export default function HighlightedText({ text, query, isCurrentMatch = false }) {
  if (!text) return null;
  const trimmed = (query || "").trim();
  if (!trimmed) return <>{text}</>;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === trimmed.toLowerCase();
        if (!isMatch) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }

        return (
          <mark
            key={index}
            className={`rounded-xs px-0.5 select-text transition-all ${
              isCurrentMatch
                ? "bg-amber-400 text-amber-950 font-bold ring-2 ring-amber-500 shadow-md px-1"
                : "bg-yellow-200 text-yellow-950 dark:bg-amber-300/70 dark:text-amber-950 font-semibold px-1"
            }`}
          >
            {part}
          </mark>
        );
      })}
    </span>
  );
}
