# Subscription API Endpoints

## Overview

This document details the REST API endpoints for subscription management, building on the database schema and service layer from the main subscription implementation guide.

---

## API Endpoints

### 1. List Available Plans

```
GET /api/plans/
```

**Description**: Get all available subscription plans

**Response**:
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Free",
      "slug": "free",
      "plan_type": "free",
      "billing_cycle": "monthly",
      "price": "0.00",
      "currency": "USD",
      "description": "Perfect for small teams getting started",
      "is_public": true,
      "features": {
        "max_members": 5,
        "max_projects": 3,
        "max_guests": 2,
        "max_storage_gb": 1,
        "api_access": true
      }
    },
    {
      "id": "uuid",
      "name": "Starter",
      "slug": "starter-monthly",
      "plan_type": "starter",
      "billing_cycle": "monthly",
      "price": "8.00",
      "currency": "USD",
      "description": "For growing teams",
      "is_public": true,
      "features": {
        "max_members": 15,
        "max_projects": 10,
        "max_guests": 5,
        "max_storage_gb": 10,
        "api_access": true,
        "webhooks": true,
        "custom_views": true,
        "time_tracking": true
      }
    }
  ]
}
```

**Implementation**:
```python
# apps/api/plane/api/views/subscription.py

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from plane.db.models import Plan, PlanFeature
from plane.api.serializers import PlanSerializer

@api_view(['GET'])
def list_plans(request):
    """List all available subscription plans"""
    plans = Plan.objects.filter(
        is_active=True,
        is_public=True
    ).prefetch_related('plan_features__feature').order_by('sort_order')

    plans_data = []
    for plan in plans:
        # Serialize plan
        plan_data = PlanSerializer(plan).data

        # Add features
        features = {}
        for pf in plan.plan_features.all():
            if pf.feature.feature_type == 'boolean':
                features[pf.feature.key] = pf.is_enabled
            elif pf.feature.feature_type == 'limit':
                features[pf.feature.key] = pf.limit_value

        plan_data['features'] = features
        plans_data.append(plan_data)

    return Response({'plans': plans_data})
```

---

### 2. Get Current Subscription

```
GET /api/workspaces/{workspace_slug}/subscription/
```

**Description**: Get current workspace subscription details

**Response**:
```json
{
  "subscription": {
    "id": "uuid",
    "status": "active",
    "plan": {
      "id": "uuid",
      "name": "Starter",
      "slug": "starter-monthly",
      "price": "8.00",
      "billing_cycle": "monthly"
    },
    "current_period_start": "2025-01-01T00:00:00Z",
    "current_period_end": "2025-02-01T00:00:00Z",
    "cancel_at_period_end": false,
    "trial_end": null
  },
  "features": {
    "max_members": 15,
    "max_projects": 10,
    "custom_views": true,
    "advanced_analytics": false
  },
  "usage": {
    "members": {
      "current": 8,
      "limit": 15,
      "percentage_used": 53.33,
      "is_unlimited": false
    },
    "projects": {
      "current": 5,
      "limit": 10,
      "percentage_used": 50.0,
      "is_unlimited": false
    }
  }
}
```

**Implementation**:
```python
from rest_framework.views import APIView
from plane.bgtasks.subscription_service import SubscriptionService

class WorkspaceSubscriptionView(APIView):
    """Get workspace subscription details"""

    def get(self, request, workspace_slug):
        workspace = Workspace.objects.get(slug=workspace_slug)
        subscription_service = SubscriptionService(str(workspace.id))

        subscription = subscription_service.subscription
        features = subscription_service.get_plan_features()

        # Calculate usage for key metrics
        usage = {}
        for metric_key in ['max_members', 'max_projects', 'max_guests', 'max_storage_gb']:
            usage[metric_key.replace('max_', '')] = subscription_service.check_limit(metric_key)

        return Response({
            'subscription': {
                'id': str(subscription.id),
                'status': subscription.status,
                'plan': {
                    'id': str(subscription.plan.id),
                    'name': subscription.plan.name,
                    'slug': subscription.plan.slug,
                    'price': str(subscription.plan.price),
                    'billing_cycle': subscription.plan.billing_cycle,
                },
                'current_period_start': subscription.current_period_start,
                'current_period_end': subscription.current_period_end,
                'cancel_at_period_end': subscription.cancel_at_period_end,
                'trial_end': subscription.trial_end,
            },
            'features': features,
            'usage': usage,
        })
```

---

### 3. Check Feature Access

```
POST /api/workspaces/{workspace_slug}/subscription/check-feature/
```

**Description**: Check if workspace has access to a specific feature

**Request**:
```json
{
  "feature_key": "advanced_analytics"
}
```

**Response**:
```json
{
  "has_access": false,
  "feature": {
    "key": "advanced_analytics",
    "name": "Advanced Analytics",
    "description": "Access to detailed analytics and insights"
  },
  "upgrade_required": true,
  "suggestions": [
    {
      "plan": {
        "id": "uuid",
        "name": "Professional",
        "price": 16.00,
        "billing_cycle": "monthly"
      },
      "includes_feature": true
    }
  ]
}
```

**Implementation**:
```python
class CheckFeatureAccessView(APIView):
    """Check if workspace has access to a feature"""

    def post(self, request, workspace_slug):
        feature_key = request.data.get('feature_key')

        if not feature_key:
            return Response(
                {'error': 'feature_key is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        workspace = Workspace.objects.get(slug=workspace_slug)
        subscription_service = SubscriptionService(str(workspace.id))

        has_access = subscription_service.has_feature(feature_key)

        # Get feature details
        try:
            feature = Feature.objects.get(key=feature_key)
        except Feature.DoesNotExist:
            return Response(
                {'error': 'Invalid feature key'},
                status=status.HTTP_404_NOT_FOUND
            )

        response_data = {
            'has_access': has_access,
            'feature': {
                'key': feature.key,
                'name': feature.name,
                'description': feature.description,
            }
        }

        if not has_access:
            # Get upgrade suggestions
            suggestions = subscription_service.get_upgrade_suggestions()
            response_data['upgrade_required'] = True
            response_data['suggestions'] = suggestions

        return Response(response_data)
```

---

### 4. Check Resource Limit

```
POST /api/workspaces/{workspace_slug}/subscription/check-limit/
```

**Description**: Check if workspace can add more of a resource

**Request**:
```json
{
  "resource_type": "projects"
}
```

**Response**:
```json
{
  "allowed": true,
  "limit": 10,
  "current": 5,
  "remaining": 5,
  "percentage_used": 50.0,
  "is_unlimited": false
}
```

**Implementation**:
```python
class CheckResourceLimitView(APIView):
    """Check if workspace can add more of a resource"""

    def post(self, request, workspace_slug):
        resource_type = request.data.get('resource_type')

        # Map resource types to feature keys
        resource_map = {
            'members': 'max_members',
            'projects': 'max_projects',
            'guests': 'max_guests',
            'storage': 'max_storage_gb',
            'integrations': 'max_integrations',
        }

        feature_key = resource_map.get(resource_type)
        if not feature_key:
            return Response(
                {'error': 'Invalid resource type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        workspace = Workspace.objects.get(slug=workspace_slug)
        subscription_service = SubscriptionService(str(workspace.id))

        check_result = subscription_service.check_limit(feature_key)

        return Response(check_result)
```

---

### 5. Upgrade Plan

```
POST /api/workspaces/{workspace_slug}/subscription/upgrade/
```

**Description**: Upgrade workspace to a new plan

**Request**:
```json
{
  "plan_id": "uuid",
  "payment_method_id": "pm_xxx"  // Stripe payment method
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "status": "active",
    "plan": {
      "name": "Professional",
      "price": "16.00"
    }
  },
  "message": "Successfully upgraded to Professional plan"
}
```

**Implementation**:
```python
class UpgradeSubscriptionView(APIView):
    """Upgrade workspace subscription"""

    def post(self, request, workspace_slug):
        plan_id = request.data.get('plan_id')
        payment_method_id = request.data.get('payment_method_id')

        if not plan_id:
            return Response(
                {'error': 'plan_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        workspace = Workspace.objects.get(slug=workspace_slug)

        # Check user has permission to upgrade
        # (Add permission check here)

        subscription_service = SubscriptionService(str(workspace.id))
        new_plan = Plan.objects.get(id=plan_id)

        # If upgrading from free or current plan is cheaper
        current_subscription = subscription_service.subscription
        needs_payment = new_plan.price > 0

        if needs_payment and not payment_method_id:
            return Response(
                {'error': 'payment_method_id required for paid plans'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Process payment with Stripe if needed
            if needs_payment:
                from plane.bgtasks.billing_service import BillingService
                billing_service = BillingService(str(workspace.id))
                subscription = billing_service.create_or_update_subscription(
                    plan_id=plan_id,
                    payment_method_id=payment_method_id
                )
            else:
                # Free plan, just update
                subscription = subscription_service.upgrade_plan(
                    new_plan_id=plan_id,
                    performed_by_id=str(request.user.id)
                )

            return Response({
                'success': True,
                'subscription': {
                    'id': str(subscription.id),
                    'status': subscription.status,
                    'plan': {
                        'name': subscription.plan.name,
                        'price': str(subscription.plan.price),
                    }
                },
                'message': f'Successfully upgraded to {subscription.plan.name} plan'
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
```

---

### 6. Cancel Subscription

```
POST /api/workspaces/{workspace_slug}/subscription/cancel/
```

**Description**: Cancel subscription at period end

**Request**:
```json
{
  "cancel_at_period_end": true,
  "reason": "Too expensive"
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "status": "active",
    "cancel_at_period_end": true,
    "current_period_end": "2025-02-01T00:00:00Z"
  },
  "message": "Your subscription will be canceled on 2025-02-01"
}
```

---

### 7. Get Usage History

```
GET /api/workspaces/{workspace_slug}/subscription/usage-history/
```

**Description**: Get historical usage metrics

**Query Parameters**:
- `metric_type`: Type of metric (members, projects, storage, etc.)
- `start_date`: Start date for history (ISO 8601)
- `end_date`: End date for history (ISO 8601)

**Response**:
```json
{
  "metric_type": "members",
  "data": [
    {
      "period_start": "2025-01-01T00:00:00Z",
      "period_end": "2025-02-01T00:00:00Z",
      "value": 8
    },
    {
      "period_start": "2024-12-01T00:00:00Z",
      "period_end": "2025-01-01T00:00:00Z",
      "value": 5
    }
  ]
}
```

---

### 8. Get Billing History

```
GET /api/workspaces/{workspace_slug}/subscription/billing-history/
```

**Description**: Get subscription billing history

**Response**:
```json
{
  "invoices": [
    {
      "id": "uuid",
      "amount": "16.00",
      "currency": "USD",
      "status": "paid",
      "invoice_pdf": "https://...",
      "created_at": "2025-01-01T00:00:00Z",
      "period_start": "2025-01-01T00:00:00Z",
      "period_end": "2025-02-01T00:00:00Z"
    }
  ]
}
```

---

## Serializers

```python
# apps/api/plane/api/serializers/subscription.py

from rest_framework import serializers
from plane.db.models import Plan, Feature, WorkspaceSubscription

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'key', 'name', 'description', 'feature_type', 'category']


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'slug', 'plan_type', 'billing_cycle',
            'price', 'currency', 'description', 'sort_order'
        ]


class WorkspaceSubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)

    class Meta:
        model = WorkspaceSubscription
        fields = [
            'id', 'status', 'plan', 'trial_start', 'trial_end',
            'current_period_start', 'current_period_end',
            'cancel_at_period_end', 'created_at', 'updated_at'
        ]
```

---

## URL Configuration

```python
# apps/api/plane/api/urls.py

from django.urls import path
from plane.api.views import subscription as subscription_views

urlpatterns = [
    # Public endpoints
    path('plans/', subscription_views.list_plans, name='list-plans'),

    # Workspace subscription endpoints
    path(
        'workspaces/<str:workspace_slug>/subscription/',
        subscription_views.WorkspaceSubscriptionView.as_view(),
        name='workspace-subscription'
    ),
    path(
        'workspaces/<str:workspace_slug>/subscription/check-feature/',
        subscription_views.CheckFeatureAccessView.as_view(),
        name='check-feature-access'
    ),
    path(
        'workspaces/<str:workspace_slug>/subscription/check-limit/',
        subscription_views.CheckResourceLimitView.as_view(),
        name='check-resource-limit'
    ),
    path(
        'workspaces/<str:workspace_slug>/subscription/upgrade/',
        subscription_views.UpgradeSubscriptionView.as_view(),
        name='upgrade-subscription'
    ),
    path(
        'workspaces/<str:workspace_slug>/subscription/cancel/',
        subscription_views.CancelSubscriptionView.as_view(),
        name='cancel-subscription'
    ),
    path(
        'workspaces/<str:workspace_slug>/subscription/usage-history/',
        subscription_views.UsageHistoryView.as_view(),
        name='usage-history'
    ),
    path(
        'workspaces/<str:workspace_slug>/subscription/billing-history/',
        subscription_views.BillingHistoryView.as_view(),
        name='billing-history'
    ),
]
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FEATURE_NOT_AVAILABLE` | 403 | Feature not in current plan |
| `LIMIT_EXCEEDED` | 403 | Resource limit reached |
| `INVALID_PLAN` | 400 | Plan ID is invalid |
| `PAYMENT_REQUIRED` | 402 | Payment method required |
| `SUBSCRIPTION_NOT_FOUND` | 404 | No subscription found |
| `INVALID_PAYMENT_METHOD` | 400 | Payment method invalid |

### Example Error Response

```json
{
  "error": "LIMIT_EXCEEDED",
  "message": "You have reached the maximum number of projects for your plan",
  "details": {
    "resource": "projects",
    "current": 10,
    "limit": 10,
    "upgrade_required": true,
    "suggestions": [
      {
        "plan": {
          "name": "Professional",
          "price": "16.00"
        },
        "new_limit": -1
      }
    ]
  }
}
```

---

## Webhook Endpoints

### Stripe Webhook Handler

```
POST /api/webhooks/stripe/
```

**Description**: Handle Stripe webhook events

**Events Handled**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Implementation**:
```python
import stripe
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

@csrf_exempt
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    # Handle the event
    if event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription)

    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_payment_succeeded(invoice)

    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        handle_payment_failed(invoice)

    return HttpResponse(status=200)


def handle_subscription_updated(stripe_subscription):
    """Update local subscription from Stripe data"""
    try:
        subscription = WorkspaceSubscription.objects.get(
            stripe_subscription_id=stripe_subscription['id']
        )
        subscription.status = stripe_subscription['status']
        subscription.current_period_start = datetime.fromtimestamp(
            stripe_subscription['current_period_start']
        )
        subscription.current_period_end = datetime.fromtimestamp(
            stripe_subscription['current_period_end']
        )
        subscription.save()
    except WorkspaceSubscription.DoesNotExist:
        pass  # Log error
```

---

## Rate Limiting

Apply rate limiting to sensitive endpoints:

```python
from rest_framework.throttling import UserRateThrottle

class SubscriptionRateThrottle(UserRateThrottle):
    rate = '10/hour'  # 10 requests per hour for upgrades

class UpgradeSubscriptionView(APIView):
    throttle_classes = [SubscriptionRateThrottle]
    # ...
```

---

## Caching Strategy

Cache expensive queries:

```python
from django.core.cache import cache

def get_plan_features(plan_id):
    cache_key = f"plan_features:{plan_id}"
    features = cache.get(cache_key)

    if features is None:
        # Fetch from database
        features = PlanFeature.objects.filter(plan_id=plan_id)
        cache.set(cache_key, features, 300)  # Cache for 5 minutes

    return features
```

---

## Next Steps

- Implement billing integration (see `billing-integration.md`)
- Build frontend components (see `subscription-frontend.md`)
- Set up Stripe webhooks
- Add monitoring and alerts for failed payments
- Implement grace periods for expired subscriptions
