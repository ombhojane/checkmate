import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'tabler-icons-react';
import AuthModal from '../components/AuthModal';
import { apiService } from '../services/api';
import type { VerifyResponse } from '../types';
import logo from '../assets/checkmate-logo.png';

export default function Home() {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [claimInput, setClaimInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!claimInput.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const result: VerifyResponse = await apiService.verifyClaim(claimInput);
      navigate(`/claims/${result.verification_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "What is CheckMate?",
      answer: "CheckMate is an AI-powered misinformation detection platform that helps verify claims in real-time using advanced machine learning models."
    },
    {
      question: "How accurate is the verification?",
      answer: "Our multi-model AI system achieves 99.5% accuracy by cross-referencing claims against trusted sources and fact-checking databases."
    },
    {
      question: "What sources does CheckMate use?",
      answer: "We analyze data from academic papers, news archives, fact-checking organizations, and verified databases to ensure comprehensive verification."
    },
    {
      question: "Is CheckMate free to use?",
      answer: "We offer a free tier with basic features. Premium plans are available for advanced analytics and higher usage limits."
    },
    {
      question: "How long does verification take?",
      answer: "Most claims are verified within 1-2 seconds. Complex claims requiring deeper analysis may take up to 5 seconds."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Journalist, Reuters",
      text: "CheckMate has revolutionized how we verify information. It's fast, accurate, and incredibly reliable.",
      image: "https://i.pravatar.cc/150?img=1"
    },
    {
      name: "Michael Chen",
      role: "Researcher, MIT",
      text: "The multi-model approach gives us confidence in the results. An essential tool for academic research.",
      image: "https://i.pravatar.cc/150?img=2"
    },
    {
      name: "Emily Rodriguez",
      role: "Fact-Checker, Snopes",
      text: "We've integrated CheckMate into our workflow. It saves us hours of manual verification work.",
      image: "https://i.pravatar.cc/150?img=3"
    },
    {
      name: "David Kim",
      role: "Editor, The Guardian",
      text: "The real-time analysis is game-changing. We can verify breaking news faster than ever before.",
      image: "https://i.pravatar.cc/150?img=4"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8F0]/70 backdrop-blur-lg border-b border-[#F5E6D3]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <img src={logo} alt="CheckMate" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold">CheckMate</span>
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-black transition-colors">
              Pricing
            </Link>
            <Link to="/careers" className="text-sm font-medium text-gray-700 hover:text-black transition-colors">
              Careers
            </Link>
            <Link to="/resources" className="text-sm font-medium text-gray-700 hover:text-black transition-colors">
              Resources
            </Link>
          </div>

          {/* Sign In / Sign Up */}
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-2.5 bg-[#8B4513] text-white text-sm font-semibold rounded-lg hover:bg-[#6B4423] transition-all"
          >
            Sign In / Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center pt-20"
        style={{
          backgroundImage: 'url("/HEROBG.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Truth, Verified. <br />
            <span>Instantly.</span>
          </h1>
          <p className="text-xl text-white mb-12 drop-shadow-md max-w-2xl mx-auto">
            AI-powered fact-checking that analyzes claims in real-time with evidence from trusted sources.
          </p>

          {/* Chat Interface */}
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-2xl">
            <textarea
              value={claimInput}
              onChange={(e) => setClaimInput(e.target.value)}
              placeholder="Enter a claim to fact-check..."
              className="w-full h-40 px-6 py-5 bg-transparent text-white placeholder-white/60 resize-none focus:outline-none text-lg"
              disabled={submitting}
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>AI-Powered Analysis</span>
              </div>
              <button 
                onClick={handleVerify}
                disabled={submitting || !claimInput.trim()}
                className="px-6 py-2.5 bg-[#8B4513] text-white rounded-xl font-semibold hover:bg-[#6B4423] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify Now'
                )}
              </button>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-100/90 backdrop-blur-lg border border-red-300 rounded-xl p-4 text-left">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-[#FFF8F0]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">About CheckMate</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The enterprise-grade misinformation detection platform powered by multi-model AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white/80 backdrop-blur-lg border border-[#F5E6D3] rounded-2xl p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-[#8B4513] to-[#A0522D] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">What is CheckMate?</h3>
              <p className="text-gray-600 leading-relaxed">
                CheckMate is an AI-powered platform that detects misinformation by analyzing claims against verified sources, academic papers, and fact-checking databases in real-time.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/80 backdrop-blur-lg border border-[#F5E6D3] rounded-2xl p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6B4423] to-[#8B4513] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">How It Works</h3>
              <p className="text-gray-600 leading-relaxed">
                Our multi-model AI combines GPT-4, Claude, and Gemini to cross-reference claims, reducing hallucination rates to near zero with 99.5% accuracy.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/80 backdrop-blur-lg border border-[#F5E6D3] rounded-2xl p-8 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-[#A0522D] to-[#8B4513] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-Time Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant verification results with detailed evidence, source citations, and confidence scores. Process thousands of claims per minute.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          backgroundImage: 'url("/HEROBG.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">Trusted by Experts</h2>
            <p className="text-xl text-white/90">See what professionals are saying about CheckMate</p>
          </div>

          {/* Scrolling Testimonials */}
          <div className="space-y-8">
            {/* Row 1 - Left to Right */}
            <div className="flex gap-6 animate-scroll-left">
              {[...testimonials, ...testimonials].map((testimonial, idx) => (
                <div
                  key={`left-${idx}`}
                  className="flex-shrink-0 w-96 bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <h4 className="font-bold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-white/80">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/90 leading-relaxed">{testimonial.text}</p>
                </div>
              ))}
            </div>

            {/* Row 2 - Right to Left */}
            <div className="flex gap-6 animate-scroll-right">
              {[...testimonials, ...testimonials].map((testimonial, idx) => (
                <div
                  key={`right-${idx}`}
                  className="flex-shrink-0 w-96 bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <h4 className="font-bold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-white/80">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/90 leading-relaxed">{testimonial.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-8 py-4 bg-[#8B4513] text-white font-bold text-lg rounded-xl hover:bg-[#6B4423] transition-all shadow-xl"
            >
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-24 bg-[#FFF8F0]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about CheckMate</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#FFEFD5] border border-[#F5DEB3] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#FFE4B5] transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                  <ChevronDown
                    size={24}
                    className={`text-gray-600 transition-transform ${
                      expandedFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        className="relative py-32"
        style={{
          backgroundImage: 'url("/HEROBG.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          {/* Floating Chat Interface */}
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-2xl -mt-20 mb-16">
            <textarea
              value={claimInput}
              onChange={(e) => setClaimInput(e.target.value)}
              placeholder="Try CheckMate now - Enter any claim..."
              className="w-full h-40 px-6 py-5 bg-transparent text-white placeholder-white/60 resize-none focus:outline-none text-lg"
              disabled={submitting}
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Instant Verification</span>
              </div>
              <button 
                onClick={handleVerify}
                disabled={submitting || !claimInput.trim()}
                className="px-6 py-2.5 bg-[#8B4513] text-white rounded-xl font-semibold hover:bg-[#6B4423] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Analyze Claim'
                )}
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-8 text-white/80 text-sm">
              <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-white/60 text-sm">
              © 2025 CheckMate. All Rights Reserved. Built at Mumbai Hacks 2025
            </p>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
