# Subscription System - Quick Start Guide

## Overview

This quick-start guide provides a step-by-step implementation roadmap for adding subscription-based feature scaling to Plane. It references the detailed guides for complete implementation details.

---

## Prerequisites

- Plane backend (Django/PostgreSQL) running
- Plane frontend (Next.js/React) running
- Stripe account (or other payment processor)
- Basic understanding of MobX and Django

---

## Implementation Roadmap

### Phase 1: Database Setup (Week 1)

**Goal**: Set up subscription models and seed initial data

#### Step 1.1: Create Models

Copy the models from `subscription-implementation-guide.md`:
- `Plan` - Subscription plans
- `Feature` - Individual features
- `PlanFeature` - Feature-to-plan mapping
- `WorkspaceSubscription` - Active subscriptions
- `UsageMetric` - Usage tracking
- `SubscriptionHistory` - Audit log

**Files to create**:
```
apps/api/plane/db/models/subscription.py
```

#### Step 1.2: Run Migrations

```bash
cd apps/api
python manage.py makemigrations
python manage.py migrate
```

#### Step 1.3: Seed Initial Data

Create management command:
```bash
python manage.py seed_subscription_plans
```

This creates:
- 4 default plans (Free, Starter, Professional, Enterprise)
- 18 features across categories
- Plan-feature mappings

**Verify**:
```python
# Django shell
from plane.db.models import Plan, Feature
print(f"Plans: {Plan.objects.count()}")  # Should be 4
print(f"Features: {Feature.objects.count()}")  # Should be 18
```

---

### Phase 2: Backend Services (Week 1-2)

**Goal**: Implement subscription business logic

#### Step 2.1: Subscription Service

Create `apps/api/plane/bgtasks/subscription_service.py`:
- `SubscriptionService` class
- Methods: `has_feature()`, `check_limit()`, `upgrade_plan()`

**Reference**: `subscription-implementation-guide.md` - Backend Implementation

#### Step 2.2: Billing Service

Create `apps/api/plane/bgtasks/billing_service.py`:
- `BillingService` class
- Stripe integration methods
- Payment processing

**Reference**: `subscription-billing-integration.md` - Stripe Integration

#### Step 2.3: Middleware

Create `apps/api/plane/middleware/subscription_middleware.py`:
- Feature access checks
- Limit enforcement
- Automatic 403 responses with upgrade prompts

**Test**:
```bash
curl http://localhost:8000/api/workspaces/test/analytics/
# Should return 403 if feature not available
```

---

### Phase 3: API Endpoints (Week 2)

**Goal**: Expose subscription functionality via REST API

#### Step 3.1: Create Views

Create `apps/api/plane/api/views/subscription.py`:
- `list_plans()` - GET /api/plans/
- `WorkspaceSubscriptionView` - GET /api/workspaces/{slug}/subscription/
- `CheckFeatureAccessView` - POST .../check-feature/
- `UpgradeSubscriptionView` - POST .../upgrade/

**Reference**: `subscription-api-endpoints.md`

#### Step 3.2: Add URL Routes

Update `apps/api/plane/api/urls.py`:
```python
from plane.api.views import subscription as subscription_views

urlpatterns += [
    path('plans/', subscription_views.list_plans),
    path('workspaces/<str:workspace_slug>/subscription/', ...),
    # ... more endpoints
]
```

#### Step 3.3: Test Endpoints

```bash
# Get plans
curl http://localhost:8000/api/plans/

# Get subscription
curl http://localhost:8000/api/workspaces/my-workspace/subscription/

# Check feature
curl -X POST http://localhost:8000/api/workspaces/my-workspace/subscription/check-feature/ \
  -H "Content-Type: application/json" \
  -d '{"feature_key": "advanced_analytics"}'
```

---

### Phase 4: Webhook Integration (Week 2-3)

**Goal**: Handle Stripe webhook events

#### Step 4.1: Webhook Handler

Create `apps/api/plane/api/views/webhooks.py`:
- `stripe_webhook()` view
- Event handlers for subscription lifecycle

**Reference**: `subscription-billing-integration.md` - Webhook Handling

#### Step 4.2: Configure Stripe

1. Create webhook endpoint in Stripe Dashboard
2. Set webhook URL: `https://your-domain.com/api/webhooks/stripe/`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. Copy webhook secret to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Step 4.3: Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/api/webhooks/stripe/

# Trigger test events
stripe trigger customer.subscription.updated
```

---

### Phase 5: Frontend Store (Week 3)

**Goal**: Implement MobX subscription store

#### Step 5.1: Create Store

Create `apps/web/core/store/subscription/subscription.store.ts`:
- `SubscriptionStore` class
- Observable: `subscription`, `plans`, `usage`
- Computed: `currentPlan`, `features`, `isFreePlan`
- Actions: `fetchSubscription()`, `hasFeature()`, `upgradePlan()`

**Reference**: `subscription-frontend.md` - MobX Store

#### Step 5.2: Add to Root Store

Update `apps/web/ce/store/root.store.ts`:
```typescript
import { SubscriptionStore } from "./subscription";

export class RootStore extends CoreRootStore {
  subscription: ISubscriptionStore;

  constructor() {
    super();
    this.subscription = new SubscriptionStore(this);
  }
}
```

#### Step 5.3: Create Service

Create `apps/web/core/services/subscription.service.ts`:
- `SubscriptionService` class
- API methods matching backend endpoints

**Test**:
```typescript
// Browser console
const store = window.__PLANE_STORE__;
await store.subscription.fetchSubscription('my-workspace');
console.log(store.subscription.currentPlan);
```

---

### Phase 6: Frontend Components (Week 3-4)

**Goal**: Build subscription UI components

#### Step 6.1: Plan Selector

Create `apps/web/core/components/subscription/plan-selector.tsx`:
- Display all available plans
- Highlight current plan
- Billing cycle toggle (monthly/yearly)

**Reference**: `subscription-frontend.md` - Components

#### Step 6.2: Feature Gate

Create `apps/web/core/components/subscription/feature-gate.tsx`:
- Conditionally render based on feature access
- Show upgrade prompt if no access

**Usage**:
```typescript
<FeatureGate featureKey="advanced_analytics">
  <AdvancedAnalyticsChart />
</FeatureGate>
```

#### Step 6.3: Usage Meter

Create `apps/web/core/components/subscription/usage-meter.tsx`:
- Visual progress bar
- Current/limit display
- Warning colors when near limit

#### Step 6.4: Upgrade Modal

Create `apps/web/core/components/subscription/upgrade-modal.tsx`:
- Plan selection
- Payment method collection
- Upgrade confirmation

---

### Phase 7: Custom Hooks (Week 4)

**Goal**: Create reusable hooks for subscription logic

#### Step 7.1: Create Hooks

Create `apps/web/core/hooks/`:
- `use-subscription.ts` - Access subscription store
- `use-feature-access.ts` - Check feature availability
- `use-resource-limit.ts` - Check and monitor limits
- `use-upgrade-prompt.ts` - Trigger upgrade flows

**Reference**: `subscription-frontend.md` - Custom Hooks

#### Step 7.2: Usage Examples

```typescript
// Check feature
const hasAnalytics = useFeatureAccess('advanced_analytics');

// Check limit
const { canAdd, percentageUsed } = useResourceLimit('projects');

// Prompt upgrade
const { promptUpgrade } = useUpgradePrompt();
```

---

### Phase 8: Integration (Week 4-5)

**Goal**: Integrate subscription checks into existing features

#### Step 8.1: Add Feature Gates

Update existing components:
```typescript
// Before
const AnalyticsDashboard = () => (
  <AdvancedCharts />
);

// After
const AnalyticsDashboard = () => (
  <FeatureGate featureKey="advanced_analytics">
    <AdvancedCharts />
  </FeatureGate>
);
```

#### Step 8.2: Add Limit Checks

Update create/add actions:
```typescript
const CreateProjectButton = () => {
  const { canAdd } = useResourceLimit('projects');
  const { promptUpgrade } = useUpgradePrompt();

  const handleClick = () => {
    if (!canAdd) {
      promptUpgrade({ resource: 'projects' });
      return;
    }
    createProject();
  };

  return <Button onClick={handleClick}>Create Project</Button>;
};
```

#### Step 8.3: Add Usage Indicators

Add to settings page:
```typescript
<UsageMeter resourceType="members" label="Team Members" />
<UsageMeter resourceType="projects" label="Projects" />
<UsageMeter resourceType="storage" label="Storage" />
```

---

### Phase 9: Migration (Week 5)

**Goal**: Migrate existing workspaces to subscription model

#### Step 9.1: Migrate Workspaces

```bash
python manage.py migrate_workspaces_to_subscriptions
```

This assigns all existing workspaces to the free plan.

#### Step 9.2: Identify Paying Customers

```bash
# Manually upgrade paying customers
python manage.py enable_legacy_features \
  --workspace-ids uuid1 uuid2 uuid3
```

#### Step 9.3: Communicate Changes

- Email existing users about new subscription system
- Highlight what they currently have
- Explain grandfathering for paying customers
- Provide upgrade options

---

### Phase 10: Testing (Week 6)

**Goal**: Comprehensive testing of subscription system

#### Step 10.1: Unit Tests

```bash
# Backend tests
cd apps/api
python manage.py test plane.tests.test_subscription_service
python manage.py test plane.tests.test_subscription_api

# Frontend tests
cd apps/web
npm test -- subscription
```

#### Step 10.2: Integration Tests

Test complete flows:
1. Sign up → Free plan assigned
2. Create projects → Hit limit → Upgrade prompt
3. Upgrade → Payment → Features unlocked
4. Downgrade → Features locked
5. Cancel → Retain access until period end

#### Step 10.3: Stripe Test Mode

Use Stripe test cards:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

---

### Phase 11: Monitoring (Week 6)

**Goal**: Set up monitoring and alerting

#### Step 11.1: Logging

Add structured logging:
```python
import logging

logger = logging.getLogger('subscription')
logger.info('Subscription upgraded', extra={
    'workspace_id': workspace_id,
    'from_plan': old_plan,
    'to_plan': new_plan,
})
```

#### Step 11.2: Metrics

Track key metrics:
- Subscription upgrades/downgrades per day
- Trial conversion rate
- Payment failure rate
- Feature adoption by plan
- Average revenue per workspace

#### Step 11.3: Alerts

Set up alerts for:
- Payment failures
- Webhook errors
- Unexpected downgrades
- High cancellation rate

---

### Phase 12: Go Live (Week 7)

**Goal**: Production deployment

#### Step 12.1: Pre-Launch Checklist

- [ ] All tests passing
- [ ] Stripe production keys configured
- [ ] Webhooks working in production
- [ ] Email templates configured
- [ ] Documentation updated
- [ ] Support team trained
- [ ] Monitoring active

#### Step 12.2: Soft Launch

1. Enable for internal team first (1 week)
2. Invite beta users (1 week)
3. Monitor for issues
4. Fix any bugs found

#### Step 12.3: Full Launch

1. Enable for all new signups
2. Gradually enforce limits for existing users
3. Send announcement email
4. Update pricing page
5. Monitor metrics closely

---

## Quick Reference

### Backend Files

```
apps/api/plane/
├── db/models/subscription.py              # Models
├── bgtasks/
│   ├── subscription_service.py            # Business logic
│   └── billing_service.py                 # Stripe integration
├── middleware/subscription_middleware.py  # Access control
├── api/
│   ├── views/
│   │   ├── subscription.py                # API endpoints
│   │   └── webhooks.py                    # Stripe webhooks
│   ├── serializers/subscription.py        # Serializers
│   └── urls.py                            # Routes
└── management/commands/
    ├── seed_subscription_plans.py         # Initial data
    └── migrate_workspaces_to_subscriptions.py
```

### Frontend Files

```
apps/web/
├── core/
│   ├── store/subscription/
│   │   └── subscription.store.ts          # MobX store
│   ├── services/subscription.service.ts   # API client
│   ├── components/subscription/
│   │   ├── plan-selector.tsx              # Plan selection
│   │   ├── feature-gate.tsx               # Feature gating
│   │   ├── usage-meter.tsx                # Usage display
│   │   └── upgrade-modal.tsx              # Upgrade flow
│   └── hooks/
│       ├── use-subscription.ts            # Store access
│       ├── use-feature-access.ts          # Feature check
│       ├── use-resource-limit.ts          # Limit check
│       └── use-upgrade-prompt.ts          # Upgrade prompt
└── ce/store/root.store.ts                 # Add to root
```

### Environment Variables

```bash
# .env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Common Tasks

### Add a New Feature

1. Create feature in database:
```python
Feature.objects.create(
    key='new_feature',
    name='New Feature',
    feature_type='boolean',
    category='productivity'
)
```

2. Add to plans:
```python
PlanFeature.objects.create(
    plan=pro_plan,
    feature=new_feature,
    is_enabled=True
)
```

3. Gate in frontend:
```typescript
<FeatureGate featureKey="new_feature">
  <NewFeatureComponent />
</FeatureGate>
```

### Add a New Plan

```python
plan = Plan.objects.create(
    name='Team',
    slug='team-monthly',
    plan_type='team',
    billing_cycle='monthly',
    price=12.00,
    description='For small teams',
    stripe_price_id='price_xxx',  # From Stripe
)

# Add features
PlanFeature.objects.create(plan=plan, feature=feature1, ...)
```

### Update Pricing

1. Create new price in Stripe Dashboard
2. Update Plan model:
```python
plan.stripe_price_id = 'price_new'
plan.price = 20.00
plan.save()
```

3. Existing subscriptions continue at old price until renewal

---

## Troubleshooting

### "No subscription found"

**Solution**: Run migration command
```bash
python manage.py migrate_workspaces_to_subscriptions
```

### Webhooks not working

**Check**:
1. Webhook URL correct in Stripe
2. Webhook secret in `.env`
3. Server accessible from internet
4. Check webhook logs in Stripe Dashboard

**Test locally**:
```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe/
```

### Feature gate not working

**Debug**:
```typescript
const subscription = useSubscription();
console.log('Features:', subscription.features);
console.log('Has feature:', subscription.hasFeature('feature_key'));
```

### Payment failing

**Check Stripe logs**:
1. Dashboard → Developers → Logs
2. Look for payment intent errors
3. Check card decline reasons

---

## Support Resources

### Documentation

- **Database Schema**: `subscription-implementation-guide.md`
- **API Endpoints**: `subscription-api-endpoints.md`
- **Frontend Components**: `subscription-frontend.md`
- **Billing Integration**: `subscription-billing-integration.md`

### External Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [MobX Documentation](https://mobx.js.org/)

---

## Success Metrics

Track these KPIs post-launch:

1. **Conversion Rate**: Free → Paid conversion %
2. **Upgrade Rate**: Users clicking "Upgrade" %
3. **Payment Success**: Successful payments %
4. **Churn Rate**: Monthly subscription cancellations %
5. **MRR**: Monthly recurring revenue
6. **Feature Adoption**: Usage by plan tier

---

## Next Steps

After successful launch:

1. **Optimize Pricing**: A/B test different price points
2. **Add Features**: Continuously add value to paid tiers
3. **Improve Onboarding**: Guide users to paid features
4. **Customer Success**: Help users get value from paid features
5. **Analytics**: Deep dive into usage patterns
6. **Expansion**: Add enterprise features, custom plans

---

## Questions?

For implementation help:
1. Review detailed guides in `docs/subscription-*.md`
2. Check code examples in each guide
3. Test in Stripe test mode first
4. Monitor logs and metrics closely
5. Start with soft launch to minimize risk

**Remember**: Implement incrementally, test thoroughly, and monitor closely. Good luck! 🚀
