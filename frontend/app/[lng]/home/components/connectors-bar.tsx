"use client";

import * as React from "react";
import {
  Plug,
  Search,
  X,
  Shield,
  Globe,
  Info,
  Check,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  MOCK_CONNECTORS,
  Connector,
  ConnectorType,
  ConnectorIcons,
} from "../model/connectors";

export { type Connector, type ConnectorType }; // Re-export if needed, or just let consumers import from model

export function ConnectorsBar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <div
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors group"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
          <Plug className="size-5" />
          <span className="text-sm">将您的工具连接到 OpenCoWork</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
          {[
            ConnectorIcons.gmail,
            ConnectorIcons.calendar,
            ConnectorIcons.drive,
            ConnectorIcons.slack,
            ConnectorIcons.github,
            ConnectorIcons.notion,
          ].map((Icon, i) => (
            <div
              key={i}
              className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground"
            >
              <Icon className="size-3.5" />
            </div>
          ))}
        </div>
      </div>

      <ConnectorsDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

function ConnectorsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = React.useState<ConnectorType>("app");
  const [selectedConnector, setSelectedConnector] =
    React.useState<Connector | null>(null);

  const filteredConnectors = MOCK_CONNECTORS.filter(
    (c) => c.type === activeTab || (activeTab === "app" && c.type === "app"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 h-[600px] flex flex-col gap-0 bg-[#1e1e1e] border-[#333] text-foreground overflow-hidden">
        {selectedConnector ? (
          <ConnectorDetail
            connector={selectedConnector}
            onBack={() => setSelectedConnector(null)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
              <DialogTitle>连接器</DialogTitle>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Tabs & Search */}
              <div className="px-6 py-4 pb-2">
                <div className="flex items-center justify-between gap-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as ConnectorType)}
                    className="w-auto"
                  >
                    <TabsList className="bg-transparent p-0 h-auto gap-2 justify-start">
                      <TabsTrigger
                        value="app"
                        className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:text-foreground transition-all"
                      >
                        应用
                      </TabsTrigger>
                      <TabsTrigger
                        value="mcp"
                        className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:text-foreground transition-all"
                      >
                        自定义 MCP
                      </TabsTrigger>
                      <TabsTrigger
                        value="skill"
                        className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:text-foreground transition-all"
                      >
                        Skill
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索"
                      className="pl-9 h-9 bg-[#252525] border-[#333] focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <Separator className="bg-[#333]" />

              <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
                <div className="p-6 grid grid-cols-2 gap-4 pb-20">
                  {filteredConnectors.map((connector) => {
                    const isAppAndNotGithub =
                      connector.type === "app" && connector.id !== "github";

                    return (
                      <div
                        key={connector.id}
                        className={cn(
                          "group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300",
                          isAppAndNotGithub
                            ? "border-white/5 bg-white/[0.02] opacity-40 grayscale cursor-not-allowed"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.02] cursor-pointer shadow-lg hover:shadow-primary/5",
                        )}
                        onClick={() => {
                          if (!isAppAndNotGithub) {
                            setSelectedConnector(connector);
                          }
                        }}
                      >
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                          <connector.icon className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                              {connector.title}
                            </div>
                            {isAppAndNotGithub && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 bg-muted/30 border-white/10 text-muted-foreground/60 px-1.5"
                              >
                                开发中
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground/70 line-clamp-2 leading-relaxed">
                            {connector.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConnectorDetail({
  connector,
  onBack,
}: {
  connector: Connector;
  onBack: () => void;
}) {
  const isGithub = connector.id === "github";
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // 模拟连接过程
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
      {/* Header with Back */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1a1a1a]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0 rounded-full hover:bg-white/10"
          >
            <X className="size-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            连接器详情
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Identity & Connection Section - Compact */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-xl shadow-lg transition-all duration-500",
                  isGithub
                    ? "bg-gradient-to-br from-[#333] to-[#000] border border-white/20"
                    : "bg-white/[0.05] border border-white/10",
                  isConnected && "ring-2 ring-green-500/50",
                )}
              >
                <connector.icon
                  className={cn(
                    "size-8 transition-all duration-500",
                    isConnected
                      ? "text-green-500"
                      : isGithub
                        ? "text-white"
                        : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {connector.title}
                  </DialogTitle>
                  {isConnected && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-1.5 py-0 h-4 rounded-full text-[8px] font-bold uppercase">
                      已连接
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs max-w-sm">
                  {connector.description}
                </p>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || isConnected}
              className={cn(
                "h-10 px-6 rounded-full transition-all duration-300 font-bold text-sm",
                isConnected
                  ? "bg-green-500/10 text-green-500 border border-green-500/30"
                  : "bg-white text-black hover:bg-gray-200",
              )}
            >
              {isConnecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isConnected ? (
                <>
                  <Check className="mr-2 size-4" />
                  已启用
                </>
              ) : (
                "立即连接"
              )}
            </Button>
          </div>

          <Separator className="bg-white/5 mb-8" />

          {/* Capabilities Section - 2 columns to save height */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="size-3.5 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
                核心能力
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  title: "自动化流程",
                  desc: "基于事件驱动，触发复杂任务流",
                  icon: Globe,
                },
                {
                  title: "智能协作助手",
                  desc: "AI 深入理解上下文，提供建议",
                  icon: Info,
                },
                {
                  title: "安全管理系统",
                  desc: "采用企业级加密，确保数据安全",
                  icon: Shield,
                },
                {
                  title: "全搜搜索索引",
                  desc: "跨平台查询，毫秒级召回对话",
                  icon: Search,
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-start gap-3"
                >
                  <div className="size-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="size-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm mb-0.5 truncate group-hover:text-primary transition-colors">
                      {f.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground/50 leading-snug line-clamp-2">
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between text-muted-foreground/30">
            <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
              <a
                href={connector.website}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Official Website
              </a>
              <a
                href={connector.privacyPolicy}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Privacy Policy
              </a>
            </div>
            <button className="text-[9px] font-bold uppercase tracking-widest hover:text-foreground">
              Report an issue
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
