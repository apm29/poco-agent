"use client";

import { useState, useMemo } from "react";

import { McpHeader } from "@/features/mcp/components/mcp-header";
import { McpGrid } from "@/features/mcp/components/mcp-grid";
import { McpSettingsDialog } from "@/features/mcp/components/mcp-settings-dialog";
import type { McpPreset, UserMcpConfig } from "@/features/mcp/types";

interface McpPageClientProps {
  initialPresets?: McpPreset[];
  initialConfigs?: UserMcpConfig[];
}

export function McpPageClient({
  initialPresets = [],
  initialConfigs = [],
}: McpPageClientProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<McpPreset | null>(null);

  // State for presets and configs
  const [presets] = useState<McpPreset[]>(initialPresets);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [configs, _setConfigs] = useState<UserMcpConfig[]>(initialConfigs);

  // TODO: Connect to real API
  const handleAddConfig = async (presetId: number) => {
    setLoadingId(presetId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Add config for preset:", presetId);
    setLoadingId(null);
  };

  const handleToggleConfig = async (configId: number, enabled: boolean) => {
    setLoadingId(configId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 500));
    console.log("Toggle config:", configId, "enabled:", enabled);
    setLoadingId(null);
  };

  const handleEditConfig = (configId: number, preset: McpPreset) => {
    console.log("Edit config:", configId, "preset:", preset);
    setSelectedPreset(preset);
  };

  const handleDeleteConfig = async (configId: number) => {
    setLoadingId(configId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Delete config:", configId);
    setLoadingId(null);
  };

  // For backward compatibility with McpSettingsDialog
  const activeItem = useMemo(() => {
    if (!selectedPreset) return null;
    const config = configs.find((c) => c.preset_id === selectedPreset.id);
    return { preset: selectedPreset, config: config || undefined };
  }, [selectedPreset, configs]);

  return (
    <>
      <McpHeader />

      <div className="flex flex-1 flex-col px-6 py-6 overflow-auto">
        <div className="w-full max-w-4xl mx-auto">
          <McpGrid
            presets={presets}
            configs={configs}
            loadingId={loadingId}
            onAddConfig={handleAddConfig}
            onToggleConfig={handleToggleConfig}
            onEditConfig={handleEditConfig}
            onDeleteConfig={handleDeleteConfig}
          />
        </div>
      </div>

      {activeItem && (
        <McpSettingsDialog
          item={activeItem}
          open={Boolean(activeItem)}
          onClose={() => setSelectedPreset(null)}
          onTogglePreset={(presetId) => {
            const config = configs.find((c) => c.preset_id === presetId);
            if (config) {
              handleToggleConfig(config.id, !config.enabled);
            }
          }}
          envVars={[]}
          savingEnvKey={null}
          onSaveEnvVar={async () => {}}
          loadingPresetId={loadingId}
        />
      )}
    </>
  );
}
