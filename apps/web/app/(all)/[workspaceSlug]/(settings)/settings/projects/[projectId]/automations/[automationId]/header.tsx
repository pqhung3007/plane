"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Zap } from "lucide-react";
import { Breadcrumbs, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
import type { ICustomSearchSelectOption, TProjectAutomation } from "@plane/types";
// components
import { SwitcherLabel } from "@/components/common/switcher-label";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  automations: TProjectAutomation[];
  currentAutomation: TProjectAutomation;
};

export const AutomationDetailHeader: React.FC<Props> = observer(({ automations, currentAutomation }) => {
  const router = useAppRouter();
  const { workspaceSlug, projectId, automationId } = useParams();

  const switcherOptions = useMemo(
    () =>
      automations.map((automation) => ({
        value: automation.id,
        query: automation.name,
        content: <SwitcherLabel name={automation.name} LabelIcon={() => <Zap className="h-3 w-3" />} />,
      })) as ICustomSearchSelectOption[],
    [automations]
  );

  return (
    <div className="border-b border-custom-border-200 px-5 py-4">
      <Breadcrumbs onBack={router.back}>
        <Breadcrumbs.Item
          component={
            <div className="flex items-center gap-2 px-1.5 py-1">
              <span className="text-sm font-medium text-custom-text-300">Settings</span>
            </div>
          }
        />
        <Breadcrumbs.Item
          component={
            <div className="flex items-center gap-2 px-1.5 py-1">
              <span className="text-sm font-medium text-custom-text-300">Automations</span>
            </div>
          }
        />
        <Breadcrumbs.Item
          component={
            <BreadcrumbNavigationSearchDropdown
              selectedItem={automationId?.toString() ?? ""}
              navigationItems={switcherOptions}
              onChange={(value: string) => {
                router.push(`/${workspaceSlug}/settings/projects/${projectId}/automations/${value}`);
              }}
              title={currentAutomation?.name}
              icon={
                <Breadcrumbs.Icon>
                  <Zap className="size-4 flex-shrink-0 text-custom-text-300" />
                </Breadcrumbs.Icon>
              }
              isLast
            />
          }
          isLast
        />
      </Breadcrumbs>
    </div>
  );
});
