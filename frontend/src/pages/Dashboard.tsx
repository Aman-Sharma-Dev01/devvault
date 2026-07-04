import React, { useState, useEffect, useCallback } from 'react';
import { Project, SystemNotification } from '../types.js';
import { projectService } from '../services/api.js';
import { useToast } from '../components/Toast.js';
import ConfirmationDialog from '../components/ConfirmationDialog.js';
import { 
  FolderGit2, 
  Github, 
  Globe, 
  Flame, 
  Compass, 
  Archive, 
  Star, 
  Pin, 
  Search, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Settings2, 
  Trash2, 
  Sparkles,
  CheckSquare,
  AlertCircle,
  Inbox,
  ArrowUpRight
} from 'lucide-react';

interface DashboardProps {
  onOpenCreateModal: () => void;
  onEditProject: (project: Project) => void;
  onSelectProject: (projectId: string) => void;
  setNotificationCount: (count: number) => void;
}

export default function Dashboard({ 
  onOpenCreateModal, 
  onEditProject, 
  onSelectProject,
  setNotificationCount
}: DashboardProps) {
  const { success, error } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    archived: 0,
    deployed: 0,
    github: 0
  });

  // Deletion State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch filtered projects
      const response = await projectService.getProjects({
        search,
        status,
        priority,
        pinned: pinnedOnly ? true : undefined,
        favorite: favoriteOnly ? true : undefined,
        sortBy,
        sortOrder,
        page,
        limit: 6
      });
      
      setProjects(response.projects);
      setTotalPages(response.totalPages);
      setTotalProjects(response.total);

      // 2. Fetch Notifications
      const alerts = await projectService.getNotifications();
      setNotifications(alerts);
      setNotificationCount(alerts.length);

      // 3. Fetch Summary Stats for cards
      const analytics = await projectService.getAnalytics();
      setStats({
        total: analytics.summary.totalProjects,
        active: analytics.summary.activeProjects,
        completed: analytics.summary.completedProjects,
        archived: analytics.summary.archivedProjects,
        deployed: analytics.summary.projectsDeployed,
        github: analytics.summary.githubConnected
      });

    } catch (err: any) {
      error('Failed to load dashboard parameters.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, pinnedOnly, favoriteOnly, sortBy, sortOrder, page, error, setNotificationCount]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle pagination pages reset on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, status, priority, pinnedOnly, favoriteOnly, sortBy, sortOrder]);

  const handleToggleFavorite = async (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await projectService.updateProject(p.id, { favorite: !p.favorite });
      setProjects(projects.map(item => item.id === p.id ? { ...item, favorite: updated.favorite } : item));
      success(updated.favorite ? 'Project bookmarked as favorite!' : 'Removed from favorites.', 'Bookmark Updated');
    } catch (err) {
      error('Failed to update project status.');
    }
  };

  const handleTogglePinned = async (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await projectService.updateProject(p.id, { pinned: !p.pinned });
      setProjects(projects.map(item => item.id === p.id ? { ...item, pinned: updated.pinned } : item));
      success(updated.pinned ? 'Project pinned to workspace!' : 'Unpinned from workspace.', 'Pin Configured');
    } catch (err) {
      error('Failed to pin project.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await projectService.deleteProject(projectToDelete.id);
      success(`Project "${projectToDelete.name}" deleted successfully.`, 'Deleted');
      setProjectToDelete(null);
      fetchDashboardData();
    } catch (err) {
      error('Failed to delete project config.');
    }
  };

  const getTodoProgress = (p: Project) => {
    if (!p.todos || p.todos.length === 0) return { percent: 0, text: 'No checklist' };
    const total = p.todos.length;
    const completed = p.todos.filter(t => t.status === 'Completed').length;
    const percent = Math.round((completed / total) * 100);
    return { percent, text: `${completed}/${total} tasks` };
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
            <span>Developer Center</span>
            <Sparkles className="w-6 h-6 text-[#33A9FF] animate-pulse" />
          </h2>
          <p className="text-xs text-[#64748B] font-semibold mt-1">
            Real-time status of software repositories, operations, and deployment stacks.
          </p>
        </div>
        
        <button
          onClick={onOpenCreateModal}
          className="sm:w-fit py-3.5 px-6 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:from-[#33A9FF] hover:to-[#1D9BFF] text-white rounded-[20px] text-xs font-bold shadow-[6px_6px_15px_rgba(29,155,255,0.25),-6px_-6px_15px_rgba(255,255,255,0.9)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
        >
          Initialize Project
        </button>
      </div>

      {/* Stats Cards Section */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-5">
        {[
          { label: 'Total Vaulted', val: stats.total, icon: FolderGit2, color: 'text-[#1D9BFF] bg-[#EAF6FF]' },
          { label: 'In Active Dev', val: stats.active, icon: Flame, color: 'text-[#FFC857] bg-[#FFC857]/10' },
          { label: 'Live Prod', val: stats.completed, icon: Compass, color: 'text-[#42D392] bg-[#42D392]/10' },
          { label: 'Archived Files', val: stats.archived, icon: Archive, color: 'text-slate-500 bg-slate-100' },
          { label: 'Deployed Apps', val: stats.deployed, icon: Globe, color: 'text-[#33A9FF] bg-[#EAF6FF]' },
          { label: 'GitHub Repos', val: stats.github, icon: Github, color: 'text-purple-500 bg-purple-50' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white p-5 rounded-[30px] flex flex-col justify-between hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 shadow-[8px_8px_16px_rgba(170,200,220,0.22),-8px_-8px_16px_rgba(255,255,255,0.95)] border border-white/60 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B] truncate">{card.label}</span>
                <div className={`p-2.5 rounded-[15px] shadow-[inset_1px_1px_3px_rgba(170,200,220,0.25)] ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-[#1E293B] mt-4.5 tracking-tight group-hover:text-[#1D9BFF] transition-colors">{card.val}</h3>
            </div>
          );
        })}
      </section>

      {/* Active Alerts / Notifications Banner */}
      {notifications.length > 0 && (
        <div className="bg-[#FF7D7D]/8 border border-[#FF7D7D]/20 rounded-[28px] p-5 space-y-4 shadow-[6px_6px_15px_rgba(255,125,125,0.1)]">
          <div className="flex items-center gap-2 text-[#FF7D7D]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Active System Warnings ({notifications.length})</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3.5 max-h-40 overflow-y-auto scrollbar-thin">
            {notifications.map((alert) => (
              <div 
                key={alert.id} 
                onClick={() => onSelectProject(alert.projectId)}
                className="p-4 bg-white border border-white hover:border-[#FF7D7D]/40 rounded-[20px] flex items-start gap-3.5 cursor-pointer shadow-[4px_4px_10px_rgba(170,200,220,0.1),-4px_-4px_10px_rgba(255,255,255,0.95)] hover:scale-[1.01] transition-all group"
              >
                <div className="w-2 h-2 rounded-full bg-[#FF7D7D] mt-1.5 flex-shrink-0 animate-pulse" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#1E293B] group-hover:text-[#1D9BFF] transition-colors flex items-center gap-1.5 leading-tight">
                    <span>{alert.title}</span>
                    <span className="text-[10px] text-[#64748B] font-medium truncate">({alert.projectName})</span>
                  </p>
                  <p className="text-[10px] text-[#64748B] mt-1 leading-snug">{alert.message}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Advanced Filters Bar */}
      <section className="bg-white/90 backdrop-blur-md border border-white p-5 rounded-[32px] shadow-[10px_10px_24px_rgba(170,200,220,0.22),-10px_-10px_24px_rgba(255,255,255,0.95)] space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#64748B]">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project title, language, tech tags..." 
              className="w-full pl-11 pr-4 py-3.5 bg-[#F4FAFF] shadow-[inset_3px_3px_6px_rgba(170,200,220,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-slate-200/10 rounded-[18px] text-sm font-semibold outline-none focus:bg-white focus:shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1),0_0_0_4px_rgba(51,169,255,0.15)] transition-all placeholder-[#64748B]/50"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`py-3.5 px-5 rounded-[18px] border flex items-center gap-2 text-xs font-bold transition-all ${
                showFilters 
                  ? 'bg-white border-white text-[#1D9BFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.25)]' 
                  : 'bg-white border-white text-slate-500 shadow-[4px_4px_10px_rgba(170,200,220,0.15),-4px_-4px_10px_rgba(255,255,255,0.95)] hover:scale-[1.02]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {/* Quick bookmarks filters */}
            <button
              onClick={() => setPinnedOnly(!pinnedOnly)}
              className={`py-3.5 px-5 rounded-[18px] border flex items-center gap-2 text-xs font-bold transition-all ${
                pinnedOnly 
                  ? 'bg-white border-white text-[#1D9BFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.25)]' 
                  : 'bg-white border-white text-slate-500 shadow-[4px_4px_10px_rgba(170,200,220,0.15),-4px_-4px_10px_rgba(255,255,255,0.95)] hover:scale-[1.02]'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Pinned</span>
            </button>

            <button
              onClick={() => setFavoriteOnly(!favoriteOnly)}
              className={`py-3.5 px-5 rounded-[18px] border flex items-center gap-2 text-xs font-bold transition-all ${
                favoriteOnly 
                  ? 'bg-white border-white text-[#1D9BFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.25)]' 
                  : 'bg-white border-white text-slate-500 shadow-[4px_4px_10px_rgba(170,200,220,0.15),-4px_-4px_10px_rgba(255,255,255,0.95)] hover:scale-[1.02]'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Favorites</span>
            </button>
          </div>
        </div>

        {/* Collapsible filters menu */}
        {showFilters && (
          <div className="grid sm:grid-cols-4 gap-4 pt-4 border-t border-[#EAF6FF]">
            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Project Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F4FAFF] border border-slate-200/10 rounded-[14px] text-xs font-bold outline-none text-[#1E293B] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] focus:bg-white"
              >
                <option value="">All Statuses</option>
                <option value="Idea">Idea</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
                <option value="Production">Production</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Priority Tier</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F4FAFF] border border-slate-200/10 rounded-[14px] text-xs font-bold outline-none text-[#1E293B] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] focus:bg-white"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Sort Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Sort Parameter</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F4FAFF] border border-slate-200/10 rounded-[14px] text-xs font-bold outline-none text-[#1E293B] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] focus:bg-white"
              >
                <option value="updatedAt">Last Operational</option>
                <option value="name">Project Title</option>
                <option value="priority">Priority Tier</option>
                <option value="createdAt">Creation Date</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Sort Order</label>
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-[#F4FAFF] border border-slate-200/10 rounded-[14px] text-xs font-bold outline-none text-[#1E293B] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] focus:bg-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Main Project Bento-Grid Container */}
      {loading ? (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="h-60 bg-white/55 rounded-[32px] animate-pulse border border-white flex flex-col justify-between p-6 shadow-[10px_10px_20px_rgba(170,200,220,0.15)]">
              <div className="space-y-3">
                <div className="h-4 w-1/3 bg-slate-200/60 rounded-[8px]" />
                <div className="h-6 w-3/4 bg-slate-200/60 rounded-[8px]" />
                <div className="h-10 w-full bg-slate-200/60 rounded-[12px]" />
              </div>
              <div className="h-6 w-full bg-slate-200/60 rounded-[8px]" />
            </div>
          ))}
        </section>
      ) : projects.length === 0 ? (
        <section className="bg-white/80 backdrop-blur-md border border-white rounded-[32px] py-16 px-6 flex flex-col items-center justify-center text-center shadow-[10px_10px_24px_rgba(170,200,220,0.2)]">
          <div className="p-5 bg-[#EAF6FF] rounded-[24px] text-[#1D9BFF] mb-5 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.3)]">
            <Inbox className="w-10 h-10" />
          </div>
          <h3 className="font-extrabold text-xl text-[#1E293B] leading-snug">No active project configs found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mt-2 leading-relaxed font-semibold">
            Configure a project setup, add API schemas, set credentials secrets, and plan sprints out of this workspace.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-6 py-3 px-6 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] text-white rounded-[18px] text-xs font-bold shadow-[4px_4px_10px_rgba(29,155,255,0.22)] hover:scale-[1.03] transition-all"
          >
            Create Your First Project
          </button>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => {
              const { percent, text } = getTodoProgress(p);
              const colorLabel = p.colorLabel || '#33A9FF';
              
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="bg-white border border-white rounded-[32px] flex flex-col justify-between overflow-hidden cursor-pointer shadow-[10px_10px_20px_rgba(170,200,220,0.18),-10px_-10px_20px_rgba(255,255,255,0.95)] hover:shadow-[16px_16px_32px_rgba(170,200,220,0.3),-16px_-16px_32px_rgba(255,255,255,0.95)] hover:scale-[1.01] hover:-translate-y-1.5 transition-all duration-300 h-[255px] group relative"
                >
                  {/* Color strip accent on the side or top */}
                  <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: colorLabel }} />

                  {/* Body Content */}
                  <div className="p-6 pt-7 flex-1 flex flex-col justify-between">
                    
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-[10px] font-extrabold text-[#1D9BFF] bg-[#EAF6FF] px-3 py-1 rounded-full uppercase tracking-wider truncate shadow-[inset_1px_1px_2px_rgba(170,200,220,0.2)]">{p.category}</span>
                        
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={(e) => handleTogglePinned(p, e)}
                            className={`p-1.5 rounded-full hover:bg-[#F4FAFF] transition-all ${
                              p.pinned ? 'text-[#1D9BFF] scale-110 shadow-[2px_2px_5px_rgba(170,200,220,0.25)] bg-white' : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={p.pinned ? 'Unpin project' : 'Pin project'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleToggleFavorite(p, e)}
                            className={`p-1.5 rounded-full hover:bg-[#F4FAFF] transition-all ${
                              p.favorite ? 'text-amber-500 scale-110 shadow-[2px_2px_5px_rgba(170,200,220,0.25)] bg-white' : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={p.favorite ? 'Unfavorite project' : 'Favorite project'}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-extrabold text-[#1E293B] mt-3 group-hover:text-[#1D9BFF] transition-colors leading-tight truncate">
                        {p.name}
                      </h4>
                      <p className="text-xs text-[#64748B] font-semibold leading-relaxed mt-2 line-clamp-2">
                        {p.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Progress Checklist section */}
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-[#64748B]">
                        <span className="flex items-center gap-1.5 leading-none">
                          <CheckSquare className="w-3.5 h-3.5 text-[#33A9FF]" />
                          <span>{text}</span>
                        </span>
                        <span className="text-[#1D9BFF] font-black">{percent}%</span>
                      </div>
                      <div className="w-full bg-[#EAF6FF] h-2 rounded-full overflow-hidden shadow-[inset_1px_1px_3px_rgba(170,200,220,0.3)]">
                        <div 
                          className="h-full bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] rounded-full transition-all duration-350"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer Badges & Actions */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-3">
                      
                      {/* Meta info tags */}
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {/* Status badge */}
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${
                          p.status === 'Production' ? 'bg-[#42D392]/10 text-[#42D392] border border-[#42D392]/20' :
                          p.status === 'Development' ? 'bg-[#FFC857]/10 text-[#FFC857] border border-[#FFC857]/20' :
                          p.status === 'Testing' ? 'bg-[#33A9FF]/10 text-[#1D9BFF] border border-[#33A9FF]/20' :
                          'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {p.status}
                        </span>

                        <span className="text-[10px] text-[#64748B] font-bold">
                          v{p.version}
                        </span>

                        {p.repository?.githubUrl && (
                          <a 
                            href={p.repository.githubUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-[#64748B] hover:text-[#1D9BFF] hover:bg-[#F4FAFF] rounded-full transition-all ml-1 shadow-[1px_1px_3px_rgba(170,200,220,0.15)]"
                            title="Visit GitHub Repository"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {p.deployment?.frontendUrl && (
                          <a 
                            href={p.deployment.frontendUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-[#64748B] hover:text-[#42D392] hover:bg-[#FAFDF9] rounded-full transition-all shadow-[1px_1px_3px_rgba(170,200,220,0.15)]"
                            title="Open Deployed Site"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Explicit Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(p);
                          }}
                          className="p-1.5 text-[#64748B] hover:text-[#1D9BFF] hover:bg-[#F4FAFF] rounded-xl transition-all shadow-[1px_1px_3px_rgba(170,200,220,0.15)]"
                          title="Configure Parameters"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(p);
                          }}
                          className="p-1.5 text-[#64748B] hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-[1px_1px_3px_rgba(170,200,220,0.15)]"
                          title="Archive/Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Pagination Footer Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#EAF6FF] pt-5 flex-wrap gap-3 text-xs">
              <span className="text-[#64748B] font-semibold">Showing {projects.length} of {totalProjects} software configurations</span>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="p-2.5 bg-white border border-white hover:bg-[#F4FAFF] rounded-xl disabled:opacity-40 shadow-[2px_2px_5px_rgba(170,200,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-[#1E293B]">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2.5 bg-white border border-white hover:bg-[#F4FAFF] rounded-xl disabled:opacity-40 shadow-[2px_2px_5px_rgba(170,200,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Confirmation warnings */}
      <ConfirmationDialog
        isOpen={!!projectToDelete}
        title="Archive and Delete Project?"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? All nested bug records, checklist tasks, changelogs, resources, and credentials will be permanently destroyed. This operation is irreversible.`}
        confirmText="Destroy Config"
        cancelText="Preserve"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProjectToDelete(null)}
      />

    </div>
  );
}
