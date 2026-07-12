import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Traveling Privacy Policy — how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <div className="container py-16 md:py-24">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Effective date: July 5, 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground">
              <strong>Traveling Inc.</strong> operates Traveling. Contact us at{' '}
              <a href="mailto:support@traveling.app" className="text-primary hover:underline">support@traveling.app</a>.
            </p>
          </div>

          <p>
            This Privacy Policy explains how Traveling collects, uses, shares, and protects information
            when you use our mobile application, backend services, websites, and related features.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Account and authentication data:</strong> name, email address, social login identifiers, and session metadata provided through Clerk.</li>
            <li><strong>Location data:</strong> GPS coordinates and approximate location used for nearby discovery, maps, emergency utilities, recommendations, and itinerary planning.</li>
            <li><strong>Microphone and voice data:</strong> voice recordings or audio snippets you choose to capture for speech-to-text, voice translation, pronunciation, and conversation features.</li>
            <li><strong>Search and app activity:</strong> discovery queries, place interactions, saved places, itinerary requests, translation requests, and feature usage.</li>
            <li><strong>Preferences:</strong> preferred language, dietary restrictions, travel style, taste preferences, nationality, and personalization settings.</li>
            <li><strong>User content:</strong> reviews, ratings, photos you choose to upload, community posts, and emergency contact information you choose to store.</li>
            <li><strong>Device and diagnostics data:</strong> device type, operating system, app version, Sentry crash reports, performance data, push notification tokens, and analytics events.</li>
            <li><strong>Subscription data:</strong> entitlement status, purchase identifiers, renewal status, and product information processed through RevenueCat.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">How We Use Information</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Provide authentication, onboarding, profile, subscription, and account features.</li>
            <li>Deliver location-based discovery, Google Places results, AI-ranked recommendations, maps, and navigation context.</li>
            <li>Generate AI travel suggestions, summaries, translations, itineraries, and personalization using services such as OpenAI.</li>
            <li>Process subscription access, premium entitlements, and purchase status through RevenueCat.</li>
            <li>Measure product performance, usage, reliability, and conversion through analytics events.</li>
            <li>Detect, investigate, and prevent abuse, fraud, unauthorized access, and service misuse.</li>
            <li>Send operational messages, push notifications, safety alerts, and support communications.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Third-Party Services</h2>
          <p>Traveling uses third-party processors to provide core functionality:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Clerk:</strong> authentication, user identity, and session management.</li>
            <li><strong>Google Places API:</strong> maps, places, geocoding, location context, and place details.</li>
            <li><strong>OpenAI:</strong> AI reasoning, place analysis, query understanding, and personalization outputs.</li>
            <li><strong>RevenueCat:</strong> subscription status, in-app purchase entitlement management.</li>
            <li><strong>Sentry:</strong> crash reporting, unhandled error capture, performance diagnostics.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Data Retention</h2>
          <p>
            We retain information for as long as needed to provide the service, comply with legal
            obligations, resolve disputes, secure the service, and maintain business records. You may
            request deletion of your account data by contacting us.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Security</h2>
          <p>
            We use technical and organizational safeguards designed to protect information. No method of
            transmission or storage is completely secure, so we cannot guarantee absolute security.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            For privacy questions or requests, contact <strong>Traveling Inc.</strong> at{' '}
            <a href="mailto:support@traveling.app" className="text-primary hover:underline">support@traveling.app</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
