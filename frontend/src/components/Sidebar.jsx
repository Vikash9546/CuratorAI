import React from 'react';
import { 
  MessageSquare, 
  History, 
  FolderIcon, 
  Archive, 
  Plus, 
  Settings, 
  LogOut,
  Zap
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'chat', label: 'New Chat', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'library', label: 'Workspace', icon: FolderIcon },
    { id: 'archives', label: 'Archives', icon: Archive },
  ];

  return (
    <aside className="w-[260px] h-full bg-[#0b0c0e] flex flex-col border-r border-white-[0.05] p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 group cursor-pointer hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-[#4eeab8] flex items-center justify-center text-black shadow-[0_0_15px_rgba(78,234,184,0.3)] group-hover:shadow-[0_0_25px_rgba(78,234,184,0.5)] transition-all">
          <Zap className="fill-current w-6 h-6" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-tight text-white leading-none uppercase">Curator AI</h1>
          <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Pro Workspace</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
              activeTab === item.id 
                ? 'bg-[#1a1c21] text-white shadow-sm border border-white/5' 
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-colors ${
              activeTab === item.id ? 'text-[#4eeab8]' : 'group-hover:text-gray-300'
            }`} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto space-y-6">
        {/* Upgrade Plan */}
        <div className="p-4 rounded-2xl bg-[#121418] border border-white/5 shadow-inner">
          <div className="flex justify-between items-center mb-3">
             <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Upgrade Plan</span>
          </div>
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-1">
             <div className="h-full w-2/3 bg-gradient-to-r from-[#4eeab8] to-[#29b6f6] rounded-full shadow-[0_0_8px_rgba(78,234,184,0.4)]"></div>
          </div>
        </div>

        {/* Footer Nav */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all group">
            <Settings className="w-5 h-5 group-hover:text-gray-300 transition-colors" />
            Settings
          </button>
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all group">
            <LogOut className="w-5 h-5 group-hover:text-gray-300 transition-colors" />
            Log Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
