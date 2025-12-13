import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 shadow-sm card rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">📡</span>
            <div>
              <div className="font-bold text-sm" style={{color: 'var(--text-primary)'}}>HIGHEST</div>
              <div className="text-xs" style={{color: 'var(--text-secondary)'}}>DATA HUB</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm hidden sm:block">
                <span style={{color: 'var(--text-secondary)'}}>Balance: </span>
                <span className="font-bold text-primary-600">
                  GHS {user.balance?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition"
              style={{color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)'}}
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
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
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn btn-ghost text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
