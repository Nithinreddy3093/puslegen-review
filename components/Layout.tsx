
import React from 'react';
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
  Upload, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Video,
  Search,
  Bell,
  X
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  user, 
  onLogout, 
  children, 
  activeTab, 
  setActiveTab,
  searchQuery,
  setSearchQuery
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Library', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER] },
    { id: 'upload', label: 'Upload Video', icon: Upload, roles: [UserRole.ADMIN, UserRole.EDITOR] },
    { id: 'admin', label: 'Admin Settings', icon: Settings, roles: [UserRole.ADMIN] },
  ].filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">VisiGuard</span>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 p-2 bg-slate-800/50 rounded-xl">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 mt-2 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center bg-gray-100 border border-transparent focus-within:border-indigo-200 focus-within:bg-white focus-within:shadow-sm px-4 py-2 rounded-xl w-96 max-w-full transition-all duration-200 group">
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, tags, status..." 
              className="bg-transparent border-none focus:ring-0 ml-2 text-sm w-full text-slate-900 placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500">Organization</p>
                <p className="text-xs font-bold text-gray-900">{user.orgId.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
