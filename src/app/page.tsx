import Link from "next/link";
import { ArrowRight, Video, Sparkles, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="selection-indigo">
      {/* Navbar */}
      <nav className="glass-nav fixed w-full z-50">
        <div className="container">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="btn-primary" style={{ width: '32px', height: '32px', padding: 0 }}>
                <Zap size={20} />
              </div>
              <span className="text-xl font-bold gradient-text">
                AutoReels AI
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/auth/login" className="text-sm font-medium text-muted">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="btn btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="hero-glow" />

        <div className="container text-center">
          <div className="inline-flex items-center gap-2 badge badge-indigo mb-8" style={{ display: 'inline-flex' }}>
            <Sparkles size={12} />
            <span>AI-Powered Content Generation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold gradient-text mb-6" style={{ lineHeight: 1.1 }}>
            Go Viral on Autopilot <br /> with AI Shorts
          </h1>

          <p className="text-lg text-muted mb-10" style={{ maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Generate, schedule, and auto-upload professional Reels and YouTube Shorts in seconds. Scale your social presence without the editing grind.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="btn btn-primary text-lg"
              style={{ padding: '1rem 2rem' }}
            >
              Start Creating Free
              <ArrowRight className="ml-2 w-5 h-5" style={{ marginLeft: '0.5rem' }} />
            </Link>
            <Link
              href="/app/templates"
              className="btn btn-outline text-lg"
              style={{ padding: '1rem 2rem' }}
            >
              View Templates
            </Link>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8" style={{ marginTop: '5rem', borderTop: '1px solid var(--border)', paddingTop: '3rem' }}>
            <div>
              <p className="text-3xl font-bold">10x</p>
              <p className="text-sm text-muted mt-1">Faster Editing</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-muted mt-1">Auto-Scheduling</p>
            </div>
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-muted mt-1">AI Generated</p>
            </div>
            <div>
              <p className="text-3xl font-bold">4.9/5</p>
              <p className="text-sm text-muted mt-1">User Rating</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '3rem 0', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>© 2026 AutoReels AI. Built for the next generation of creators.</p>
      </footer>
    </div>
  );
}
