"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Row } from "@plane/ui";
// components
import { ActiveCycleStats } from "@/components/cycles/active-cycle/cycle-stats";
import { ActiveCycleProductivity } from "@/components/cycles/active-cycle/productivity";
import { ActiveCycleProgress } from "@/components/cycles/active-cycle/progress";
import {
  EnhancedCycleHeader,
  EnhancedActiveCycleChart,
  EnhancedCycleMetrics,
} from "@/components/cycles/active-cycle/enhanced-index";
import useCyclesDetails from "@/components/cycles/active-cycle/use-cycles-details";
import { CycleListGroupHeader } from "@/components/cycles/list/cycle-list-group-header";
import { CyclesListItem } from "@/components/cycles/list/cycles-list-item";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import type { ActiveCycleIssueDetails } from "@/store/issue/cycle";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
  showHeader?: boolean;
}

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  const { workspaceSlug, projectId, cycleId: propsCycleId, showHeader = true } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentProjectActiveCycleId } = useCycle();
  // derived values
  const cycleId = propsCycleId ?? currentProjectActiveCycleId;
  const activeCycleResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/cycle/active" });
  // fetch cycle details
  const {
    handleFiltersUpdate,
    cycle: activeCycle,
    cycleIssueDetails,
  } = useCyclesDetails({ workspaceSlug, projectId, cycleId });

  const ActiveCyclesComponent = useMemo(
    () => (
      <>
        {!cycleId || !activeCycle ? (
          <DetailedEmptyState
            title={t("project_cycles.empty_state.active.title")}
            description={t("project_cycles.empty_state.active.description")}
            assetPath={activeCycleResolvedPath}
          />
        ) : (
          <div className="flex flex-col border-b border-custom-border-200">
            <Row className="bg-custom-background-100 pt-6 pb-6 px-6">
              {/* Enhanced Cycle Header */}
              <EnhancedCycleHeader
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                cycle={activeCycle}
              />

              {/* Enhanced Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Metrics Sidebar (1/3 width) */}
                <div className="lg:col-span-1">
                  <EnhancedCycleMetrics
                    cycle={activeCycle}
                    handleFiltersUpdate={handleFiltersUpdate}
                  />
                </div>

                {/* Charts Section (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Burn-down Chart */}
                  <EnhancedActiveCycleChart
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    cycle={activeCycle}
                    plotType="burndown"
                  />

                  {/* Build-up Chart */}
                  <EnhancedActiveCycleChart
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    cycle={activeCycle}
                    plotType="burnup"
                  />
                </div>
              </div>
            </Row>
          </div>
        )}
      </>
    ),
    [cycleId, activeCycle, workspaceSlug, projectId, handleFiltersUpdate, cycleIssueDetails]
  );

  return (
    <>
      {showHeader ? (
        <Disclosure as="div" className="flex flex-shrink-0 flex-col" defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 cursor-pointer">
                <CycleListGroupHeader title={t("project_cycles.active_cycle.label")} type="current" isExpanded={open} />
              </Disclosure.Button>
              <Disclosure.Panel>{ActiveCyclesComponent}</Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ) : (
        <>{ActiveCyclesComponent}</>
      )}
    </>
  );
});
