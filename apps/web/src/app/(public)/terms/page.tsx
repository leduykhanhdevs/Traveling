import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Traveling Terms of Service — the rules and guidelines for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="container py-16 md:py-24">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Effective date: July 5, 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground">
              These Terms are between you and <strong>Traveling Inc.</strong>.
              Contact us at <a href="mailto:support@traveling.app" className="text-primary hover:underline">support@traveling.app</a>.
            </p>
          </div>

          <p>
            These Terms of Service govern your access to and use of Traveling, including our mobile
            application, backend services, websites, subscriptions, and related features.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Using Traveling</h2>
          <p>
            You must use Traveling only in compliance with applicable law. You are responsible for keeping
            your account credentials secure and for activity that occurs through your account.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Travel, AI, and Translation Information</h2>
          <p>
            Traveling provides AI-generated recommendations, translations, itinerary suggestions, and place
            information for convenience. Outputs may be incomplete, outdated, inaccurate, or unsuitable for
            your circumstances. You are responsible for independently verifying safety, accessibility,
            pricing, business hours, visa rules, local laws, medical requirements, and emergency information.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Location and Emergency Features</h2>
          <p>
            Location and SOS features are provided as convenience tools and are not a substitute for
            contacting local emergency services directly. Traveling does not guarantee emergency response,
            SMS delivery, geocoding accuracy, or availability of emergency numbers in all locations.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Subscriptions and Purchases</h2>
          <p>
            Premium features may be offered through in-app purchases and managed by RevenueCat, Apple, or
            Google. Subscription billing, renewals, cancellation, refunds, and trial terms may be governed
            by the applicable app store and purchase provider.
          </p>

          <h2 className="text-xl font-semibold text-foreground">User Content</h2>
          <p>
            You are responsible for reviews, photos, ratings, comments, and other content you submit. You
            grant Traveling a non-exclusive license to host, display, process, and use your content to
            operate and improve the service. Do not upload content that is illegal, harmful, misleading,
            infringing, or violates another person's rights.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Acceptable Use</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Do not misuse, disrupt, reverse engineer, scrape, or interfere with Traveling.</li>
            <li>Do not attempt unauthorized access to accounts, systems, or data.</li>
            <li>Do not use Traveling to harass, defraud, impersonate, or harm others.</li>
            <li>Do not submit sensitive personal information unless a feature specifically requests it.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Disclaimers</h2>
          <p>
            Traveling is provided "as is" and "as available" without warranties of any kind to the maximum
            extent permitted by law. We do not warrant that the service will be uninterrupted, accurate,
            secure, or error-free.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, <strong>Traveling Inc.</strong> will not be liable for
            indirect, incidental, consequential, special, exemplary, or punitive damages, or for lost profits,
            lost data, travel disruption, or personal injury arising from use of Traveling.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            Questions about these Terms can be sent to{' '}
            <a href="mailto:support@traveling.app" className="text-primary hover:underline">support@traveling.app</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
