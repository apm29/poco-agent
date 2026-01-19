"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MoreHorizontal,
  PenSquare,
  Share2,
  Trash2,
} from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { ProjectItem } from "@/features/projects/types";
import { RenameProjectDialog } from "@/features/projects/components/rename-project-dialog";
import { useAppShell } from "@/components/shared/app-shell-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectHeaderProps {
  project?: ProjectItem;
  onRenameProject?: (projectId: string, name: string) => void;
  onDeleteProject?: (projectId: string) => Promise<void> | void;
}

export function ProjectHeader({
  project,
  onRenameProject,
  onDeleteProject,
}: ProjectHeaderProps) {
  const { t } = useT("translation");
  const router = useRouter();
  const { lng } = useAppShell();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleGoBack = React.useCallback(() => {
    router.push(`/${lng}/home`);
  }, [router, lng]);

  const handleRename = React.useCallback(
    (newName: string) => {
      if (!project) return;
      onRenameProject?.(project.id, newName);
    },
    [onRenameProject, project],
  );

  const handleDelete = React.useCallback(async () => {
    if (!project || !onDeleteProject) return;
    try {
      setIsDeleting(true);
      await onDeleteProject(project.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [onDeleteProject, project]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="size-8 text-muted-foreground hover:bg-sidebar-accent"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-2 h-4" />

        <div className="flex flex-1 items-center gap-2">
          <span className="text-base">{project?.icon || "📁"}</span>
          <span className="text-sm font-medium">{project?.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:bg-sidebar-accent"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right">
              <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
                <PenSquare className="size-4" />
                <span>{t("project.rename")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="size-4" />
                <span>{t("project.share")}</span>
              </DropdownMenuItem>
              {onDeleteProject && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    <span>{t("project.delete")}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <RenameProjectDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        projectName={project?.name ?? ""}
        onRename={handleRename}
      />
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("project.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("project.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("project.deleteConfirm", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
