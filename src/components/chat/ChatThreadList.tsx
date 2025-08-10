import { ChatThread } from "@/hooks/useChatThreads";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  threads: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  counts?: Record<string, number>;
}

export default function ChatThreadList({ threads, activeId, onSelect, counts }: Props) {
  return (
    <aside className="w-full sm:w-72 border-r bg-background">
      <div className="p-3 border-b">
        <h2 className="text-base font-semibold">Messages</h2>
      </div>
      <ul className="divide-y max-h-[calc(100vh-14rem)] overflow-y-auto">
        {threads.map((t) => {
          const unread = counts?.[t.id] || 0;
          return (
            <li key={t.id}>
              <button
                className={cn(
                  "w-full text-left p-3 hover:bg-muted/60 transition",
                  activeId === t.id && "bg-muted"
                )}
                onClick={() => onSelect(t.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium line-clamp-1 flex-1">
                    {t.subject || "Conversation"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {unread > 0 && (
                      <Badge variant="default" className="rounded-full px-2 py-0 text-[10px]">
                        {unread}
                      </Badge>
                    )}
                    {t.last_message_at && (
                      <time className="text-xs text-muted-foreground" dateTime={t.last_message_at}>
                        {new Date(t.last_message_at).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {t.last_message_preview || "No messages yet"}
                </p>
              </button>
            </li>
          );
        })}
        {threads.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">No conversations yet.</li>
        )}
      </ul>
    </aside>
  );
}
