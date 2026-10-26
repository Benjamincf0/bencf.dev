import type { ContributionData } from "../data/contributions";
import "#styles/contributions.css";

export default function Contribution({
  url,
  title,
  description,
  additions,
  deletions,
  comments,
}: ContributionData) {
  const totalChanges = additions + deletions;
  const addedBlocks = totalChanges > 0 ? Math.round((additions / totalChanges) * 5) : 0;

  return (
    <div className="Box tmp-p-3">
      <svg
        aria-hidden="true"
        height="16"
        viewBox="0 0 16 16"
        width="16"
        className="octicon octicon-git-merge d-inline-block mt-1 tmp-mt-1 float-left color-fg-done"
      >
        <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 0 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z" />
      </svg>
      <div className="tmp-ml-4">
        <h3 className="lh-condensed my-0">
          <a className="color-fg-default markdown-title" href={url} target="_blank" rel="noreferrer">
            {title}
          </a>
        </h3>
        <div className="color-fg-muted mb-0 mt-2">
          <p>{description}</p>
        </div>
        <div className="f6 color-fg-muted mt-2">
          <span className="diffstat position-relative float-left" style={{ top: 0 }}>
            <span className="color-fg-success">+{additions}</span>{" "}
            <span className="color-fg-danger">−{deletions}</span>{" "}
            {totalChanges > 0 && Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className="diffstat-block-added"
                style={index >= addedBlocks ? { backgroundColor: "#cf222e" } : undefined}
              />
            ))}{" "}
            <span className="color-fg-muted">lines changed</span>
            <span className="color-fg-muted mx-1">•</span>
          </span>
          {comments} {comments === 1 ? "comment" : "comments"}
        </div>
      </div>
    </div>
  );
}
