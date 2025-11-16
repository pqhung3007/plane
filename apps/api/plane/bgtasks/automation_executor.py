# Python imports
import time
import json
from datetime import datetime

# Django imports
from django.db.models.signals import post_save, pre_save, m2m_changed
from django.dispatch import receiver
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Issue,
    IssueComment,
    ProjectAutomation,
    AutomationLog,
    State,
    Label,
)
from plane.utils.exception_logger import log_exception


class AutomationExecutor:
    """
    Executes workflow automations based on triggers and conditions.

    This class evaluates automation conditions and executes configured actions
    when issue events occur in the system.
    """

    def __init__(self, automation, issue, trigger_type):
        self.automation = automation
        self.issue = issue
        self.trigger_type = trigger_type
        self.start_time = time.time()

    def evaluate_conditions(self):
        """
        Evaluate all conditions defined in the automation.

        Returns:
            bool: True if all conditions are met, False otherwise
        """
        if not self.automation.conditions:
            return True  # No conditions means always execute

        for condition in self.automation.conditions:
            field = condition.get("field")
            operator = condition.get("operator")
            value = condition.get("value")

            if not self._evaluate_condition(field, operator, value):
                return False

        return True

    def _evaluate_condition(self, field, operator, value):
        """
        Evaluate a single condition.

        Args:
            field: The issue field to check (state, priority, label, assignee, created_by)
            operator: The comparison operator (is, is_not, contains, not_contains, is_empty, is_not_empty)
            value: The value to compare against

        Returns:
            bool: True if condition is met, False otherwise
        """
        try:
            if field == "state":
                issue_value = str(self.issue.state_id) if self.issue.state_id else None
            elif field == "priority":
                issue_value = self.issue.priority
            elif field == "label":
                # Get all label IDs for the issue
                label_ids = list(self.issue.labels.values_list("id", flat=True))
                issue_value = [str(lid) for lid in label_ids]
            elif field == "assignee":
                # Get all assignee IDs for the issue
                assignee_ids = list(self.issue.assignees.values_list("id", flat=True))
                issue_value = [str(aid) for aid in assignee_ids]
            elif field == "created_by":
                issue_value = str(self.issue.created_by_id) if self.issue.created_by_id else None
            elif field == "issue_type":
                issue_value = str(self.issue.type_id) if self.issue.type_id else None
            else:
                return False

            # Evaluate based on operator
            if operator == "is":
                if isinstance(issue_value, list):
                    return value in issue_value
                return issue_value == value

            elif operator == "is_not":
                if isinstance(issue_value, list):
                    return value not in issue_value
                return issue_value != value

            elif operator == "contains":
                if not isinstance(issue_value, list):
                    issue_value = [issue_value] if issue_value else []
                if not isinstance(value, list):
                    value = [value]
                return any(v in issue_value for v in value)

            elif operator == "not_contains":
                if not isinstance(issue_value, list):
                    issue_value = [issue_value] if issue_value else []
                if not isinstance(value, list):
                    value = [value]
                return not any(v in issue_value for v in value)

            elif operator == "is_empty":
                if isinstance(issue_value, list):
                    return len(issue_value) == 0
                return issue_value is None or issue_value == ""

            elif operator == "is_not_empty":
                if isinstance(issue_value, list):
                    return len(issue_value) > 0
                return issue_value is not None and issue_value != ""

            return False

        except Exception as e:
            log_exception(e)
            return False

    def execute_actions(self):
        """
        Execute all actions defined in the automation.

        Returns:
            tuple: (success: bool, actions_executed: list, error_message: str)
        """
        actions_executed = []
        error_message = ""

        try:
            for action in self.automation.actions:
                action_type = action.get("type")
                config = action.get("config", {})

                success = self._execute_action(action_type, config)

                actions_executed.append({
                    "type": action_type,
                    "config": config,
                    "success": success,
                    "timestamp": timezone.now().isoformat(),
                })

                if not success:
                    error_message = f"Failed to execute action: {action_type}"

            return True, actions_executed, error_message

        except Exception as e:
            log_exception(e)
            return False, actions_executed, str(e)

    def _execute_action(self, action_type, config):
        """
        Execute a single action.

        Args:
            action_type: Type of action (add_comment, change_state, etc.)
            config: Action configuration

        Returns:
            bool: True if action executed successfully
        """
        try:
            if action_type == "add_comment":
                comment_text = config.get("comment", "")
                IssueComment.objects.create(
                    issue=self.issue,
                    project=self.issue.project,
                    workspace=self.issue.workspace,
                    comment_html=f"<p>{comment_text}</p>",
                    comment_stripped=comment_text,
                    created_by_id=self.automation.created_by_id,
                )
                return True

            elif action_type == "change_state":
                state_id = config.get("state_id")
                if state_id:
                    self.issue.state_id = state_id
                    self.issue.save(update_fields=["state"])
                    return True

            elif action_type == "change_priority":
                priority = config.get("priority")
                if priority in ["urgent", "high", "medium", "low", "none"]:
                    self.issue.priority = priority
                    self.issue.save(update_fields=["priority"])
                    return True

            elif action_type == "add_assignee":
                assignee_ids = config.get("assignee_ids", [])
                if assignee_ids:
                    from plane.db.models import IssueAssignee
                    for assignee_id in assignee_ids:
                        IssueAssignee.objects.get_or_create(
                            issue=self.issue,
                            assignee_id=assignee_id,
                            project=self.issue.project,
                            workspace=self.issue.workspace,
                        )
                    return True

            elif action_type == "remove_assignee":
                assignee_ids = config.get("assignee_ids", [])
                if assignee_ids:
                    from plane.db.models import IssueAssignee
                    IssueAssignee.objects.filter(
                        issue=self.issue,
                        assignee_id__in=assignee_ids
                    ).delete()
                    return True

            elif action_type == "add_label":
                label_ids = config.get("label_ids", [])
                if label_ids:
                    from plane.db.models import IssueLabel
                    for label_id in label_ids:
                        IssueLabel.objects.get_or_create(
                            issue=self.issue,
                            label_id=label_id,
                            project=self.issue.project,
                            workspace=self.issue.workspace,
                        )
                    return True

            elif action_type == "remove_label":
                label_ids = config.get("label_ids", [])
                if label_ids:
                    from plane.db.models import IssueLabel
                    IssueLabel.objects.filter(
                        issue=self.issue,
                        label_id__in=label_ids
                    ).delete()
                    return True

            elif action_type == "set_start_date":
                start_date = config.get("start_date")
                if start_date:
                    self.issue.start_date = start_date
                    self.issue.save(update_fields=["start_date"])
                    return True

            elif action_type == "set_due_date":
                due_date = config.get("due_date")
                if due_date:
                    self.issue.target_date = due_date
                    self.issue.save(update_fields=["target_date"])
                    return True

            return False

        except Exception as e:
            log_exception(e)
            return False

    def execute(self):
        """
        Execute the automation: evaluate conditions and run actions.

        Returns:
            AutomationLog: The log entry for this execution
        """
        conditions_met = self.evaluate_conditions()

        if not conditions_met:
            # Log as skipped
            execution_time_ms = int((time.time() - self.start_time) * 1000)
            log = AutomationLog.objects.create(
                automation=self.automation,
                issue=self.issue,
                project=self.issue.project,
                workspace=self.issue.workspace,
                trigger_type=self.trigger_type,
                conditions_met=False,
                status="skipped",
                execution_time_ms=execution_time_ms,
                created_by_id=self.automation.created_by_id,
            )
            return log

        # Execute actions
        success, actions_executed, error_message = self.execute_actions()

        # Update automation execution count
        self.automation.execution_count += 1
        self.automation.last_executed_at = timezone.now()
        self.automation.save(update_fields=["execution_count", "last_executed_at"])

        # Log execution
        execution_time_ms = int((time.time() - self.start_time) * 1000)
        log = AutomationLog.objects.create(
            automation=self.automation,
            issue=self.issue,
            project=self.issue.project,
            workspace=self.issue.workspace,
            trigger_type=self.trigger_type,
            conditions_met=True,
            status="success" if success else "failed",
            actions_executed=actions_executed,
            error_message=error_message,
            execution_time_ms=execution_time_ms,
            created_by_id=self.automation.created_by_id,
        )

        return log


@shared_task
def execute_automations(issue_id, trigger_type, trigger_config=None):
    """
    Celery task to execute automations for an issue.

    Args:
        issue_id: UUID of the issue that triggered the automation
        trigger_type: Type of trigger (issue_created, state_changed, etc.)
        trigger_config: Additional trigger configuration (e.g., from_state, to_state)
    """
    try:
        issue = Issue.objects.select_related("project", "state").get(pk=issue_id)

        # Get active automations for this project and trigger type
        automations = ProjectAutomation.objects.filter(
            project=issue.project,
            is_active=True,
            trigger_type=trigger_type,
        ).select_related("project", "workspace", "created_by")

        for automation in automations:
            # Check trigger-specific config if needed
            if trigger_config and automation.trigger_config:
                # For state_changed trigger, check if it matches the transition
                if trigger_type == "state_changed":
                    expected_from = automation.trigger_config.get("from_state_id")
                    expected_to = automation.trigger_config.get("to_state_id")

                    if expected_from and expected_from != trigger_config.get("from_state_id"):
                        continue
                    if expected_to and expected_to != trigger_config.get("to_state_id"):
                        continue

            # Execute the automation
            executor = AutomationExecutor(automation, issue, trigger_type)
            executor.execute()

    except Issue.DoesNotExist:
        pass
    except Exception as e:
        log_exception(e)


# Signal handlers
_issue_state_cache = {}


@receiver(pre_save, sender=Issue)
def cache_issue_state(sender, instance, **kwargs):
    """Cache the current state before saving to detect state changes"""
    if instance.pk:
        try:
            old_issue = Issue.objects.get(pk=instance.pk)
            _issue_state_cache[instance.pk] = {
                "state_id": old_issue.state_id,
                "priority": old_issue.priority,
            }
        except Issue.DoesNotExist:
            pass


@receiver(post_save, sender=Issue)
def trigger_issue_automations(sender, instance, created, **kwargs):
    """Trigger automations when an issue is created or updated"""
    try:
        if created:
            # Issue created trigger
            execute_automations.delay(
                issue_id=str(instance.pk),
                trigger_type="issue_created"
            )
        else:
            # Check for state change
            old_state = _issue_state_cache.get(instance.pk, {})
            if old_state.get("state_id") != instance.state_id:
                execute_automations.delay(
                    issue_id=str(instance.pk),
                    trigger_type="state_changed",
                    trigger_config={
                        "from_state_id": str(old_state.get("state_id")) if old_state.get("state_id") else None,
                        "to_state_id": str(instance.state_id) if instance.state_id else None,
                    }
                )

            # Issue updated trigger
            execute_automations.delay(
                issue_id=str(instance.pk),
                trigger_type="issue_updated"
            )

            # Clean up cache
            if instance.pk in _issue_state_cache:
                del _issue_state_cache[instance.pk]

    except Exception as e:
        log_exception(e)


@receiver(m2m_changed, sender=Issue.assignees.through)
def trigger_assignee_change_automation(sender, instance, action, **kwargs):
    """Trigger automations when issue assignees change"""
    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            execute_automations.delay(
                issue_id=str(instance.pk),
                trigger_type="assignee_changed"
            )
        except Exception as e:
            log_exception(e)


@receiver(post_save, sender=IssueComment)
def trigger_comment_automation(sender, instance, created, **kwargs):
    """Trigger automations when a comment is created"""
    if created:
        try:
            execute_automations.delay(
                issue_id=str(instance.issue_id),
                trigger_type="comment_created"
            )
        except Exception as e:
            log_exception(e)
