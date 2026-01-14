"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/app/i18n/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useAutosizeTextarea } from "../hooks/use-autosize-textarea";
import { useTaskHistory } from "@/hooks/use-task-history";
import { useProjects } from "@/hooks/use-projects";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { HomeHeader } from "./home-header";
import { TaskComposer } from "./task-composer";
import { ConnectorsBar } from "./connectors-bar";
import { chatApi } from "@/lib/api/chat";

import { SettingsDialog } from "@/components/settings/settings-dialog";

export function HomePage() {
  const { t } = useT("translation");
  const router = useRouter();

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const { projects, addProject } = useProjects();
  const { taskHistory, addTask, removeTask, moveTask } = useTaskHistory();

  const [inputValue, setInputValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useAutosizeTextarea(textareaRef, inputValue);

  const handleNewTask = React.useCallback(() => {
    // Navigate to home for new task
    router.push("/");
  }, [router]);

  const handleOpenSettings = React.useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleSendTask = React.useCallback(async () => {
    if (!inputValue.trim()) return;

    console.log("[Home] Sending task:", inputValue);

    try {
      // 1. Call create session API
      const session = await chatApi.createSession(inputValue);
      const sessionId = session.session_id;

      // 2. Save prompt to localStorage for compatibility/fallback
      localStorage.setItem(`session_prompt_${sessionId}`, inputValue);

      // 3. Add to local history (persisted via localStorage in hook)
      addTask(inputValue, {
        id: sessionId,
        timestamp: t("mocks.timestamps.justNow"),
        status: "running",
      });

      console.log("[Home] Navigating to chat session:", sessionId);
      setInputValue("");

      // 4. Navigate to the chat page
      router.push(`/chat/${sessionId}`);
    } catch (error) {
      console.error("[Home] Failed to create session:", error);
    }
  }, [addTask, inputValue, t, router]);

  const handleCreateProject = React.useCallback(
    (name: string) => {
      addProject(name);
    },
    [addProject],
  );

  const handleRenameTask = React.useCallback(
    (taskId: string, newName: string) => {
      // TODO: Implement task rename logic
      console.log("Rename task:", taskId, "to:", newName);
    },
    [],
  );

  const handleMoveTaskToProject = React.useCallback(
    (taskId: string, projectId: string | null) => {
      moveTask(taskId, projectId);
    },
    [moveTask],
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full overflow-hidden bg-background">
        <AppSidebar
          projects={projects}
          taskHistory={taskHistory}
          onNewTask={handleNewTask}
          onDeleteTask={removeTask}
          onRenameTask={handleRenameTask}
          onMoveTaskToProject={handleMoveTaskToProject}
          onCreateProject={handleCreateProject}
          onOpenSettings={handleOpenSettings}
        />

        <SidebarInset className="flex flex-col bg-muted/30">
          <HomeHeader onOpenSettings={handleOpenSettings} />

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
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
              />

              <ConnectorsBar />
            </div>
          </div>
        </SidebarInset>

        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      </div>
    </SidebarProvider>
  );
}
