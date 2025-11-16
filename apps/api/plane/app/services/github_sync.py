# Python imports
import re
import requests
from typing import Optional, Dict, List, Tuple

# Django imports
from django.db import transaction
from django.utils import timezone

# Module imports
from plane.db.models import (
    GithubRepository,
    GithubRepositorySync,
    GithubIssueSync,
    GithubCommentSync,
    GithubUserConnection,
    GithubPRStateMapping,
    GithubPRSync,
    Issue,
    IssueComment,
    Label,
    State,
    User,
    Project,
)
from plane.utils.exception_logger import log_exception


class GitHubSyncService:
    """
    Service for handling GitHub synchronization operations
    """

    def __init__(self, repository_sync: GithubRepositorySync):
        self.repository_sync = repository_sync
        self.repository = repository_sync.repository
        self.project = repository_sync.project
        self.workspace = repository_sync.workspace

    def get_github_headers(self, user_connection: Optional[GithubUserConnection] = None) -> Dict[str, str]:
        """Get headers for GitHub API requests"""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        }

        if user_connection and user_connection.access_token:
            headers["Authorization"] = f"Bearer {user_connection.access_token}"
        elif self.repository_sync.credentials.get("access_token"):
            headers["Authorization"] = f"Bearer {self.repository_sync.credentials.get('access_token')}"

        return headers

    @transaction.atomic
    def sync_github_issue_to_plane(self, github_issue: Dict) -> Optional[Issue]:
        """
        Sync a GitHub issue to Plane
        Creates or updates a Plane issue based on GitHub issue data
        """
        try:
            github_issue_id = github_issue.get("id")
            github_issue_number = github_issue.get("number")

            # Check if issue already synced
            issue_sync = GithubIssueSync.objects.filter(
                github_issue_id=github_issue_id,
                repository_sync=self.repository_sync
            ).first()

            if issue_sync:
                # Update existing issue
                issue = issue_sync.issue
                issue.name = github_issue.get("title", issue.name)
                issue.description_html = github_issue.get("body", issue.description_html)

                # Update state based on GitHub issue state
                if github_issue.get("state") == "closed" and self.repository_sync.github_closed_state:
                    issue.state = self.repository_sync.github_closed_state
                elif github_issue.get("state") == "open" and self.repository_sync.github_open_state:
                    issue.state = self.repository_sync.github_open_state

                issue.save()
                return issue

            # Create new issue
            state = self.repository_sync.github_open_state or self.get_default_state()

            issue = Issue.objects.create(
                project=self.project,
                workspace=self.workspace,
                name=github_issue.get("title"),
                description_html=github_issue.get("body", ""),
                state=state,
                created_by=self.repository_sync.actor,
                updated_by=self.repository_sync.actor,
            )

            # Create issue sync record
            GithubIssueSync.objects.create(
                project=self.project,
                workspace=self.workspace,
                issue=issue,
                repository_sync=self.repository_sync,
                github_issue_id=github_issue_id,
                repo_issue_id=github_issue_number,
                issue_url=github_issue.get("html_url"),
                created_by=self.repository_sync.actor,
                updated_by=self.repository_sync.actor,
            )

            # Sync labels
            self.sync_github_labels_to_issue(issue, github_issue.get("labels", []))

            # Post comment on GitHub with Plane link
            self.post_github_comment(
                github_issue_number,
                f"✅ This issue has been synced to Plane: {self.get_plane_issue_url(issue)}"
            )

            return issue

        except Exception as e:
            log_exception(e)
            return None

    @transaction.atomic
    def sync_plane_issue_to_github(self, issue: Issue) -> Optional[Dict]:
        """
        Sync a Plane issue to GitHub
        Creates or updates a GitHub issue based on Plane issue data
        """
        try:
            # Check if issue already synced
            issue_sync = GithubIssueSync.objects.filter(
                issue=issue,
                repository_sync=self.repository_sync
            ).first()

            headers = self.get_github_headers()
            api_url = f"https://api.github.com/repos/{self.repository.owner}/{self.repository.name}/issues"

            if issue_sync:
                # Update existing GitHub issue
                update_url = f"{api_url}/{issue_sync.repo_issue_id}"
                data = {
                    "title": issue.name,
                    "body": self.convert_plane_description_to_markdown(issue.description_html),
                    "state": "closed" if issue.state.group == "completed" else "open",
                }

                response = requests.patch(update_url, json=data, headers=headers)
                if response.status_code == 200:
                    return response.json()
            else:
                # Create new GitHub issue
                data = {
                    "title": issue.name,
                    "body": self.convert_plane_description_to_markdown(issue.description_html),
                    "labels": ["Plane"],  # Add Plane label
                }

                response = requests.post(api_url, json=data, headers=headers)
                if response.status_code == 201:
                    github_issue = response.json()

                    # Create sync record
                    GithubIssueSync.objects.create(
                        project=self.project,
                        workspace=self.workspace,
                        issue=issue,
                        repository_sync=self.repository_sync,
                        github_issue_id=github_issue.get("id"),
                        repo_issue_id=github_issue.get("number"),
                        issue_url=github_issue.get("html_url"),
                        created_by=self.repository_sync.actor,
                        updated_by=self.repository_sync.actor,
                    )

                    return github_issue

        except Exception as e:
            log_exception(e)
            return None

    def sync_github_labels_to_issue(self, issue: Issue, github_labels: List[Dict]):
        """Sync GitHub labels to Plane issue"""
        try:
            for gh_label in github_labels:
                label_name = gh_label.get("name")
                label_color = gh_label.get("color", "000000")

                # Get or create label in Plane
                label, _ = Label.objects.get_or_create(
                    project=self.project,
                    name=label_name,
                    defaults={
                        "color": f"#{label_color}",
                        "workspace": self.workspace,
                        "created_by": self.repository_sync.actor,
                        "updated_by": self.repository_sync.actor,
                    }
                )

                # Add label to issue
                issue.labels.add(label)

        except Exception as e:
            log_exception(e)

    @transaction.atomic
    def sync_github_comment_to_plane(self, github_comment: Dict, issue_sync: GithubIssueSync) -> Optional[IssueComment]:
        """Sync a GitHub comment to Plane"""
        try:
            github_comment_id = github_comment.get("id")

            # Check if comment already synced
            comment_sync = GithubCommentSync.objects.filter(
                repo_comment_id=github_comment_id,
                issue_sync=issue_sync
            ).first()

            if comment_sync:
                # Update existing comment
                comment = comment_sync.comment
                comment.comment_html = github_comment.get("body", "")
                comment.save()
                return comment

            # Create new comment
            comment = IssueComment.objects.create(
                project=self.project,
                workspace=self.workspace,
                issue=issue_sync.issue,
                comment_html=github_comment.get("body", ""),
                created_by=self.repository_sync.actor,
                updated_by=self.repository_sync.actor,
            )

            # Create comment sync record
            GithubCommentSync.objects.create(
                project=self.project,
                workspace=self.workspace,
                comment=comment,
                issue_sync=issue_sync,
                repo_comment_id=github_comment_id,
                created_by=self.repository_sync.actor,
                updated_by=self.repository_sync.actor,
            )

            return comment

        except Exception as e:
            log_exception(e)
            return None

    def post_github_comment(self, issue_number: int, comment_body: str, user_connection: Optional[GithubUserConnection] = None):
        """Post a comment on a GitHub issue"""
        try:
            headers = self.get_github_headers(user_connection)
            api_url = f"https://api.github.com/repos/{self.repository.owner}/{self.repository.name}/issues/{issue_number}/comments"

            data = {"body": comment_body}
            response = requests.post(api_url, json=data, headers=headers)

            return response.status_code == 201

        except Exception as e:
            log_exception(e)
            return False

    def get_default_state(self) -> State:
        """Get default state for the project"""
        return State.objects.filter(
            project=self.project,
            default=True
        ).first() or State.objects.filter(project=self.project).first()

    def get_plane_issue_url(self, issue: Issue) -> str:
        """Get the URL for a Plane issue"""
        return f"/workspaces/{self.workspace.slug}/projects/{self.project.id}/issues/{issue.id}"

    def convert_plane_description_to_markdown(self, html_description: str) -> str:
        """Convert Plane HTML description to GitHub-compatible Markdown"""
        # This is a simple converter - you might want to use a library like html2text
        # For now, return as-is
        return html_description

    @staticmethod
    def extract_plane_issue_references(text: str) -> Tuple[List[str], List[str]]:
        """
        Extract Plane issue references from PR title/description
        Returns:
            - automated_refs: List of issue IDs with brackets [WEB-344]
            - linked_refs: List of issue IDs without brackets WEB-344
        """
        # Match issue references with brackets (for automation)
        automated_pattern = r'\[([A-Z]+-\d+)\]'
        automated_refs = re.findall(automated_pattern, text)

        # Match issue references without brackets (for linking only)
        linked_pattern = r'(?<!\[)([A-Z]+-\d+)(?!\])'
        all_refs = re.findall(linked_pattern, text)

        # Remove automated refs from linked refs
        linked_refs = [ref for ref in all_refs if ref not in automated_refs]

        return automated_refs, linked_refs


class GitHubPRService:
    """
    Service for handling GitHub Pull Request automation
    """

    def __init__(self, pr_state_mapping: GithubPRStateMapping):
        self.pr_state_mapping = pr_state_mapping
        self.repository = pr_state_mapping.repository
        self.project = pr_state_mapping.project
        self.workspace = pr_state_mapping.workspace

    @transaction.atomic
    def handle_pr_state_change(self, pr_data: Dict, action: str):
        """
        Handle PR state changes and update linked Plane issues
        """
        try:
            pr_number = pr_data.get("number")
            pr_id = pr_data.get("id")
            pr_title = pr_data.get("title", "")
            pr_body = pr_data.get("body", "")
            pr_state = pr_data.get("state")  # open, closed
            pr_draft = pr_data.get("draft", False)
            pr_merged = pr_data.get("merged", False)

            # Get or create PR sync record
            pr_sync, created = GithubPRSync.objects.get_or_create(
                repository=self.repository,
                pr_id=pr_id,
                defaults={
                    "project": self.project,
                    "workspace": self.workspace,
                    "pr_number": pr_number,
                    "pr_url": pr_data.get("html_url"),
                    "pr_title": pr_title,
                    "pr_state": self.determine_pr_state(pr_state, pr_draft, pr_merged),
                }
            )

            # Extract issue references from PR title and body
            combined_text = f"{pr_title} {pr_body}"
            automated_refs, linked_refs = GitHubSyncService.extract_plane_issue_references(combined_text)

            # Find referenced issues
            all_issue_ids = automated_refs + linked_refs
            issues = Issue.objects.filter(
                project=self.project,
                sequence_id__in=[int(ref.split('-')[1]) for ref in all_issue_ids if '-' in ref]
            )

            # Link issues to PR
            pr_sync.linked_issues.set(issues)

            # Update state only for automated refs
            if automated_refs:
                automated_issues = [
                    issue for issue in issues
                    if f"{issue.project.identifier}-{issue.sequence_id}" in automated_refs
                ]

                new_state = self.get_state_for_pr_action(action, pr_draft, pr_merged, pr_state)
                if new_state:
                    for issue in automated_issues:
                        issue.state = new_state
                        issue.save()

            # Post comment on PR with linked issues
            self.post_pr_comment(pr_number, issues, automated_refs)

        except Exception as e:
            log_exception(e)

    def determine_pr_state(self, state: str, is_draft: bool, is_merged: bool) -> str:
        """Determine the current PR state"""
        if is_merged:
            return "merged"
        elif state == "closed":
            return "closed"
        elif is_draft:
            return "draft"
        else:
            return "open"

    def get_state_for_pr_action(self, action: str, is_draft: bool, is_merged: bool, pr_state: str) -> Optional[State]:
        """Get the Plane state based on PR action"""
        if is_merged and self.pr_state_mapping.pr_merged_state:
            return self.pr_state_mapping.pr_merged_state
        elif pr_state == "closed" and not is_merged and self.pr_state_mapping.pr_closed_state:
            return self.pr_state_mapping.pr_closed_state
        elif is_draft and self.pr_state_mapping.pr_draft_state:
            return self.pr_state_mapping.pr_draft_state
        elif action == "ready_for_review" and self.pr_state_mapping.pr_opened_state:
            return self.pr_state_mapping.pr_opened_state
        elif action == "review_requested" and self.pr_state_mapping.pr_review_requested_state:
            return self.pr_state_mapping.pr_review_requested_state

        return None

    def post_pr_comment(self, pr_number: int, issues: List[Issue], automated_refs: List[str]):
        """Post a comment on the PR listing linked Plane issues"""
        try:
            if not issues:
                return

            comment_lines = ["## 🔗 Linked Plane Issues\n"]

            for issue in issues:
                issue_ref = f"{issue.project.identifier}-{issue.sequence_id}"
                automated = "✅ State Automation Enabled" if issue_ref in automated_refs else "🔗 Linked"
                issue_url = f"/workspaces/{self.workspace.slug}/projects/{self.project.id}/issues/{issue.id}"
                comment_lines.append(f"- {automated} [{issue_ref}]({issue_url}): {issue.name}")

            comment_body = "\n".join(comment_lines)

            # Post comment via GitHub API
            # This would require the GitHub API token from the workspace integration
            # For now, we'll skip the actual API call

        except Exception as e:
            log_exception(e)
