import { ArrowLeftIcon, MessageSquareIcon, SendIcon } from "lucide-react";
import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { EmptyState, ErrorState, LoadingBlock } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { conversationApi } from "@/lib/api";
import { formatRelative, initials } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation, Message } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The other participant, given the signed-in user's id. */
function otherParticipant(conversation: Conversation, selfId: string) {
  return (
    conversation.participants?.find(
      (participant) => participant._id !== selfId,
    ) ?? conversation.participants?.[0]
  );
}

export function ConversationThread({
  conversationId,
}: {
  conversationId: string;
}) {
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/conversations/${conversationId}/messages`,
    () => conversationApi.messages(conversationId),
  );
  const { data: detail } = useQuery(
    `get|/conversations/${conversationId}`,
    () => conversationApi.detail(conversationId),
  );

  const send = useMutation({
    mutationFn: () => conversationApi.send(conversationId, { body }),
    onSuccess: () => {
      setBody("");
      refetch();
    },
  });

  // Mark the thread read whenever it is opened or a message lands.
  React.useEffect(() => {
    if (!conversationId) return;
    void conversationApi.markRead(conversationId).catch(() => undefined);
  }, [conversationId, data?.messages?.length]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages?.length]);

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  if (error)
    return <ErrorState message={error} onRetry={() => void refetch()} />;

  const messages = data?.messages ?? [];
  const participant = detail?.conversation
    ? otherParticipant(detail.conversation, user?._id ?? "")
    : undefined;

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col gap-4">
      <header className="flex items-center gap-3 border-b pb-4">
        <Link
          to="/messages"
          className="text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <Avatar className="size-9">
          <AvatarFallback className="bg-accent text-accent-foreground text-xs">
            {initials(participant?.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {participant?.email ?? "Conversation"}
          </p>
          {detail?.conversation?.propertyId && (
            <Link
              to={`/properties/${detail.conversation.propertyId}`}
              className="text-primary text-xs hover:underline"
            >
              View the listing
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
        {messages.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((message) => {
            const sender =
              typeof message.senderId === "string"
                ? message.senderId
                : message.senderId._id;
            const mine = sender === user?._id;
            return (
              <MessageBubble
                key={message._id}
                message={message}
                mine={mine}
                author={mine ? undefined : sender}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (body.trim()) send.mutate();
        }}
      >
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a message…"
          rows={2}
          className="resize-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              if (body.trim()) send.mutate();
            }
          }}
        />
        <Button type="submit" disabled={send.isPending || !body.trim()}>
          <SendIcon />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  author,
}: {
  message: Message;
  mine: boolean;
  author?: string;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          mine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm",
        )}
      >
        <p className="whitespace-pre-wrap">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatRelative(message.createdAt)}
          {message.readAt ? " · read" : ""}
        </p>
      </div>
      <span className="sr-only">{author ?? ""}</span>
    </div>
  );
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, error, refetch } = useQuery(
    "get|/conversations",
    () => conversationApi.list(),
  );
  const conversations = data?.conversations ?? [];

  if (id) return <ConversationThread conversationId={id} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
          Messages
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Conversations you are part of, most recent first.
        </p>
      </header>

      {isLoading && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={() => void refetch()} />}

      {!isLoading && !error && conversations.length === 0 && (
        <EmptyState
          icon={MessageSquareIcon}
          title="No conversations yet"
          description="Open a listing and use “Chat with the agent” to start a thread."
          action={
            <Button asChild>
              <Link to="/search">Browse listings</Link>
            </Button>
          }
        />
      )}

      <ul className="space-y-2">
        {conversations.map((conversation) => {
          const participant = otherParticipant(conversation, user?._id ?? "");
          return (
            <li key={conversation._id}>
              <button
                type="button"
                onClick={() => navigate(`/messages/${conversation._id}`)}
                className="bg-card hover:border-primary/30 flex w-full cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-colors"
              >
                <Avatar className="size-10">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                    {initials(participant?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {participant?.email ?? "Conversation"}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {conversation.lastMessage?.body ?? "No messages yet"}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatRelative(conversation.lastMessageAt)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
