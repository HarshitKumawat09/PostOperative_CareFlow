'use client';

import { Quote, Star, Hospital, User, Stethoscope } from 'lucide-react';

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Head of Surgery",
    hospital: "Apollo Hospitals",
    avatar: "SC",
    content: "CareFlow AI has transformed our post-operative care. Patients get instant, accurate answers based on our exact protocols. We've reduced unnecessary hospital visits by 80% and improved patient satisfaction significantly.",
    rating: 5,
    type: "doctor"
  },
  {
    name: "Michael Rodriguez",
    role: "Knee Replacement Patient",
    hospital: "Mayo Clinic",
    avatar: "MR",
    content: "Having CareFlow AI after my surgery was incredible. I could ask questions at 2 AM and get immediate answers that followed my hospital's exact guidelines. It gave me peace of mind throughout my recovery.",
    rating: 5,
    type: "patient"
  },
  {
    name: "Dr. James Wilson",
    role: "Medical Director",
    hospital: "Cleveland Clinic",
    avatar: "JW",
    content: "The accuracy is remarkable. Unlike generic medical apps, CareFlow AI only uses our hospital's protocols. Our staff loves it, and our patients feel more confident in their recovery journey.",
    rating: 5,
    type: "doctor"
  },
  {
    name: "Priya Sharma",
    role: "Cardiac Surgery Patient",
    hospital: "Fortis Healthcare",
    avatar: "PS",
    content: "I was anxious about going home after heart surgery. CareFlow AI became my 24/7 companion. Every answer was consistent with what my doctors told me, which made me feel safe and cared for.",
    rating: 5,
    type: "patient"
  },
  {
    name: "Dr. Emily Thompson",
    role: "Post-Op Care Coordinator",
    hospital: "Johns Hopkins Medicine",
    avatar: "ET",
    content: "Our care team efficiency has improved dramatically. We spend less time answering routine questions and more time on complex cases. The AI's ability to reference our exact protocols is game-changing.",
    rating: 5,
    type: "doctor"
  },
  {
    name: "Robert Kim",
    role: "Spinal Surgery Patient",
    hospital: "Massachusetts General Hospital",
    avatar: "RK",
    content: "The personalized recovery timeline helped me understand what to expect each day. When I had concerns about swelling, CareFlow AI gave me answers that matched my surgeon's instructions perfectly.",
    rating: 5,
    type: "patient"
  }
];

const stats = [
  { value: "95%", label: "Accuracy Rate", description: "Protocol-compliant answers" },
  { value: "80%", label: "Fewer Calls", description: "Reduced unnecessary inquiries" },
  { value: "24/7", label: "Availability", description: "Round-the-clock support" },
  { value: "10M+", label: "Questions Answered", description: "Across partner hospitals" }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by Leading Healthcare Institutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from medical professionals and patients who have experienced the 
            transformative power of hospital-specific AI guidance.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-gray-900 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${
                    testimonial.type === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Hospital className="h-3 w-3" />
                      {testimonial.hospital}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="relative">
                <Quote className="absolute -top-2 -left-2 h-8 w-8 text-blue-100" />
                <p className="text-gray-700 text-sm leading-relaxed pl-6">
                  {testimonial.content}
                </p>
              </div>

              {/* Type Badge */}
              <div className="mt-4 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {testimonial.type === 'doctor' ? (
                  <>
                    <Stethoscope className="h-3 w-3" />
                    Medical Professional
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3" />
                    Patient
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Join Hospitals Revolutionizing Post-Operative Care
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Experience the power of hospital-specific AI that understands your exact protocols 
            and provides safe, accurate guidance for your patients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Request Demo
            </button>
            <button className="px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              View Case Studies
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
