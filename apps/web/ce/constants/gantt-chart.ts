import type { TIssueRelationTypes } from "../types";

export const REVERSE_RELATIONS: { [key in TIssueRelationTypes]: TIssueRelationTypes } = {
  blocked_by: "blocking",
  blocking: "blocked_by",
  relates_to: "relates_to",
  duplicate: "duplicate",
  starts_before: "starts_after",
  starts_after: "starts_before",
  finishes_before: "finishes_after",
  finishes_after: "finishes_before",
};
