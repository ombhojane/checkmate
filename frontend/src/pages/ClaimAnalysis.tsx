import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import type { VerifyResponse, SimilarClaim } from '../types';
import Footer from '../components/Footer';

export default function ClaimAnalysis() {
  const { claimId } = useParams<{ claimId: string }>();
  const [verification, setVerification] = useState<VerifyResponse | null>(null);
  const [similarClaims, setSimilarClaims] = useState<SimilarClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (claimId) {
      loadVerification(claimId);
    }
  }, [claimId]);

  const loadVerification = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getVerification(id);
      setVerification(data);
      
      // Load similar claims
      try {
        const similar = await apiService.getSimilarClaims(id, 3);
        setSimilarClaims(similar);
      } catch {
        // Similar claims might not be available
        console.log('No similar claims found');
      }
    } catch (err) {
      console.error('Failed to load verification:', err);
      setError('Verification not found or failed to load.');
    } finally {
      setLoading(false);
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
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFF8F0]">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-[#8B4513] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFF8F0]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The verification you are looking for does not exist.'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B4513] text-white rounded-xl font-semibold hover:bg-[#6B4423] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF8F0] min-h-screen">
      {/* Header with Back Button */}
      <div className="bg-[#FFF8F0] border-b border-[#F5E6D3] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/dashboard" className="inline-flex items-center text-[#8B4513] hover:text-[#6B4423] font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Verification Result Section */}
      <section className="bg-[#FFF8F0] border-b border-[#F5E6D3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Result */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <span className={`px-5 py-2 rounded-lg text-sm font-bold ${getVerdictColor(verification.verdict)}`}>
                  {verification.verdict.toUpperCase()}
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className={`font-bold text-lg ${getConfidenceColor(verification.confidence)}`}>
                    {verification.confidence}%
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${getIntensityColor(verification.intensity)}`}>
                  {verification.intensity} intensity
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                Verification Summary
              </h1>

              <p className="text-gray-700 leading-relaxed text-lg border-l-4 border-[#8B4513] pl-4 mb-6">
                {verification.summary}
              </p>
            </div>

            {/* Quick Facts Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Quick Facts</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Verdict</div>
                    <div className="text-xl font-bold text-gray-900">{verification.verdict}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Confidence Score</div>
                    <div className={`text-2xl font-bold ${getConfidenceColor(verification.confidence)}`}>
                      {verification.confidence}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Threat Intensity</div>
                    <div className={`text-sm font-bold capitalize ${
                      verification.intensity === 'high' ? 'text-red-600' : 
                      verification.intensity === 'medium' ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {verification.intensity}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Processing Time</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {verification.processing_time_ms}ms
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Sources Analyzed</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {verification.sources?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Analysis Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Detailed Analysis */}
            <div className="bg-white/80 rounded-xl border border-[#F5E6D3] p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Analysis</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {verification.detailed_analysis}
                </p>
              </div>
            </div>

            {/* Evidence Sources */}
            <div className="bg-white/80 rounded-xl border border-[#F5E6D3] p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Evidence Sources</h2>
              {verification.sources && verification.sources.length > 0 ? (
                <div className="space-y-4">
                  {verification.sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#8B4513] hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-gray-900 flex-1 line-clamp-2">{source.title}</h4>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed italic line-clamp-3">
                        "{source.snippet}"
                      </p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Credibility:</span>
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                source.credibility_score >= 85 ? 'bg-green-500' :
                                source.credibility_score >= 70 ? 'bg-[#8B4513]' :
                                source.credibility_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${source.credibility_score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-900">{source.credibility_score}%</span>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#8B4513] hover:text-[#6B4423] font-semibold flex items-center gap-1 group-hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Source
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No sources available for this verification.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Similar Claims Section */}
      {similarClaims.length > 0 && (
        <section className="py-12 bg-[#FFF8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Claims</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarClaims.map((claim) => (
                <Link
                  key={claim.verification_id}
                  to={`/claims/${claim.verification_id}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#8B4513] hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getVerdictColor(claim.verdict)}`}>
                      {claim.verdict.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(claim.similarity * 100)}% similar
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">{claim.claim_text}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{claim.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Confidence Indicator */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#FFF8F0] to-[#FFEFD5] rounded-2xl p-8 border border-[#F5E6D3]">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Confidence</h3>
                <p className="text-gray-600">
                  This analysis was performed with {verification.confidence}% confidence based on {verification.sources?.length || 0} sources.
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getConfidenceColor(verification.confidence)}`}>
                    {verification.confidence}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Confidence</div>
                </div>
                <div className="w-32 h-32 relative">
                  <svg className="transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={verification.confidence >= 80 ? '#22c55e' : verification.confidence >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${verification.confidence * 2.51} 251`}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
