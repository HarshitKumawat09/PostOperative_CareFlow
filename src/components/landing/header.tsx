"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";

import { HeartPulse } from "lucide-react";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "h-16 bg-white/90 backdrop-blur-md border-b shadow-sm"
          : "h-20 bg-transparent border-transparent"
      }`}
    >
      <div className="container px-4 md:px-6 h-full flex items-center justify-between mx-auto">
        
        {/* LOGO SECTION */}
        <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
          {/* Logo color changes based on scroll */}
          <HeartPulse 
            className={`h-8 w-8 transition-colors ${
              isScrolled ? "text-primary" : "text-white"
            }`} 
          />
          <span 
            className={`text-xl font-bold font-headline transition-colors ${
              isScrolled ? "text-slate-900" : "text-white"
            }`}
          >
            CareFlow
          </span>
        </Link>

        {/* NAVIGATION LINKS (Hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "How It Works", "Testimonials"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className={`text-sm font-medium transition-colors hover:underline underline-offset-4 ${
                isScrolled 
                  ? "text-slate-600 hover:text-primary" 
                  : "text-white/90 hover:text-white"
              }`}
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* BUTTONS SECTION */}
        <div className="flex items-center gap-4">
          <Link
             href="/login"
             className={`text-sm font-medium transition-colors ${
               isScrolled 
                 ? "text-slate-600 hover:text-primary" 
                 : "text-white hover:text-white/80"
             }`}
          >
            Login
          </Link>
          
          <Button 
            asChild
            className={`font-semibold rounded-full px-6 transition-all ${
              isScrolled
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-white text-primary hover:bg-white/90"
            }`}
          >
            {/* <Link href="/signup" prefetch={false}>
              Get Started
            </Link> */}
          </Button>
        </div>
      </div>
    </header>
  );
}