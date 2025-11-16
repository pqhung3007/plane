"use client";

import React from "react";
import { observer } from "mobx-react";
import { GitBranch, GitPullRequest, Tag, ArrowRight } from "lucide-react";

export const GithubSyncGuide: React.FC = observer(() => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">How to Use GitHub Integration</h3>
        <p className="text-sm text-custom-text-300">
          Follow these steps to sync issues and automate workflows between GitHub and Plane
        </p>
      </div>

      {/* Issue Sync Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-green-500" />
          <h4 className="font-medium">Syncing Issues</h4>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">GitHub → Plane</span>
              <ArrowRight className="h-4 w-4 text-custom-text-300" />
            </div>
            <ol className="text-sm text-custom-text-300 space-y-2 list-decimal list-inside">
              <li>Add the <code className="px-1 py-0.5 rounded bg-custom-background-80">Plane</code> label to any GitHub issue</li>
              <li>Issue automatically creates in linked Plane project</li>
              <li>Plane posts a comment on GitHub with link to work item</li>
            </ol>
          </div>

          <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Plane → GitHub</span>
              <ArrowRight className="h-4 w-4 text-custom-text-300" />
            </div>
            <ol className="text-sm text-custom-text-300 space-y-2 list-decimal list-inside">
              <li>Add the <code className="px-1 py-0.5 rounded bg-custom-background-80">GitHub</code> label to any Plane work item</li>
              <li>Issue automatically creates in linked GitHub repository</li>
              <li>GitHub issue includes link back to Plane work item</li>
            </ol>
            <p className="text-xs text-custom-text-400 mt-2">
              * Requires bidirectional sync enabled
            </p>
          </div>
        </div>
      </div>

      {/* PR Automation Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-purple-500" />
          <h4 className="font-medium">Pull Request Automation</h4>
        </div>

        <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-medium mb-1">With State Automation (Brackets)</h5>
              <div className="text-sm text-custom-text-300 space-y-2">
                <div>
                  <span className="text-custom-text-200">PR Title:</span>{" "}
                  <code className="px-1 py-0.5 rounded bg-custom-background-80">[WEB-344] Add authentication feature</code>
                </div>
                <div>
                  <span className="text-custom-text-200">or in PR Description:</span>{" "}
                  <code className="px-1 py-0.5 rounded bg-custom-background-80">Fixes [WEB-344] [WEB-345]</code>
                </div>
                <p className="text-xs text-custom-text-400">
                  ✓ Work items WEB-344 and WEB-345 will have states automatically updated based on PR lifecycle
                </p>
              </div>
            </div>

            <div className="border-t border-custom-border-200 pt-3">
              <h5 className="text-sm font-medium mb-1">Link Only (Without Brackets)</h5>
              <div className="text-sm text-custom-text-300 space-y-2">
                <div>
                  <span className="text-custom-text-200">PR Title:</span>{" "}
                  <code className="px-1 py-0.5 rounded bg-custom-background-80">Add authentication (relates to WEB-344)</code>
                </div>
                <div>
                  <span className="text-custom-text-200">or in PR Description:</span>{" "}
                  <code className="px-1 py-0.5 rounded bg-custom-background-80">Implements WEB-344 and WEB-345</code>
                </div>
                <p className="text-xs text-custom-text-400">
                  ✓ Work items will be linked to PR but states won't update automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What Gets Synced */}
      <div className="space-y-3">
        <h4 className="font-medium">What Gets Synced?</h4>

        <div className="rounded-lg border border-custom-border-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-custom-background-80">
              <tr>
                <th className="text-left p-3 font-medium">Property</th>
                <th className="text-left p-3 font-medium">Sync Direction</th>
                <th className="text-left p-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-custom-border-200">
              <tr>
                <td className="p-3">Title</td>
                <td className="p-3">
                  <span className="text-green-500">↔ Both ways</span>
                </td>
                <td className="p-3 text-custom-text-300">Updates in either platform reflect in the other</td>
              </tr>
              <tr>
                <td className="p-3">Description</td>
                <td className="p-3">
                  <span className="text-green-500">↔ Both ways</span>
                </td>
                <td className="p-3 text-custom-text-300">Content remains consistent</td>
              </tr>
              <tr>
                <td className="p-3">Assignees</td>
                <td className="p-3">
                  <span className="text-green-500">↔ Both ways</span>
                </td>
                <td className="p-3 text-custom-text-300">Users must be mapped between platforms</td>
              </tr>
              <tr>
                <td className="p-3">Labels</td>
                <td className="p-3">
                  <span className="text-green-500">↔ Both ways</span>
                </td>
                <td className="p-3 text-custom-text-300">Created automatically if they don't exist</td>
              </tr>
              <tr>
                <td className="p-3">States</td>
                <td className="p-3">
                  <span className="text-blue-500">→ GitHub to Plane</span>
                </td>
                <td className="p-3 text-custom-text-300">Based on configured state mappings</td>
              </tr>
              <tr>
                <td className="p-3">Comments</td>
                <td className="p-3">
                  <span className="text-green-500">↔ Both ways</span>
                </td>
                <td className="p-3 text-custom-text-300">With source attribution</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
