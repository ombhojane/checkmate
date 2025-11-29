import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import type { FeedItem } from '../types';
import Footer from '../components/Footer';

export default function Timeline() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedIntensity, setSelectedIntensity] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await apiService.getFeed(50);
      setFeedItems(data);
    } catch (error) {
      console.error('Failed to load threat feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const intensityLevels = ['all', 'high', 'medium', 'low'];

  const filteredItems = selectedIntensity === 'all'
    ? feedItems
    : feedItems.filter(item => item.intensity === selectedIntensity);

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[#FFF8F0] text-gray-800 min-h-screen">
      {/* Timeline Header */}
      <section className="pt-24 pb-8 bg-[#FFF8F0] border-b border-[#F5E6D3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/dashboard" className="text-[#8B4513] hover:text-[#6B4423] text-sm font-medium">
              ← Back to Dashboard
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">Threat Feed Timeline</h1>
          <p className="text-lg text-gray-600 mb-8">
            Track trending misinformation threats and their spread over time.
          </p>

          {/* Intensity Filter */}
          <div className="flex flex-wrap gap-3">
            {intensityLevels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedIntensity(level)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedIntensity === level
                    ? 'bg-[#8B4513] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          {/* Timeline Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-800">{feedItems.length}</div>
              <div className="text-sm text-gray-600">Total Threats</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-600">
                {feedItems.filter(e => e.intensity === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Intensity</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-600">
                {feedItems.filter(e => e.intensity === 'medium').length}
              </div>
              <div className="text-sm text-gray-600">Medium Intensity</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">
                {feedItems.filter(e => e.intensity === 'low').length}
              </div>
              <div className="text-sm text-gray-600">Low Intensity</div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Events */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-12 w-12 text-[#8B4513]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 timeline-line"></div>

              {/* Events */}
              <div className="space-y-12">
                {filteredItems.length === 0 ? (
                  <div className="p-8 bg-white/80 border border-[#F5E6D3] rounded-xl text-center text-gray-600">
                    No threats found for this intensity level.
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item.id} className="relative pl-20">
                      {/* Timeline Marker */}
                      <div className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white timeline-marker ${
                        item.intensity === 'high' ? 'bg-red-500' :
                        item.intensity === 'medium' ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}></div>

                      {/* Event Content */}
                      <div className="bg-white/80 border border-[#F5E6D3] rounded-xl p-6 card-hover">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-semibold text-gray-500">
                                {formatDate(item.first_seen)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded uppercase ${getIntensityColor(item.intensity)}`}>
                                {item.intensity}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 uppercase">
                                {item.language}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{item.topic}</h3>
                            <p className="text-gray-600 mb-4">{item.claim_summary}</p>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-gray-600">Centrality Score</div>
                                <div className="font-semibold text-gray-800">
                                  {(item.graph_centrality_score * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Sources</div>
                                <div className="font-semibold text-gray-800">{item.source_count}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Last Updated</div>
                                <div className="font-semibold text-gray-800 text-sm">
                                  {formatDate(item.last_updated)}
                                </div>
                              </div>
                            </div>

                            {/* Sources */}
                            {item.sources && item.sources.length > 0 && (
                              <div className="mb-4">
                                <div className="text-sm font-semibold text-gray-700 mb-2">Sources:</div>
                                <div className="flex flex-wrap gap-2">
                                  {item.sources.map((source, index) => (
                                    <a
                                      key={index}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs px-3 py-1 bg-gray-100 rounded-full text-[#8B4513] hover:bg-gray-200 transition-colors"
                                    >
                                      {source.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Trending Score Bar */}
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Trending Score</span>
                                <span className="font-semibold text-[#8B4513]">
                                  {(item.graph_centrality_score * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    item.intensity === 'high' ? 'bg-red-500' :
                                    item.intensity === 'medium' ? 'bg-amber-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(item.graph_centrality_score * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
