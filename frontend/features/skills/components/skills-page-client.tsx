"use client";

import { useState } from "react";

import { SkillsHeader } from "@/features/skills/components/skills-header";
import { SkillsGrid } from "@/features/skills/components/skills-grid";

import type { SkillPreset, UserSkillInstall } from "@/features/skills/types";

interface SkillsPageClientProps {
  initialPresets?: SkillPreset[];
  initialInstalls?: UserSkillInstall[];
}

export function SkillsPageClient({
  initialPresets = [],
  initialInstalls = [],
}: SkillsPageClientProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // State for presets and installs
  const [presets] = useState<SkillPreset[]>(initialPresets);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [installs, _setInstalls] =
    useState<UserSkillInstall[]>(initialInstalls);

  // TODO: Connect to real API
  const handleInstall = async (presetId: number) => {
    setLoadingId(presetId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Install preset:", presetId);
    setLoadingId(null);
  };

  const handleUninstall = async (installId: number) => {
    setLoadingId(installId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Uninstall:", installId);
    setLoadingId(null);
  };

  const handleUpdate = async (installId: number) => {
    setLoadingId(installId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Update install:", installId);
    setLoadingId(null);
  };

  const handleUploadToPreset = async (installId: number) => {
    setLoadingId(installId);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Upload to preset:", installId);
    setLoadingId(null);
  };

  return (
    <>
      <SkillsHeader />

      <div className="flex flex-1 flex-col px-6 py-6 overflow-auto">
        <div className="w-full max-w-4xl mx-auto">
          <SkillsGrid
            presets={presets}
            installs={installs}
            loadingId={loadingId}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onUpdate={handleUpdate}
            onUploadToPreset={handleUploadToPreset}
          />
        </div>
      </div>
    </>
  );
}
