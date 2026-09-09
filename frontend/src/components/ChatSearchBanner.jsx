import React, { useEffect, useRef } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";

export default function ChatSearchBanner({
  query,
  setQuery,
  matchCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  onClose,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Automatically focus and select the search input on mount
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const hasQuery = Boolean(query.trim());

  return (
    <div
      id="chat-search-banner"
      className="bg-base-100/95 backdrop-blur-md border-b border-base-300/80 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 z-20 shadow-xs animate-in slide-in-from-top-2 duration-150"
    >
      {/* Search Input Box */}
      <div className="relative flex-1 min-w-0 max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-base-content/40 pointer-events-none" />
        <input
          ref={inputRef}
          id="chat-search-input"
          type="text"
          placeholder="Find text in conversation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input input-sm input-bordered w-full pl-9 pr-8 rounded-xl text-xs sm:text-sm bg-base-200/50 focus:bg-base-100 focus:border-primary transition-colors shadow-2xs"
        />
        {hasQuery && (
          <button
            id="chat-search-clear-btn"
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-2 p-0.5 rounded-full text-base-content/50 hover:text-base-content hover:bg-base-300 transition-colors"
            title="Clear text"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Match Count & Navigation Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {hasQuery && (
          <div className="flex items-center gap-1">
            {matchCount > 0 ? (
              <span
                id="chat-search-match-count"
                className="text-[11px] sm:text-xs font-semibold text-base-content/80 tabular-nums px-2 py-0.5 rounded-lg bg-base-200 border border-base-300/60 select-none whitespace-nowrap"
              >
                {currentMatchIndex + 1} of {matchCount}
              </span>
            ) : (
              <span
                id="chat-search-no-matches"
                className="text-[11px] sm:text-xs font-medium text-error px-2 py-0.5 rounded-lg bg-error/10 select-none whitespace-nowrap"
              >
                No matches
              </span>
            )}

            {/* Previous match button */}
            <button
              id="chat-search-prev-btn"
              type="button"
              onClick={onPrevMatch}
              disabled={matchCount <= 1}
              className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content disabled:opacity-30"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp className="size-4" />
            </button>

            {/* Next match button */}
            <button
              id="chat-search-next-btn"
              type="button"
              onClick={onNextMatch}
              disabled={matchCount <= 1}
              className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-base-content disabled:opacity-30"
              title="Next match (Enter)"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        )}

        <div className="h-4 w-px bg-base-300/80 mx-0.5 hidden sm:block" />

        {/* Keyboard shortcut hint on desktop */}
        <span className="text-[10px] text-base-content/40 hidden lg:inline select-none">
          ESC to close
        </span>

        {/* Close search button */}
        <button
          id="chat-search-close-btn"
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-base-content/60 hover:text-base-content"
          title="Close search (Esc)"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
