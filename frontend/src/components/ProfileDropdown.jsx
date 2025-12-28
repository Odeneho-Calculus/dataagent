import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Settings } from 'lucide-react';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)'
        }}
        title={user.name}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{backgroundColor: '#5a1bff'}}>
          {initials}
        </div>
        <span className="text-sm font-medium hidden sm:inline">
          {user.name.split(' ')[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50" style={{backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}>
          <div className="px-4 py-3" style={{borderBottom: '1px solid var(--border-color)'}}>
            <p className="text-sm font-semibold" style={{color: 'var(--text-primary)'}}>{user.name}</p>
            <p className="text-xs" style={{color: 'var(--text-secondary)'}}>{user.email}</p>
            {user.role === 'admin' && (
              <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded" style={{backgroundColor: '#15005b', color: '#f0f0ff'}}>
                👑 Admin
              </span>
            )}
          </div>

          <nav className="py-2">
            {user.role === 'admin' ? (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-2 text-sm transition"
                  style={{color: 'var(--text-secondary)'}}
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard size={16} />
                  Admin Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm transition"
                  style={{color: 'var(--text-secondary)'}}
                  onClick={() => setIsOpen(false)}
                >
                  <User size={16} />
                  Profile
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm transition"
                  style={{color: 'var(--text-secondary)'}}
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          <div className="py-2" style={{borderTop: '1px solid var(--border-color)'}}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm transition"
              style={{color: '#ff6600'}}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
