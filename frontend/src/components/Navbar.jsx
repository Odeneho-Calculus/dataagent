import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const showSidebarToggle = user && !['/'].includes(location.pathname) && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-50 shadow-sm card rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            {showSidebarToggle && (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                aria-label="Toggle sidebar"
              >
                <Menu size={24} />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition flex-shrink-0">
              <span className="text-2xl">📡</span>
              <div className="hidden xs:block">
                <div className="font-bold text-sm" style={{color: 'var(--text-primary)'}}>Desnethub</div>
                <div className="text-xs" style={{color: 'var(--text-secondary)'}}>DATA HUB</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition flex-shrink-0"
              style={{color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)'}}
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <ProfileDropdown />
            ) : (
              <>
                <div className="hidden sm:flex gap-2">
                  <Link to="/login" className="btn btn-ghost text-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary text-sm">
                    Sign up
                  </Link>
                </div>

                <button
                  onClick={toggleMenu}
                  className="sm:hidden p-2 rounded-lg transition flex-shrink-0"
                  style={{color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)'}}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            )}
          </div>
        </div>

        {isMenuOpen && !user && (
          <div className="sm:hidden border-t" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)'}}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-sm"
                style={{color: 'var(--text-primary)'}}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 rounded-md text-sm"
                style={{color: 'var(--text-primary)'}}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
