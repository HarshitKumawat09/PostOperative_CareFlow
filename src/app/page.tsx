
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  MessageSquare, 
  TrendingUp, 
  HeartPulse, 
  Database, 
  BrainCircuit, 
  FileText, 
  ArrowRight, 
  ShieldCheck,
  PlayCircle
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <Header />
      
      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"
              alt="Medical Recovery"
              fill
              className="object-cover object-center brightness-50" 
              priority
            />
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-black/40" />
          </div>

          <div className="container relative z-10 px-4 md:px-6 text-center">
            <h1 className="mx-auto max-w-4xl text-3xl font-bold tracking-tighter text-white sm:text-5xl xl:text-6xl/none mb-6 drop-shadow-md">
              "Moving beyond basic health monitoring to provide intelligent, explainable, and predictive recovery support."
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl mb-8 font-light">
              Your intelligent post-operative partner. We use RAG and LLMs to explain risks, predict complications, and empower your recovery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white min-w-[160px]">
                <Link href="/login">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent text-white border-white hover:bg-white/20 min-w-[160px] gap-2">
                <Link href="#demo">
                  <PlayCircle className="w-5 h-5" />
                  Watch Demo Video
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
            </div>
            
            {/* FIX 1: Added lg:grid-cols-4 to make it a single row on laptop */}
            {/* FIX 2: Increased max-w to 6xl to give it breathing room */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              
              <div className="flex flex-col items-center text-center space-y-4 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                <ClipboardCheck className="w-12 h-12 text-primary" />
                <div>
                  <h3 className="text-xl font-bold">Daily Med Reminder</h3>
                  <p className="text-muted-foreground">Never miss a dose. Smart scheduling ensures you stay on track.</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                <MessageSquare className="w-12 h-12 text-primary" />
                <div>
                  <h3 className="text-xl font-bold">Direct Chat with Staff</h3>
                  <p className="text-muted-foreground">Secure, HIPAA-compliant messaging to reach your care team.</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                <TrendingUp className="w-12 h-12 text-primary" />
                <div>
                  <h3 className="text-xl font-bold">Daily Progression</h3>
                  <p className="text-muted-foreground">Visualize your recovery journey with simple charts.</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                <HeartPulse className="w-12 h-12 text-primary" />
                <div>
                  <h3 className="text-xl font-bold">Post Op Health Care</h3>
                  <p className="text-muted-foreground">Access personalized, surgery-specific care plans.</p>
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