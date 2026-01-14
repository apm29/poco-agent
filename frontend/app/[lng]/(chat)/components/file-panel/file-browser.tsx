"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Folder,
  FileText,
  FileCode,
  FileImage,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  PanelRightOpen,
} from "lucide-react";
import type { FileNode } from "@/lib/api-types";

interface FileBrowserProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
}

function FileTreeItem({
  node,
  onSelect,
  selectedId,
  level = 0,
}: {
  node: FileNode;
  onSelect: (file: FileNode) => void;
  selectedId?: string;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(level === 0);

  const getFileIcon = (name: string, type: string) => {
    if (type === "folder") {
      return <Folder className="size-4 text-blue-500" />;
    }

    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
      case "docx":
      case "doc":
        return <FileText className="size-4 text-red-500" />;
      case "xlsx":
      case "xls":
        return <FileText className="size-4 text-green-600" />;
      case "html":
      case "ts":
      case "tsx":
      case "js":
      case "jsx":
        return <FileCode className="size-4 text-blue-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImage className="size-4 text-purple-500" />;
      default:
        return <FileIcon className="size-4 text-muted-foreground" />;
    }
  };

  const handleClick = () => {
    if (node.type === "folder") {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
          selectedId === node.id ? "bg-muted" : ""
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "folder" && (
          <span className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="size-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 text-muted-foreground" />
            )}
          </span>
        )}
        {getFileIcon(node.name, node.type)}
        <span className="text-sm truncate flex-1">{node.name}</span>
      </div>
      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileBrowser({
  files,
  onFileSelect,
  selectedFile,
}: FileBrowserProps) {
  const [open, setOpen] = React.useState(false);

  const handleFileSelect = (file: FileNode) => {
    onFileSelect(file);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-muted"
          title="文件浏览器"
        >
          <PanelRightOpen className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="text-base font-semibold">
            工作区文件
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-4 py-4">
            {files.map((file) => (
              <FileTreeItem
                key={file.id}
                node={file}
                onSelect={handleFileSelect}
                selectedId={selectedFile?.id}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
