import { useState } from "react";
import type { CSSProperties } from "react";
import Contribution from "#components/contribution.tsx";
import { contributions } from "../data/contributions";

export default function Contributions() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const count = contributions.length;

  if (count === 0) return null;

  function moveCard(direction: number) {
    setActiveIndex((index) => (index + direction + count) % count);
  }

  return (
    <div className="contributions-container">
      <div id="contribution-deck" className={`contribution-deck${expanded ? " is-expanded" : ""}`}>
        {contributions.map((contribution, index) => {
          const depth = (index - activeIndex + count) % count;
          const behind = !expanded && depth !== 0;

          return (
            <div
              key={contribution.url}
              className="contribution-layer"
              data-hidden={!expanded && depth > 2 ? "true" : undefined}
              aria-hidden={behind || undefined}
              inert={behind}
              style={{
                "--depth": Math.min(depth, 2),
                zIndex: expanded ? undefined : count - depth,
              } as CSSProperties}
            >
              <Contribution {...contribution} />
            </div>
          );
        })}
      </div>
      {count > 1 && (
        <div className="contribution-controls">
          {!expanded && (
            <>
              <button type="button" onClick={() => moveCard(-1)} aria-label="Previous contribution" aria-controls="contribution-deck">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
              </button>
              <span className="contribution-position" aria-live="polite">{activeIndex + 1} / {count}</span>
              <button type="button" onClick={() => moveCard(1)} aria-label="Next contribution" aria-controls="contribution-deck">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
              </button>
            </>
          )}
          <button
            type="button"
            className="contribution-toggle"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls="contribution-deck"
          >
            {expanded ? "Stack cards" : "Show all"}
          </button>
        </div>
      )}
    </div>
  );
}
