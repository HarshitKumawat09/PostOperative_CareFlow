'use client';

import { Brain, Shield, Clock, MessageSquare, Users, FileText, BarChart3, Heart } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: "Hospital-Specific AI",
    description: "Get answers based on your hospital's exact medical protocols, not generic internet knowledge",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Shield,
    title: "Medically Grounded",
    description: "Every AI response is sourced from official hospital guidelines, eliminating hallucinations",
    color: "text-green-600", 
    bgColor: "bg-green-50"
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Instant medical guidance anytime, anywhere - no more waiting for doctor callbacks",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: MessageSquare,
    title: "Intelligent Q&A",
    description: "Ask natural language questions and receive precise, protocol-based medical answers",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    icon: Users,
    title: "Staff-Patient Connect",
    description: "Seamless communication between medical staff and patients with real-time chat support",
    color: "text-pink-600",
    bgColor: "bg-pink-50"
  },
  {
    icon: FileText,
    title: "Guideline Management",
    description: "Easy upload and management of hospital protocols and medical guidelines",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track patient recovery patterns, guideline usage, and care effectiveness",
    color: "text-teal-600",
    bgColor: "bg-teal-50"
  },
  {
    icon: Heart,
    title: "Personalized Care",
    description: "Surgery-specific recovery timelines and personalized symptom tracking",
    color: "text-red-600",
    bgColor: "bg-red-50"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Revolutionary Features for Modern Healthcare
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the first AI system that understands your hospital's exact medical protocols 
            and provides safe, accurate guidance for post-operative care.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-4">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">95% Accuracy Rate</span>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join leading hospitals that trust CareFlow AI for safe, accurate, and hospital-specific 
            post-operative care guidance.
          </p>
        </div>
      </div>
    </section>
  );
}
