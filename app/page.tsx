import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 md:py-32 bg-gradient-to-b from-background to-secondary/20 overflow-hidden relative">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 blur-[100px]"></div>

        <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-secondary/50 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            v2.0 is now live
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 max-w-4xl">
            Master Your Workflow <br />
            <span className="text-primary">Without the Chaos</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] leading-relaxed">
            A secure, intelligent, and beautifully designed task management workspace.
            Organize your life with clarity and style.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-background/50 backdrop-blur-sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl space-y-4 hover:translate-y-[-4px] transition-transform duration-300">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Built on Next.js 16 with instant interactions. No loading spinners, just speed.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl space-y-4 hover:translate-y-[-4px] transition-transform duration-300">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Secure by Default</h3>
              <p className="text-muted-foreground">
                Enterprise-grade authentication with Better Auth. Your data is yours alone.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl space-y-4 hover:translate-y-[-4px] transition-transform duration-300">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Focus Centric</h3>
              <p className="text-muted-foreground">
                A distracted-free interface designed to help you crush your todo list.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}