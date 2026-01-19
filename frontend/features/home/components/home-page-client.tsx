"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/client";

import { useAutosizeTextarea } from "../hooks/use-autosize-textarea";

import { HomeHeader } from "./home-header";
import { TaskComposer } from "./task-composer";
import { ConnectorsBar } from "./connectors-bar";
import { createSessionAction } from "@/features/chat/actions/session-actions";
import type { InputFile } from "@/features/chat/types/api/session";

import { useAppShell } from "@/components/shared/app-shell-context";

export function HomePageClient() {
  const { t } = useT("translation");
  const router = useRouter();
  const { lng, addTask, openSettings } = useAppShell();

  const [inputValue, setInputValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useAutosizeTextarea(textareaRef, inputValue);

  const handleSendTask = React.useCallback(
    async (files?: InputFile[]) => {
      const inputFiles = files ?? [];
      if (
        (inputValue.trim() === "" && inputFiles.length === 0) ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(true);
      console.log("[Home] Sending task:", inputValue);

      try {
        // 1. Call create session API
        const session = await createSessionAction({
          prompt: inputValue,
          config:
            inputFiles.length > 0 ? { input_files: inputFiles } : undefined,
        });
        console.log("session", session);
        const sessionId = session.sessionId;
        console.log("sessionId", sessionId);

        // 2. Save prompt to localStorage for compatibility/fallback
        localStorage.setItem(`session_prompt_${sessionId}`, inputValue);

        // 3. Add to local history (persisted via localStorage in hook)
        addTask(inputValue, {
          id: sessionId,
          timestamp: new Date().toISOString(),
          status: "running",
        });

        console.log("[Home] Navigating to chat session:", sessionId);
        setInputValue("");

        // 4. Navigate to the chat page
        router.push(`/${lng}/chat/${sessionId}`);
      } catch (error) {
        console.error("[Home] Failed to create session:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [addTask, inputValue, isSubmitting, lng, router],
  );

  return (
    <>
      <HomeHeader onOpenSettings={openSettings} />

      <div className="flex flex-1 flex-col items-center justify-start px-6 pt-[20vh]">
        <div className="w-full max-w-2xl">
          {/* 欢迎语 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              {t("hero.title")}
            </h1>
          </div>

          <TaskComposer
            textareaRef={textareaRef}
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendTask}
            isSubmitting={isSubmitting}
          />

          <ConnectorsBar />
        </div>
      </div>
    </>
  );
}
