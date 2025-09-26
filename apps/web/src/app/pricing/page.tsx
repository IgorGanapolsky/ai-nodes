import { Metadata } from 'next';
import { PricingSection } from '@/components/pricing-section';

export const metadata: Metadata = {
  title: 'Pricing - AI Nodes',
  description: 'Choose the perfect plan for your DePIN node operations. Increase earnings by 25-40% with automated optimization.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            Supercharge Your DePIN Earnings
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of node operators who&apos;ve increased their earnings by 25-40%
            with AI-powered automation and optimization.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Social Proof */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Trusted by DePIN Operators Worldwide</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600 mb-2">$2.3M+</div>
              <div className="text-muted-foreground">Additional earnings generated</div>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-muted-foreground">Nodes under management</div>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;AI Nodes increased my Helium earnings by 35% in the first month.
                The automation is incredible!&quot;
              </p>
              <div className="font-semibold">Sarah Chen</div>
              <div className="text-sm text-muted-foreground">Helium Network Operator</div>
            </div>
            
            <div className="bg-background p-6 rounded-lg border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;Managing 50+ nodes was a nightmare before AI Nodes.
                Now everything runs automatically.&quot;
              </p>
              <div className="font-semibold">Marcus Rodriguez</div>
              <div className="text-sm text-muted-foreground">Multi-Network Operator</div>
            </div>
            
            <div className="bg-background p-6 rounded-lg border">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;The ROI tracking and optimization suggestions are game-changing.
                Worth every penny!&quot;
              </p>
              <div className="font-semibold">Alex Thompson</div>
              <div className="text-sm text-muted-foreground">DePIN Investor</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Maximize Your DePIN Earnings?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-background text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-background/90 transition-colors">
              Start Free Trial
            </button>
            <button className="border border-primary-foreground/20 px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/10 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
