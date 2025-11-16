import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { ICustomDashboardStore } from "@/store/custom-dashboard.store";

export const useCustomDashboard = (): ICustomDashboardStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCustomDashboard must be used within StoreProvider");
  return context.customDashboard;
};
