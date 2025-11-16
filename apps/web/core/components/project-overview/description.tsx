"use client";

import { observer } from "mobx-react";
import { useState, useRef } from "react";
import { EditorRefApi, RichTextEditorWithRef } from "@plane/editor";
import { Card, ECardSpacing, ECardVariant } from "@plane/ui";
import type { TProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  project: TProject;
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
};

export const ProjectOverviewDescription = observer((props: Props) => {
  const { project, workspaceSlug, projectId, hasEditPermission } = props;
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<EditorRefApi>(null);

  // store hooks
  const { updateProject } = useProject();

  const handleDescriptionUpdate = async (description_html: string) => {
    try {
      await updateProject(workspaceSlug, projectId, {
        description: description_html,
      });
    } catch (error) {
      console.error("Failed to update project description:", error);
    }
  };

  return (
    <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-custom-text-100">
            About this project
          </h2>
        </div>

        <div
          className="min-h-[200px] cursor-text"
          onClick={() => {
            if (hasEditPermission && !isEditing) {
              setIsEditing(true);
              editorRef.current?.focus();
            }
          }}
        >
          {hasEditPermission || project.description ? (
            <RichTextEditorWithRef
              forwardRef={editorRef}
              initialValue={project.description || "<p>Add a description for your project...</p>"}
              editorClassName="min-h-[200px]"
              containerClassName="!p-0"
              placeholder="Add a description for your project..."
              customClassName="!p-0"
              editable={hasEditPermission}
              onChange={(html: string) => {
                handleDescriptionUpdate(html);
              }}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
            />
          ) : (
            <p className="text-sm text-custom-text-300">
              No description available
            </p>
          )}
        </div>
      </div>
    </Card>
  );
});
