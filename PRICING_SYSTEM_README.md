# Pricing & Credit System Documentation

## Overview
Complete pricing and credit system for NeuroNest with 4 subscription tiers, credit-based feature access, and Stripe integration.

## Frontend Components

### 1. PricingPage (`/app/pricing/page.jsx`)
- **Location**: `/pricing`
- **Features**:
  - 4 subscription tiers: Free, Pro, Premium, Enterprise
  - Monthly/Yearly billing toggle
  - Stripe Checkout integration
  - Responsive design with Tailwind CSS
  - Recommended plan highlighting (Pro)
  - FAQ section

### 2. CreditBalance Component (`/components/CreditBalance.jsx`)
- **Features**:
  - Real-time credit balance display
  - Progress bar showing credit percentage
  - Credit cost breakdown (Chat: 1, Screen Analysis: 3, Cognitive Test: 5, Focus Report: 10)
  - Purchase modal with 3 credit packages
  - Low credit warnings

### 3. Updated Profile Page (`/app/profile/page.jsx`)
- **New Sections**:
  - Subscription card with plan info and expiry
  - Credit balance widget
  - Credit history timeline
  - Upgrade/downgrade buttons

## Backend Endpoints

### Subscription Endpoints
- `GET /api/user/subscription?user_id=<id>` - Get user's subscription
- `POST /api/subscribe` - Create Stripe checkout session
- `POST /api/user/upgrade_plan` - Change subscription tier
- `POST /api/stripe/webhook` - Handle Stripe webhook events

### Credit Endpoints
- `GET /api/user/credits?user_id=<id>` - Get credit balance and history
- `POST /api/user/use_credits` - Deduct credits for a feature
- `POST /api/user/add_credits` - Add credits (purchase, reward, referral)

## Credit System

### Credit Costs
- **AI Chat**: 1 credit
- **Screen Analysis**: 3 credits
- **Cognitive Test**: 5 credits
- **Focus Report**: 10 credits

### Daily Refill
- Free plan users receive 30 credits daily
- Automatically checked on credit balance requests
- Refill happens once per 24 hours

### Credit Packages
- **100 Credits**: $2.00
- **500 Credits**: $8.00 (Best Value)
- **1000 Credits**: $15.00

## Subscription Plans

| Plan | Monthly | Yearly | Features |
|------|---------|--------|----------|
| **Free** | $0 | $0 | 30 daily AI messages, 3 focus reports/month, basic screen awareness |
| **Pro** | $9.99 | $99.99 | Unlimited AI chat, full screen awareness, focus tracking, integrations |
| **Premium** | $24.99 | $249.99 | Everything in Pro + NeuroTwin predictions, advanced analytics, reports |
| **Enterprise** | Custom | Custom | Team dashboard, API access, compliance, white-label |

## MongoDB Schema

### Users Collection
```javascript
{
  _id: "user_id",
  email: "user@example.com",
  age: 30,
  gender: "male",
  plan: "free", // free, pro, premium, enterprise
  credits: 30,
  subscription: {
    plan: "free",
    status: "active",
    expiry: "2024-12-31T00:00:00",
    stripe_customer_id: "cus_xxx",
    stripe_subscription_id: "sub_xxx"
  },
  last_refill: "2024-01-01T00:00:00"
}
```

### Credit History Collection
```javascript
{
  user_id: "user_id",
  timestamp: "2024-01-01T00:00:00",
  action: "used", // used, earned, purchased, refill
  amount: 5,
  feature: "cognitive_test"
}
```

## Environment Variables

Add to your `.env` file:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000

# MongoDB (optional)
MONGODB_URI=mongodb://localhost:27017/
```

## Installation

### Backend Dependencies
```bash
pip install stripe pymongo
```

### Frontend
No additional dependencies needed (uses existing Next.js setup)

## Usage

### Testing Credit System
1. User signs up → Gets 30 credits (free plan)
2. User uses a feature → Credits deducted automatically
3. Daily refill → +30 credits for free users
4. Purchase credits → Via Stripe checkout

### Testing Subscriptions
1. User visits `/pricing`
2. Selects a plan (Pro/Premium)
3. Clicks "Subscribe"
4. Redirected to Stripe Checkout
5. After payment → Webhook updates subscription
6. User receives bonus credits (Pro: 100, Premium: 250)

## Credit Deduction Example

```javascript
// In your feature code (e.g., cognitive test)
const response = await fetch('http://localhost:5002/api/user/use_credits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    feature: 'cognitive_test',
    amount: 5
  })
});

if (response.status === 402) {
  // Not enough credits
  alert('Insufficient credits. Please purchase more.');
  return;
}

// Proceed with feature
```

## Stripe Webhook Setup

1. Install Stripe CLI: `stripe listen --forward-to localhost:5002/api/stripe/webhook`
2. Get webhook secret from Stripe Dashboard
3. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
4. Test with: `stripe trigger checkout.session.completed`

## Notes

- System works with or without MongoDB (falls back to in-memory storage)
- Stripe integration is optional (gracefully handles missing API key)
- Daily refill is automatic and checked on every credit request
- All credit transactions are logged in history
- Subscription expiry is calculated automatically (30 days for monthly, 365 for yearly)

## Future Enhancements

- Referral system (earn 50 credits per referral)
- Credit expiration (credits expire after 90 days)
- Promotional codes
- Team credit pools (Enterprise)
- Credit gifting between users

