import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ClipboardCheck, MessageSquare, TrendingUp, HeartPulse } from "lucide-react";
import Link from "next/link";
import { placeholderImages } from "@/lib/data";

const features = [
  {
    icon: <ClipboardCheck className="w-8 h-8 text-primary" />,
    title: "Daily Med Reminder",
    description: "Never miss a dose with our smart reminders.",
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-primary" />,
    title: "Direct Chat with Staff",
    description: "Communicate securely with your care team anytime.",
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
    title: "Daily Progression",
    description: "Track your recovery journey with simple daily logs.",
  },
  {
    icon: <HeartPulse className="w-8 h-8 text-primary" />,
    title: "Post Op Health Care",
    description: "Access personalized post-operative care plans.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Your Digital Recovery Companion
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    CareFlow simplifies your post-surgery care, connecting you with your medical team and empowering you on your journey to recovery.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">
                      Get Started
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src={placeholderImages.find(img => img.id === 'hero-landing')?.imageUrl ?? "https://picsum.photos/seed/1/600/400"}
                data-ai-hint="medical professional tablet"
                width={600}
                height={400}
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Proactive Post-Surgery Care</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides the tools you need to take control of your recovery process, ensuring a smoother and safer healing experience.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4 mt-12">
              {features.map((feature, index) => (
                <div key={index} className="grid gap-1 text-center">
                   <div className="flex justify-center items-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
