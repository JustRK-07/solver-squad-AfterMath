"use client";

import { useEffect, useMemo, useState } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { QuickActions } from "@/components/incident/QuickActions";
import { IncidentForm } from "@/components/incident/IncidentForm";
import { ImpactBar } from "@/components/incident/ImpactBar";
import { IncidentHeader } from "@/components/incident/IncidentHeader";
import { SignalsPanel } from "@/components/incident/SignalsPanel";
import { DeploysPanel } from "@/components/incident/DeploysPanel";
import { MetricsCard } from "@/components/incident/MetricsCard";
import { AgentActivity } from "@/components/agent/AgentActivity";
import { MemoryBank } from "@/components/memory/MemoryBank";
import { RecommendationCard } from "@/components/recommendation/RecommendationCard";
import { WhyMatched } from "@/components/recommendation/WhyMatched";
import { OutcomeForm } from "@/components/outcome/OutcomeForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/shared/Toast";

import { useDiagnosis } from "@/hooks/useDiagnosis";
import { useDemo } from "@/hooks/useDemo";
import { buildFlows } from "@/lib/flows";
import { DEPLOYS, SIGNALS } from "@/lib/mockData";
import { downloadPlay, downloadSignals } from "@/lib/downloads";
import { nowUTC } from "@/lib/utils";
import type { OutcomeReport, Scenario, ScenarioKey } from "@/types/incident";

function AfterMathPage() {
  const diag = useDiagnosis();
  const toast = useToast();
  const { playDemo, demoInProgress, demoLabel } = useDemo(diag);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankSelectedId, setBankSelectedId] = useState<string | null>(null);

  const scenario: Scenario | null = diag.scenario;
  const scenarioKey: ScenarioKey | null = diag.scenarioKey;
  const hasResult = diag.status === "done" && scenario !== null;

  // The flow array — empty when idle, populated after a diagnosis
  const flows = useMemo(() => {
    if (!scenario) return [];
    return buildFlows(scenario, diag.useMemory, diag.service, diag.symptom);
    // re-build when service / symptom / useMemory change (live form edits)
  }, [scenario, diag.useMemory, diag.service, diag.symptom]);

  // signals & deploys come from the picked scenario
  const signals = scenarioKey ? (SIGNALS[scenarioKey] ?? SIGNALS.baseline) : SIGNALS.baseline;
  const deploys = scenarioKey ? (DEPLOYS[scenarioKey] ?? DEPLOYS.baseline) : DEPLOYS.baseline;

  // prefill values for the outcome form
  const defaultFix = scenario?.steps?.[0]?.text ?? scenario?.recommendedFix ?? "";
  const defaultMttr = scenario?.mttr ?? 0;

  // ── handlers ─────────────────────────────────────────────────────
  const onPick = (symptom: string, service: string) => {
    diag.setAll({ symptom, service, useMemory: true });
    void diag.diagnose({ symptom, service, useMemory: true });
  };

  const onSubmitForm = () => {
    void diag.diagnose();
  };

  const onViewDetails = () => {
    setBankSelectedId("INC-231");
    setBankOpen(true);
    toast.show("✓ Opened INC-231 in Memory bank");
  };

  const onNotify = () => {
    toast.show(`✓ Paged @payments-oncall via Slack #incidents — acknowledged in ~30s`);
  };

  const onRecollect = () => {
    toast.show("↻ Recollecting metadata from Hindsight…");
    setTimeout(() => {
      if (diag.scenario) {
        void diag.diagnose();
        toast.show("✓ Metadata refreshed — 4 new signals, 1 new deploy detected");
      }
    }, 700);
  };

  const onDownloadSignals = () => downloadSignals(diag.scenarioKey);
  const onDownloadPlay = () => {
    if (diag.scenario) downloadPlay(diag.scenario);
  };

  const onRecord = async (
    outcome: "success" | "failure",
    fix: string,
    mttrMins: number,
  ) => {
    const report: OutcomeReport = {
      incidentInput: { service: diag.service, symptom: diag.symptom },
      appliedFix: fix,
      outcome,
      mttrMinutes: mttrMins,
    };
    try {
      await fetch("/api/outcome", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcomeReport: report }),
      });
    } catch {
      /* mock fallback */
    }
    toast.show(
      `✓ Outcome recorded (${outcome}, ${mttrMins}m). Next similar incident will recall this.`,
    );
  };

  const onSelectRecall = (id: string) => {
    setBankSelectedId(id);
    setBankOpen(true);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader
        demoLabel={demoLabel}
        demoDisabled={demoInProgress || diag.status === "running"}
        onPlayDemo={playDemo}
      />

      <main className="container py-6 grid gap-3.5">
        {/* chrome — always visible */}
        <QuickActions onPick={onPick} />
        <IncidentForm
          service={diag.service}
          symptom={diag.symptom}
          useMemory={diag.useMemory}
          isRunning={diag.status === "running"}
          onServiceChange={diag.setService}
          onSymptomChange={diag.setSymptom}
          onUseMemoryChange={diag.setUseMemory}
          onSubmit={onSubmitForm}
        />

        {/* impact + incident header — visible once a diagnosis lands */}
        {hasResult && (
          <>
            <ImpactBar mttrMins={scenario!.mttr} />
            <IncidentHeader
              service={diag.service}
              incidentId="INC-231"
              openedAt={nowUTC()}
              severity="P1"
              status="Degraded"
              relatedDeploy={diag.useMemory ? "7f3ac1" : null}
              owner="@payments-oncall"
              visible
              onViewDetails={onViewDetails}
              onNotify={onNotify}
              onRecollect={onRecollect}
            />
          </>
        )}

        {/* signals + deploys + metrics */}
        {hasResult && (
          <>
            <SignalsPanel signals={signals} onDownload={onDownloadSignals} />
            <DeploysPanel deploys={deploys} />
            <MetricsCard
              similarCount={scenario!.retrieved.length}
              topMatchPct={scenario!.retrieved[0]?.sim ?? null}
              mttrMins={scenario!.mttr}
            />
          </>
        )}

        {/* agent + memory bank tabs */}
        {hasResult && (
          <Tabs
            value={bankOpen ? "bank" : "agent"}
            onValueChange={(v) => setBankOpen(v === "bank")}
          >
            <TabsList>
              <TabsTrigger value="agent">Agent activity</TabsTrigger>
              <TabsTrigger value="bank">Memory bank</TabsTrigger>
            </TabsList>
            <TabsContent value="agent" className="mt-2">
              <AgentActivity flows={flows} onSelectRecall={onSelectRecall} />
            </TabsContent>
            <TabsContent value="bank" className="mt-2">
              <MemoryBank
                initialId={bankSelectedId}
                onSelect={(id) => setBankSelectedId(id)}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* recommendation */}
        {hasResult && (
          <RecommendationCard scenario={scenario!} onDownload={onDownloadPlay} />
        )}

        {/* why matched */}
        {hasResult && scenario!.top && (
          <WhyMatched top={scenario!.top} history={scenario!.history} />
        )}

        {/* outcome form — DARC loop closure */}
        {hasResult && (
          <OutcomeForm
            defaultFix={defaultFix}
            defaultMttr={defaultMttr}
            onRecord={onRecord}
          />
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <AfterMathPage />
    </ToastProvider>
  );
}
