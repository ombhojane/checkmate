import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import type { VerifyResponse, FeedItem } from '../types';
import Footer from '../components/Footer';

export default function Dashboard() {
  const [trendingThreats, setTrendingThreats] = useState<FeedItem[]>([]);
  const [claimInput, setClaimInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');

  const phrases = [
    'Detecting Misinformation',
    'Verifying Claims',
    'Protecting Truth',
    'Building Trust'
  ];

  useEffect(() => {
    loadTrendingThreats();
    startTypingEffect();
  }, []);

  const startTypingEffect = () => {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeEffect = () => {
      const currentText = phrases[phraseIndex];
      
      if (!isDeleting && charIndex <= currentText.length) {
        setTypedText(currentText.substring(0, charIndex));
        charIndex++;
        setTimeout(typeEffect, 80);
      } else if (isDeleting && charIndex >= 0) {
        setTypedText(currentText.substring(0, charIndex));
        charIndex--;
        setTimeout(typeEffect, 60);
      } else if (!isDeleting && charIndex > currentText.length) {
        isDeleting = true;
        setTimeout(typeEffect, 2000);
      } else if (isDeleting && charIndex < 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        charIndex = 0;
        setTimeout(typeEffect, 500);
      }
    };

    typeEffect();
  };

  const loadTrendingThreats = async () => {
    try {
      const data = await apiService.getTrendingThreats(6);
      setTrendingThreats(data);
    } catch (error) {
      console.error('Failed to load trending threats:', error);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInput.trim()) return;

    setSubmitting(true);
    setVerifyResult(null);
    setError(null);

    try {
      const result = await apiService.verifyClaim(claimInput);
      setVerifyResult(result);
    } catch (err) {
      console.error('Failed to verify claim:', err);
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'false':
        return 'bg-red-100 text-red-800';
      case 'true':
        return 'bg-green-100 text-green-800';
      case 'misleading':
      case 'partially true':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-[#FFF8F0] text-gray-800 min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url("/HEROBG.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            What will you verify today?
          </h1>
          
          <p className="text-lg text-white mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            <strong>CheckMate</strong> - AI-powered fact-checking that analyzes claims in real-time with evidence from trusted sources.
          </p>

          {/* Claim verification form */}
          <form onSubmit={handleSubmitClaim} className="relative">
            <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
              <textarea
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value)}
                placeholder="Enter a claim to fact-check..."
                className="w-full h-40 px-6 py-5 bg-transparent text-white placeholder-white/60 resize-none focus:outline-none text-lg"
                disabled={submitting}
              />
              
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>AI-Powered Analysis</span>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || !claimInput.trim()}
                  className="bg-[#8B4513] hover:bg-[#6B4423] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
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
                    <>
                      Verify now
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-100/90 backdrop-blur-lg border border-red-300 rounded-2xl p-4 text-left">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Verification Result */}
          {verifyResult && (
            <div className="mt-8 bg-white/90 backdrop-blur-lg border border-white/40 rounded-2xl p-6 text-left shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 text-lg">Analysis Complete</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-4 py-1.5 rounded-full font-semibold text-sm ${getVerdictColor(verifyResult.verdict)}`}>
                    {verifyResult.verdict}
                  </span>
                  <span className="text-sm text-gray-600">
                    {verifyResult.confidence}% confidence
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 leading-relaxed">{verifyResult.summary}</p>
              
              {/* Intensity indicator */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className="text-gray-500">Threat Intensity:</span>
                <span className={`font-semibold capitalize ${getIntensityColor(verifyResult.intensity)}`}>
                  {verifyResult.intensity}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">
                  Processed in {verifyResult.processing_time_ms}ms
                </span>
              </div>

              {/* Sources */}
              {verifyResult.sources && verifyResult.sources.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h5 className="font-medium text-gray-900 mb-3">Sources ({verifyResult.sources.length})</h5>
                  <div className="space-y-2">
                    {verifyResult.sources.slice(0, 3).map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 text-sm">{source.title}</span>
                          <span className="text-xs text-gray-500">
                            {source.credibility_score}% credible
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{source.snippet}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <Link
                to={`/claims/${verifyResult.verification_id}`}
                className="inline-flex items-center gap-2 text-[#8B4513] hover:text-[#6B4423] font-medium transition-colors mt-4"
              >
                View Detailed Analysis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}

          {/* Live status indicator */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-[#8B4513] rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-[#8B4513] rounded-full animate-ping opacity-75"></div>
              </div>
              <span>Live monitoring active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Threats Section */}
      <section className="py-20 bg-[#FFF8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] bg-clip-text text-transparent">
                {typedText}
              </span>
              <span className="animate-pulse text-gray-400">|</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real-time monitoring of viral narratives and emerging misinformation
            </p>
          </div>

          {trendingThreats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingThreats.map((threat) => (
                <ThreatCard key={threat.id} threat={threat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading trending threats...</p>
            </div>
          )}
        </div>
      </section>

      {/* AI Explanation Section */}
      <section className="py-20 bg-gradient-to-b from-[#FFF8F0] to-[#FFF0E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">How CheckMate Works</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Combining AI technology with human expertise to deliver transparent, 
              reliable fact-checking at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F5DEB3] to-[#FFEFD5] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md">
                <svg className="w-10 h-10 text-[#8B4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">Claim Detection</h4>
              <p className="text-sm text-gray-600 leading-relaxed">AI monitors thousands of sources to identify checkable claims in real-time.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F5DEB3] to-[#FFEFD5] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md">
                <svg className="w-10 h-10 text-[#8B4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">Evidence Retrieval</h4>
              <p className="text-sm text-gray-600 leading-relaxed">Cross-references with trusted databases, academic sources, and expert analysis.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md">
                <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">Veracity Analysis</h4>
              <p className="text-sm text-gray-600 leading-relaxed">Advanced algorithms analyze evidence to determine accuracy with confidence scores.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md">
                <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">Expert Review</h4>
              <p className="text-sm text-gray-600 leading-relaxed">Human experts review and validate AI findings for maximum accuracy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="bg-[#FFF8F0]">
        <Footer />
      </div>
    </div>
  );
}

interface ThreatCardProps {
  threat: FeedItem;
}

function ThreatCard({ threat }: ThreatCardProps) {
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white/80 rounded-xl p-6 border border-[#F5E6D3] card-hover cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getIntensityColor(threat.intensity)}`}>
          {threat.intensity}
        </span>
        <span className="text-xs font-semibold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
          {threat.language}
        </span>
      </div>
      <h4 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">
        {threat.topic}
      </h4>
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
        {threat.claim_summary}
      </p>
      <div className="veracity-bar mb-3 bg-gray-100">
        <div 
          className="veracity-fill bg-teal-500 h-1.5 rounded-full" 
          style={{ width: `${Math.min(threat.graph_centrality_score * 100, 100)}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{threat.source_count}</span> sources
        </span>
        <span className="flex items-center gap-1 text-teal-600 font-semibold">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {(threat.graph_centrality_score * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
