import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  Search,
  MapPin,
  Languages,
  Wallet,
  BookmarkPlus,
  Users,
  Cloud,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Star,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Traveling — Discover, Plan & Explore the World',
  description:
    'Traveling helps you discover places, plan better trips, overcome language barriers, manage travel budgets, and share authentic experiences.',
};

const features = [
  {
    icon: Search,
    title: 'Smart Discovery',
    description:
      'AI-powered place discovery with filters for cuisine, budget, dietary needs, and local favorites.',
  },
  {
    icon: MapPin,
    title: 'AI Itinerary Planning',
    description:
      'Generate personalized day-by-day itineraries based on your travel style, budget, and interests.',
  },
  {
    icon: Languages,
    title: 'Real-time Translation',
    description:
      'Break language barriers with text, voice, and camera translation supporting 50+ languages.',
  },
  {
    icon: Wallet,
    title: 'Budget Management',
    description:
      'Track expenses by category, split costs with travel companions, and stay on budget.',
  },
  {
    icon: BookmarkPlus,
    title: 'Saved Places',
    description:
      'Bookmark restaurants, attractions, and hidden gems to build your personal travel map.',
  },
  {
    icon: Users,
    title: 'Travel Community',
    description:
      'Share authentic experiences, read reviews from real travelers, and connect with the community.',
  },
  {
    icon: Cloud,
    title: 'Weather & Currency',
    description:
      'Check weather forecasts and convert currencies instantly for smarter travel decisions.',
  },
  {
    icon: Shield,
    title: 'Safety & Emergency',
    description:
      'Access emergency contacts, SOS features, and safety information wherever you travel.',
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'Choose Your Destination',
    description: 'Search destinations or let our AI suggest places based on your interests.',
  },
  {
    step: '2',
    title: 'Plan Your Trip',
    description: 'Generate smart itineraries, set budgets, and save must-visit places.',
  },
  {
    step: '3',
    title: 'Travel with Confidence',
    description: 'Use real-time translation, discover local spots, and manage expenses on the go.',
  },
  {
    step: '4',
    title: 'Share & Connect',
    description: 'Post reviews, share experiences, and help fellow travelers discover hidden gems.',
  },
];

const testimonials = [
  {
    name: 'Travel Enthusiast',
    location: 'Hanoi, Vietnam',
    text: 'The translation feature saved me so many times during my trip across Southeast Asia. Being able to point my camera at a menu and instantly understand it was a game changer.',
    rating: 5,
    note: 'Editorial sample',
  },
  {
    name: 'Budget Backpacker',
    location: 'Bangkok, Thailand',
    text: 'Managing expenses across multiple currencies used to be a nightmare. Now I just log everything in the app and it handles the rest.',
    rating: 5,
    note: 'Editorial sample',
  },
  {
    name: 'Family Traveler',
    location: 'Tokyo, Japan',
    text: 'The AI itinerary planner created a perfect family-friendly schedule. It even considered our dietary restrictions when suggesting restaurants.',
    rating: 5,
    note: 'Editorial sample',
  },
];

const faqItems = [
  {
    q: 'Is Traveling free to use?',
    a: 'Yes! Traveling offers a generous free tier with essential features. Premium users get higher limits and advanced AI features.',
  },
  {
    q: 'What languages does the translator support?',
    a: 'Traveling supports over 50 languages including Vietnamese, English, Japanese, Korean, Thai, Chinese, Spanish, French, and many more.',
  },
  {
    q: 'Can I use Traveling offline?',
    a: 'Some features like saved translations and itineraries are available offline. Discovery and real-time translation require an internet connection.',
  },
  {
    q: 'How does the AI itinerary planner work?',
    a: 'Our AI considers your destination, travel dates, budget, style preferences, and dietary needs to create a personalized day-by-day plan with real places.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use industry-standard encryption, secure authentication through Clerk, and never sell your personal data. See our Privacy Policy for details.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 md:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI-Powered Travel Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
              Discover, Plan &{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Explore the World
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
              Traveling helps you discover places, plan better trips, overcome language barriers,
              manage travel budgets, and share authentic experiences in one connected platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up">
              <Link href="/discover">
                <Button size="xl" className="w-full sm:w-auto gap-2">
                  <Search className="h-4 w-4" />
                  Start Exploring
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" size="xl" className="w-full sm:w-auto gap-2">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destination Search */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Link href="/discover">
                <div className="w-full h-14 pl-12 pr-4 rounded-xl border bg-background text-muted-foreground flex items-center cursor-pointer hover:border-primary/50 transition-colors">
                  Search destinations, restaurants, attractions...
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28" id="features">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Travel Smart
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From discovering hidden gems to managing your budget, Traveling brings all your travel tools together.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:border-primary/50 transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/features">
              <Button variant="outline" className="gap-2">
                See All Features
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Traveling Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Getting started is simple. Four steps to transform how you travel.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Trust & Safety Matter
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Traveling is built with security and privacy at its core. Your data stays yours.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Secure Authentication</p>
                  <p className="text-xs text-muted-foreground">Enterprise-grade auth via Clerk</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">No Data Selling</p>
                  <p className="text-xs text-muted-foreground">We never sell personal information</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Encrypted Storage</p>
                  <p className="text-xs text-muted-foreground">Industry-standard data protection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Free vs Premium</h2>
            <p className="text-lg text-muted-foreground">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="relative">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-muted-foreground text-sm mb-6">Perfect for casual travelers</p>
                <ul className="space-y-3">
                  {[
                    '20 AI queries per day',
                    '50 translations per day',
                    '10 saved places',
                    'Basic itinerary planning',
                    'Budget tracking',
                    'Community access',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" className="block mt-8">
                  <Button variant="outline" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Most Popular</Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="text-muted-foreground text-sm mb-6">For serious travelers</p>
                <ul className="space-y-3">
                  {[
                    'Unlimited AI queries',
                    'Unlimited translations',
                    'Unlimited saved places',
                    'Advanced AI itinerary planning',
                    'OCR camera translation',
                    'Voice translation',
                    'Shared budgets',
                    'Priority support',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" className="block mt-8">
                  <Button className="w-full">View Pricing</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Travelers Say</h2>
            <p className="text-sm text-muted-foreground">
              Editorial sample content — real testimonials will appear as the community grows.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm mb-4 leading-relaxed">{t.text}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {t.note}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {faqItems.map((faq) => (
              <Card key={faq.q}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq">
              <Button variant="outline" className="gap-2">
                View All FAQs
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Travel Smarter?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of travelers who plan better trips with Traveling. Free to start, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up">
                <Button size="xl" className="w-full sm:w-auto gap-2">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
