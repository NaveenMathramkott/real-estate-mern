import { CheckCheckIcon, MessagesSquareIcon, SendIcon } from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { queryStore } from "@/lib/query-store";
import { conversationApi } from "@/lib/api";
import { formatRelative, initials } from "@/lib/format";
import type { Conversation, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { pickList } from "@/lib/safe";
import { useAuthStore } from "@/store/auth-store";

export default function ConversationsPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  const list = useQuery<{ conversations: Conversation[] }>(
    "get|/conversations|",
    conversationApi.list,
  );
  const conversations = React.useMemo(
    () => pickList<Conversation>(list.data, "conversations"),
    [list.data],
  );
  const activeId = selectedId ?? conversations[0]?._id ?? null;

  const thread = useQuery<{ messages: Message[] }>(
    activeId ? `get|/conversations/${activeId}/messages|` : null,
    () => conversationApi.messages(activeId!),
    { enabled: Boolean(activeId) },
  );

  const send = useMutation({
    mutationFn: (body: string) => conversationApi.send(activeId!, { body }),
    successMessage: "Message sent",
    onSuccess: () => {
      setDraft("");
      void thread.refetch();
    },
    invalidate: () => queryStore.invalidate("get|/conversations"),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => conversationApi.markRead(id),
    onSuccess: () => queryStore.invalidate("get|/conversations"),
  });

  const active = conversations.find((c) => c._id === activeId);

  const otherParticipant = (conversation?: Conversation) =>
    conversation?.participants.find((p) => p._id !== currentUser?._id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description="Threads between buyers and agents. Realtime delivery shares one path with REST."
      />

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : list.isLoading && !list.data ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Panel title="Threads">
            {conversations.length === 0 ? (
              <EmptyState
                icon={MessagesSquareIcon}
                title="No conversations yet"
              />
            ) : (
              <ul className="max-h-[560px] overflow-y-auto">
                {conversations.map((conversation) => {
                  const person = otherParticipant(conversation);
                  return (
                    <li key={conversation._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(conversation._id);
                          void markRead.mutate(conversation._id);
                        }}
                        className={cn(
                          "hover:bg-accent/50 flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left transition-colors",
                          conversation._id === activeId && "bg-accent",
                        )}
                      >
                        <Avatar className="size-9">
                          <AvatarFallback>
                            {initials(person?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {person?.email ?? "Conversation"}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {conversation.lastMessage?.body ??
                              "No messages yet"}
                          </p>
                        </div>
                        <span className="text-muted-foreground shrink-0 text-[11px]">
                          {formatRelative(conversation.lastMessageAt)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title={otherParticipant(active)?.email ?? "Conversation"}
            description={
              active
                ? `Last activity ${formatRelative(active.lastMessageAt)}`
                : undefined
            }
            action={
              <Badge variant="outline">
                Only participants can read this thread
              </Badge>
            }
            contentClassName="flex flex-col"
          >
            {!active ? (
              <EmptyState
                icon={MessagesSquareIcon}
                title="Select a thread"
                description="Pick a conversation from the list to read its history."
              />
            ) : thread.isLoading && !thread.data ? (
              <LoadingBlock />
            ) : (
              <>
                <ScrollArea className="h-[380px]">
                  <ul className="space-y-3 p-5">
                    {pickList<Message>(thread.data, "messages").map(
                      (message) => {
                        const mine = message.senderId === currentUser?._id;
                        return (
                          <li
                            key={message._id}
                            className={cn(
                              "flex",
                              mine ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] rounded-xl px-3.5 py-2 text-sm shadow-xs",
                                mine
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted",
                              )}
                            >
                              <p className="leading-relaxed">{message.body}</p>
                              <p
                                className={cn(
                                  "mt-1 flex items-center justify-end gap-1 text-[11px]",
                                  mine
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground",
                                )}
                              >
                                {formatRelative(message.createdAt)}
                                {mine && message.readAt && (
                                  <CheckCheckIcon className="size-3" />
                                )}
                              </p>
                            </div>
                          </li>
                        );
                      },
                    )}
                  </ul>
                </ScrollArea>

                <form
                  className="flex items-center gap-2 border-t p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (draft.trim()) send.mutate(draft.trim());
                  }}
                >
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a message…"
                    disabled={send.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={send.isPending || !draft.trim()}
                  >
                    <SendIcon className="size-4" />
                    Send
                  </Button>
                </form>
              </>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
