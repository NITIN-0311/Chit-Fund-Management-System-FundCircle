import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">💰</div>
            <h1 className="text-xl font-bold">Chit Fund Manager</h1>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-sm">
                👤
              </div>
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs opacity-75">{user?.role === 'ADMIN' ? 'Admin' : 'Member'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary text-sm px-3 py-1"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden"
          >
            ≡
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden pb-4 space-y-2 border-t border-white border-opacity-20">
            <p className="text-sm py-2">{user?.email}</p>
            <button
              onClick={handleLogout}
              className="w-full text-left btn btn-secondary text-sm px-3 py-2"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
