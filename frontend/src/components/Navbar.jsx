import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-50 shadow-sm card rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition flex-shrink-0">
            <span className="text-2xl">📡</span>
            <div className="hidden xs:block">
              <div className="font-bold text-sm" style={{color: 'var(--text-primary)'}}>HIGHEST</div>
              <div className="text-xs" style={{color: 'var(--text-secondary)'}}>DATA HUB</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="text-sm hidden md:block">
                <span style={{color: 'var(--text-secondary)'}}>Balance: </span>
                <span className="font-bold text-primary-600">
                  GHS {user.balance?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}

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
              <>
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/dashboard" className="btn btn-secondary text-sm">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary text-sm flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>

                <button
                  onClick={toggleMenu}
                  className="md:hidden p-2 rounded-lg transition flex-shrink-0"
                  style={{color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)'}}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
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

        {isMenuOpen && (
          <div className="md:hidden border-t" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)'}}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user && (
                <div className="px-3 py-2 text-sm">
                  <span style={{color: 'var(--text-secondary)'}}>Balance: </span>
                  <span className="font-bold text-primary-600">
                    GHS {user.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-sm"
                    style={{color: 'var(--text-primary)'}}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2"
                    style={{color: 'var(--text-primary)'}}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
