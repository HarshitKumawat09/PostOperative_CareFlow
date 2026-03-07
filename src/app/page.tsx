import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  MessageSquare, 
  TrendingUp, 
  HeartPulse, 
  Database, 
  Brain, 
  FileText, 
  ArrowRight, 
  ShieldCheck,
  PlayCircle,
  BrainCircuit
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <Header />
      
      <main className="flex-1">
        {/* ================= HERO SECTION (Upgraded) ================= */}
        <section className="relative w-full h-screen min-h-[650px] flex items-center justify-center overflow-hidden group">
          
          {/* 1. Background Image with Parallax-like feel */}
          <div className="absolute inset-0 z-0 transform scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-in-out">
            <Image
              src="https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=2070&auto=format&fit=crop"
              alt="Woman resting comfortably while CareFlow manages recovery"
              fill
              className="object-cover object-center"
              priority
            />
          </div>

          {/* 2. Advanced Overlay - Multi-layered for depth */}
          {/* Layer A: Darkens the whole image slightly */}
          <div className="absolute inset-0 bg-blue-950/30 mix-blend-multiply z-1" />
          {/* Layer B: A strong gradient from bottom-left (blue) to top-right (transparent/dark) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 via-black/40 to-black/10 z-2" />
          {/* Layer C: Subtle radial gradient to focus attention on the center text */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/50 z-3" />


          {/* 3. Centered Content with animation entry */}
          <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
            
            {/* Optional "Kicker" text above headline */}
            <p className="text-blue-200 font-semibold tracking-widest uppercase text-sm mb-6 animate-fade-in-down">
              The New Standard in Post-Op Care.
            </p>

            {/* Main Headline (Quote) */}
            <h1 className="max-w-5xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl mb-8 drop-shadow-2xl leading-tight animate-fade-in-up delay-100">
              “Moving beyond basic health monitoring to provide <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">intelligent, explainable, and predictive</span> recovery support.”
            </h1>
            
            {/* Subheadline */}
            <p className="max-w-2xl text-lg md:text-xl text-blue-50/90 mb-12 font-medium leading-relaxed animate-fade-in-up delay-200">
              Your intelligent partner. We use RAG and AI to explain risks, predict complications, and empower your recovery from the comfort of home.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 w-full justify-center animate-fade-in-up delay-300">
              {/* Primary Button with glow effect */}
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-8 h-14 rounded-full shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-blue-400/40 min-w-[200px]">
                <Link href="/login">Get Started</Link>
              </Button>
              
              {/* Secondary Button with glass effect */}
              <Button asChild variant="outline" size="lg" className="bg-white/5 text-white border-2 border-white/30 hover:bg-white/10 hover:border-white text-lg px-8 h-14 rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-105 min-w-[200px] gap-3">
                <Link href="#demo">
                   <PlayCircle className="w-6 h-6" />
                   Watch Demo
                </Link>
              </Button>
            </div>

          </div>
        </section>

        {/* ================= INTRO / VALUE PROP ================= */}
        <section className="w-full py-16 md:py-24 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <div className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
                Introduction
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                Your AI-Powered Recovery Partner
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                CareFlow isn't just a logbook. It collects post-operative inputs and uses advanced AI to ground answers in medical guidelines, preventing hallucinations and ensuring safety.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center p-6">
                <div className="p-4 rounded-full bg-blue-100 mb-4">
                  <Database className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Data Collection</h3>
                <p className="text-muted-foreground">
                  Seamlessly collects pain levels, mobility logs, and symptom reports daily.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center p-6">
                <div className="p-4 rounded-full bg-blue-100 mb-4">
                  <BrainCircuit className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Analysis</h3>
                <p className="text-muted-foreground">
                  Interprets raw data to explain recovery risks in simple, understandable language.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center p-6">
                <div className="p-4 rounded-full bg-blue-100 mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Proactive Alerts</h3>
                <p className="text-muted-foreground">
                  Predicts potential complications early and generates smart summaries for doctors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= KEY FEATURES GRID ================= */}
        <section className="w-full py-16 md:py-24 bg-secondary/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Key Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Comprehensive Care Tools
              </h2>
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 max-w-6xl mx-auto">
                
                {/* Daily Med Reminder */}
                <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                  <ClipboardCheck className="w-12 h-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Daily Med Reminder</h3>
                    <p className="text-muted-foreground">Never miss a dose. Smart scheduling ensures you stay on track.</p>
                  </div>
                </div>

                {/* Direct Chat with Staff */}
                <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                  <MessageSquare className="w-12 h-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Direct Chat with Staff</h3>
                    <p className="text-muted-foreground">Secure, HIPAA-compliant messaging to reach your care team.</p>
                  </div>
                </div>

                {/* AI-Powered Health Analysis */}
                <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                  <Brain className="w-12 h-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">🤖 AI-Powered Health Analysis</h3>
                    <p className="text-muted-foreground">Advanced risk assessment and predictive insights for better outcomes.</p>
                  </div>
                </div>

                {/* Proactive Alerts */}
                <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                  <ShieldCheck className="w-12 h-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Proactive Alerts</h3>
                    <p className="text-muted-foreground">Early complication detection and smart notifications for medical staff.</p>
                  </div>
                </div>

                {/* Recovery Progress Tracking */}
                <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                  <TrendingUp className="w-12 h-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Recovery Progress Tracking</h3>
                    <p className="text-muted-foreground">Visualize your healing journey with intelligent progress charts.</p>
                  </div>
                </div>

                {/* Gemini AI Assistant */}
                <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                  <Brain className="w-12 h-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">🤖 Gemini AI Assistant</h3>
                    <p className="text-muted-foreground">Test AI-powered medical intelligence and explanations.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ================= TECHNOLOGY STACK (RAG DIAGRAM) ================= */}
        <section className="w-full py-16 md:py-24 bg-white border-y">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <div className="inline-block rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-800 mb-4">
                Technology
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-4">
                Our Unique Intelligence Layer
              </h2>
              <p className="max-w-[800px] mx-auto text-muted-foreground">
                We don't just "guess". We use <strong>Retrieval-Augmented Generation (RAG)</strong> to combine your data with verified medical guidelines.
              </p>
            </div>

            {/* The Diagram Flow */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-4 max-w-6xl mx-auto py-8">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center bg-slate-50 border p-6 rounded-xl w-64 h-48 justify-center shadow-sm">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <ClipboardCheck className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-lg">Patient Data</h4>
                <p className="text-xs text-center text-muted-foreground mt-2">Symptoms, Pain, Logs</p>
              </div>

              <ArrowRight className="text-gray-300 w-8 h-8 rotate-90 lg:rotate-0" />

              {/* Step 2 */}
              <div className="flex flex-col items-center bg-slate-50 border p-6 rounded-xl w-64 h-48 justify-center shadow-sm">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-lg">Vector DB</h4>
                <p className="text-xs text-center text-muted-foreground mt-2">Medical Guidelines & Protocols</p>
              </div>

              <ArrowRight className="text-gray-300 w-8 h-8 rotate-90 lg:rotate-0" />

              {/* Step 3 */}
              <div className="flex flex-col items-center bg-primary/5 border-2 border-primary/20 p-6 rounded-xl w-64 h-48 justify-center shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1 rounded-bl">Core</div>
                <div className="bg-primary p-3 rounded-full mb-3">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-lg text-primary">RAG Engine</h4>
                <p className="text-xs text-center text-muted-foreground mt-2">LLM + Context Retrieval</p>
              </div>

              <ArrowRight className="text-gray-300 w-8 h-8 rotate-90 lg:rotate-0" />

              {/* Step 4 */}
              <div className="flex flex-col items-center bg-slate-50 border p-6 rounded-xl w-64 h-48 justify-center shadow-sm">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-lg">Explainable Insight</h4>
                <p className="text-xs text-center text-muted-foreground mt-2">Predictive Alerts & Explanations</p>
              </div>
            </div>

            <div className="mt-12 p-8 bg-slate-50 rounded-2xl border text-center max-w-4xl mx-auto">
               <p className="text-xl md:text-2xl font-serif italic text-gray-700">
                 "PostOpCare-AI adds the missing intelligence layer with predictive alerts and explainable medical feedback."
               </p>
            </div>
          </div>
        </section>

        {/* ================= NEW LANDING SECTIONS ================= */}
        <Features />
        <HowItWorks />
        <Testimonials />

        {/* ================= FINAL CTA ================= */}
        <section className="w-full py-20 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
              Ready for a smarter recovery?
            </h2>
            <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl mb-8">
              Join the platform that understands your recovery journey.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-primary font-bold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
              <Link href="/login">Get Started Now</Link>
            </Button>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}