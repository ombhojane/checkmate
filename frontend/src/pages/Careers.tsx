import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase } from 'tabler-icons-react';
import logo from '../assets/checkmate-logo.png';

export default function Careers() {
  const openRoles = [
    {
      title: 'Senior AI Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build and optimize our multi-model AI verification system.',
      skills: ['Python', 'LangGraph', 'Gemini', 'GPT-4', 'Machine Learning']
    },
    {
      title: 'Graph Data Scientist',
      department: 'Data Science',
      location: 'Remote',
      type: 'Full-time',
      description: 'Design and analyze complex misinformation networks.',
      skills: ['Neo4j', 'Network Analysis', 'Python', 'Graph Theory', 'Data Visualization']
    },
    {
      title: 'Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Create seamless user experiences for our verification platform.',
      skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'React Native']
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Craft intuitive interfaces for complex verification workflows.',
      skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'User Research']
    },
    {
      title: 'DevOps Engineer',
      department: 'Infrastructure',
      location: 'Remote',
      type: 'Full-time',
      description: 'Scale our infrastructure to handle millions of verifications.',
      skills: ['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform']
    },
    {
      title: 'Content Strategist',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      description: 'Tell the story of truth in the age of misinformation.',
      skills: ['Content Writing', 'SEO', 'Social Media', 'Analytics', 'Storytelling']
    }
  ];

  const values = [
    {
      title: 'Truth First',
      description: 'We are obsessed with accuracy and transparency in everything we build.'
    },
    {
      title: 'High Agency',
      description: 'Own your work. Ship fast. Make decisions. We trust you.'
    },
    {
      title: 'Remote-First',
      description: 'Work from anywhere. Async communication. Results over hours.'
    },
    {
      title: 'Learn & Grow',
      description: 'Continuous learning budget. Conference tickets. Book allowance.'
    }
  ];

  const perks = [
    'Competitive salary + equity',
    'Health, dental, vision insurance',
    'Unlimited PTO',
    '$2000 learning budget',
    'Latest tech equipment',
    'Home office stipend',
    'Team retreats twice a year',
    'Flexible working hours'
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
            <Link to="/careers" className="text-sm font-medium text-[#8B4513]">Careers</Link>
            <Link to="/resources" className="text-sm font-medium text-gray-700 hover:text-black">Resources</Link>
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
            Join the Defense. <span className="text-[#8B4513]">Your Move.</span>
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We are building the immune system for the internet. Remote-first, high-agency, obsessed with truth.
          </p>
        </div>
      </motion.section>

      {/* Culture Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="py-16 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#8B4513] to-[#6B4423] rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-8 text-center">Our Culture</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, idx) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
                  className="text-center"
                >
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-white/80">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Open Roles */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">Join our mission to fight misinformation</p>
          </div>

          <div className="space-y-6">
            {openRoles.map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-lg border border-[#F5E6D3] rounded-2xl p-8 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#8B4513] transition-colors">
                          {role.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{role.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {role.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-[#F5DEB3] text-[#8B4513] text-sm font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} />
                        <span>{role.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{role.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{role.type}</span>
                      </div>
                    </div>
                  </div>

                  <button className="px-8 py-3 bg-[#8B4513] text-white font-semibold rounded-xl hover:bg-[#6B4423] transition-all whitespace-nowrap">
                    Apply Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks & Benefits */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="py-24 px-6 bg-white/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Perks & Benefits</h2>
            <p className="text-xl text-gray-600">We take care of our team</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk, idx) => (
              <motion.div
                key={perk}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.05 }}
                className="bg-white/80 border border-[#F5E6D3] rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B4513] to-[#A0522D] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900">{perk}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Don't See Your Role?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're always looking for exceptional talent. Send us your resume and let's talk.
          </p>
          <button className="px-8 py-4 bg-[#8B4513] text-white font-bold text-lg rounded-xl hover:bg-[#6B4423] transition-all shadow-xl">
            Get in Touch
          </button>
        </div>
      </section>
    </div>
  );
}
