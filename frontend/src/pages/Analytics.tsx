import React, { useState, useEffect } from 'react';
import { AnalyticsSummary } from '../types.js';
import { projectService } from '../services/api.js';
import { useToast } from '../components/Toast.js';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  FolderKanban, 
  GitBranch, 
  BarChart2, 
  Server, 
  Database, 
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function Analytics() {
  const { error } = useToast();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const summary = await projectService.getAnalytics();
      setData(summary);
    } catch (err) {
      error('Failed to parse analytics records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Soft premium Neo Claymorphic color palette
  const COLORS = ['#33A9FF', '#42D392', '#FFC857', '#FF7D7D', '#9333EA', '#1D9BFF'];

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-[#33A9FF] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#64748B] font-bold">Compiling analytics report...</span>
      </div>
    );
  }

  if (!data) return null;

  const { summary, statusDistribution, priorityDistribution, techStackUsage, hostingUsage, databaseUsage, monthlyCreated } = data;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
            <span>Dev Analytics Portal</span>
            <BarChart2 className="w-6.5 h-6.5 text-[#1D9BFF]" />
          </h2>
          <p className="text-xs text-[#64748B] font-semibold mt-1">
            Statistical breakdown of active software configurations and hosting allocations.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-3.5 bg-white border border-white hover:bg-[#F4FAFF] text-slate-500 hover:text-[#1D9BFF] rounded-2xl shadow-[4px_4px_10px_rgba(170,200,220,0.15),-4px_-4px_10px_rgba(255,255,255,0.95)] hover:scale-[1.03] active:scale-[0.98] transition-all"
          title="Reload Report"
        >
          <RefreshCw className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Total Managed', val: summary.totalProjects, icon: FolderKanban, color: 'text-[#1D9BFF] bg-[#EAF6FF]' },
          { label: 'Active Pipeline', val: summary.activeProjects, icon: GitBranch, color: 'text-[#FFC857] bg-[#FFC857]/10' },
          { label: 'Cloud Deployed', val: summary.projectsDeployed, icon: Server, color: 'text-[#42D392] bg-[#42D392]/10' },
          { label: 'Connected Repos', val: summary.githubConnected, icon: Database, color: 'text-purple-500 bg-purple-50' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-[30px] border border-white shadow-[8px_8px_16px_rgba(170,200,220,0.18),-8px_-8px_16px_rgba(255,255,255,0.95)] flex items-center gap-4 hover:scale-[1.02] transition-transform">
              <div className={`p-3.5 rounded-[18px] shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)] ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748B]">{card.label}</span>
                <h4 className="text-xl font-extrabold text-[#1E293B] mt-1 leading-none">{card.val}</h4>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Main Layout Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Status distribution Pie */}
        <div className="bg-white border border-white rounded-[32px] p-6 shadow-[10px_10px_24px_rgba(170,200,220,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)] space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Project Status Distribution</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '5px 5px 15px rgba(0,0,0,0.15)' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-slate-500 text-xs font-extrabold">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority levels bar */}
        <div className="bg-white border border-white rounded-[32px] p-6 shadow-[10px_10px_24px_rgba(170,200,220,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)] space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <span>Sprint Priority Allocation</span>
            <ShieldAlert className="w-4 h-4 text-[#FF7D7D]" />
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF6FF" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                <Tooltip 
                  cursor={{ fill: 'rgba(51, 169, 255, 0.04)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="value" fill="#33A9FF" radius={[8, 8, 0, 0]}>
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'High' ? '#FF7D7D' : entry.name === 'Medium' ? '#FFC857' : '#42D392'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Creation trends bar */}
        <div className="bg-white border border-white rounded-[32px] p-6 shadow-[10px_10px_24px_rgba(170,200,220,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)] space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <span>Project Initialization Velocity</span>
            <Sparkles className="w-4 h-4 text-[#33A9FF]" />
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCreated} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAF6FF" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                <Tooltip 
                  cursor={{ fill: 'rgba(51, 169, 255, 0.04)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="projects" fill="#1D9BFF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cloud Hosting platforms usage bar */}
        <div className="bg-white border border-white rounded-[32px] p-6 shadow-[10px_10px_24px_rgba(170,200,220,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)] space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Hosting allocation distribution</h3>

          <div className="h-64">
            {hostingUsage.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-20 font-bold">No active cloud deployment parameters configured.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hostingUsage} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAF6FF" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(51, 169, 255, 0.04)' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" fill="#9333EA" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
