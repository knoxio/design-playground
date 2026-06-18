import { MessageSquare } from "@helix/ui/icons";
import { glass } from "./glass";

/**
 * The comments toggle shared by the internal Dock and the client toolbar, so
 * the two surfaces can't drift. Glass pill with an open-thread count badge.
 */
export function CommentsButton({
  commentsActive,
  openCommentCount,
  onToggle,
}: {
  commentsActive: boolean;
  openCommentCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={commentsActive ? "Exit comments (Esc)" : "Comments (i)"}
      aria-pressed={commentsActive}
      title="Comments — click any element or the page and discuss it (i)"
      onClick={onToggle}
      className={`relative z-20 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150 hover:scale-105 active:scale-95 ${glass} ${
        commentsActive ? "bg-primary text-primary-foreground" : "hover:bg-background/90"
      }`}
    >
      <MessageSquare className="h-4 w-4" />
      {openCommentCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-accent-foreground">
          {openCommentCount}
        </span>
      ) : null}
    </button>
  );
}
