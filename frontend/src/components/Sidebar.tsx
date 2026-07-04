import { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { 
  LayoutDashboard, 
  BarChart3, 
  User, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Terminal,
  Menu,
  X,
  Plus,
  Bell
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  notificationCount: number;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  onOpenCreateModal,
  notificationCount 
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpen(false);
  };

  const getProfileInitials = () => {
    if (!user) return 'DV';
    return user.username.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden h-16 bg-white/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm border-b border-[#EAF6FF]">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-tr from-[#4FC3FF] to-[#1D9BFF] rounded-xl text-white shadow-[0_4px_12px_rgba(29,155,255,0.25)]">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg text-[#1E293B] tracking-tight">DevVault</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all shadow-[2px_2px_6px_rgba(170,200,220,0.2)] bg-white border border-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:fixed lg:top-4 lg:bottom-4 lg:left-4 h-[calc(100vh-2rem)] w-64 clay-sidebar flex flex-col justify-between p-5 transform transition-transform duration-300 lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col gap-6">
          {/* Logo Heading */}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-2xl text-[#1D9BFF] shadow-[4px_4px_10px_rgba(170,200,220,0.25),-4px_-4px_10px_rgba(255,255,255,0.95)] border border-white">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-[#1E293B] tracking-tight">
                DevVault
              </span>
            </div>
            {/* Mobile Close */}
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Create Project CTA */}
          <button
            onClick={() => {
              onOpenCreateModal();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 clay-button text-white rounded-2xl font-bold text-sm group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            New Project
          </button>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between py-3 px-4 rounded-[18px] text-sm font-semibold transition-all duration-300
                    ${isActive 
                      ? 'bg-white border border-white/80 text-[#1D9BFF] shadow-[4px_4px_10px_rgba(170,200,220,0.25),-4px_-4px_10px_rgba(255,255,255,0.95)] scale-[1.02]' 
                      : 'text-slate-500 hover:bg-[#F4FAFF] hover:text-[#1D9BFF] hover:scale-[1.01]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1D9BFF]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'dashboard' && notificationCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42D392] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#42D392]"></span>
                      </span>
                      <span className="bg-[#EAF6FF] text-[#1D9BFF] text-xs px-2.5 py-0.5 rounded-full font-bold shadow-[inset_1px_1px_3px_rgba(170,200,220,0.3)]">
                        {notificationCount}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: Profile & Logout */}
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 mt-auto">
          {/* User Profile Info Card */}
          {user && (
            <div className="flex flex-col gap-3 p-3.5 rounded-[24px] bg-white border border-white/85 shadow-[4px_4px_10px_rgba(170,200,220,0.15),-4px_-4px_10px_rgba(255,255,255,0.95)]">
              <div className="flex items-center gap-3 overflow-hidden">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.username} 
                    className="w-10 h-10 rounded-[14px] object-cover ring-2 ring-[#4FC3FF]/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-[#4FC3FF] to-[#1D9BFF] flex items-center justify-center text-white font-extrabold text-sm uppercase shadow-[0_4px_10px_rgba(29,155,255,0.2)]">
                    {getProfileInitials()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#1E293B] truncate leading-tight">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate mt-0.5">
                    {user.email}
                  </span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[14px] text-slate-500 hover:text-red-500 hover:bg-red-50/50 border border-transparent hover:border-red-100 transition-all text-xs font-semibold"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
