import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, Zap, Layers, Clock } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary">Galaxy AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="
                px-4 py-2 rounded-lg text-sm font-medium
                gradient-primary text-white
                hover:opacity-90 transition-opacity
              "
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Powered by Google Gemini</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-text-primary mb-6 leading-tight">
            Build AI Workflows
            <br />
            <span className="gradient-text">Visually</span>
          </h1>

          {/* Description */}
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Create powerful AI workflows with a visual drag-and-drop interface.
            Connect nodes, process data, and execute tasks with parallel processing.
          </p>

          {/* CTA */}
          <Link
            href="/sign-up"
            className="
              inline-flex items-center gap-2 px-6 py-3 rounded-lg
              gradient-primary text-white font-medium text-lg
              hover:opacity-90 transition-opacity shadow-glow
            "
          >
            Start Building
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            {
              icon: Layers,
              title: "Visual Builder",
              description: "Drag and drop nodes to create complex workflows without code",
            },
            {
              icon: Zap,
              title: "Parallel Execution",
              description: "Execute multiple nodes simultaneously for faster processing",
            },
            {
              icon: Clock,
              title: "Run History",
              description: "Track every execution with detailed logs and outputs",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="
                p-6 rounded-xl bg-surface border border-surface-border
                hover:border-primary/30 transition-colors
              "
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Galaxy AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
