# Subscription Plans Implementation Guide

## Overview

This guide provides a comprehensive implementation plan for adding subscription-based feature scaling to Plane, covering both backend and frontend. The design builds on Plane's existing multi-edition (CE/EE) architecture and MobX state management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Feature Gating Patterns](#feature-gating-patterns)
6. [Billing Integration](#billing-integration)
7. [Migration Strategy](#migration-strategy)
8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ Plan Select  │    │Feature Gates │    │Upgrade CTAs  │     │
│  │  Component   │    │  & Paywalls  │    │   & Modals   │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                    │                    │              │
│  ┌──────▼────────────────────▼────────────────────▼───────┐    │
│  │         Subscription Store (MobX)                       │    │
│  │  - Current plan details                                 │    │
│  │  - Feature entitlements                                 │    │
│  │  - Usage metrics                                        │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                    API Calls
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│                        Backend                                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Subscription Middleware                      │   │
│  │  - Check plan entitlements                               │   │
│  │  - Enforce usage limits                                  │   │
│  │  - Track usage metrics                                   │   │
│  └───────────────────┬──────────────────────────────────────┘   │
│                      │                                           │
│  ┌──────────────────▼────────────────┐                          │
│  │     Subscription Service           │                          │
│  │  - Manage subscriptions            │                          │
│  │  - Check feature access            │                          │
│  │  - Handle billing events           │                          │
│  └──────────────────┬─────────────────┘                          │
│                     │                                            │
│  ┌──────────────────▼─────────────────┐                          │
│  │       Database Models               │                          │
│  │  - Plans                            │                          │
│  │  - Subscriptions                    │                          │
│  │  - Features                         │                          │
│  │  - Usage Tracking                   │                          │
│  └─────────────────────────────────────┘                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                          │
                          │
                          ▼
              ┌────────────────────────┐
              │  Billing Provider      │
              │  (Stripe, Paddle, etc) │
              └────────────────────────┘
```

### Key Design Principles

1. **Leverage Existing Architecture**: Build on CE/EE pattern and MobX stores
2. **Feature-Based Entitlements**: Features are independently gated, not monolithic plans
3. **Usage-Based Limits**: Track and enforce quotas (users, projects, storage, etc.)
4. **Graceful Degradation**: Downgrade path doesn't break existing data
5. **Transparent Pricing**: Clear visibility of limits and upgrade paths

---

## Database Schema

### Django Models

```python
# apps/api/plane/db/models/subscription.py

from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField
from .workspace import Workspace

class Plan(models.Model):
    """Subscription plans available for purchase"""

    PLAN_TYPES = (
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
    )

    BILLING_CYCLES = (
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
        ('lifetime', 'Lifetime'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES)
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLES)

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')

    # Stripe integration
    stripe_price_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_product_id = models.CharField(max_length=255, null=True, blank=True)

    # Plan metadata
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)  # Show on pricing page
    sort_order = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'plans'
        ordering = ['sort_order', 'price']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['plan_type', 'billing_cycle']),
        ]

    def __str__(self):
        return f"{self.name} ({self.billing_cycle})"


class Feature(models.Model):
    """Individual features that can be assigned to plans"""

    FEATURE_TYPES = (
        ('boolean', 'Boolean'),      # On/off feature
        ('limit', 'Limit'),          # Numeric limit (e.g., max 10 projects)
        ('unlimited', 'Unlimited'),  # No limit
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)  # e.g., 'advanced_analytics'
    name = models.CharField(max_length=200)
    description = models.TextField()
    feature_type = models.CharField(max_length=20, choices=FEATURE_TYPES)

    # Category for grouping in UI
    category = models.CharField(max_length=50)  # e.g., 'analytics', 'automation', 'integrations'

    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'features'
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.name


class PlanFeature(models.Model):
    """Join table mapping features to plans with their limits"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='plan_features')
    feature = models.ForeignKey(Feature, on_delete=models.CASCADE, related_name='feature_plans')

    # For 'limit' type features
    limit_value = models.IntegerField(null=True, blank=True)

    # For 'boolean' type features
    is_enabled = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'plan_features'
        unique_together = [['plan', 'feature']]
        indexes = [
            models.Index(fields=['plan', 'feature']),
        ]

    def __str__(self):
        return f"{self.plan.name} - {self.feature.name}"


class WorkspaceSubscription(models.Model):
    """Active subscription for a workspace"""

    STATUS_CHOICES = (
        ('active', 'Active'),
        ('trialing', 'Trialing'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('incomplete', 'Incomplete'),
        ('incomplete_expired', 'Incomplete Expired'),
        ('unpaid', 'Unpaid'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.OneToOneField(
        Workspace,
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')

    # Subscription status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Billing integration
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)

    # Subscription dates
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    canceled_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    # Auto-renew
    cancel_at_period_end = models.BooleanField(default=False)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workspace_subscriptions'
        indexes = [
            models.Index(fields=['workspace']),
            models.Index(fields=['status']),
            models.Index(fields=['stripe_subscription_id']),
        ]

    def __str__(self):
        return f"{self.workspace.name} - {self.plan.name}"

    @property
    def is_active(self):
        """Check if subscription is currently active"""
        return self.status in ['active', 'trialing']

    @property
    def is_trial(self):
        """Check if subscription is in trial period"""
        return self.status == 'trialing'


class UsageMetric(models.Model):
    """Track usage metrics for billing and limits"""

    METRIC_TYPES = (
        ('members', 'Workspace Members'),
        ('projects', 'Projects'),
        ('issues', 'Issues'),
        ('storage', 'Storage (GB)'),
        ('api_calls', 'API Calls'),
        ('guests', 'Guest Users'),
        ('integrations', 'Active Integrations'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='usage_metrics')
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)

    # Current usage
    current_value = models.IntegerField(default=0)

    # Historical data
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'usage_metrics'
        unique_together = [['workspace', 'metric_type', 'period_start']]
        indexes = [
            models.Index(fields=['workspace', 'metric_type']),
            models.Index(fields=['period_start', 'period_end']),
        ]

    def __str__(self):
        return f"{self.workspace.name} - {self.metric_type}: {self.current_value}"


class SubscriptionHistory(models.Model):
    """Audit log of subscription changes"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='subscription_history')

    # Plan change
    from_plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, related_name='upgrades_from')
    to_plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, related_name='upgrades_to')

    # Change details
    action = models.CharField(max_length=50)  # 'created', 'upgraded', 'downgraded', 'canceled', 'renewed'

    # Billing
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')

    # Context
    performed_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subscription_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', '-created_at']),
        ]

    def __str__(self):
        return f"{self.workspace.name} - {self.action} at {self.created_at}"
```

### Database Migrations

```python
# apps/api/plane/db/migrations/0001_subscription_models.py

from django.db import migrations
from django.core.management import call_command

def create_default_plans(apps, schema_editor):
    """Create default subscription plans"""
    Plan = apps.get_model('plane', 'Plan')
    Feature = apps.get_model('plane', 'Feature')
    PlanFeature = apps.get_model('plane', 'PlanFeature')

    # Create features
    features_data = [
        # Core features
        {'key': 'max_members', 'name': 'Team Members', 'feature_type': 'limit', 'category': 'workspace'},
        {'key': 'max_projects', 'name': 'Projects', 'feature_type': 'limit', 'category': 'workspace'},
        {'key': 'max_guests', 'name': 'Guest Users', 'feature_type': 'limit', 'category': 'workspace'},
        {'key': 'max_storage_gb', 'name': 'Storage (GB)', 'feature_type': 'limit', 'category': 'workspace'},

        # Advanced features
        {'key': 'advanced_analytics', 'name': 'Advanced Analytics', 'feature_type': 'boolean', 'category': 'analytics'},
        {'key': 'custom_views', 'name': 'Custom Views', 'feature_type': 'boolean', 'category': 'views'},
        {'key': 'automation', 'name': 'Automation Rules', 'feature_type': 'boolean', 'category': 'automation'},
        {'key': 'custom_fields', 'name': 'Custom Fields', 'feature_type': 'boolean', 'category': 'customization'},
        {'key': 'time_tracking', 'name': 'Time Tracking', 'feature_type': 'boolean', 'category': 'productivity'},

        # Security
        {'key': 'sso', 'name': 'Single Sign-On (SSO)', 'feature_type': 'boolean', 'category': 'security'},
        {'key': 'audit_logs', 'name': 'Audit Logs', 'feature_type': 'boolean', 'category': 'security'},
        {'key': 'advanced_permissions', 'name': 'Advanced Permissions', 'feature_type': 'boolean', 'category': 'security'},

        # Integrations
        {'key': 'max_integrations', 'name': 'Active Integrations', 'feature_type': 'limit', 'category': 'integrations'},
        {'key': 'webhooks', 'name': 'Webhooks', 'feature_type': 'boolean', 'category': 'integrations'},
        {'key': 'api_access', 'name': 'API Access', 'feature_type': 'boolean', 'category': 'integrations'},

        # Support
        {'key': 'priority_support', 'name': 'Priority Support', 'feature_type': 'boolean', 'category': 'support'},
        {'key': 'dedicated_support', 'name': 'Dedicated Support', 'feature_type': 'boolean', 'category': 'support'},
    ]

    features = {}
    for feature_data in features_data:
        feature = Feature.objects.create(**feature_data)
        features[feature.key] = feature

    # Create plans
    plans_config = [
        {
            'plan': {
                'name': 'Free',
                'slug': 'free',
                'plan_type': 'free',
                'billing_cycle': 'monthly',
                'price': 0,
                'description': 'Perfect for small teams getting started',
                'sort_order': 1,
            },
            'features': {
                'max_members': 5,
                'max_projects': 3,
                'max_guests': 2,
                'max_storage_gb': 1,
                'max_integrations': 1,
                'api_access': True,
            }
        },
        {
            'plan': {
                'name': 'Starter',
                'slug': 'starter-monthly',
                'plan_type': 'starter',
                'billing_cycle': 'monthly',
                'price': 8,
                'description': 'For growing teams',
                'sort_order': 2,
            },
            'features': {
                'max_members': 15,
                'max_projects': 10,
                'max_guests': 5,
                'max_storage_gb': 10,
                'max_integrations': 5,
                'api_access': True,
                'webhooks': True,
                'custom_views': True,
                'time_tracking': True,
            }
        },
        {
            'plan': {
                'name': 'Professional',
                'slug': 'professional-monthly',
                'plan_type': 'professional',
                'billing_cycle': 'monthly',
                'price': 16,
                'description': 'For established teams',
                'sort_order': 3,
            },
            'features': {
                'max_members': 50,
                'max_projects': -1,  # Unlimited
                'max_guests': 20,
                'max_storage_gb': 100,
                'max_integrations': -1,  # Unlimited
                'api_access': True,
                'webhooks': True,
                'custom_views': True,
                'time_tracking': True,
                'advanced_analytics': True,
                'automation': True,
                'custom_fields': True,
                'priority_support': True,
            }
        },
        {
            'plan': {
                'name': 'Enterprise',
                'slug': 'enterprise',
                'plan_type': 'enterprise',
                'billing_cycle': 'yearly',
                'price': 0,  # Custom pricing
                'description': 'For large organizations',
                'sort_order': 4,
                'is_public': False,  # Contact sales
            },
            'features': {
                'max_members': -1,  # Unlimited
                'max_projects': -1,  # Unlimited
                'max_guests': -1,  # Unlimited
                'max_storage_gb': -1,  # Unlimited
                'max_integrations': -1,  # Unlimited
                'api_access': True,
                'webhooks': True,
                'custom_views': True,
                'time_tracking': True,
                'advanced_analytics': True,
                'automation': True,
                'custom_fields': True,
                'sso': True,
                'audit_logs': True,
                'advanced_permissions': True,
                'priority_support': True,
                'dedicated_support': True,
            }
        },
    ]

    for config in plans_config:
        plan = Plan.objects.create(**config['plan'])

        for feature_key, value in config['features'].items():
            feature = features[feature_key]

            if feature.feature_type == 'boolean':
                PlanFeature.objects.create(
                    plan=plan,
                    feature=feature,
                    is_enabled=value
                )
            elif feature.feature_type == 'limit':
                PlanFeature.objects.create(
                    plan=plan,
                    feature=feature,
                    limit_value=value
                )


class Migration(migrations.Migration):
    dependencies = [
        ('plane', 'previous_migration'),
    ]

    operations = [
        migrations.RunPython(create_default_plans),
    ]
```

---

## Backend Implementation

### Subscription Service

```python
# apps/api/plane/bgtasks/subscription_service.py

from typing import Optional, Dict, Any, List
from django.db import transaction
from django.utils import timezone
from django.core.cache import cache
from plane.db.models import (
    WorkspaceSubscription,
    Plan,
    Feature,
    PlanFeature,
    UsageMetric,
    Workspace
)

class SubscriptionService:
    """Service for managing subscriptions and checking entitlements"""

    CACHE_TTL = 300  # 5 minutes

    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.workspace = Workspace.objects.get(id=workspace_id)

    @property
    def subscription(self) -> Optional[WorkspaceSubscription]:
        """Get active subscription for workspace"""
        cache_key = f"subscription:{self.workspace_id}"
        subscription = cache.get(cache_key)

        if subscription is None:
            try:
                subscription = WorkspaceSubscription.objects.select_related('plan').get(
                    workspace_id=self.workspace_id,
                    status__in=['active', 'trialing']
                )
                cache.set(cache_key, subscription, self.CACHE_TTL)
            except WorkspaceSubscription.DoesNotExist:
                # Fall back to free plan
                free_plan = Plan.objects.get(plan_type='free')
                subscription = self._create_free_subscription(free_plan)

        return subscription

    def _create_free_subscription(self, plan: Plan) -> WorkspaceSubscription:
        """Create a free subscription for workspace"""
        now = timezone.now()
        subscription = WorkspaceSubscription.objects.create(
            workspace=self.workspace,
            plan=plan,
            status='active',
            current_period_start=now,
            current_period_end=now + timezone.timedelta(days=365)
        )
        return subscription

    def get_plan_features(self, plan_id: Optional[str] = None) -> Dict[str, Any]:
        """Get all features for a plan with their values"""
        if plan_id is None:
            plan_id = self.subscription.plan_id

        cache_key = f"plan_features:{plan_id}"
        features = cache.get(cache_key)

        if features is None:
            plan_features = PlanFeature.objects.filter(
                plan_id=plan_id
            ).select_related('feature')

            features = {}
            for pf in plan_features:
                feature_key = pf.feature.key
                if pf.feature.feature_type == 'boolean':
                    features[feature_key] = pf.is_enabled
                elif pf.feature.feature_type == 'limit':
                    features[feature_key] = pf.limit_value
                elif pf.feature.feature_type == 'unlimited':
                    features[feature_key] = -1  # -1 represents unlimited

            cache.set(cache_key, features, self.CACHE_TTL)

        return features

    def has_feature(self, feature_key: str) -> bool:
        """Check if current plan has a boolean feature enabled"""
        features = self.get_plan_features()
        return features.get(feature_key, False)

    def get_feature_limit(self, feature_key: str) -> int:
        """Get numeric limit for a feature (-1 means unlimited)"""
        features = self.get_plan_features()
        return features.get(feature_key, 0)

    def check_limit(self, feature_key: str, current_usage: Optional[int] = None) -> Dict[str, Any]:
        """
        Check if usage is within limits

        Returns:
            {
                'allowed': bool,
                'limit': int,
                'current': int,
                'remaining': int,
                'is_unlimited': bool
            }
        """
        limit = self.get_feature_limit(feature_key)

        # Get current usage if not provided
        if current_usage is None:
            current_usage = self._get_current_usage(feature_key)

        is_unlimited = limit == -1
        allowed = is_unlimited or current_usage < limit
        remaining = -1 if is_unlimited else max(0, limit - current_usage)

        return {
            'allowed': allowed,
            'limit': limit,
            'current': current_usage,
            'remaining': remaining,
            'is_unlimited': is_unlimited,
            'percentage_used': 0 if is_unlimited else (current_usage / limit * 100) if limit > 0 else 100
        }

    def _get_current_usage(self, feature_key: str) -> int:
        """Get current usage for a metric"""
        metric_type_map = {
            'max_members': 'members',
            'max_projects': 'projects',
            'max_guests': 'guests',
            'max_storage_gb': 'storage',
            'max_integrations': 'integrations',
        }

        metric_type = metric_type_map.get(feature_key)
        if not metric_type:
            return 0

        # Get from database or calculate
        if metric_type == 'members':
            from plane.db.models import WorkspaceMember
            return WorkspaceMember.objects.filter(workspace_id=self.workspace_id).count()

        elif metric_type == 'projects':
            from plane.db.models import Project
            return Project.objects.filter(workspace_id=self.workspace_id).count()

        elif metric_type == 'guests':
            from plane.db.models import WorkspaceMember
            return WorkspaceMember.objects.filter(
                workspace_id=self.workspace_id,
                role='guest'
            ).count()

        # For others, use UsageMetric model
        try:
            metric = UsageMetric.objects.get(
                workspace_id=self.workspace_id,
                metric_type=metric_type
            )
            return metric.current_value
        except UsageMetric.DoesNotExist:
            return 0

    def can_add_resource(self, feature_key: str) -> bool:
        """Check if user can add one more of a resource"""
        check_result = self.check_limit(feature_key)
        return check_result['allowed']

    def get_upgrade_suggestions(self) -> List[Dict[str, Any]]:
        """Get plan suggestions for upgrade based on current usage"""
        current_plan = self.subscription.plan
        current_features = self.get_plan_features()

        # Check which limits are being hit
        limits_hit = []
        for feature_key in ['max_members', 'max_projects', 'max_guests', 'max_storage_gb']:
            check = self.check_limit(feature_key)
            if check['percentage_used'] >= 80:  # 80% threshold
                limits_hit.append({
                    'feature': feature_key,
                    'usage': check['current'],
                    'limit': check['limit'],
                    'percentage': check['percentage_used']
                })

        # Find plans that would solve the limits
        suitable_plans = Plan.objects.filter(
            is_active=True,
            is_public=True,
            sort_order__gt=current_plan.sort_order
        ).order_by('sort_order')

        suggestions = []
        for plan in suitable_plans:
            plan_features = self.get_plan_features(plan.id)

            # Check if this plan solves the limits
            solves_limits = []
            for limit_hit in limits_hit:
                feature_key = limit_hit['feature']
                new_limit = plan_features.get(feature_key, 0)
                if new_limit == -1 or new_limit > limit_hit['limit']:
                    solves_limits.append(feature_key)

            if solves_limits:
                suggestions.append({
                    'plan': {
                        'id': str(plan.id),
                        'name': plan.name,
                        'price': float(plan.price),
                        'billing_cycle': plan.billing_cycle,
                    },
                    'solves': solves_limits,
                    'new_features': self._get_new_features(current_features, plan_features)
                })

        return suggestions

    def _get_new_features(self, current_features: Dict, new_plan_features: Dict) -> List[str]:
        """Get list of new features available in new plan"""
        new_features = []
        for feature_key, value in new_plan_features.items():
            if feature_key not in current_features or current_features[feature_key] != value:
                # Check if it's an improvement
                if isinstance(value, bool) and value and not current_features.get(feature_key, False):
                    new_features.append(feature_key)
                elif isinstance(value, int) and value > current_features.get(feature_key, 0):
                    new_features.append(feature_key)
        return new_features

    @transaction.atomic
    def upgrade_plan(self, new_plan_id: str, performed_by_id: str) -> WorkspaceSubscription:
        """Upgrade to a new plan"""
        new_plan = Plan.objects.get(id=new_plan_id)
        old_subscription = self.subscription

        # Update subscription
        old_subscription.plan = new_plan
        old_subscription.save()

        # Log the change
        from plane.db.models import SubscriptionHistory
        SubscriptionHistory.objects.create(
            workspace=self.workspace,
            from_plan=old_subscription.plan,
            to_plan=new_plan,
            action='upgraded',
            amount=new_plan.price,
            performed_by_id=performed_by_id,
        )

        # Clear cache
        cache.delete(f"subscription:{self.workspace_id}")
        cache.delete(f"plan_features:{old_subscription.plan_id}")

        return old_subscription

    def update_usage_metric(self, metric_type: str, value: int):
        """Update a usage metric"""
        now = timezone.now()
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Calculate period end (first day of next month)
        if period_start.month == 12:
            period_end = period_start.replace(year=period_start.year + 1, month=1)
        else:
            period_end = period_start.replace(month=period_start.month + 1)

        UsageMetric.objects.update_or_create(
            workspace_id=self.workspace_id,
            metric_type=metric_type,
            period_start=period_start,
            defaults={
                'current_value': value,
                'period_end': period_end,
            }
        )
```

### Middleware for Feature Checking

```python
# apps/api/plane/middleware/subscription_middleware.py

from django.http import JsonResponse
from plane.bgtasks.subscription_service import SubscriptionService

class SubscriptionMiddleware:
    """Middleware to check subscription limits"""

    # Endpoints that require feature checks
    FEATURE_ENDPOINTS = {
        '/api/workspaces/{workspace_slug}/analytics/': 'advanced_analytics',
        '/api/workspaces/{workspace_slug}/automations/': 'automation',
        '/api/workspaces/{workspace_slug}/sso/': 'sso',
    }

    # Endpoints that require limit checks
    LIMIT_ENDPOINTS = {
        'POST': {
            '/api/workspaces/{workspace_slug}/projects/': 'max_projects',
            '/api/workspaces/{workspace_slug}/members/': 'max_members',
        }
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if endpoint requires subscription check
        if self._requires_feature_check(request):
            response = self._check_feature_access(request)
            if response:
                return response

        if self._requires_limit_check(request):
            response = self._check_limit(request)
            if response:
                return response

        return self.get_response(request)

    def _requires_feature_check(self, request) -> bool:
        """Check if endpoint requires feature access"""
        path = request.path
        for endpoint_pattern in self.FEATURE_ENDPOINTS.keys():
            if self._matches_pattern(path, endpoint_pattern):
                return True
        return False

    def _requires_limit_check(self, request) -> bool:
        """Check if endpoint requires limit check"""
        method = request.method
        path = request.path

        if method in self.LIMIT_ENDPOINTS:
            for endpoint_pattern in self.LIMIT_ENDPOINTS[method].keys():
                if self._matches_pattern(path, endpoint_pattern):
                    return True
        return False

    def _matches_pattern(self, path: str, pattern: str) -> bool:
        """Simple pattern matching for URLs"""
        # Replace {workspace_slug} with regex pattern
        import re
        regex_pattern = pattern.replace('{workspace_slug}', r'[^/]+')
        return bool(re.match(f"^{regex_pattern}$", path))

    def _check_feature_access(self, request):
        """Check if workspace has access to feature"""
        workspace_slug = self._extract_workspace_slug(request.path)
        if not workspace_slug:
            return None

        from plane.db.models import Workspace
        try:
            workspace = Workspace.objects.get(slug=workspace_slug)
        except Workspace.DoesNotExist:
            return None

        subscription_service = SubscriptionService(str(workspace.id))

        # Find which feature to check
        feature_key = None
        for pattern, feature in self.FEATURE_ENDPOINTS.items():
            if self._matches_pattern(request.path, pattern):
                feature_key = feature
                break

        if not feature_key:
            return None

        if not subscription_service.has_feature(feature_key):
            return JsonResponse({
                'error': 'FEATURE_NOT_AVAILABLE',
                'message': f'This feature is not available in your current plan',
                'feature': feature_key,
                'upgrade_required': True,
                'suggestions': subscription_service.get_upgrade_suggestions()
            }, status=403)

        return None

    def _check_limit(self, request):
        """Check if workspace is within limits"""
        workspace_slug = self._extract_workspace_slug(request.path)
        if not workspace_slug:
            return None

        from plane.db.models import Workspace
        try:
            workspace = Workspace.objects.get(slug=workspace_slug)
        except Workspace.DoesNotExist:
            return None

        subscription_service = SubscriptionService(str(workspace.id))

        # Find which limit to check
        limit_key = None
        method = request.method
        if method in self.LIMIT_ENDPOINTS:
            for pattern, limit in self.LIMIT_ENDPOINTS[method].items():
                if self._matches_pattern(request.path, pattern):
                    limit_key = limit
                    break

        if not limit_key:
            return None

        check_result = subscription_service.check_limit(limit_key)
        if not check_result['allowed']:
            return JsonResponse({
                'error': 'LIMIT_EXCEEDED',
                'message': f'You have reached the limit for this resource',
                'limit': check_result['limit'],
                'current': check_result['current'],
                'upgrade_required': True,
                'suggestions': subscription_service.get_upgrade_suggestions()
            }, status=403)

        return None

    def _extract_workspace_slug(self, path: str) -> Optional[str]:
        """Extract workspace slug from URL"""
        import re
        match = re.search(r'/workspaces/([^/]+)/', path)
        return match.group(1) if match else None
```

This is part 1 of the implementation guide. Should I continue with the API endpoints, frontend implementation, and billing integration?
