import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const adminMenu = [
    { label: 'Dashboard', path: '/admin-dashboard', icon: '📊' },
    { label: 'Members', path: '/members', icon: '👥' },
    { label: 'Chit Groups', path: '/groups', icon: '📋' },
    { label: 'Auctions', path: '/auctions', icon: '🏆' },
    { label: 'Reports', path: '/reports', icon: '📈' },
    { label: 'Profile', path: '/profile', icon: '⚙️' },
  ];

  const memberMenu = [
    { label: 'Dashboard', path: '/member-dashboard', icon: '📊' },
    { label: 'Contributions', path: '/contributions', icon: '💳' },
    { label: 'Auctions', path: '/auctions', icon: '🏆' },
    { label: 'Statements', path: '/reports', icon: '📄' },
    { label: 'Profile', path: '/profile', icon: '⚙️' },
  ];

  const menuItems = user?.role === 'ADMIN' ? adminMenu : memberMenu;

  return (
    <aside className="bg-white w-64 min-h-screen shadow-lg">
      <nav className="p-6 space-y-2">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
