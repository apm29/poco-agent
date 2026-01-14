"use client";

import * as React from "react";
import { Bot, Copy, ThumbsUp } from "lucide-react";
import { MessageContent } from "./message-content";
import { TypingIndicator } from "./typing-indicator";
import type { ChatMessage } from "@/lib/api-types";
import { Button } from "@/components/ui/button";

interface AssistantMessageProps {
  message: ChatMessage;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="flex w-full gap-4 group animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Avatar Section */}
      <div className="flex-shrink-0 mt-1">
        <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center">
          <Bot className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground/50 tracking-wide uppercase">
            COCO
          </span>
          <span className="text-[10px] text-muted-foreground/40">
            {new Date(message.timestamp || "").toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="text-foreground leading-relaxed text-sm">
          <MessageContent content={message.content} />
          {message.status === "streaming" && <TypingIndicator />}
        </div>

        {/* Action Buttons - Visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <ThumbsUp className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
