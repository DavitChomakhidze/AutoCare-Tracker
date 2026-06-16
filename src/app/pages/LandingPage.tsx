import {
  Car,
  Wrench,
  DollarSign,
  Bell,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Users,
  BookOpen,
  Mail,
  Lock,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppActions } from '../data/appTypes';

const features = [
  {
    icon: <Wrench size={32} />,
    title: 'Track maintenance history',
    description: 'Keep detailed records of all services, repairs, and replaced parts'
  },
  {
    icon: <Bell size={32} />,
    title: 'Never miss a service',
    description: 'Set date and mileage-based reminders for upcoming maintenance'
  },
  {
    icon: <DollarSign size={32} />,
    title: 'Monitor your expenses',
    description: 'Analyze spending with charts and reports for better budgeting'
  },
  {
    icon: <Car size={32} />,
    title: 'Manage multiple vehicles',
    description: 'Track all your vehicles in one organized platform'
  }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For one everyday vehicle owner getting organized.',
    features: ['1 vehicle', 'Service history', 'Basic reminders', 'Monthly expense summary'],
    cta: 'Start free'
  },
  {
    name: 'Personal',
    price: '₾9',
    period: '/ month',
    description: 'For owners who maintain multiple personal vehicles.',
    features: ['Up to 5 vehicles', 'Date and mileage reminders', 'Expense analytics', 'Export reports'],
    cta: 'Choose Personal',
    highlighted: true
  },
  {
    name: 'Family',
    price: '₾19',
    period: '/ month',
    description: 'For households that share vehicle maintenance tasks.',
    features: ['Up to 12 vehicles', 'Shared service records', 'Advanced notifications', 'Priority support'],
    cta: 'Choose Family'
  }
];

const faqs = [
  {
    question: 'Can I use AutoCare Tracker for free?',
    answer: 'Yes. The Starter plan is enough to manage one vehicle, record services, and create basic reminders.'
  },
  {
    question: 'Does the prototype connect to a real mechanic or vehicle API?',
    answer: 'No. This bachelor-project prototype focuses on personal vehicle records, reminders, expenses, and analytics.'
  },
  {
    question: 'Can reminders be based on mileage?',
    answer: 'Yes. Reminders can be date-based, mileage-based, or use both triggers for services like oil changes.'
  },
  {
    question: 'Can I export my service history?',
    answer: 'Yes. The interface includes report export flows for service history, expenses, and reminder summaries.'
  }
];

const blogPosts = [
  {
    title: 'How to build a simple car maintenance routine',
    category: 'Maintenance',
    description: 'A practical checklist for oil changes, inspections, tires, brakes, and seasonal care.'
  },
  {
    title: 'Why mileage-based reminders matter',
    category: 'Reminders',
    description: 'Learn when date reminders are enough and when odometer-based tracking gives better results.'
  },
  {
    title: 'Tracking vehicle costs without overcomplicating it',
    category: 'Expenses',
    description: 'Simple ways to understand monthly car spending and prepare for bigger repairs.'
  }
];

const contactItems = [
  { label: 'Email', value: 'support@autocaretracker.local' },
  { label: 'Project owner', value: 'David Chomakhidze' },
  { label: 'Response time', value: '1-2 business days' }
];

export function LandingPage({ actions }: { actions: AppActions }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const scrollToTop = () => {
    setMobileMenuOpen(false);
    if (window.location.pathname !== '/') {
      actions.navigate('landing');
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navigateFromMenu = (page: Parameters<AppActions['navigate']>[0]) => {
    setMobileMenuOpen(false);
    actions.navigate(page);
  };

  return (
    <div className="min-h-screen modern-page-bg">
      <header className="border-b border-border/80 bg-card/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Go to AutoCare home"
              className="flex items-center gap-3 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={scrollToTop}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-success-500 rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary-600/20">
                AC
              </div>
              <span className="text-xl font-bold">AutoCare Tracker</span>
            </button>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How it works
              </a>
              <Button variant="outline" size="sm" onClick={() => actions.navigate('login')}>
                Log in
              </Button>
              <Button size="sm" onClick={() => actions.navigate('register')}>
                Get started
              </Button>
            </nav>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-navigation"
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-accent hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-[1000] transition-opacity duration-200 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          className="absolute inset-0 h-full w-full bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
        <nav
          id="landing-mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={`absolute right-0 top-0 h-full w-80 max-w-[86vw] bg-card p-5 shadow-2xl transition-transform duration-200 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <button
              type="button"
              aria-label="Go to AutoCare home"
              className="flex items-center gap-3 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={scrollToTop}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-success-500 rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary-600/20">
                AC
              </div>
              <span className="font-bold">AutoCare</span>
            </button>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {[
              ['features', 'Features'],
              ['pricing', 'Pricing'],
              ['faq', 'FAQ'],
              ['how-it-works', 'How it works'],
              ['about', 'About'],
              ['contact', 'Contact']
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="rounded-lg px-3 py-3 text-left text-foreground hover:bg-accent"
                onClick={() => scrollToSection(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 border-t border-border pt-6">
            <Button variant="outline" onClick={() => navigateFromMenu('login')}>
              Log in
            </Button>
            <Button onClick={() => navigateFromMenu('register')}>
              Get started
            </Button>
          </div>
        </nav>
      </div>

      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full modern-chip border text-sm text-primary-700 mb-5">
                <CheckCircle size={16} />
                Built for simple personal vehicle care
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Take better care of your car
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Track maintenance, repairs, expenses, and reminders in one place. Keep your vehicle running smoothly and stay on top of every service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => actions.navigate('register')}>
                  Get started for free
                  <ArrowRight size={20} />
                </Button>
                <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  Learn more
                </Button>
              </div>
            </div>

            <div className="modern-hero-panel rounded-2xl p-6 lg:p-8 min-h-[400px] border border-primary-500/10 shadow-2xl shadow-primary-700/10">
              <div className="bg-card/90 rounded-card border border-border shadow-xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Dashboard preview</p>
                    <h3 className="text-xl font-semibold">Subaru Forester XT</h3>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-600 to-success-500 text-primary-foreground flex items-center justify-center">
                    <Car size={24} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-lg bg-primary-50 p-4">
                    <p className="text-xs text-primary-700 mb-1">Mileage</p>
                    <p className="font-semibold">281,450 km</p>
                  </div>
                  <div className="rounded-lg bg-warning-50 p-4">
                    <p className="text-xs text-warning-700 mb-1">Next service</p>
                    <p className="font-semibold">600 km</p>
                  </div>
                  <div className="rounded-lg bg-success-50 p-4">
                    <p className="text-xs text-success-700 mb-1">This month</p>
                    <p className="font-semibold">₾420</p>
                  </div>
                  <div className="rounded-lg bg-info-50 p-4">
                    <p className="text-xs text-info-700 mb-1">Vehicles</p>
                    <p className="font-semibold">2 active</p>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-neutral-200 overflow-hidden">
                  <div className="h-full w-4/5 bg-gradient-to-r from-warning-500 to-success-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-card/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage your vehicle
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple yet powerful features designed for everyday car owners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} padding="lg" hover>
                <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Add your vehicle</h3>
              <p className="text-muted-foreground">
                Enter your vehicle details and current mileage to get started
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Record services and repairs</h3>
              <p className="text-muted-foreground">
                Log completed maintenance with costs, parts, and notes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Receive maintenance reminders</h3>
              <p className="text-muted-foreground">
                Set date or mileage-based reminders so you never miss a service
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-card/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple pricing for personal car care
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with the free plan, then upgrade when you need more vehicles, exports, and reminder controls.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                padding="lg"
                className={plan.highlighted ? 'border-primary shadow-md' : ''}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {plan.highlighted && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-500/20">
                      Best value
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={16} className="text-success-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => actions.navigate('register')}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <HelpCircle size={28} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Quick answers about the AutoCare Tracker product flow.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-card border border-border bg-card p-5 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {faq.question}
                  <span className="text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-6">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 rounded-card border border-border bg-neutral-50 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-50 text-success-700 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Built for a university prototype</h3>
                <p className="text-sm text-muted-foreground">
                  The product scope stays focused on personal maintenance records, reminders, and expense tracking.
                </p>
              </div>
            </div>
            <Button onClick={() => actions.navigate('register')} className="w-full md:w-auto">
              Create account
            </Button>
          </div>
        </div>
      </section>

      <section id="about" className="py-20 bg-card/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="w-14 h-14 mb-6 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <Users size={28} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">About AutoCare Tracker</h2>
              <p className="text-lg text-muted-foreground mb-6">
                AutoCare Tracker is a bachelor-project web application designed for everyday car owners who want a simple, reliable way to organize vehicle maintenance.
              </p>
              <p className="text-muted-foreground">
                The product focuses on the essentials: vehicles, service history, replaced parts, reminders, expenses, and clear analytics. It avoids complex fleet-management features so the experience stays practical and easy to use.
              </p>
            </div>
            <Card padding="lg">
              <h3 className="text-xl font-semibold mb-4">Project focus</h3>
              <div className="space-y-4">
                {['Personal vehicle maintenance', 'Date and mileage reminders', 'Expense tracking in GEL', 'Responsive React and Tailwind UI'].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-success-500 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="blog" className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <div className="w-14 h-14 mb-4 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <BookOpen size={28} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Blog</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Educational articles that support the product’s maintenance and repair tracking goals.
              </p>
            </div>
            <Button variant="outline" onClick={() => actions.toast('info', 'Blog archive is a prototype preview.')}>
              View all posts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Card key={post.title} padding="lg" hover>
                <span className="inline-flex mb-4 text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
                  {post.category}
                </span>
                <h3 className="text-xl font-semibold mb-3">{post.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{post.description}</p>
                <button
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => actions.toast('info', 'Article opened in prototype mode.')}
                >
                  Read article
                </button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 bg-card/60">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <Mail size={28} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact</h2>
            <p className="text-lg text-muted-foreground">
              Send questions, feedback, or project review notes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="lg">
              <h3 className="text-xl font-semibold mb-4">Contact details</h3>
              <div className="space-y-4">
                {contactItems.map((item) => (
                  <div key={item.label} className="flex justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-xl font-semibold mb-4">Message form</h3>
              <div className="space-y-4">
                <input className="w-full h-10 px-3 rounded-input border border-input bg-input-background" placeholder="Your name" />
                <input className="w-full h-10 px-3 rounded-input border border-input bg-input-background" placeholder="Email address" />
                <textarea className="w-full min-h-28 px-3 py-2 rounded-input border border-input bg-input-background resize-none" placeholder="Message" />
                <Button className="w-full" onClick={() => actions.toast('success', 'Message sent in prototype mode.')}>
                  Send message
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="privacy" className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Privacy Policy</h2>
              <p className="text-muted-foreground">
                Prototype policy for how AutoCare Tracker would handle personal vehicle data.
              </p>
            </div>
          </div>
          <Card padding="lg">
            <div className="space-y-5 text-sm text-muted-foreground leading-6">
              <p><strong className="text-foreground">Data collected:</strong> account details, vehicle information, service records, reminders, expense values, and uploaded maintenance notes.</p>
              <p><strong className="text-foreground">Purpose:</strong> data is used to show dashboards, reminders, analytics, and exportable maintenance reports.</p>
              <p><strong className="text-foreground">Storage:</strong> this frontend prototype uses local sample data only. A production version would store data securely through a backend such as Supabase.</p>
              <p><strong className="text-foreground">User control:</strong> users should be able to export, update, and delete their stored data from account settings.</p>
            </div>
          </Card>
        </div>
      </section>

      <section id="terms" className="py-20 bg-card/60">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Terms of Service</h2>
              <p className="text-muted-foreground">
                Prototype terms for using AutoCare Tracker as a personal maintenance management tool.
              </p>
            </div>
          </div>
          <Card padding="lg">
            <div className="space-y-5 text-sm text-muted-foreground leading-6">
              <p><strong className="text-foreground">Use of service:</strong> AutoCare Tracker is intended to help organize maintenance information and should not replace professional mechanical advice.</p>
              <p><strong className="text-foreground">Accuracy:</strong> users are responsible for entering correct mileage, dates, costs, and vehicle details.</p>
              <p><strong className="text-foreground">Availability:</strong> this is a frontend prototype, so persistence and production uptime are outside the current implementation scope.</p>
              <p><strong className="text-foreground">Limitations:</strong> the product does not provide GPS tracking, telematics, AI diagnosis, online payments, or mechanic booking.</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-700 via-primary-600 to-success-700 text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to take better care of your car?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of car owners who trust AutoCare Tracker
          </p>
          <Button variant="secondary" size="lg" onClick={() => actions.navigate('register')}>
            Get started for free
            <ArrowRight size={20} />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
                  AC
                </div>
                <span className="font-bold">AutoCare</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your complete vehicle maintenance tracking solution
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#blog" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2026 AutoCare Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
