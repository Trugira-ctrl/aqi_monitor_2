import React, { useState } from 'react';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Wind,
  Bell,
  Mail
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: (section: string) => void;
  activeSection: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  onNavigate,
  activeSection
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Sensor Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'weather', label: 'Weather', icon: Wind },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div 
      className={`bg-gray-900 text-gray-100 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      } min-h-screen relative`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-purple-600 rounded-full p-1 hover:bg-purple-700 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Logo Area */}
      <div className={`p-4 border-b border-gray-800 flex items-center ${
        collapsed ? 'justify-center' : 'justify-start'
      }`}>
        <Wind className="w-8 h-8 text-purple-500" />
        {!collapsed && (
          <span className="ml-3 font-bold text-lg">AQI Monitor</span>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center px-4 py-2 transition-colors ${
                    activeSection === item.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!collapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Status Area */}
      <div className={`p-4 border-t border-gray-800 ${
        collapsed ? 'text-center' : ''
      }`}>
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          {!collapsed && (
            <span className="ml-2 text-sm text-gray-400">System Online</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;