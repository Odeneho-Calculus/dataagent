import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { Menu } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

export default function AdminHeader() {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} className="text-slate-900" />
            </button>
            <Link to="/admin" className="flex items-center gap-2 hover:opacity-80 transition flex-shrink-0">
              <div>
                <div className="font-black text-xl" style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 50%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 4px 6px rgba(37, 99, 235, 0.3)',
                  filter: 'drop-shadow(2px 2px 4px rgba(147, 51, 234, 0.2))',
                  letterSpacing: '0.025em'
                }}>Desnethub</div>
                <div className="text-xs text-slate-600 font-semibold">ADMIN</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && <ProfileDropdown />}
          </div>
        </div>
      </div>
    </nav>
  );
}
