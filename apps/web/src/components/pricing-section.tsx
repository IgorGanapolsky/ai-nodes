'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Building } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    description: 'Perfect for small node operators',
    features: [
      'Up to 10 nodes',
      'Basic monitoring dashboard',
      'Email alerts',
      'Standard support',
      '1GB data storage'
    ],
    icon: <Zap className="h-6 w-6" />,
    buttonText: 'Start Free Trial',
    buttonVariant: 'outline'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    description: 'Most popular for growing operations',
    features: [
      'Up to 100 nodes',
      'Advanced analytics',
      'Real-time monitoring',
      'Automated optimization',
      'Priority support',
      'API access',
      '10GB data storage'
    ],
    popular: true,
    icon: <Crown className="h-6 w-6" />,
    buttonText: 'Start Free Trial',
    buttonVariant: 'default'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    description: 'For large-scale operations',
    features: [
      'Unlimited nodes',
      'Custom integrations',
      'White-label options',
      'Dedicated support',
      'SLA guarantees',
      'Custom reporting',
      'Unlimited storage'
    ],
    icon: <Building className="h-6 w-6" />,
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary'
  }
];

export function PricingSection() {
  const handleSubscribe = async (tierId: string) => {
    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: getPriceId(tierId),
          tier: tierId,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const getPriceId = (tierId: string) => {
    const priceIds = {
      starter: 'price_1RNdUBGGBpd520QYG1A9SWF4',
      professional: 'price_professional_monthly',
      enterprise: 'price_enterprise_monthly'
    };
    return priceIds[tierId as keyof typeof priceIds];
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Increase your DePIN earnings by 25-40% with automated optimization
          </p>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <Check className="h-4 w-4" />
            <span className="font-medium">14-day free trial • No credit card required</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative ${tier.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${tier.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {tier.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full"
                  variant={tier.buttonVariant}
                  onClick={() => handleSubscribe(tier.id)}
                >
                  {tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* ROI Calculator */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">ROI Calculator</h3>
            <p className="text-muted-foreground mb-6">
              See how much you could earn with AI Nodes optimization
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">25-40%</div>
                <div className="text-sm text-muted-foreground">Earnings Increase</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-sm text-muted-foreground">Automated Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">$500+</div>
                <div className="text-sm text-muted-foreground">Average Monthly Savings</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">How does the free trial work?</h4>
              <p className="text-muted-foreground">
                Get 14 days of full access to all features. No credit card required to start.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What DePIN networks do you support?</h4>
              <p className="text-muted-foreground">
                We support Helium, Filecoin, IoTeX, and 15+ other major DePIN networks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
