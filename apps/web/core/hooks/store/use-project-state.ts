import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IProjectStateStore } from "@/store/workspace/project-state.store";

export const useProjectState = (): IProjectStateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectState must be used within StoreProvider");
  return context.projectState;
};
