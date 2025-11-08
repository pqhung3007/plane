# Subscription Frontend Implementation

## Overview

This guide covers the frontend implementation of the subscription system, building on Plane's existing MobX state management and React component architecture.

---

## Table of Contents

1. [MobX Store](#mobx-store)
2. [Services](#services)
3. [Custom Hooks](#custom-hooks)
4. [Components](#components)
5. [Feature Gates](#feature-gates)
6. [Usage Indicators](#usage-indicators)
7. [Upgrade Flows](#upgrade-flows)

---

## MobX Store

### Subscription Store

```typescript
// apps/web/core/store/subscription/subscription.store.ts

import { action, makeObservable, observable, computed, runInAction } from "mobx";
import type { RootStore } from "@/plane-web/store/root.store";
import type { TSubscription, TPlan, TFeatureEntitlements, TUsageMetrics } from "@plane/types";
import { SubscriptionService } from "@/services/subscription.service";

export interface ISubscriptionStore {
  // Observables
  subscription: TSubscription | null;
  plans: TPlan[];
  usage: TUsageMetrics | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  currentPlan: TPlan | null;
  features: TFeatureEntitlements;
  isFreePlan: boolean;
  isPaidPlan: boolean;
  isTrialing: boolean;

  // Actions
  fetchSubscription: (workspaceId: string) => Promise<void>;
  fetchPlans: () => Promise<void>;
  hasFeature: (featureKey: string) => boolean;
  checkLimit: (resourceType: string) => Promise<TLimitCheck>;
  upgradePlan: (planId: string, paymentMethodId?: string) => Promise<void>;
  cancelSubscription: (reason?: string) => Promise<void>;
}

export class SubscriptionStore implements ISubscriptionStore {
  subscription: TSubscription | null = null;
  plans: TPlan[] = [];
  usage: TUsageMetrics | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  rootStore: RootStore;
  subscriptionService: SubscriptionService;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      // Observables
      subscription: observable,
      plans: observable,
      usage: observable,
      isLoading: observable,
      error: observable,

      // Computed
      currentPlan: computed,
      features: computed,
      isFreePlan: computed,
      isPaidPlan: computed,
      isTrialing: computed,

      // Actions
      fetchSubscription: action,
      fetchPlans: action,
      upgradePlan: action,
      cancelSubscription: action,
    });

    this.rootStore = rootStore;
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Computed: Get current plan details
   */
  get currentPlan(): TPlan | null {
    return this.subscription?.plan || null;
  }

  /**
   * Computed: Get feature entitlements
   */
  get features(): TFeatureEntitlements {
    return this.subscription?.features || {};
  }

  /**
   * Computed: Check if on free plan
   */
  get isFreePlan(): boolean {
    return this.currentPlan?.plan_type === 'free';
  }

  /**
   * Computed: Check if on paid plan
   */
  get isPaidPlan(): boolean {
    return this.currentPlan?.plan_type !== 'free';
  }

  /**
   * Computed: Check if in trial period
   */
  get isTrialing(): boolean {
    return this.subscription?.status === 'trialing';
  }

  /**
   * Fetch current workspace subscription
   */
  fetchSubscription = async (workspaceSlug: string): Promise<void> => {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await this.subscriptionService.getSubscription(workspaceSlug);

      runInAction(() => {
        this.subscription = data.subscription;
        this.usage = data.usage;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Fetch available plans
   */
  fetchPlans = async (): Promise<void> => {
    try {
      const data = await this.subscriptionService.getPlans();

      runInAction(() => {
        this.plans = data.plans;
      });
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      throw error;
    }
  };

  /**
   * Check if current plan has a feature
   */
  hasFeature = (featureKey: string): boolean => {
    const featureValue = this.features[featureKey];

    // Boolean features
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }

    // Limit features (any positive value means enabled)
    if (typeof featureValue === 'number') {
      return featureValue !== 0;
    }

    return false;
  };

  /**
   * Check if within resource limits
   */
  checkLimit = async (resourceType: string): Promise<TLimitCheck> => {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug) {
      throw new Error("No workspace selected");
    }

    const result = await this.subscriptionService.checkLimit(workspaceSlug, resourceType);
    return result;
  };

  /**
   * Upgrade to a new plan
   */
  upgradePlan = async (planId: string, paymentMethodId?: string): Promise<void> => {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug) {
      throw new Error("No workspace selected");
    }

    this.isLoading = true;
    this.error = null;

    try {
      const data = await this.subscriptionService.upgradePlan(
        workspaceSlug,
        planId,
        paymentMethodId
      );

      runInAction(() => {
        this.subscription = data.subscription;
        this.isLoading = false;
      });

      // Refresh usage after upgrade
      await this.fetchSubscription(workspaceSlug);
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Cancel subscription at period end
   */
  cancelSubscription = async (reason?: string): Promise<void> => {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug) {
      throw new Error("No workspace selected");
    }

    this.isLoading = true;
    this.error = null;

    try {
      const data = await this.subscriptionService.cancelSubscription(workspaceSlug, reason);

      runInAction(() => {
        this.subscription = data.subscription;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
      throw error;
    }
  };
}
```

### Add to Root Store

```typescript
// apps/web/ce/store/root.store.ts

import { CoreRootStore } from "@/store/root.store";
import type { ITimelineStore } from "./timeline";
import { TimeLineStore } from "./timeline";
import type { ISubscriptionStore } from "./subscription";
import { SubscriptionStore } from "./subscription";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;
  subscription: ISubscriptionStore;

  constructor() {
    super();

    this.timelineStore = new TimeLineStore(this);
    this.subscription = new SubscriptionStore(this);
  }
}
```

---

## Services

### Subscription Service

```typescript
// apps/web/core/services/subscription.service.ts

import { APIService } from "@/services/api.service";
import type {
  TSubscription,
  TPlan,
  TFeatureCheck,
  TLimitCheck,
  TUsageMetrics,
} from "@plane/types";

export class SubscriptionService extends APIService {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_BASE_URL || "");
  }

  /**
   * Get all available plans
   */
  async getPlans(): Promise<{ plans: TPlan[] }> {
    return this.get(`/api/plans/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get current workspace subscription
   */
  async getSubscription(workspaceSlug: string): Promise<{
    subscription: TSubscription;
    features: Record<string, any>;
    usage: TUsageMetrics;
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/subscription/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Check feature access
   */
  async checkFeature(
    workspaceSlug: string,
    featureKey: string
  ): Promise<TFeatureCheck> {
    return this.post(`/api/workspaces/${workspaceSlug}/subscription/check-feature/`, {
      feature_key: featureKey,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Check resource limit
   */
  async checkLimit(
    workspaceSlug: string,
    resourceType: string
  ): Promise<TLimitCheck> {
    return this.post(`/api/workspaces/${workspaceSlug}/subscription/check-limit/`, {
      resource_type: resourceType,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Upgrade subscription
   */
  async upgradePlan(
    workspaceSlug: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; subscription: TSubscription; message: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/subscription/upgrade/`, {
      plan_id: planId,
      payment_method_id: paymentMethodId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    workspaceSlug: string,
    reason?: string
  ): Promise<{ success: boolean; subscription: TSubscription; message: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/subscription/cancel/`, {
      cancel_at_period_end: true,
      reason,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get usage history
   */
  async getUsageHistory(
    workspaceSlug: string,
    metricType: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params: any = { metric_type: metricType };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return this.get(`/api/workspaces/${workspaceSlug}/subscription/usage-history/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get billing history
   */
  async getBillingHistory(workspaceSlug: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/subscription/billing-history/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
```

---

## Custom Hooks

### useSubscription Hook

```typescript
// apps/web/core/hooks/store/use-subscription.ts

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";

export const useSubscription = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within StoreProvider");
  }

  return context.subscription;
};
```

### useFeatureAccess Hook

```typescript
// apps/web/core/hooks/use-feature-access.ts

import { useSubscription } from "@/hooks/store/use-subscription";

export const useFeatureAccess = (featureKey: string): boolean => {
  const subscription = useSubscription();
  return subscription.hasFeature(featureKey);
};
```

### useResourceLimit Hook

```typescript
// apps/web/core/hooks/use-resource-limit.ts

import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/store/use-subscription";
import type { TLimitCheck } from "@plane/types";

export const useResourceLimit = (resourceType: string) => {
  const subscription = useSubscription();
  const [limitCheck, setLimitCheck] = useState<TLimitCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkLimit = async () => {
      setIsLoading(true);
      try {
        const result = await subscription.checkLimit(resourceType);
        setLimitCheck(result);
      } catch (error) {
        console.error("Failed to check limit:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLimit();
  }, [resourceType, subscription]);

  return {
    limitCheck,
    isLoading,
    canAdd: limitCheck?.allowed || false,
    percentageUsed: limitCheck?.percentage_used || 0,
    remaining: limitCheck?.remaining || 0,
  };
};
```

### useUpgradePrompt Hook

```typescript
// apps/web/core/hooks/use-upgrade-prompt.ts

import { useState } from "react";
import { useSubscription } from "@/hooks/store/use-subscription";

export const useUpgradePrompt = () => {
  const subscription = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState<{
    feature?: string;
    resource?: string;
    message?: string;
  }>({});

  const promptUpgrade = (context: {
    feature?: string;
    resource?: string;
    message?: string;
  }) => {
    setUpgradeContext(context);
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
    setUpgradeContext({});
  };

  return {
    isUpgradeModalOpen,
    upgradeContext,
    promptUpgrade,
    closeUpgradeModal,
    currentPlan: subscription.currentPlan,
    isFreePlan: subscription.isFreePlan,
  };
};
```

---

## Components

### 1. Plan Selector Component

```typescript
// apps/web/core/components/subscription/plan-selector.tsx

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useSubscription } from "@/hooks/store/use-subscription";
import { cn } from "@plane/utils";
import { Button } from "@plane/ui";

interface PlanSelectorProps {
  onPlanSelected?: (planId: string) => void;
}

export const PlanSelector: FC<PlanSelectorProps> = observer(({ onPlanSelected }) => {
  const subscription = useSubscription();
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    subscription.fetchPlans();
  }, [subscription]);

  const filteredPlans = subscription.plans.filter(
    (plan) => plan.billing_cycle === selectedCycle
  );

  return (
    <div className="space-y-6">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-custom-border-200 p-1">
          <button
            onClick={() => setSelectedCycle('monthly')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              selectedCycle === 'monthly'
                ? "bg-custom-primary text-white"
                : "text-custom-text-200 hover:text-custom-text-100"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedCycle('yearly')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              selectedCycle === 'yearly'
                ? "bg-custom-primary text-white"
                : "text-custom-text-200 hover:text-custom-text-100"
            )}
          >
            Yearly <span className="ml-1 text-xs text-green-500">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPlans.map((plan) => {
          const isCurrentPlan = subscription.currentPlan?.id === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-lg border p-6 flex flex-col",
                isCurrentPlan
                  ? "border-custom-primary bg-custom-primary/5"
                  : "border-custom-border-200 hover:border-custom-border-300"
              )}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-custom-primary text-white text-xs px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-custom-text-100">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-custom-text-200">
                  {plan.description}
                </p>

                <div className="mt-4">
                  <span className="text-4xl font-bold text-custom-text-100">
                    ${plan.price}
                  </span>
                  <span className="text-custom-text-200 ml-2">
                    /{plan.billing_cycle}
                  </span>
                </div>

                {/* Features List */}
                <ul className="mt-6 space-y-3">
                  {Object.entries(plan.features).map(([key, value]) => (
                    <li key={key} className="flex items-start text-sm">
                      <svg
                        className="h-5 w-5 text-custom-primary flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="ml-2 text-custom-text-200">
                        {formatFeature(key, value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant={isCurrentPlan ? "outline" : "primary"}
                className="mt-6 w-full"
                onClick={() => onPlanSelected?.(plan.id)}
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? "Current Plan" : "Select Plan"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

function formatFeature(key: string, value: any): string {
  if (typeof value === 'boolean') {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
  if (typeof value === 'number') {
    if (value === -1) return `Unlimited ${key.replace('max_', '')}`;
    return `Up to ${value} ${key.replace('max_', '')}`;
  }
  return String(value);
}
```

### 2. Feature Gate Component

```typescript
// apps/web/core/components/subscription/feature-gate.tsx

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { useUpgradePrompt } from "@/hooks/use-upgrade-prompt";
import { Button } from "@plane/ui";

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate: FC<FeatureGateProps> = observer(({
  featureKey,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const hasAccess = useFeatureAccess(featureKey);
  const { promptUpgrade } = useUpgradePrompt();

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-custom-primary/10 mb-4">
          <svg
            className="h-6 w-6 text-custom-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-custom-text-100 mb-2">
          Upgrade Required
        </h3>
        <p className="text-sm text-custom-text-200 mb-4">
          This feature is not available in your current plan.
        </p>
        <Button
          variant="primary"
          onClick={() => promptUpgrade({ feature: featureKey })}
        >
          Upgrade Plan
        </Button>
      </div>
    );
  }

  return null;
});
```

### 3. Usage Meter Component

```typescript
// apps/web/core/components/subscription/usage-meter.tsx

import { FC } from "react";
import { observer } from "mobx-react";
import { useResourceLimit } from "@/hooks/use-resource-limit";
import { cn } from "@plane/utils";

interface UsageMeterProps {
  resourceType: string;
  label: string;
  showUpgradeButton?: boolean;
}

export const UsageMeter: FC<UsageMeterProps> = observer(({
  resourceType,
  label,
  showUpgradeButton = true,
}) => {
  const { limitCheck, isLoading, percentageUsed } = useResourceLimit(resourceType);

  if (isLoading || !limitCheck) {
    return <div className="h-16 bg-custom-background-80 animate-pulse rounded" />;
  }

  const isNearLimit = percentageUsed >= 80;
  const isAtLimit = percentageUsed >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-custom-text-200">{label}</span>
        <span className={cn(
          "font-medium",
          isAtLimit ? "text-red-500" : isNearLimit ? "text-yellow-500" : "text-custom-text-100"
        )}>
          {limitCheck.is_unlimited
            ? `${limitCheck.current} (Unlimited)`
            : `${limitCheck.current} / ${limitCheck.limit}`
          }
        </span>
      </div>

      {!limitCheck.is_unlimited && (
        <>
          <div className="h-2 bg-custom-background-80 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isAtLimit
                  ? "bg-red-500"
                  : isNearLimit
                  ? "bg-yellow-500"
                  : "bg-custom-primary"
              )}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>

          {isAtLimit && showUpgradeButton && (
            <p className="text-xs text-red-500">
              You've reached your limit. Upgrade to add more.
            </p>
          )}
        </>
      )}
    </div>
  );
});
```

### 4. Upgrade Modal Component

```typescript
// apps/web/core/components/subscription/upgrade-modal.tsx

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Dialog } from "@headlessui/react";
import { useSubscription } from "@/hooks/store/use-subscription";
import { PlanSelector } from "./plan-selector";
import { PaymentMethodForm } from "./payment-method-form";
import { Button } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    feature?: string;
    resource?: string;
    message?: string;
  };
}

export const UpgradeModal: FC<UpgradeModalProps> = observer(({
  isOpen,
  onClose,
  context,
}) => {
  const subscription = useSubscription();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = subscription.plans.find((p) => p.id === selectedPlanId);
  const requiresPayment = selectedPlan && selectedPlan.price > 0;

  const handleUpgrade = async () => {
    if (!selectedPlanId) return;

    setIsProcessing(true);
    try {
      await subscription.upgradePlan(selectedPlanId, paymentMethodId || undefined);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `Successfully upgraded to ${selectedPlan?.name} plan`,
      });

      onClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error.message || "Failed to upgrade plan",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-6xl w-full rounded-lg bg-custom-background-100 p-6">
          <Dialog.Title className="text-2xl font-semibold text-custom-text-100 mb-4">
            Upgrade Your Plan
          </Dialog.Title>

          {context?.message && (
            <div className="mb-6 rounded-lg bg-custom-primary/10 border border-custom-primary/20 p-4">
              <p className="text-sm text-custom-text-200">{context.message}</p>
            </div>
          )}

          {!selectedPlanId ? (
            <PlanSelector onPlanSelected={setSelectedPlanId} />
          ) : requiresPayment && !paymentMethodId ? (
            <div>
              <Button
                variant="neutral-primary"
                onClick={() => setSelectedPlanId(null)}
                className="mb-4"
              >
                ← Back to Plans
              </Button>
              <PaymentMethodForm onPaymentMethodCreated={setPaymentMethodId} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-custom-border-200 p-4">
                <h3 className="font-medium text-custom-text-100">Selected Plan</h3>
                <p className="text-2xl font-bold text-custom-primary mt-2">
                  {selectedPlan?.name} - ${selectedPlan?.price}/{selectedPlan?.billing_cycle}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="neutral-primary"
                  onClick={() => {
                    setSelectedPlanId(null);
                    setPaymentMethodId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpgrade}
                  loading={isProcessing}
                >
                  Confirm Upgrade
                </Button>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
});
```

---

## Feature Gates

### Usage in Components

```typescript
// Example: Gating advanced analytics

import { FeatureGate } from "@/components/subscription/feature-gate";

const AnalyticsDashboard = () => {
  return (
    <FeatureGate featureKey="advanced_analytics">
      <AdvancedAnalyticsCharts />
    </FeatureGate>
  );
};
```

### Conditional Rendering

```typescript
import { useFeatureAccess } from "@/hooks/use-feature-access";

const ProjectSettings = observer(() => {
  const hasAutomation = useFeatureAccess("automation");

  return (
    <div>
      <h1>Project Settings</h1>

      {hasAutomation && (
        <div>
          <h2>Automation Rules</h2>
          <AutomationRulesEditor />
        </div>
      )}
    </div>
  );
});
```

### Limit Checking Before Actions

```typescript
import { useResourceLimit } from "@/hooks/use-resource-limit";
import { useUpgradePrompt } from "@/hooks/use-upgrade-prompt";

const CreateProjectButton = observer(() => {
  const { canAdd, limitCheck } = useResourceLimit("projects");
  const { promptUpgrade } = useUpgradePrompt();

  const handleCreateProject = () => {
    if (!canAdd) {
      promptUpgrade({
        resource: "projects",
        message: `You've reached the limit of ${limitCheck?.limit} projects in your current plan.`,
      });
      return;
    }

    // Proceed with project creation
    createProject();
  };

  return (
    <Button onClick={handleCreateProject}>
      Create Project
    </Button>
  );
});
```

---

## Usage Indicators

### Workspace Settings Page

```typescript
// apps/web/app/[workspaceSlug]/settings/billing/page.tsx

import { observer } from "mobx-react";
import { useSubscription } from "@/hooks/store/use-subscription";
import { UsageMeter } from "@/components/subscription/usage-meter";

const BillingSettingsPage = observer(() => {
  const subscription = useSubscription();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="rounded-lg border p-6">
          <h3 className="text-2xl font-bold">{subscription.currentPlan?.name}</h3>
          <p className="text-custom-text-200 mt-1">
            ${subscription.currentPlan?.price}/{subscription.currentPlan?.billing_cycle}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Usage</h2>
        <div className="space-y-4">
          <UsageMeter resourceType="members" label="Team Members" />
          <UsageMeter resourceType="projects" label="Projects" />
          <UsageMeter resourceType="storage" label="Storage" />
          <UsageMeter resourceType="integrations" label="Integrations" />
        </div>
      </div>
    </div>
  );
});

export default BillingSettingsPage;
```

---

## Upgrade Flows

### Inline Upgrade Prompts

```typescript
// Prompt when hitting a limit

const AddMemberButton = observer(() => {
  const { limitCheck, canAdd } = useResourceLimit("members");
  const { promptUpgrade } = useUpgradePrompt();

  if (!canAdd) {
    return (
      <Button
        variant="primary"
        onClick={() => promptUpgrade({
          resource: "members",
          message: "Upgrade to add more team members"
        })}
      >
        <LockIcon className="h-4 w-4 mr-2" />
        Upgrade to Add Members
      </Button>
    );
  }

  return (
    <Button variant="primary" onClick={handleAddMember}>
      Add Member ({limitCheck?.remaining} remaining)
    </Button>
  );
});
```

### Feature Discovery Banners

```typescript
const AdvancedFeaturesBanner = observer(() => {
  const hasAdvancedAnalytics = useFeatureAccess("advanced_analytics");
  const { promptUpgrade, isFreePlan } = useUpgradePrompt();

  if (!isFreePlan || hasAdvancedAnalytics) return null;

  return (
    <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
      <h3 className="text-xl font-bold mb-2">Unlock Advanced Analytics</h3>
      <p className="mb-4">
        Get deeper insights with custom charts, reports, and data exports.
      </p>
      <Button
        variant="neutral-primary"
        onClick={() => promptUpgrade({ feature: "advanced_analytics" })}
      >
        Upgrade Now
      </Button>
    </div>
  );
});
```

---

## TypeScript Types

```typescript
// packages/types/src/subscription.d.ts

export type TPlanType = 'free' | 'starter' | 'professional' | 'enterprise';
export type TBillingCycle = 'monthly' | 'yearly' | 'lifetime';
export type TSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface TPlan {
  id: string;
  name: string;
  slug: string;
  plan_type: TPlanType;
  billing_cycle: TBillingCycle;
  price: number;
  currency: string;
  description: string;
  is_public: boolean;
  sort_order: number;
  features: Record<string, boolean | number>;
}

export interface TSubscription {
  id: string;
  status: TSubscriptionStatus;
  plan: TPlan;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  features: TFeatureEntitlements;
}

export interface TFeatureEntitlements {
  [key: string]: boolean | number;
}

export interface TLimitCheck {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  percentage_used: number;
  is_unlimited: boolean;
}

export interface TUsageMetrics {
  [resource: string]: TLimitCheck;
}

export interface TFeatureCheck {
  has_access: boolean;
  feature: {
    key: string;
    name: string;
    description: string;
  };
  upgrade_required?: boolean;
  suggestions?: any[];
}
```

---

## Next Steps

1. Implement Stripe Elements for payment collection
2. Add subscription analytics tracking
3. Build admin panel for managing plans
4. Create email templates for subscription events
5. Add grace periods for payment failures
6. Implement prorated billing for mid-cycle upgrades
