import type { Metadata } from 'next';
import { Globe, Heart, Shield, Eye, Rocket, Users, Lightbulb, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Traveling — our mission to make travel accessible, informed, and connected for everyone.',
};

const values = [
  { icon: Globe, title: 'Accessible Travel', description: 'Making travel tools available to everyone regardless of language or location.' },
  { icon: Heart, title: 'Authentic Experiences', description: 'Connecting travelers with genuine local culture and honest community reviews.' },
  { icon: Shield, title: 'Privacy & Safety', description: 'Protecting user data and providing safety tools for confident travel.' },
  { icon: Eye, title: 'Transparency', description: 'Honest about our capabilities, limitations, and how we use your data.' },
  { icon: Users, title: 'Community First', description: 'Building a supportive travel community that shares real experiences.' },
  { icon: Lightbulb, title: 'Responsible AI', description: 'Using AI to enhance — not replace — human judgment and exploration.' },
];

export default function AboutPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">About Traveling</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Traveling is a platform that helps people discover places, plan better trips, overcome language barriers, manage travel budgets, and share authentic experiences.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground mb-4">
            Traveling exists to make international travel more accessible and less intimidating. We believe that language barriers, budget uncertainty, and lack of local knowledge should not prevent anyone from exploring the world.
          </p>
          <p className="text-muted-foreground">
            Our platform combines AI-powered discovery, real-time translation, smart itinerary planning, and community insights to give travelers the confidence they need — whether visiting a neighboring city or a country on the other side of the globe.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The Problem We Solve</h2>
          <p className="text-muted-foreground mb-4">
            Travelers today juggle multiple apps for translation, maps, budgeting, weather, and trip planning. Each app works in isolation, creating friction. Important local context gets lost. Language barriers make ordering food or asking for directions stressful. Budget management across currencies is confusing.
          </p>
          <p className="text-muted-foreground">
            Traveling brings all of these tools into one connected experience, with AI that understands your preferences and an honest community that shares genuine recommendations.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Our Values</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="p-6">
                  <value.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Responsible AI Statement</h2>
          <p className="text-muted-foreground mb-4">
            Traveling uses AI (including OpenAI models) to power discovery recommendations, itinerary generation, and translation quality. We believe AI should enhance human decision-making, not replace it.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>AI recommendations are suggestions — always verify safety, hours, and pricing independently.</li>
            <li>AI translations are tools for communication — not certified legal or medical translations.</li>
            <li>AI-generated itineraries are starting points — customize them to your actual needs.</li>
            <li>We do not use your personal data to train AI models.</li>
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Privacy & Safety Commitment</h2>
          <p className="text-muted-foreground mb-4">
            Your travel data is personal. We are committed to protecting it:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>We never sell your personal data.</li>
            <li>Authentication is handled by Clerk with enterprise-grade security.</li>
            <li>Location data is used only with your explicit permission.</li>
            <li>You can request data export or account deletion at any time.</li>
            <li>We maintain transparent privacy and security policies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Product Roadmap</h2>
          <p className="text-muted-foreground mb-4">
            Traveling is continuously evolving. Here are areas we are actively working on:
          </p>
          <div className="space-y-3">
            {[
              'Enhanced offline capabilities for travelers in remote areas',
              'Group trip planning with collaborative itineraries',
              'Advanced AI conversation translation',
              'Local event and experience discovery',
              'Accessibility improvements for travelers with disabilities',
              'More language support and translation accuracy improvements',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Rocket className="h-4 w-4 text-primary shrink-0 mt-1" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            This roadmap reflects current direction. Timelines and priorities may change.
          </p>
        </section>
      </div>
    </div>
  );
}
