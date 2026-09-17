import React from 'react';
import { ShieldCheck, Cpu, GitMerge, FileText, Activity } from 'lucide-react';

interface NavRailProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const NavRail: React.FC<NavRailProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'model', label: 'Model Builder', icon: Cpu },
    { id: 'simulation', label: 'Simulation Workbench', icon: Activity },
    { id: 'system', label: 'System Reliability', icon: GitMerge },
    { id: 'reports', label: 'PDF Reports', icon: FileText }
  ];

  return (
    <aside className="nav-rail">
      <div className="brand-header">
        <div className="brand-icon">R</div>
        <div className="brand-title">Reliability-Lab</div>
      </div>
      <nav>
        {items.map((item) => {
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
      <div style={{ marginTop: 'auto', padding: '12px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>
        ISO 2394 / DNV-RP-C210 Verified
      </div>
    </aside>
  );
};
