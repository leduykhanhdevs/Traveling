import { Router } from 'express';

const replaceBeforeSubmit =
  '[REPLACE_BEFORE_SUBMIT] Replace placeholders before publishing this URL.';

const baseStyles = `
  <style>
    :root {
      color-scheme: light dark;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
    }
    body {
      margin: 0;
      background: #0f0f1a;
      color: #f8fafc;
    }
    main {
      max-width: 880px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    h1, h2 {
      line-height: 1.2;
    }
    h1 {
      font-size: 2.4rem;
      margin-bottom: 0.25rem;
    }
    h2 {
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      margin-top: 2rem;
      padding-top: 1.5rem;
    }
    p, li {
      color: #d4d4d8;
    }
    a {
      color: #a7a2ff;
    }
    .notice {
      background: rgba(255, 101, 132, 0.14);
      border: 1px solid rgba(255, 101, 132, 0.4);
      border-radius: 8px;
      margin: 24px 0;
      padding: 16px;
    }
    .meta {
      color: #a1a1aa;
      margin-top: 0;
    }
    strong {
      color: #ffffff;
    }
  </style>
`;

const page = (title: string, body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} | WanderAI</title>
    ${baseStyles}
  </head>
  <body>
    <main>
      ${body}
    </main>
  </body>
</html>`;

const privacyPolicyHtml = page(
  'Privacy Policy',
  `
    <h1>Privacy Policy</h1>
    <p class="meta">Effective date: <strong>[EFFECTIVE_DATE]</strong> [REPLACE_BEFORE_SUBMIT]</p>
    <div class="notice">
      <strong>[YOUR_COMPANY_NAME]</strong> [REPLACE_BEFORE_SUBMIT] operates WanderAI. Contact us at
      <a href="mailto:[YOUR_EMAIL]">[YOUR_EMAIL]</a> [REPLACE_BEFORE_SUBMIT].
    </div>

    <p>
      This Privacy Policy explains how WanderAI collects, uses, shares, and protects information
      when you use our mobile application, backend services, websites, and related features.
    </p>

    <h2>Information We Collect</h2>
    <ul>
      <li><strong>Account and authentication data:</strong> name, email address, social login identifiers, and session metadata provided through Clerk.</li>
      <li><strong>Location data:</strong> GPS coordinates and approximate location used for nearby discovery, maps, emergency utilities, recommendations, and itinerary planning.</li>
      <li><strong>Search and app activity:</strong> discovery queries, place interactions, saved places, itinerary requests, translation requests, and feature usage.</li>
      <li><strong>Preferences:</strong> preferred language, dietary restrictions, travel style, taste preferences, nationality, and personalization settings.</li>
      <li><strong>User content:</strong> reviews, ratings, photos you choose to upload, community posts, and emergency contact information you choose to store.</li>
      <li><strong>Device and diagnostics data:</strong> device type, operating system, app version, crash logs, performance data, push notification tokens, and analytics events.</li>
      <li><strong>Subscription data:</strong> entitlement status, purchase identifiers, renewal status, and product information processed through RevenueCat.</li>
    </ul>

    <h2>How We Use Information</h2>
    <ul>
      <li>Provide authentication, onboarding, profile, subscription, and account features.</li>
      <li>Deliver location-based discovery, Google Places results, AI-ranked recommendations, maps, and navigation context.</li>
      <li>Generate AI travel suggestions, summaries, translations, itineraries, and personalization using services such as OpenAI.</li>
      <li>Process subscription access, premium entitlements, and purchase status through RevenueCat.</li>
      <li>Measure product performance, usage, reliability, and conversion through analytics events.</li>
      <li>Detect, investigate, and prevent abuse, fraud, unauthorized access, and service misuse.</li>
      <li>Send operational messages, push notifications, safety alerts, and support communications.</li>
    </ul>

    <h2>Third-Party Services</h2>
    <p>WanderAI uses third-party processors to provide core functionality. These services may process data according to their own privacy notices.</p>
    <ul>
      <li><strong>Clerk:</strong> authentication, user identity, and session management.</li>
      <li><strong>Google Places API and related Google services:</strong> maps, places, geocoding, location context, and place details.</li>
      <li><strong>OpenAI:</strong> AI reasoning, place analysis, query understanding, and personalization outputs.</li>
      <li><strong>RevenueCat:</strong> subscription status, in-app purchase entitlement management, and purchase metadata.</li>
      <li><strong>Analytics providers:</strong> product analytics events, usage trends, and operational metrics.</li>
      <li><strong>Crash and diagnostics providers:</strong> crash reporting and error diagnostics.</li>
    </ul>

    <h2>Location Data</h2>
    <p>
      Location access is used to show nearby restaurants, attractions, emergency numbers, travel
      utilities, and other location-aware recommendations. You can disable location permissions in
      your device settings, but some features may not work correctly without location access.
    </p>

    <h2>Analytics and Diagnostics</h2>
    <p>
      We collect analytics events and diagnostics data to understand feature usage, identify bugs,
      improve performance, and measure reliability. Analytics events are not intended to include
      sensitive travel documents, payment card numbers, or passwords.
    </p>

    <h2>Sharing of Information</h2>
    <p>
      We do not sell personal information. We share information with service providers that help us
      operate WanderAI, comply with legal obligations, enforce our rights, protect users, or complete
      a transaction requested by you.
    </p>

    <h2>Data Retention</h2>
    <p>
      We retain information for as long as needed to provide the service, comply with legal
      obligations, resolve disputes, secure the service, and maintain business records. You may
      request deletion of your account data by contacting us.
    </p>

    <h2>Security</h2>
    <p>
      We use technical and organizational safeguards designed to protect information. No method of
      transmission or storage is completely secure, so we cannot guarantee absolute security.
    </p>

    <h2>Children</h2>
    <p>
      WanderAI is not intended for children under 13 or the minimum age required in your jurisdiction.
      We do not knowingly collect personal information from children.
    </p>

    <h2>International Use</h2>
    <p>
      WanderAI is designed for international travelers. Your information may be processed in countries
      different from where you live, subject to applicable law.
    </p>

    <h2>Your Choices</h2>
    <ul>
      <li>Manage location, camera, microphone, speech, and notification permissions in device settings.</li>
      <li>Update profile preferences in the app.</li>
      <li>Manage subscription settings through Apple, Google, or RevenueCat-supported purchase flows.</li>
      <li>Contact us to request access, correction, or deletion where applicable.</li>
    </ul>

    <h2>Changes to This Policy</h2>
    <p>
      We may update this Privacy Policy from time to time. If changes are material, we will provide
      notice as required by applicable law.
    </p>

    <h2>Contact</h2>
    <p>
      For privacy questions or requests, contact <strong>[YOUR_COMPANY_NAME]</strong>
      [REPLACE_BEFORE_SUBMIT] at <a href="mailto:[YOUR_EMAIL]">[YOUR_EMAIL]</a>
      [REPLACE_BEFORE_SUBMIT].
    </p>
  `,
);

const termsHtml = page(
  'Terms of Service',
  `
    <h1>Terms of Service</h1>
    <p class="meta">Effective date: <strong>[EFFECTIVE_DATE]</strong> [REPLACE_BEFORE_SUBMIT]</p>
    <div class="notice">
      These Terms are between you and <strong>[YOUR_COMPANY_NAME]</strong> [REPLACE_BEFORE_SUBMIT].
      Contact us at <a href="mailto:[YOUR_EMAIL]">[YOUR_EMAIL]</a> [REPLACE_BEFORE_SUBMIT].
    </div>

    <p>
      These Terms of Service govern your access to and use of WanderAI, including our mobile
      application, backend services, websites, subscriptions, and related features.
    </p>

    <h2>Using WanderAI</h2>
    <p>
      You must use WanderAI only in compliance with applicable law. You are responsible for keeping
      your account credentials secure and for activity that occurs through your account.
    </p>

    <h2>Travel, AI, and Translation Information</h2>
    <p>
      WanderAI provides AI-generated recommendations, translations, itinerary suggestions, and place
      information for convenience. Outputs may be incomplete, outdated, inaccurate, or unsuitable for
      your circumstances. You are responsible for independently verifying safety, accessibility,
      pricing, business hours, visa rules, local laws, medical requirements, and emergency information.
    </p>

    <h2>Location and Emergency Features</h2>
    <p>
      Location and SOS features are provided as convenience tools and are not a substitute for
      contacting local emergency services directly. WanderAI does not guarantee emergency response,
      SMS delivery, geocoding accuracy, or availability of emergency numbers in all locations.
    </p>

    <h2>Subscriptions and Purchases</h2>
    <p>
      Premium features may be offered through in-app purchases and managed by RevenueCat, Apple, or
      Google. Subscription billing, renewals, cancellation, refunds, and trial terms may be governed
      by the applicable app store and purchase provider.
    </p>

    <h2>User Content</h2>
    <p>
      You are responsible for reviews, photos, ratings, comments, and other content you submit. You
      grant WanderAI a non-exclusive license to host, display, process, and use your content to
      operate and improve the service. Do not upload content that is illegal, harmful, misleading,
      infringing, or violates another person's rights.
    </p>

    <h2>Acceptable Use</h2>
    <ul>
      <li>Do not misuse, disrupt, reverse engineer, scrape, or interfere with WanderAI.</li>
      <li>Do not attempt unauthorized access to accounts, systems, or data.</li>
      <li>Do not use WanderAI to harass, defraud, impersonate, or harm others.</li>
      <li>Do not submit sensitive personal information unless a feature specifically requests it.</li>
    </ul>

    <h2>Third-Party Services</h2>
    <p>
      WanderAI integrates with third-party services such as Clerk, Google Places API, OpenAI,
      RevenueCat, analytics providers, app stores, and diagnostics providers. We are not responsible
      for third-party services, data, content, availability, or terms.
    </p>

    <h2>Privacy</h2>
    <p>
      Our Privacy Policy explains how information is collected, used, and shared. By using WanderAI,
      you also agree to the Privacy Policy.
    </p>

    <h2>Service Changes and Termination</h2>
    <p>
      We may modify, suspend, or discontinue features at any time. We may suspend or terminate access
      if you violate these Terms, create risk, or use WanderAI unlawfully.
    </p>

    <h2>Disclaimers</h2>
    <p>
      WanderAI is provided "as is" and "as available" without warranties of any kind to the maximum
      extent permitted by law. We do not warrant that the service will be uninterrupted, accurate,
      secure, or error-free.
    </p>

    <h2>Limitation of Liability</h2>
    <p>
      To the maximum extent permitted by law, <strong>[YOUR_COMPANY_NAME]</strong>
      [REPLACE_BEFORE_SUBMIT] will not be liable for indirect, incidental, consequential, special,
      exemplary, or punitive damages, or for lost profits, lost data, travel disruption, or personal
      injury arising from use of WanderAI.
    </p>

    <h2>Contact</h2>
    <p>
      Questions about these Terms can be sent to
      <a href="mailto:[YOUR_EMAIL]">[YOUR_EMAIL]</a> [REPLACE_BEFORE_SUBMIT].
    </p>
  `,
);

export const legalRouter = Router();

legalRouter.get('/privacy-policy', (_req, res) => {
  res.status(200).type('html').send(privacyPolicyHtml);
});

legalRouter.get('/terms', (_req, res) => {
  res.status(200).type('html').send(termsHtml);
});
