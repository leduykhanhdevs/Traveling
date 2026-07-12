import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CheckCircle2, X, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Traveling pricing plans — start free, upgrade to Premium for unlimited access.',
};

const plans = [
  {
    name: 'Free',
    price: 'Free',
    period: 'forever',
    description: 'Essential travel tools for casual travelers',
    features: [
      { name: '20 AI discovery queries/day', included: true },
      { name: '50 translations/day', included: true },
      { name: '10 saved places', included: true },
      { name: 'Basic itinerary planning', included: true },
      { name: 'Budget tracking', included: true },
      { name: 'Community access', included: true },
      { name: 'Weather & currency tools', included: true },
      { name: 'Emergency contacts', included: true },
      { name: 'OCR camera translation', included: false },
      { name: 'Voice translation', included: false },
      { name: 'Unlimited saved places', included: false },
      { name: 'Advanced AI features', included: false },
      { name: 'Shared budgets', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: 'See app for pricing',
    period: 'monthly or yearly',
    description: 'Full access for serious travelers',
    features: [
      { name: 'Unlimited AI discovery queries', included: true },
      { name: 'Unlimited translations', included: true },
      { name: 'Unlimited saved places', included: true },
      { name: 'Advanced AI itinerary planning', included: true },
      { name: 'Budget tracking & sharing', included: true },
      { name: 'Community access', included: true },
      { name: 'Weather & currency tools', included: true },
      { name: 'Emergency contacts & SOS', included: true },
      { name: 'OCR camera translation', included: true },
      { name: 'Voice translation', included: true },
      { name: 'Shared budgets & itineraries', included: true },
      { name: 'Advanced AI features', included: true },
      { name: 'Export & sharing', included: true },
      { name: 'Priority support', included: true },
    ],
    cta: 'Start Premium',
    href: '/sign-up',
    highlighted: true,
  },
];

const faqs = [
  { q: 'How does billing work?', a: 'Premium subscriptions are managed through the app stores (Apple App Store or Google Play). Web-based bank transfer payments are also available in supported regions.' },
  { q: 'Can I cancel anytime?', a: 'Yes. You can cancel your subscription at any time through your app store settings. You will retain Premium access until the end of your billing period.' },
  { q: 'What payment methods are accepted?', a: 'Through app stores: credit cards, debit cards, and store credit. Bank transfers (VND) are available in Vietnam for direct purchases.' },
  { q: 'Is there a free trial?', a: 'Trial availability depends on the app store and region. Check the subscription page in the mobile app for current offers.' },
  { q: 'What happens when I downgrade?', a: 'You keep your data. Usage limits return to free tier levels. Saved places beyond the free limit become read-only until you reduce or upgrade again.' },
];

export default function PricingPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground">
          Start free. Upgrade only when you need more.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlighted ? 'border-primary shadow-lg relative' : 'relative'}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Recommended</Badge>
              </div>
            )}
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
              <p className="text-3xl font-bold mb-1">{plan.price}</p>
              <p className="text-sm text-muted-foreground mb-2">{plan.period}</p>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Billing Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.q}>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
