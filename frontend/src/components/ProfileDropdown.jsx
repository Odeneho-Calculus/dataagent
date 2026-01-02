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
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
        title={user.name}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-blue-600 to-purple-600">
          {initials}
        </div>
        <span className="text-sm font-medium hidden sm:inline text-slate-900">
          {user.name.split(' ')[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-xl z-50 bg-white border-2 border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b-2 border-slate-200">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-600">{user.email}</p>
            {user.role === 'admin' && (
              <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700">
                👑 Admin
              </span>
            )}
          </div>

          <nav className="py-2">
            {user.role === 'admin' ? (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
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
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={16} />
                  Profile
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          <div className="py-2 border-t-2 border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
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
