import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterState: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { projectStateIds, getProjectStateById, fetchProjectStates } = useProjectState();

  useEffect(() => {
    if (workspaceSlug && !projectStateIds) {
      fetchProjectStates(workspaceSlug.toString());
    }
  }, [workspaceSlug, projectStateIds, fetchProjectStates]);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const projectStates = projectStateIds
    ?.map((id) => getProjectStateById(id))
    .filter((state) => state && state.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <>
      <FilterHeader
        title={`State${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {projectStates.length > 0 ? (
            projectStates.map((state) => {
              if (!state) return null;
              return (
                <FilterOption
                  key={state.id}
                  isChecked={appliedFilters?.includes(state.id) ? true : false}
                  onClick={() => handleUpdate(state.id)}
                  icon={
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: state.color }}
                    />
                  }
                  title={state.name}
                />
              );
            })
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
