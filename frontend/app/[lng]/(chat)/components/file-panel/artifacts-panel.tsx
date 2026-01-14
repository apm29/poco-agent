"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Artifact, ArtifactType } from "@/lib/api-types";
import {
  FileText,
  Code,
  Image,
  FileJson,
  File,
  Presentation,
  FileCode,
  Layers,
  PanelRight,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileSidebar } from "./file-sidebar";
import type { FileNode } from "@/lib/api-types";
import { DocumentViewer } from "./document-viewer";

import { chatApi } from "@/lib/api/chat";

interface ArtifactsPanelProps {
  artifacts?: Artifact[];
  sessionId?: string;
}

export function ArtifactsPanel({
  artifacts = [],
  sessionId,
}: ArtifactsPanelProps) {
  const [files, setFiles] = React.useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<
    FileNode | undefined
  >();
  const [viewMode, setViewMode] = React.useState<"artifacts" | "document">(
    "artifacts",
  );
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // 当侧边栏开关时，同步切换视图模式
  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      // 如果是打开侧边栏，切换到文档预览模式
      // 如果是关闭侧边栏，切回执行产物列表模式
      setViewMode(next ? "document" : "artifacts");
      if (!next) setSelectedFile(undefined); // 关闭时清空选择
      return next;
    });
  }, []);

  // Fetch file list from API
  React.useEffect(() => {
    const fetchFiles = async () => {
      try {
        const data = await chatApi.getFiles(sessionId);
        setFiles(data);
      } catch (error) {
        console.error("Failed to fetch workspace files:", error);
      }
    };
    fetchFiles();
  }, [sessionId]);

  const getArtifactConfig = (type: ArtifactType) => {
    switch (type) {
      case "text":
        return {
          icon: FileText,
          label: "文本",
          color: "text-foreground/80 bg-muted",
        };
      case "code_diff":
        return {
          icon: Code,
          label: "代码",
          color: "text-foreground/80 bg-muted",
        };
      case "image":
        return {
          icon: Image,
          label: "图片",
          color: "text-foreground/80 bg-muted",
        };
      case "ppt":
        return {
          icon: Presentation,
          label: "演示文稿",
          color: "text-foreground/80 bg-muted",
        };
      case "pdf":
        return {
          icon: File,
          label: "PDF",
          color: "text-foreground/80 bg-muted",
        };
      case "markdown":
        return {
          icon: FileCode,
          label: "Markdown",
          color: "text-foreground/80 bg-muted",
        };
      case "json":
        return {
          icon: FileJson,
          label: "JSON",
          color: "text-foreground/80 bg-muted",
        };
      default:
        return {
          icon: File,
          label: "文件",
          color: "text-muted-foreground bg-muted",
        };
    }
  };

  const renderArtifactContent = (artifact: Artifact) => {
    switch (artifact.type) {
      case "image":
        return (
          <div className="mt-3 rounded-lg overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artifact.url}
              alt={artifact.title}
              className="w-full h-auto"
            />
          </div>
        );

      case "code_diff":
        return (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {artifact.content}
            </pre>
          </div>
        );

      case "text":
      case "markdown":
      case "json":
        return (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
            <pre className="text-xs whitespace-pre-wrap break-words">
              {artifact.content}
            </pre>
          </div>
        );

      case "ppt":
      case "pdf":
        return (
          <div className="mt-3 p-4 rounded-lg border border-border bg-muted/30 text-center">
            <File className="size-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">点击预览文件</p>
            {artifact.metadata?.size && (
              <p className="text-xs text-muted-foreground mt-1">
                {(artifact.metadata.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handleFileSelect = React.useCallback((file: FileNode) => {
    setSelectedFile(file);
    setViewMode("document");
  }, []);

  // Document viewer mode with file sidebar
  if (viewMode === "document") {
    return (
      <div className="flex h-full">
        {/* Document Viewer */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-6 py-4 border-b border-border bg-card shrink-0 min-h-[85px] flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <Layers className="size-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground truncate">
                  {selectedFile?.name || "文档预览"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  工作区文件预览
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg hover:bg-muted"
                onClick={toggleSidebar}
                title={isSidebarOpen ? "隐藏文件列表" : "显示文件列表"}
              >
                {isSidebarOpen ? (
                  <PanelRightClose className="size-4" />
                ) : (
                  <PanelRight className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex relative">
            <div className="flex-1 min-h-0">
              <DocumentViewer file={selectedFile} />
            </div>
            {/* File Sidebar - positioned on the right */}
            {isSidebarOpen && (
              <div className="relative z-10 animate-in slide-in-from-right duration-300 shadow-lg">
                <FileSidebar
                  files={files}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  isOpen={isSidebarOpen}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Artifacts mode - show artifacts list with file sidebar
  if (artifacts.length === 0) {
    return (
      <div className="flex h-full">
        {/* Empty state */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-6 py-4 border-b border-border bg-card shrink-0 min-h-[85px] flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                <Layers className="size-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  执行产物
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  AI 生成的各种产出（代码、文档、图片等）
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg hover:bg-muted"
                onClick={toggleSidebar}
                title={isSidebarOpen ? "隐藏文件列表" : "显示文件列表"}
              >
                {isSidebarOpen ? (
                  <PanelRightClose className="size-4" />
                ) : (
                  <PanelRight className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex relative">
            <div className="flex items-center justify-center flex-1">
              <div className="text-center text-muted-foreground">
                <File className="size-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无产出</p>
                <p className="text-xs mt-1">AI 执行结果将在此处展示</p>
              </div>
            </div>
            {/* File Sidebar - positioned on the right */}
            {isSidebarOpen && (
              <div className="relative z-10 animate-in slide-in-from-right duration-300 shadow-lg">
                <FileSidebar
                  files={files}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  isOpen={isSidebarOpen}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Artifacts List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border bg-card shrink-0 min-h-[85px] flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
              <Layers className="size-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">
                执行产物
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                AI 生成的各种产出（代码、文档、图片等）
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-muted"
              onClick={toggleSidebar}
              title={isSidebarOpen ? "隐藏文件列表" : "显示文件列表"}
            >
              {isSidebarOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRight className="size-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex relative">
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-4 space-y-4">
              {artifacts.map((artifact) => {
                const config = getArtifactConfig(artifact.type);
                const Icon = config.icon;

                return (
                  <div
                    key={artifact.id}
                    className="rounded-lg border border-border bg-card overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                      <Icon className="size-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {artifact.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(artifact.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        className={`text-xs ${config.color}`}
                        variant="outline"
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <div className="p-3">{renderArtifactContent(artifact)}</div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* File Sidebar - positioned on the right, inside ScrollArea container */}
          {isSidebarOpen && (
            <div className="relative z-10 animate-in slide-in-from-right duration-300 shadow-lg">
              <FileSidebar
                files={files}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                isOpen={isSidebarOpen}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
