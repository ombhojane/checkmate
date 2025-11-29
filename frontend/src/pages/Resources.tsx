import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Book, Code, FileText, Shield, TrendingUp, Users } from 'tabler-icons-react';
import logo from '../assets/checkmate-logo.png';

export default function Resources() {
  const resources = [
    {
      icon: <FileText size={32} />,
      title: 'The Vaccine Archive',
      description: 'Access past weekly misinformation digests and trend reports.',
      color: 'from-[#8B4513] to-[#A0522D]',
      link: '#archive'
    },
    {
      icon: <Code size={32} />,
      title: 'API Documentation',
      description: 'For developers integrating the CheckMate Engine into their platforms.',
      color: 'from-[#6B4423] to-[#8B4513]',
      link: '#api'
    },
    {
      icon: <Shield size={32} />,
      title: 'Transparency Reports',
      description: 'How our AI & Graph logic works. Trust & Safety insights.',
      color: 'from-[#A0522D] to-[#8B4513]',
      link: '#transparency'
    },
    {
      icon: <Book size={32} />,
      title: 'Fact-Checking 101',
      description: 'Guides on spotting deepfakes, manipulation, and misinformation.',
      color: 'from-[#8B4513] to-[#6B4423]',
      link: '#guides'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Research Papers',
      description: 'Academic publications and whitepapers on misinformation detection.',
      color: 'from-[#6B4423] to-[#A0522D]',
      link: '#research'
    },
    {
      icon: <Users size={32} />,
      title: 'Community Forum',
      description: 'Join discussions with researchers, journalists, and fact-checkers.',
      color: 'from-[#A0522D] to-[#6B4423]',
      link: '#community'
    }
  ];

  const guides = [
    {
      title: 'Spotting Deepfakes',
      description: 'Learn to identify AI-generated images and videos',
      readTime: '8 min read'
    },
    {
      title: 'Social Media Verification',
      description: 'Best practices for verifying viral content',
      readTime: '12 min read'
    },
    {
      title: 'Source Credibility',
      description: 'How to evaluate information sources',
      readTime: '10 min read'
    },
    {
      title: 'Reverse Image Search',
      description: 'Tools and techniques for image verification',
      readTime: '6 min read'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8F0]/70 backdrop-blur-lg border-b border-[#F5E6D3]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="CheckMate" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold">CheckMate</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-black">Pricing</Link>
            <Link to="/careers" className="text-sm font-medium text-gray-700 hover:text-black">Careers</Link>
            <Link to="/resources" className="text-sm font-medium text-[#8B4513]">Resources</Link>
          </div>
          <Link
            to="/dashboard"
            className="px-6 py-2.5 bg-[#8B4513] text-white text-sm font-semibold rounded-lg hover:bg-[#6B4423] transition-all"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-16 px-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Knowledge <span className="text-[#8B4513]">Arsenal</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to become a misinformation detection expert. Tools, guides, and insights.
          </p>
        </div>
      </motion.section>

      {/* Resource Cards Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <motion.a
                key={resource.title}
                href={resource.link}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group bg-white/80 backdrop-blur-lg border border-[#F5E6D3] rounded-2xl p-8 hover:shadow-2xl transition-all cursor-pointer"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${resource.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {resource.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#8B4513] transition-colors">
                  {resource.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {resource.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-[#8B4513] font-semibold">
                  <span>Explore</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="py-24 px-6 bg-white/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Guides</h2>
            <p className="text-xl text-gray-600">Master the art of fact-checking</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {guides.map((guide, idx) => (
              <motion.div
                key={guide.title}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + idx * 0.1 }}
                className="bg-white/80 border border-[#F5E6D3] rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#8B4513] transition-colors">
                    {guide.title}
                  </h3>
                  <span className="text-xs text-gray-500 bg-[#F5DEB3] px-3 py-1 rounded-full">
                    {guide.readTime}
                  </span>
                </div>
                <p className="text-gray-600">{guide.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* API Documentation Preview */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#8B4513] to-[#6B4423] rounded-3xl p-12 text-white">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Build with CheckMate</h2>
                <p className="text-xl text-white/90 mb-8">
                  Integrate our powerful verification engine into your platform with our comprehensive API.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>RESTful API with 99.9% uptime</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Comprehensive documentation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>SDKs for Python, Node.js, and more</span>
                  </div>
                </div>
                <button className="mt-8 px-8 py-4 bg-white text-[#8B4513] font-bold rounded-xl hover:bg-gray-100 transition-all">
                  View Documentation
                </button>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 font-mono text-sm">
                <div className="text-green-300 mb-2">// Quick Start Example</div>
                <div className="text-white/80">
                  <span className="text-purple-300">import</span> CheckMate <span className="text-purple-300">from</span> <span className="text-yellow-300">'checkmate-sdk'</span>;
                </div>
                <div className="text-white/80 mt-2">
                  <span className="text-purple-300">const</span> client = <span className="text-purple-300">new</span> CheckMate(apiKey);
                </div>
                <div className="text-white/80 mt-2">
                  <span className="text-purple-300">const</span> result = <span className="text-purple-300">await</span> client.verify(claim);
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Stay Updated
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get weekly insights on misinformation trends and new features.
          </p>
          <div className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-6 py-3 border border-[#F5E6D3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
            />
            <button className="px-8 py-3 bg-[#8B4513] text-white font-semibold rounded-xl hover:bg-[#6B4423] transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
