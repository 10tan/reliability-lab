import React, { useState, useEffect } from 'react';
import { Cpu, Activity, GitMerge, FileText, Info, ShieldCheck, Sun, Moon } from 'lucide-react';

interface NavRailProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const NavRail: React.FC<NavRailProps> = ({ activeTab, setActiveTab }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('reliability_lab_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('reliability_lab_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const mainItems = [
    { id: 'model', label: 'Model Builder', icon: Cpu },
    { id: 'simulation', label: 'Simulation Workbench', icon: Activity },
    { id: 'system', label: 'System Reliability', icon: GitMerge },
    { id: 'reports', label: 'PDF Reports', icon: FileText }
  ];

  const infoItems = [
    { id: 'about', label: 'About & Guide', icon: Info }
  ];

  return (
    <aside className="nav-rail">
      <div className="brand-header">
        <div className="brand-icon">R</div>
        <div className="brand-title">Reliability-Lab</div>
      </div>

      <div className="nav-section-label">Engineering</div>
      <nav>
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="nav-section-label" style={{ marginTop: '12px' }}>Information</div>
      <nav>
        {infoItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <button
          className="nav-item"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{ width: '100%', marginBottom: '12px' }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <ShieldCheck size={12} />
          <span>ISO 2394 / DNV-RP-C210</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '18px' }}>
          v0.1.0 — Light Edition
        </div>
      </div>
    </aside>
  );
};
