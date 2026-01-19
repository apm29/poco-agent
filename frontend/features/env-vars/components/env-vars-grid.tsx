"use client";

import * as React from "react";
import { Loader2, Pencil, Trash2, User, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/client";
import type { EnvVar } from "@/features/env-vars/types";

const EMPTY_ENV_VARS: EnvVar[] = [];

interface EnvVarsGridProps {
  envVars?: EnvVar[];
  savingKey?: string | null;
  onDelete?: (id: number) => void;
  onEdit?: (envVar: EnvVar) => void;
  onOverrideSystem?: (key: string) => void;
}

function EnvVarsSection({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80 px-1">
        {icon}
        <span>{title}</span>
      </div>
      {hint ? (
        <p className="px-1 text-xs text-muted-foreground/80">{hint}</p>
      ) : null}
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function EnvVarsGrid({
  envVars: propEnvVars,
  savingKey,
  onDelete,
  onEdit,
  onOverrideSystem,
}: EnvVarsGridProps) {
  const { t } = useT("translation");
  const vars = propEnvVars?.length ? propEnvVars : EMPTY_ENV_VARS;

  const systemVars = React.useMemo(
    () => vars.filter((v) => v.scope === "system"),
    [vars],
  );
  const userVars = React.useMemo(
    () => vars.filter((v) => v.scope === "user"),
    [vars],
  );

  const systemKeys = React.useMemo(
    () => new Set(systemVars.map((v) => v.key)),
    [systemVars],
  );
  const userKeys = React.useMemo(
    () => new Set(userVars.map((v) => v.key)),
    [userVars],
  );

  if (!vars.length) {
    return (
      <div className="text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg p-6 text-center">
        {t("library.envVars.empty", "暂未配置任何环境变量")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {systemVars.length > 0 && (
        <EnvVarsSection
          title={t("library.envVars.scope.system", "系统")}
          icon={<Wrench className="size-4" />}
          hint={t(
            "library.envVars.systemHint",
            "系统变量仅展示是否已设置；可通过创建同名个人变量来覆盖",
          )}
        >
          {systemVars.map((envVar) => {
            const isOverridden = userKeys.has(envVar.key);
            const isBusy = savingKey === envVar.key;
            return (
              <div
                key={envVar.id}
                className="flex flex-col gap-2 rounded-lg border border-border/50 bg-background p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{envVar.key}</span>
                    <Badge variant="outline" className="text-xs">
                      {t("library.envVars.scope.system", "系统")}
                    </Badge>
                    <Badge
                      variant={envVar.is_set ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {envVar.is_set
                        ? t("library.envVars.status.set", "已设置")
                        : t("library.envVars.status.unset", "未设置")}
                    </Badge>
                    {isOverridden && (
                      <Badge variant="secondary" className="text-xs">
                        {t("library.envVars.status.overridden", "已被个人覆盖")}
                      </Badge>
                    )}
                  </div>
                  {envVar.description && (
                    <p className="mt-1 text-xs text-muted-foreground break-words">
                      {envVar.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => onOverrideSystem?.(envVar.key)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <User className="size-4" />
                    )}
                    {isOverridden
                      ? t("library.envVars.actions.editOverride", "更新个人值")
                      : t("library.envVars.actions.override", "覆盖")}
                  </Button>
                </div>
              </div>
            );
          })}
        </EnvVarsSection>
      )}

      {userVars.length > 0 && (
        <EnvVarsSection
          title={t("library.envVars.scope.user", "个人")}
          icon={<User className="size-4" />}
          hint={t(
            "library.envVars.userHint",
            "个人变量不会在前端展示明文；更新时请输入新值（留空表示不修改）",
          )}
        >
          {userVars.map((envVar) => {
            const overridesSystem = systemKeys.has(envVar.key);
            const isBusy = savingKey === envVar.key;
            return (
              <div
                key={envVar.id}
                className="flex flex-col gap-2 rounded-lg border border-border/50 bg-background p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{envVar.key}</span>
                    <Badge variant="outline" className="text-xs">
                      {t("library.envVars.scope.user", "个人")}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {t("library.envVars.status.set", "已设置")}
                    </Badge>
                    {overridesSystem && (
                      <Badge variant="secondary" className="text-xs">
                        {t(
                          "library.envVars.status.overridesSystem",
                          "覆盖系统",
                        )}
                      </Badge>
                    )}
                  </div>
                  {envVar.description && (
                    <p className="mt-1 text-xs text-muted-foreground break-words">
                      {envVar.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => onEdit?.(envVar)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Pencil className="size-4" />
                    )}
                    {t("library.envVars.actions.edit", "更新")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete?.(envVar.id)}
                    title={t("common.delete", "删除")}
                    disabled={isBusy}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </EnvVarsSection>
      )}
    </div>
  );
}
