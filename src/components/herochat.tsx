import { useEffect, useState } from "react";
import type { FormEvent, RefObject } from "react";
import "#styles/herochat.css";

interface HeroChatProps {
  ready: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  formRef: RefObject<HTMLFormElement | null>;
  statusRef: RefObject<HTMLSpanElement | null>;
}

export default function HeroChat({ ready, inputRef, formRef, statusRef }: HeroChatProps) {
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!ready) return;
    // Leave another text field alone if the visitor started typing while the portrait loaded.
    const editing = document.activeElement?.matches("input, textarea, select, [contenteditable='true']");
    if (!editing) inputRef.current?.focus({ preventScroll: true });
  }, [ready, inputRef]);

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;

    setSubmitted(true);
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <form
      ref={formRef}
      className="hero-chat"
      hidden={!ready}
      inert={!ready}
      data-ready={ready}
      aria-label="Chat with Ben"
      onSubmit={sendMessage}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        ref={inputRef}
        name="message"
        type="text"
        aria-label="Message Ben"
        placeholder="Ask me anything…"
        autoComplete="off"
        maxLength={1000}
        disabled={!ready}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setSubmitted(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault();
        }}
        aria-describedby="hero-chat-status"
      />
      <button type="submit" disabled={!ready || !draft.trim()} aria-label="Send message">
        {/* Lucide arrow-up; attribution in /licenses/lucide.txt. */}
        <svg viewBox="4 4 16 16" fill="none" aria-hidden="true">
          <path d="M12 19V5m-7 7 7-7 7 7" />
        </svg>
      </button>
      <span ref={statusRef} className="hero-chat__status" id="hero-chat-status" role="status">
        {submitted ? "AI replies coming soon." : ""}
      </span>
    </form>
  );
}
