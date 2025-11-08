# Billing Integration & Migration Guide

## Overview

This guide covers Stripe integration, migration strategies, and best practices for implementing subscription billing in Plane.

---

## Table of Contents

1. [Stripe Integration](#stripe-integration)
2. [Webhook Handling](#webhook-handling)
3. [Migration Strategy](#migration-strategy)
4. [Testing Strategy](#testing-strategy)
5. [Security Considerations](#security-considerations)
6. [Best Practices](#best-practices)

---

## Stripe Integration

### Setup

```python
# apps/api/plane/bgtasks/billing_service.py

import stripe
from django.conf import settings
from plane.db.models import WorkspaceSubscription, Plan
from datetime import datetime

stripe.api_key = settings.STRIPE_SECRET_KEY

class BillingService:
    """Service for managing Stripe billing"""

    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.workspace = Workspace.objects.get(id=workspace_id)

    def create_or_get_customer(self, user) -> str:
        """Create or retrieve Stripe customer"""
        subscription = WorkspaceSubscription.objects.filter(
            workspace_id=self.workspace_id
        ).first()

        # Return existing customer if available
        if subscription and subscription.stripe_customer_id:
            return subscription.stripe_customer_id

        # Create new customer
        customer = stripe.Customer.create(
            email=user.email,
            name=self.workspace.name,
            metadata={
                'workspace_id': str(self.workspace_id),
                'workspace_slug': self.workspace.slug,
            }
        )

        return customer.id

    def attach_payment_method(
        self,
        payment_method_id: str,
        customer_id: str
    ) -> None:
        """Attach payment method to customer"""
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id,
        )

        # Set as default payment method
        stripe.Customer.modify(
            customer_id,
            invoice_settings={
                'default_payment_method': payment_method_id,
            }
        )

    def create_or_update_subscription(
        self,
        plan_id: str,
        payment_method_id: str,
        user
    ) -> WorkspaceSubscription:
        """Create or update Stripe subscription"""
        plan = Plan.objects.get(id=plan_id)

        # Get or create customer
        customer_id = self.create_or_get_customer(user)

        # Attach payment method
        self.attach_payment_method(payment_method_id, customer_id)

        # Get existing subscription if any
        workspace_subscription = WorkspaceSubscription.objects.filter(
            workspace_id=self.workspace_id
        ).first()

        if workspace_subscription and workspace_subscription.stripe_subscription_id:
            # Update existing subscription
            stripe_subscription = stripe.Subscription.modify(
                workspace_subscription.stripe_subscription_id,
                items=[{
                    'id': stripe_subscription['items']['data'][0]['id'],
                    'price': plan.stripe_price_id,
                }],
                proration_behavior='create_prorations',  # Prorate the difference
            )
        else:
            # Create new subscription
            stripe_subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{
                    'price': plan.stripe_price_id,
                }],
                expand=['latest_invoice.payment_intent'],
                metadata={
                    'workspace_id': str(self.workspace_id),
                    'plan_id': str(plan.id),
                }
            )

        # Update or create local subscription
        workspace_subscription, created = WorkspaceSubscription.objects.update_or_create(
            workspace_id=self.workspace_id,
            defaults={
                'plan': plan,
                'status': stripe_subscription['status'],
                'stripe_subscription_id': stripe_subscription['id'],
                'stripe_customer_id': customer_id,
                'current_period_start': datetime.fromtimestamp(
                    stripe_subscription['current_period_start']
                ),
                'current_period_end': datetime.fromtimestamp(
                    stripe_subscription['current_period_end']
                ),
            }
        )

        return workspace_subscription

    def cancel_subscription(
        self,
        cancel_at_period_end: bool = True
    ) -> WorkspaceSubscription:
        """Cancel Stripe subscription"""
        subscription = WorkspaceSubscription.objects.get(
            workspace_id=self.workspace_id
        )

        if not subscription.stripe_subscription_id:
            raise ValueError("No Stripe subscription found")

        stripe_subscription = stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=cancel_at_period_end,
        )

        subscription.cancel_at_period_end = cancel_at_period_end
        if not cancel_at_period_end:
            subscription.status = 'canceled'
            subscription.canceled_at = datetime.now()
        subscription.save()

        return subscription

    def create_portal_session(self, return_url: str) -> str:
        """Create Stripe customer portal session"""
        subscription = WorkspaceSubscription.objects.get(
            workspace_id=self.workspace_id
        )

        if not subscription.stripe_customer_id:
            raise ValueError("No Stripe customer found")

        session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=return_url,
        )

        return session.url

    def get_invoices(self, limit: int = 100):
        """Get customer invoices"""
        subscription = WorkspaceSubscription.objects.get(
            workspace_id=self.workspace_id
        )

        if not subscription.stripe_customer_id:
            return []

        invoices = stripe.Invoice.list(
            customer=subscription.stripe_customer_id,
            limit=limit
        )

        return invoices.data

    def preview_upgrade(self, new_plan_id: str) -> dict:
        """Preview cost of upgrading to a new plan"""
        subscription = WorkspaceSubscription.objects.get(
            workspace_id=self.workspace_id
        )

        new_plan = Plan.objects.get(id=new_plan_id)

        if not subscription.stripe_subscription_id:
            # No existing subscription, just return new plan price
            return {
                'amount_due': float(new_plan.price),
                'proration_amount': 0,
                'next_invoice_date': None,
            }

        # Get upcoming invoice with new price
        upcoming_invoice = stripe.Invoice.upcoming(
            customer=subscription.stripe_customer_id,
            subscription=subscription.stripe_subscription_id,
            subscription_items=[{
                'id': subscription.stripe_subscription_id,
                'price': new_plan.stripe_price_id,
            }],
        )

        return {
            'amount_due': upcoming_invoice.amount_due / 100,  # Convert from cents
            'proration_amount': upcoming_invoice.starting_balance / 100,
            'next_invoice_date': datetime.fromtimestamp(
                upcoming_invoice.next_payment_attempt
            ) if upcoming_invoice.next_payment_attempt else None,
        }
```

---

## Webhook Handling

### Webhook Processor

```python
# apps/api/plane/api/views/webhooks.py

import stripe
import logging
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.conf import settings
from plane.db.models import WorkspaceSubscription, SubscriptionHistory
from datetime import datetime

logger = logging.getLogger(__name__)

@csrf_exempt
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return HttpResponse(status=400)

    # Handle the event
    handler = StripeWebhookHandler()

    event_type = event['type']
    if event_type == 'customer.subscription.created':
        handler.handle_subscription_created(event['data']['object'])

    elif event_type == 'customer.subscription.updated':
        handler.handle_subscription_updated(event['data']['object'])

    elif event_type == 'customer.subscription.deleted':
        handler.handle_subscription_deleted(event['data']['object'])

    elif event_type == 'invoice.payment_succeeded':
        handler.handle_payment_succeeded(event['data']['object'])

    elif event_type == 'invoice.payment_failed':
        handler.handle_payment_failed(event['data']['object'])

    elif event_type == 'customer.subscription.trial_will_end':
        handler.handle_trial_will_end(event['data']['object'])

    else:
        logger.info(f"Unhandled event type: {event_type}")

    return HttpResponse(status=200)


class StripeWebhookHandler:
    """Handler for Stripe webhook events"""

    def handle_subscription_created(self, stripe_subscription):
        """Handle subscription created event"""
        workspace_id = stripe_subscription['metadata'].get('workspace_id')
        plan_id = stripe_subscription['metadata'].get('plan_id')

        if not workspace_id or not plan_id:
            logger.error("Missing workspace_id or plan_id in metadata")
            return

        try:
            subscription = WorkspaceSubscription.objects.get(
                workspace_id=workspace_id
            )

            subscription.stripe_subscription_id = stripe_subscription['id']
            subscription.status = stripe_subscription['status']
            subscription.current_period_start = datetime.fromtimestamp(
                stripe_subscription['current_period_start']
            )
            subscription.current_period_end = datetime.fromtimestamp(
                stripe_subscription['current_period_end']
            )

            if stripe_subscription.get('trial_end'):
                subscription.trial_end = datetime.fromtimestamp(
                    stripe_subscription['trial_end']
                )

            subscription.save()

            logger.info(f"Updated subscription for workspace {workspace_id}")

        except WorkspaceSubscription.DoesNotExist:
            logger.error(f"Subscription not found for workspace {workspace_id}")

    def handle_subscription_updated(self, stripe_subscription):
        """Handle subscription updated event"""
        try:
            subscription = WorkspaceSubscription.objects.get(
                stripe_subscription_id=stripe_subscription['id']
            )

            old_status = subscription.status
            subscription.status = stripe_subscription['status']
            subscription.current_period_start = datetime.fromtimestamp(
                stripe_subscription['current_period_start']
            )
            subscription.current_period_end = datetime.fromtimestamp(
                stripe_subscription['current_period_end']
            )
            subscription.cancel_at_period_end = stripe_subscription.get(
                'cancel_at_period_end', False
            )

            if stripe_subscription.get('canceled_at'):
                subscription.canceled_at = datetime.fromtimestamp(
                    stripe_subscription['canceled_at']
                )

            subscription.save()

            # Log the change
            if old_status != subscription.status:
                SubscriptionHistory.objects.create(
                    workspace=subscription.workspace,
                    from_plan=subscription.plan,
                    to_plan=subscription.plan,
                    action=f'status_changed_{subscription.status}',
                    metadata={'old_status': old_status, 'new_status': subscription.status}
                )

            logger.info(
                f"Updated subscription {subscription.id} status: "
                f"{old_status} -> {subscription.status}"
            )

        except WorkspaceSubscription.DoesNotExist:
            logger.error(
                f"Subscription not found: {stripe_subscription['id']}"
            )

    def handle_subscription_deleted(self, stripe_subscription):
        """Handle subscription deleted event"""
        try:
            subscription = WorkspaceSubscription.objects.get(
                stripe_subscription_id=stripe_subscription['id']
            )

            subscription.status = 'canceled'
            subscription.ended_at = datetime.now()
            subscription.save()

            # Downgrade to free plan
            free_plan = Plan.objects.get(plan_type='free')
            subscription.plan = free_plan
            subscription.save()

            SubscriptionHistory.objects.create(
                workspace=subscription.workspace,
                from_plan=subscription.plan,
                to_plan=free_plan,
                action='downgraded_to_free',
                notes='Subscription canceled'
            )

            logger.info(f"Subscription canceled for workspace {subscription.workspace_id}")

        except WorkspaceSubscription.DoesNotExist:
            logger.error(f"Subscription not found: {stripe_subscription['id']}")

    def handle_payment_succeeded(self, invoice):
        """Handle successful payment"""
        subscription_id = invoice.get('subscription')
        if not subscription_id:
            return

        try:
            subscription = WorkspaceSubscription.objects.get(
                stripe_subscription_id=subscription_id
            )

            # Update subscription status if it was past_due
            if subscription.status == 'past_due':
                subscription.status = 'active'
                subscription.save()

            logger.info(f"Payment succeeded for subscription {subscription.id}")

            # TODO: Send success email to workspace owner

        except WorkspaceSubscription.DoesNotExist:
            logger.error(f"Subscription not found: {subscription_id}")

    def handle_payment_failed(self, invoice):
        """Handle failed payment"""
        subscription_id = invoice.get('subscription')
        if not subscription_id:
            return

        try:
            subscription = WorkspaceSubscription.objects.get(
                stripe_subscription_id=subscription_id
            )

            subscription.status = 'past_due'
            subscription.save()

            logger.warning(f"Payment failed for subscription {subscription.id}")

            # TODO: Send payment failed email with action required

        except WorkspaceSubscription.DoesNotExist:
            logger.error(f"Subscription not found: {subscription_id}")

    def handle_trial_will_end(self, stripe_subscription):
        """Handle trial ending soon (3 days before)"""
        try:
            subscription = WorkspaceSubscription.objects.get(
                stripe_subscription_id=stripe_subscription['id']
            )

            logger.info(f"Trial ending soon for subscription {subscription.id}")

            # TODO: Send trial ending soon email

        except WorkspaceSubscription.DoesNotExist:
            logger.error(f"Subscription not found: {stripe_subscription['id']}")
```

---

## Migration Strategy

### Phase 1: Database Migration

```python
# Create migrations for subscription models
python manage.py makemigrations
python manage.py migrate

# Seed default plans and features
python manage.py seed_subscription_plans
```

### Phase 2: Existing Workspaces Migration

```python
# apps/api/plane/management/commands/migrate_workspaces_to_subscriptions.py

from django.core.management.base import BaseCommand
from plane.db.models import Workspace, WorkspaceSubscription, Plan
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Migrate existing workspaces to subscription model'

    def handle(self, *args, **options):
        free_plan = Plan.objects.get(plan_type='free')
        migrated_count = 0

        workspaces = Workspace.objects.all()

        for workspace in workspaces:
            # Check if subscription already exists
            if WorkspaceSubscription.objects.filter(workspace=workspace).exists():
                continue

            # Create free subscription for existing workspace
            now = datetime.now()
            WorkspaceSubscription.objects.create(
                workspace=workspace,
                plan=free_plan,
                status='active',
                current_period_start=now,
                current_period_end=now + timedelta(days=365),
            )

            migrated_count += 1

            if migrated_count % 100 == 0:
                self.stdout.write(f"Migrated {migrated_count} workspaces...")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully migrated {migrated_count} workspaces to free plan"
            )
        )
```

### Phase 3: Feature Rollout

```python
# apps/api/plane/management/commands/enable_legacy_features.py

from django.core.management.base import BaseCommand
from plane.db.models import Workspace, WorkspaceSubscription, Plan

class Command(BaseCommand):
    help = 'Enable legacy features for existing paying customers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--workspace-ids',
            nargs='+',
            type=str,
            help='List of workspace IDs to upgrade',
        )

    def handle(self, *args, **options):
        workspace_ids = options.get('workspace_ids', [])

        if not workspace_ids:
            self.stdout.write(self.style.ERROR("No workspace IDs provided"))
            return

        professional_plan = Plan.objects.get(plan_type='professional')

        for workspace_id in workspace_ids:
            try:
                subscription = WorkspaceSubscription.objects.get(
                    workspace_id=workspace_id
                )

                subscription.plan = professional_plan
                subscription.save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Upgraded workspace {workspace_id} to Professional plan"
                    )
                )

            except WorkspaceSubscription.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f"Subscription not found for workspace {workspace_id}"
                    )
                )
```

### Phase 4: Gradual Feature Gating

1. **Week 1-2**: Deploy subscription system, all features remain enabled
2. **Week 3-4**: Start showing usage metrics and limits (soft limits)
3. **Week 5-6**: Enable upgrade prompts for users approaching limits
4. **Week 7+**: Enforce hard limits for new workspaces
5. **Week 8+**: Gradually enforce limits for existing workspaces (with grace period)

---

## Testing Strategy

### Unit Tests

```python
# apps/api/plane/tests/test_subscription_service.py

from django.test import TestCase
from plane.db.models import Workspace, Plan, WorkspaceSubscription
from plane.bgtasks.subscription_service import SubscriptionService

class SubscriptionServiceTestCase(TestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace"
        )

        self.free_plan = Plan.objects.create(
            name="Free",
            slug="free",
            plan_type="free",
            billing_cycle="monthly",
            price=0
        )

        self.pro_plan = Plan.objects.create(
            name="Professional",
            slug="professional",
            plan_type="professional",
            billing_cycle="monthly",
            price=16
        )

    def test_has_feature_boolean(self):
        """Test checking boolean feature access"""
        service = SubscriptionService(str(self.workspace.id))

        # Free plan should not have advanced analytics
        self.assertFalse(service.has_feature('advanced_analytics'))

    def test_check_limit(self):
        """Test checking resource limits"""
        service = SubscriptionService(str(self.workspace.id))

        # Create some projects
        for i in range(3):
            Project.objects.create(
                workspace=self.workspace,
                name=f"Project {i}"
            )

        # Check project limit (free plan allows 3)
        result = service.check_limit('max_projects')

        self.assertEqual(result['current'], 3)
        self.assertEqual(result['limit'], 3)
        self.assertFalse(result['allowed'])  # At limit
        self.assertEqual(result['percentage_used'], 100)

    def test_upgrade_plan(self):
        """Test upgrading to a new plan"""
        service = SubscriptionService(str(self.workspace.id))

        # Upgrade to pro plan
        user = User.objects.create(email="test@example.com")
        subscription = service.upgrade_plan(str(self.pro_plan.id), str(user.id))

        self.assertEqual(subscription.plan, self.pro_plan)
        self.assertEqual(subscription.status, 'active')
```

### Integration Tests

```python
# apps/api/plane/tests/test_subscription_api.py

from django.test import TestCase, Client
from django.contrib.auth import get_user_model

User = get_user_model()

class SubscriptionAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123"
        )
        self.client.login(email="test@example.com", password="testpass123")

    def test_get_subscription(self):
        """Test fetching workspace subscription"""
        response = self.client.get(
            f'/api/workspaces/{self.workspace.slug}/subscription/'
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('subscription', response.json())
        self.assertIn('features', response.json())
        self.assertIn('usage', response.json())

    def test_check_feature_access(self):
        """Test checking feature access"""
        response = self.client.post(
            f'/api/workspaces/{self.workspace.slug}/subscription/check-feature/',
            {'feature_key': 'advanced_analytics'},
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('has_access', data)
        self.assertFalse(data['has_access'])  # Free plan

    def test_upgrade_without_payment_method(self):
        """Test upgrade fails without payment method for paid plan"""
        pro_plan = Plan.objects.get(plan_type='professional')

        response = self.client.post(
            f'/api/workspaces/{self.workspace.slug}/subscription/upgrade/',
            {'plan_id': str(pro_plan.id)},
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('payment_method_id required', response.json()['error'])
```

### Stripe Webhook Tests

```python
import stripe
from django.test import TestCase
from unittest.mock import patch, MagicMock

class StripeWebhookTestCase(TestCase):
    @patch('stripe.Webhook.construct_event')
    def test_subscription_updated_webhook(self, mock_construct_event):
        """Test handling subscription updated webhook"""
        # Mock the Stripe event
        mock_event = {
            'type': 'customer.subscription.updated',
            'data': {
                'object': {
                    'id': 'sub_test123',
                    'status': 'active',
                    'current_period_start': 1234567890,
                    'current_period_end': 1234567890,
                }
            }
        }
        mock_construct_event.return_value = mock_event

        # Send webhook request
        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_signature'
        )

        self.assertEqual(response.status_code, 200)
```

---

## Security Considerations

### 1. Webhook Signature Verification

```python
# Always verify Stripe webhook signatures
try:
    event = stripe.Webhook.construct_event(
        payload, sig_header, webhook_secret
    )
except stripe.error.SignatureVerificationError:
    return HttpResponse(status=400)
```

### 2. Payment Method Storage

```python
# Never store raw card details
# Always use Stripe's tokenization

# Good: Use payment method ID
payment_method_id = 'pm_xxx'

# Bad: Never do this
card_number = '4242424242424242'  # ❌
```

### 3. Customer Data Protection

```python
# Encrypt sensitive data in database
from django.db import models
from encrypted_model_fields.fields import EncryptedCharField

class WorkspaceSubscription(models.Model):
    # Stripe IDs are safe to store
    stripe_customer_id = models.CharField(max_length=255)

    # Any PII should be encrypted
    billing_email = EncryptedCharField(max_length=255)
```

### 4. Rate Limiting

```python
# Protect upgrade endpoint from abuse
from rest_framework.throttling import UserRateThrottle

class UpgradeSubscriptionView(APIView):
    throttle_classes = [UserRateThrottle]
    throttle_scope = 'subscription_upgrade'

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'subscription_upgrade': '5/hour',
    }
}
```

---

## Best Practices

### 1. Graceful Degradation

```python
# Don't break existing functionality when limits are hit
# Instead, prompt for upgrade

def create_project(workspace_id, data):
    service = SubscriptionService(workspace_id)

    # Check limit
    can_create = service.can_add_resource('max_projects')

    if not can_create:
        # Don't fail silently, return upgrade prompt
        raise UpgradeRequiredException(
            message="Project limit reached",
            suggestions=service.get_upgrade_suggestions()
        )

    # Proceed with creation
    return Project.objects.create(workspace_id=workspace_id, **data)
```

### 2. Usage Tracking

```python
# Track usage in real-time
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Project)
def update_project_count(sender, instance, created, **kwargs):
    if created:
        service = SubscriptionService(str(instance.workspace_id))
        service.update_usage_metric('projects', Project.objects.filter(
            workspace_id=instance.workspace_id
        ).count())
```

### 3. Monitoring & Alerts

```python
# Monitor subscription events
import logging

logger = logging.getLogger('subscription')

def handle_payment_failed(invoice):
    workspace_id = get_workspace_from_invoice(invoice)

    logger.critical(
        f"Payment failed for workspace {workspace_id}",
        extra={
            'workspace_id': workspace_id,
            'invoice_id': invoice['id'],
            'amount': invoice['amount_due'] / 100,
        }
    )

    # Alert admins
    send_admin_alert(
        f"Payment failure for workspace {workspace_id}"
    )

    # Notify workspace owner
    send_payment_failed_email(workspace_id, invoice)
```

### 4. Prorated Billing

```python
# Always use Stripe's proration for upgrades/downgrades
stripe.Subscription.modify(
    subscription_id,
    items=[{'price': new_price_id}],
    proration_behavior='create_prorations',  # Important!
)
```

### 5. Trial Periods

```python
# Offer trials for paid plans
def create_trial_subscription(workspace_id, plan_id):
    plan = Plan.objects.get(id=plan_id)

    stripe_subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{'price': plan.stripe_price_id}],
        trial_period_days=14,  # 14-day trial
        metadata={'workspace_id': workspace_id}
    )

    return stripe_subscription
```

---

## Environment Configuration

```python
# settings.py

# Stripe Configuration
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = env('STRIPE_PUBLISHABLE_KEY')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET')

# For testing
if DEBUG:
    STRIPE_SECRET_KEY = env('STRIPE_TEST_SECRET_KEY')
    STRIPE_PUBLISHABLE_KEY = env('STRIPE_TEST_PUBLISHABLE_KEY')
    STRIPE_WEBHOOK_SECRET = env('STRIPE_TEST_WEBHOOK_SECRET')
```

```bash
# .env.example

# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Production
# STRIPE_SECRET_KEY=sk_live_xxx
# STRIPE_PUBLISHABLE_KEY=pk_live_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Default plans and features seeded
- [ ] Existing workspaces migrated to free plan
- [ ] Stripe webhooks configured
- [ ] Webhook endpoint URL added to Stripe dashboard
- [ ] Environment variables set
- [ ] Monitoring and logging configured
- [ ] Email templates created
- [ ] Frontend subscription UI deployed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Soft launch to small group
- [ ] Monitor for issues
- [ ] Full rollout

---

## Troubleshooting

### Webhook Not Receiving Events

```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:8000/api/webhooks/stripe/

# Trigger test event
stripe trigger customer.subscription.updated
```

### Subscription Out of Sync

```python
# Sync subscription from Stripe
def sync_subscription_from_stripe(workspace_id):
    subscription = WorkspaceSubscription.objects.get(workspace_id=workspace_id)

    stripe_sub = stripe.Subscription.retrieve(
        subscription.stripe_subscription_id
    )

    subscription.status = stripe_sub['status']
    subscription.current_period_start = datetime.fromtimestamp(
        stripe_sub['current_period_start']
    )
    subscription.current_period_end = datetime.fromtimestamp(
        stripe_sub['current_period_end']
    )
    subscription.save()
```

---

## Next Steps

1. Set up Stripe account and get API keys
2. Configure webhook endpoints
3. Test payment flows in Stripe test mode
4. Implement email notifications for subscription events
5. Add subscription analytics dashboard
6. Create customer support playbooks for common issues
7. Monitor usage and adjust limits based on data
