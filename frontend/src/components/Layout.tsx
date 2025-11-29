import { Link, useLocation, Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    // For claim detail, match prefix
    if (path.startsWith('/claim')) {
      return location.pathname.startsWith('/claim');
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Enhanced */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 tracking-tight hover:text-teal-600 transition-colors group">
                <img src="https://i.ibb.co/0pGcPxGX/image.png" alt="CheckMate Logo" className="w-9 h-9 rounded-lg shadow-sm" />
                <span className="ml-2">CheckMate</span>
              </Link>
              <div className="relative ml-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full scanning-dot"></div>
                <div className="absolute inset-0 w-2 h-2 bg-teal-500 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <NavLinkEnhanced to="/" active={isActive('/')}>Dashboard</NavLinkEnhanced>
              <NavLinkEnhanced to="/timeline" active={isActive('/timeline')}>Timeline</NavLinkEnhanced>
              <NavLinkEnhanced to="/claim/1" active={isActive('/claim')}>Claims</NavLinkEnhanced>
            </div>
            {/* Mobile menu button (optional, for future expansion) */}
            <div className="md:hidden">
              <button className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <span className="sr-only">Open menu</span>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100"></div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        {children || <Outlet />}
      </main>
    </div>
  );
}

// Enhanced nav link with animated underline and hover effects
function NavLinkEnhanced({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`relative px-4 py-2 font-medium transition-all duration-200 rounded-lg ${
        active 
          ? 'text-teal-600 bg-teal-50' 
          : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
      }`}
    >
      <span>{children}</span>
      {active && (
        <span
          className="absolute left-1 right-1 bottom-1 h-0.5 bg-teal-500 rounded-full"
          style={{ animation: 'slideIn 0.3s ease' }}
        />
      )}
    </Link>
  );
}
