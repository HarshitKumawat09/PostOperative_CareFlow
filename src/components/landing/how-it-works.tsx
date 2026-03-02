'use client';

import { Upload, Search, Brain, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: "Guideline Ingestion",
    description: "Medical staff upload hospital protocols, surgical guidelines, and post-operative care instructions",
    details: ["PDF documents", "Text files", "Direct paste", "Metadata tagging"],
    color: "bg-blue-500",
    delay: "delay-0"
  },
  {
    icon: Search,
    title: "Vector Storage",
    description: "Documents are converted to semantic embeddings and stored in our specialized medical database",
    details: ["Semantic understanding", "Fast retrieval", "Context preservation", "Medical accuracy"],
    color: "bg-green-500", 
    delay: "delay-100"
  },
  {
    icon: Brain,
    title: "Smart Retrieval",
    description: "When patients ask questions, AI finds the most relevant hospital guidelines using semantic search",
    details: ["Context matching", "Relevance scoring", "Multiple sources", "Confidence levels"],
    color: "bg-purple-500",
    delay: "delay-200"
  },
  {
    icon: MessageSquare,
    title: "Grounded Response",
    description: "AI generates answers using ONLY the retrieved hospital guidelines, ensuring medical accuracy",
    details: ["Protocol-compliant", "Source citations", "Risk assessment", "Safety first"],
    color: "bg-orange-500",
    delay: "delay-300"
  }
];

const comparison = [
  {
    title: "Generic Medical AI",
    items: [
      { text: "Uses internet knowledge", type: "bad" },
      { text: "May hallucinate information", type: "bad" },
      { text: "One-size-fits-all answers", type: "bad" },
      { text: "No hospital specificity", type: "bad" }
    ]
  },
  {
    title: "CareFlow AI",
    items: [
      { text: "Hospital-specific protocols", type: "good" },
      { text: "100% guideline grounded", type: "good" },
      { text: "Personalized to your hospital", type: "good" },
      { text: "Medically verified sources", type: "good" }
    ]
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How CareFlow AI Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our breakthrough technology ensures every medical answer is based on your hospital's 
            exact protocols, not generic internet knowledge.
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className={`relative ${step.delay}`}>
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              
              {/* Step Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-lg ${step.color} mb-4`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {step.description}
                </p>
                
                {/* Details */}
                <ul className="space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-blue-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            The CareFlow Difference
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {comparison.map((item, index) => (
              <div key={index} className="text-center">
                <h4 className={`text-lg font-semibold mb-4 ${
                  index === 0 ? 'text-gray-500' : 'text-blue-600'
                }`}>
                  {item.title}
                </h4>
                <ul className="space-y-3">
                  {item.items.map((listItem, itemIndex) => (
                    <li 
                      key={itemIndex} 
                      className={`flex items-center justify-center gap-2 text-sm ${
                        listItem.type === 'bad' ? 'text-red-600' : listItem.type === 'good' ? 'text-green-600' : 'text-gray-600'
                      }`}
                    >
                      {listItem.type === 'bad' ? (
                        <span className="text-red-500">✗</span>
                      ) : (
                        <span className="text-green-500">✓</span>
                      )}
                      {listItem.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
            <div className="text-gray-600 text-sm">Accuracy Rate</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-2">&lt;2s</div>
            <div className="text-gray-600 text-sm">Response Time</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
            <div className="text-gray-600 text-sm">Protocol Compliant</div>
          </div>
        </div>
      </div>
    </section>
  );
}
