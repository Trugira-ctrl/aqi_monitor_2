import React, { useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigation = (section: string) => {
    setActiveSection(section);
    // Additional navigation logic can be added here
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        onNavigate={handleNavigation}
        activeSection={activeSection}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default Layout;