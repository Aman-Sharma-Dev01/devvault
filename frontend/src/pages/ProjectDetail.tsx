import React, { useState, useEffect } from 'react';
import { Project, ProjectTodo, ProjectBug, ProjectFeature, ProjectChangelog, ApiEndpoint } from '../types.js';
import { projectService } from '../services/api.js';
import { useToast } from '../components/Toast.js';
import { 
  ArrowLeft, 
  Github, 
  Globe, 
  Terminal, 
  CheckSquare, 
  Bug, 
  Sparkles, 
  History, 
  FileCode, 
  Lock, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Download,
  Printer,
  Calendar,
  CheckCircle,
  Eye,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

type TabType = 'todos' | 'bugs' | 'features' | 'changelogs' | 'apis' | 'secrets' | 'resources';

export default function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { success, error, info } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('todos');

  // Secrets Revealer State
  const [masterPassword, setMasterPassword] = useState('');
  const [revealedCreds, setRevealedCreds] = useState<Record<string, string>>({});
  const [isRevealingId, setIsRevealingId] = useState<string | null>(null);

  // --- SUB-ENTITIES CREATION / EDITING STATES ---
  
  // Todos state
  const [todoName, setTodoName] = useState('');
  const [todoPriority, setTodoPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [todoDueDate, setTodoDueDate] = useState('');
  const [checklistText, setChecklistText] = useState('');
  const [activeTodoChecklist, setActiveTodoChecklist] = useState<string | null>(null);

  // Bugs state
  const [bugTitle, setBugTitle] = useState('');
  const [bugSeverity, setBugSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [bugSteps, setBugSteps] = useState('');
  const [bugAssigned, setBugAssigned] = useState('');
  const [bugSolution, setBugSolution] = useState('');

  // Features state
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureStatus, setFeatureStatus] = useState<'Requested' | 'Completed' | 'Future Idea'>('Requested');
  const [featureNotes, setFeatureNotes] = useState('');

  // Changelogs state
  const [changeVersion, setChangeVersion] = useState('');
  const [changeTitle, setChangeTitle] = useState('');
  const [changeDesc, setChangeDesc] = useState('');
  const [changeNoteInput, setChangeNoteInput] = useState('');
  const [changesList, setChangesList] = useState<string[]>([]);

  // APIs state
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [apiPath, setApiPath] = useState('');
  const [apiDesc, setApiDesc] = useState('');

  // Load project operational details
  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjectById(projectId);
      setProject(data);
    } catch (err) {
      error('Failed to locate specified project file.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const handleSyncProjectUpdate = async (updatedProject: Project) => {
    setProject(updatedProject);
    // Silent optimistic sync
    await projectService.updateProject(projectId, updatedProject);
  };

  // --- ACTIONS: JSON & PDF EXPORTS ---
  const handleExportJson = () => {
    if (!project) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DevVault_Config_${project.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Project JSON configurations generated.', 'JSON Exported');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // --- SUB-ENTITIES ACTIONS ---

  // 1. TODOS Checklist Management
  const handleAddTodo = () => {
    if (!project || !todoName.trim()) return;
    const newTodo: ProjectTodo = {
      id: Math.random().toString(36).substring(2, 11),
      name: todoName.trim(),
      status: 'Pending',
      dueDate: todoDueDate || undefined,
      priority: todoPriority,
      progress: 0,
      checklist: []
    };
    const updated = {
      ...project,
      todos: [...(project.todos || []), newTodo]
    };
    handleSyncProjectUpdate(updated);
    setTodoName('');
    setTodoDueDate('');
    setTodoPriority('Medium');
    success('Sprint task created.', 'Task Configured');
  };

  const handleRemoveTodo = (id: string) => {
    if (!project) return;
    const updated = {
      ...project,
      todos: project.todos.filter(t => t.id !== id)
    };
    handleSyncProjectUpdate(updated);
    success('Sprint task removed.');
  };

  const handleToggleTodoStatus = (todoId: string) => {
    if (!project) return;
    const updated = {
      ...project,
      todos: project.todos.map(t => {
        if (t.id === todoId) {
          const nextStatus = t.status === 'Pending' ? 'In Progress' : t.status === 'In Progress' ? 'Completed' : 'Pending';
          return { ...t, status: nextStatus, progress: nextStatus === 'Completed' ? 100 : t.progress };
        }
        return t;
      })
    };
    handleSyncProjectUpdate(updated);
  };

  const handleAddChecklistItem = (todoId: string) => {
    if (!project || !checklistText.trim()) return;
    const updated = {
      ...project,
      todos: project.todos.map(t => {
        if (t.id === todoId) {
          const newItem = { id: Math.random().toString(36).substring(2, 11), text: checklistText.trim(), completed: false };
          const items = [...t.checklist, newItem];
          // Recalculate percent progress
          const done = items.filter(i => i.completed).length;
          const progress = Math.round((done / items.length) * 100);
          return { ...t, checklist: items, progress };
        }
        return t;
      })
    };
    handleSyncProjectUpdate(updated);
    setChecklistText('');
  };

  const handleToggleChecklistItem = (todoId: string, itemId: string) => {
    if (!project) return;
    const updated = {
      ...project,
      todos: project.todos.map(t => {
        if (t.id === todoId) {
          const items = t.checklist.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item);
          const done = items.filter(i => i.completed).length;
          const progress = Math.round((done / items.length) * 100);
          return { ...t, checklist: items, progress };
        }
        return t;
      })
    };
    handleSyncProjectUpdate(updated);
  };

  // 2. BUG MANAGEMENT ACTIONS
  const handleAddBug = () => {
    if (!project || !bugTitle.trim()) return;
    const newBug: ProjectBug = {
      id: Math.random().toString(36).substring(2, 11),
      title: bugTitle.trim(),
      severity: bugSeverity,
      steps: bugSteps.trim() || undefined,
      status: 'Open',
      assigned: bugAssigned.trim() || undefined,
      solution: bugSolution.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    const updated = {
      ...project,
      bugs: [...(project.bugs || []), newBug]
    };
    handleSyncProjectUpdate(updated);
    setBugTitle('');
    setBugSteps('');
    setBugAssigned('');
    setBugSolution('');
    setBugSeverity('Medium');
    success('Project bug record created.', 'Bug Tracked');
  };

  const handleRemoveBug = (id: string) => {
    if (!project) return;
    const updated = {
      ...project,
      bugs: project.bugs.filter(b => b.id !== id)
    };
    handleSyncProjectUpdate(updated);
    success('Bug record purged.');
  };

  const handleUpdateBugStatus = (bugId: string, nextStatus: any) => {
    if (!project) return;
    const updated = {
      ...project,
      bugs: project.bugs.map(b => b.id === bugId ? { ...b, status: nextStatus } : b)
    };
    handleSyncProjectUpdate(updated);
  };

  // 3. FEATURE MANAGEMENT ACTIONS
  const handleAddFeature = () => {
    if (!project || !featureTitle.trim()) return;
    const newFeat: ProjectFeature = {
      id: Math.random().toString(36).substring(2, 11),
      title: featureTitle.trim(),
      status: featureStatus,
      notes: featureNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    const updated = {
      ...project,
      features: [...(project.features || []), newFeat]
    };
    handleSyncProjectUpdate(updated);
    setFeatureTitle('');
    setFeatureNotes('');
    setFeatureStatus('Requested');
    success('Requested feature logged.', 'Feature Saved');
  };

  const handleRemoveFeature = (id: string) => {
    if (!project) return;
    const updated = {
      ...project,
      features: project.features.filter(f => f.id !== id)
    };
    handleSyncProjectUpdate(updated);
    success('Feature entry purged.');
  };

  // 4. CHANGELOG MANAGEMENT ACTIONS
  const handleAddChangelog = () => {
    if (!project || !changeVersion.trim() || !changeTitle.trim()) return;
    const newLog: ProjectChangelog = {
      id: Math.random().toString(36).substring(2, 11),
      version: changeVersion.trim(),
      date: new Date().toLocaleDateString(),
      title: changeTitle.trim(),
      description: changeDesc.trim(),
      changes: changesList
    };
    const updated = {
      ...project,
      changelogs: [newLog, ...(project.changelogs || [])] // Prepend most recent
    };
    handleSyncProjectUpdate(updated);
    setChangeVersion('');
    setChangeTitle('');
    setChangeDesc('');
    setChangesList([]);
    success(`Version log ${newLog.version} created!`, 'Changelog Saved');
  };

  const handleAddChangeToList = () => {
    if (changeNoteInput.trim()) {
      setChangesList([...changesList, changeNoteInput.trim()]);
      setChangeNoteInput('');
    }
  };

  const handleRemoveChangelog = (id: string) => {
    if (!project) return;
    const updated = {
      ...project,
      changelogs: project.changelogs.filter(c => c.id !== id)
    };
    handleSyncProjectUpdate(updated);
    success('Changelog entry removed.');
  };

  // 5. API ENDPOINTS ACTIONS
  const handleAddApi = () => {
    if (!project || !apiPath.trim()) return;
    const newEndpoint: ApiEndpoint = {
      id: Math.random().toString(36).substring(2, 11),
      method: apiMethod,
      path: apiPath.trim(),
      description: apiDesc.trim()
    };
    const collection = project.apiCollection || { endpoints: [] };
    const updated = {
      ...project,
      apiCollection: {
        ...collection,
        endpoints: [...(collection.endpoints || []), newEndpoint]
      }
    };
    handleSyncProjectUpdate(updated);
    setApiPath('');
    setApiDesc('');
    setApiMethod('GET');
    success('Endpoint entry configured.', 'Schema Updated');
  };

  const handleRemoveApi = (id: string) => {
    if (!project) return;
    const updated = {
      ...project,
      apiCollection: {
        ...project.apiCollection,
        endpoints: project.apiCollection.endpoints.filter(e => e.id !== id)
      }
    };
    handleSyncProjectUpdate(updated);
    success('Endpoint schema removed.');
  };

  // 6. DECRYPT VAULT CREDENTIALS
  const handleRevealCredential = async (credId: string) => {
    if (!masterPassword.trim()) {
      info('Please provide your current profile password first to unlock secrets.', 'Master Key Required');
      return;
    }
    setIsRevealingId(credId);
    try {
      const data = await projectService.revealCredential({
        projectId: projectId,
        credentialId: credId,
        masterPassword
      });
      setRevealedCreds({
        ...revealedCreds,
        [credId]: data.value
      });
      success('Credential key unlocked.', 'Success');
    } catch (err: any) {
      error(err.response?.data?.message || 'Invalid master password - access denied.');
    } finally {
      setIsRevealingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-[#33A9FF] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#64748B] font-bold">Reading project vault blueprints...</span>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Header Back and Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAF6FF] pb-5">
        <button
          onClick={onBack}
          className="w-fit flex items-center gap-2 text-[#64748B] hover:text-[#1E293B] text-xs font-bold transition-colors py-2 px-3 hover:bg-white/60 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dev Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-white border border-white hover:bg-[#F4FAFF] rounded-[14px] text-xs font-bold text-[#64748B] hover:text-[#1D9BFF] shadow-[2px_2px_5px_rgba(170,200,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:scale-[1.02] transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#33A9FF]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-white border border-white hover:bg-[#F4FAFF] rounded-[14px] text-xs font-bold text-[#64748B] hover:text-[#1D9BFF] shadow-[2px_2px_5px_rgba(170,200,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:scale-[1.02] transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-[#33A9FF]" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Project Showcase Banner */}
      <section className="bg-white border border-white p-7 rounded-[32px] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[10px_10px_24px_rgba(170,200,220,0.2),-10px_-10px_24px_rgba(255,255,255,0.95)]">
        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: project.colorLabel || '#6366f1' }} />
        
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] tracking-wider uppercase font-extrabold px-3 py-1 rounded-full bg-[#EAF6FF] text-[#1D9BFF] shadow-[inset_1px_1px_2px_rgba(170,200,220,0.15)]">
              {project.category}
            </span>
            <span className="text-xs text-[#64748B] font-bold flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#33A9FF]" />
              <span>Started: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight leading-tight">{project.name}</h1>
          <p className="text-xs text-[#64748B] font-semibold leading-relaxed">{project.description || 'No operational brief logged.'}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 self-start md:self-center">
          {project.tags.map((tag, idx) => (
            <span key={idx} className="bg-[#F4FAFF] shadow-[inset_1px_1px_2px_rgba(170,200,220,0.1)] text-[#1D9BFF] font-extrabold text-[10px] px-3 py-1.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 3. Main Split Workspace Layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Operations and Deploy Info */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Tech Stack Info Panel */}
          <div className="bg-white border border-white p-6 rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Software Architecture</h3>
            
            <div className="space-y-3.5 text-xs">
              {[
                { name: 'Frontend', val: project.techStack?.frontend },
                { name: 'Backend', val: project.techStack?.backend },
                { name: 'Database', val: project.techStack?.database },
                { name: 'Authentication', val: project.techStack?.authentication },
                { name: 'Hosting Nodes', val: project.techStack?.hosting },
                { name: 'Aux DevTools', val: project.techStack?.otherTools }
              ].map((stack, idx) => (
                <div key={idx} className="flex justify-between items-start gap-3 border-b border-[#EAF6FF] pb-2.5 last:border-0 last:pb-0">
                  <span className="text-[#64748B] font-bold">{stack.name}</span>
                  <span className="font-extrabold text-[#1E293B] text-right max-w-[180px] truncate">{stack.val || 'Not set'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Repository Connections Panel */}
          <div className="bg-white border border-white p-6 rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Repositories ({project.repository?.branch || 'main'})</h3>
              <span className={`text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full ${
                project.repository?.isPrivate ? 'bg-[#FF7D7D]/10 text-[#FF7D7D]' : 'bg-[#EAF6FF] text-[#1D9BFF]'
              }`}>
                {project.repository?.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-bold">
              {project.repository?.githubUrl && (
                <a 
                  href={project.repository.githubUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-[#F4FAFF] hover:bg-white hover:scale-[1.02] border border-transparent hover:border-slate-100 rounded-xl transition-all text-[#64748B] hover:text-[#1D9BFF] shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)] hover:shadow-[3px_3px_8px_rgba(170,200,220,0.1)]"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Github className="w-4 h-4 text-[#33A9FF] flex-shrink-0" />
                    <span className="truncate">GitHub Repository</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}
              
              {project.repository?.frontendRepo && (
                <a 
                  href={project.repository.frontendRepo} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-[#F4FAFF] hover:bg-white hover:scale-[1.02] border border-transparent hover:border-slate-100 rounded-xl transition-all text-[#64748B] hover:text-[#1D9BFF] shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)] hover:shadow-[3px_3px_8px_rgba(170,200,220,0.1)]"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Terminal className="w-4 h-4 text-[#33A9FF] flex-shrink-0" />
                    <span className="truncate">Frontend Sub-Repo</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}

              {project.repository?.backendRepo && (
                <a 
                  href={project.repository.backendRepo} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-[#F4FAFF] hover:bg-white hover:scale-[1.02] border border-transparent hover:border-slate-100 rounded-xl transition-all text-[#64748B] hover:text-[#1D9BFF] shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)] hover:shadow-[3px_3px_8px_rgba(170,200,220,0.1)]"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCode className="w-4 h-4 text-[#33A9FF] flex-shrink-0" />
                    <span className="truncate">Backend Sub-Repo</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}

              {!project.repository?.githubUrl && !project.repository?.frontendRepo && !project.repository?.backendRepo && (
                <p className="text-[11px] text-slate-400 italic font-semibold">No repositories configured.</p>
              )}
            </div>
          </div>

          {/* Deployment Stack & Environment variables */}
          <div className="bg-white border border-white p-6 rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Deployments</h3>

            <div className="space-y-4 text-xs font-bold">
              {project.deployment?.frontendUrl && (
                <div className="space-y-1">
                  <span className="text-[#64748B] block">Client Deployed ({project.deployment.frontendHosting || 'Cloud'}):</span>
                  <a 
                    href={project.deployment.frontendUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[#1D9BFF] hover:underline"
                  >
                    <span className="truncate">{project.deployment.frontendUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                </div>
              )}

              {project.deployment?.backendUrl && (
                <div className="space-y-1">
                  <span className="text-[#64748B] block">Server Deployed ({project.deployment.backendHosting || 'Cloud'}):</span>
                  <a 
                    href={project.deployment.backendUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[#1D9BFF] hover:underline"
                  >
                    <span className="truncate">{project.deployment.backendUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-[#EAF6FF] pt-3 text-[11px]">
                <span className="text-[#64748B]">Custom Web Domain</span>
                <span className="font-extrabold text-[#1E293B]">{project.deployment?.customDomain || 'None'}</span>
              </div>

              <div className="flex justify-between items-center border-b border-[#EAF6FF] pb-3 text-[11px]">
                <span className="text-[#64748B]">SSL Certificate Enabled</span>
                <span className="flex items-center gap-1">
                  {project.deployment?.sslEnabled ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#42D392]" />
                      <span className="text-[#42D392] font-black">ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-[#FF7D7D]" />
                      <span className="text-[#FF7D7D] font-black">DISABLED</span>
                    </>
                  )}
                </span>
              </div>

              {project.deployment?.envVariablesNotes && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] block">Required Environment Variables</span>
                  <div className="bg-[#F4FAFF] p-3 border border-slate-100 rounded-xl font-mono text-[10px] leading-relaxed text-[#1E293B] break-all select-all whitespace-pre-wrap shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)]">
                    {project.deployment.envVariablesNotes}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: WORKSPACE TABS */}
        <div className="lg:col-span-8 bg-white border border-white rounded-[32px] min-h-[550px] flex flex-col justify-between overflow-hidden shadow-[10px_10px_24px_rgba(170,200,220,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)]">
          
          <div>
            {/* Header Tabs select */}
            <div className="border-b border-[#EAF6FF] flex bg-[#F4FAFF] p-1.5 px-3 gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'todos', label: 'Todos/Sprints', icon: CheckSquare },
                { id: 'bugs', label: 'Bugs/Issues', icon: Bug },
                { id: 'features', label: 'Features', icon: Sparkles },
                { id: 'changelogs', label: 'Changelogs', icon: History },
                { id: 'apis', label: 'API schemas', icon: FileCode },
                { id: 'secrets', label: 'Secrets Key', icon: Lock },
                { id: 'resources', label: 'Assets', icon: FileSpreadsheet }
              ].map(tab => {
                const Icon = tab.icon;
                const isSel = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3 px-4 rounded-[14px] font-extrabold text-xs flex items-center gap-2 whitespace-nowrap outline-none transition-all ${
                      isSel 
                        ? 'bg-white text-[#1D9BFF] shadow-[2px_2px_5px_rgba(170,200,220,0.15),-1px_-1px_3px_rgba(255,255,255,0.9)]' 
                        : 'text-slate-400 hover:text-[#1E293B]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#33A9FF]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-6">
              
              {/* TAB: TODOS (Checklist Tasks) */}
              {activeTab === 'todos' && (
                <div className="space-y-6">
                  {/* Create Todo */}
                  <div className="grid sm:grid-cols-4 gap-3 bg-[#F4FAFF] p-4.5 rounded-[22px] border border-slate-100 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)]">
                    <input 
                      type="text" 
                      value={todoName}
                      onChange={(e) => setTodoName(e.target.value)}
                      placeholder="Add task / sprint action item..." 
                      className="sm:col-span-2 px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B] focus:shadow-[0_0_0_4px_rgba(51,169,255,0.15)] placeholder-slate-400"
                    />
                    
                    <select
                      value={todoPriority}
                      onChange={(e: any) => setTodoPriority(e.target.value)}
                      className="px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B] focus:shadow-[0_0_0_4px_rgba(51,169,255,0.15)]"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>

                    <button
                      onClick={handleAddTodo}
                      className="py-3 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:scale-[1.02] text-white font-extrabold text-xs rounded-xl shadow-[3px_3px_8px_rgba(29,155,255,0.2)] transition-all"
                    >
                      Add Task
                    </button>
                  </div>

                  {/* Todos Lists */}
                  <div className="space-y-3.5">
                    {(!project.todos || project.todos.length === 0) ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 font-bold">No tasks mapped to this sprint.</p>
                    ) : (
                      project.todos.map((t) => {
                        const isOpenChecklist = activeTodoChecklist === t.id;
                        return (
                          <div key={t.id} className="border border-slate-100/80 rounded-[20px] overflow-hidden bg-white shadow-[4px_4px_12px_rgba(170,200,220,0.12)]">
                            
                            {/* Header row */}
                            <div className="p-4 flex items-center justify-between gap-3 flex-wrap bg-[#F4FAFF]/40">
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={() => handleToggleTodoStatus(t.id)}
                                  className={`p-1.5 rounded-lg border flex-shrink-0 transition-colors shadow-[1px_1px_3px_rgba(170,200,220,0.15)] ${
                                    t.status === 'Completed' 
                                      ? 'bg-[#EAF6FF] border-slate-100 text-[#1D9BFF]' 
                                      : 'bg-white border-slate-200 text-slate-300'
                                  }`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                
                                <span className={`text-xs font-extrabold truncate leading-tight ${
                                  t.status === 'Completed' ? 'line-through text-slate-400' : 'text-[#1E293B]'
                                }`}>
                                  {t.name}
                                </span>

                                <span className={`text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                                  t.priority === 'High' ? 'bg-[#FF7D7D]/10 text-[#FF7D7D]' :
                                  t.priority === 'Medium' ? 'bg-[#FFC857]/10 text-[#FFC857]' :
                                  'bg-slate-100 text-slate-400'
                                }`}>
                                  {t.priority}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-[#64748B] font-extrabold">{t.progress}% complete</span>
                                
                                <button
                                  onClick={() => setActiveTodoChecklist(isOpenChecklist ? null : t.id)}
                                  className="text-[11px] text-[#1D9BFF] hover:underline font-extrabold"
                                >
                                  {isOpenChecklist ? 'Hide Items' : 'Micro Checklist'}
                                </button>

                                <button
                                  onClick={() => handleRemoveTodo(t.id)}
                                  className="text-slate-400 hover:text-[#FF7D7D] p-1 transition-all rounded-full hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Nested Checklist container */}
                            {isOpenChecklist && (
                              <div className="p-4 border-t border-slate-100 bg-white space-y-3">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Micro-Task checklist</span>
                                
                                <div className="space-y-2">
                                  {t.checklist.map((item) => (
                                    <div 
                                      key={item.id} 
                                      onClick={() => handleToggleChecklistItem(t.id, item.id)}
                                      className="flex items-center gap-2.5 p-2 bg-[#F4FAFF]/20 hover:bg-[#F4FAFF]/40 rounded-lg cursor-pointer transition-colors"
                                    >
                                      <input 
                                        type="checkbox" 
                                        checked={item.completed}
                                        onChange={() => {}} // Swallowed, parent onClick handles
                                        className="rounded text-[#1D9BFF] focus:ring-[#33A9FF]"
                                      />
                                      <span className={`text-xs font-bold ${item.completed ? 'line-through text-slate-400' : 'text-[#1E293B]'}`}>
                                        {item.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Add nested items input */}
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={checklistText}
                                    onChange={(e) => setChecklistText(e.target.value)}
                                    placeholder="Add checklist sub-item (e.g. Set staging branch)..." 
                                    className="flex-1 px-3 py-2 bg-[#F4FAFF] border border-transparent rounded-lg text-xs font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF]"
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => handleAddChecklistItem(t.id)}
                                    className="px-3 bg-white border border-slate-100 hover:bg-[#F4FAFF] font-extrabold rounded-lg text-xs text-[#1D9BFF] shadow-[2px_2px_5px_rgba(170,200,220,0.1)]"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB: BUGS / TRACKING */}
              {activeTab === 'bugs' && (
                <div className="space-y-6">
                  {/* Create Bug */}
                  <div className="bg-[#F4FAFF] p-5 rounded-[22px] border border-slate-100 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)] space-y-3.5">
                    <span className="font-extrabold text-[#64748B] text-xs block">File Bug / Issue Report</span>
                    
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        value={bugTitle}
                        onChange={(e) => setBugTitle(e.target.value)}
                        placeholder="Bug Title e.g. JWT Auth Expired..." 
                        className="sm:col-span-2 px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B] focus:shadow-[0_0_0_4px_rgba(51,169,255,0.15)]"
                      />
                      
                      <select
                        value={bugSeverity}
                        onChange={(e: any) => setBugSeverity(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B] focus:shadow-[0_0_0_4px_rgba(51,169,255,0.15)]"
                      >
                        <option value="Low">Low severity</option>
                        <option value="Medium">Medium severity</option>
                        <option value="High">High severity</option>
                        <option value="Critical">Critical severity</option>
                      </select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        value={bugAssigned}
                        onChange={(e) => setBugAssigned(e.target.value)}
                        placeholder="Developer Assigned (e.g. Priyanshu)..." 
                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B]"
                      />
                      <input 
                        type="text" 
                        value={bugSteps}
                        onChange={(e) => setBugSteps(e.target.value)}
                        placeholder="Steps to reproduce (optional)..." 
                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B]"
                      />
                    </div>

                    <button
                      onClick={handleAddBug}
                      className="w-full py-3 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:scale-[1.01] text-white font-extrabold text-xs rounded-xl shadow-[3px_3px_8px_rgba(29,155,255,0.2)] transition-all"
                    >
                      Log Bug Report
                    </button>
                  </div>

                  {/* Bug List */}
                  <div className="space-y-3.5">
                    {(!project.bugs || project.bugs.length === 0) ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 font-bold">No bugs logged.</p>
                    ) : (
                      project.bugs.map((b) => (
                        <div key={b.id} className="p-4.5 bg-white border border-slate-100 rounded-[20px] flex items-start justify-between gap-4 shadow-[4px_4px_12px_rgba(170,200,220,0.12)]">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                                b.severity === 'Critical' ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                                b.severity === 'High' ? 'bg-amber-50 text-amber-500' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {b.severity} severity
                              </span>

                              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                                b.status === 'Open' ? 'bg-[#FFC857]/10 text-[#FFC857]' :
                                b.status === 'Resolved' ? 'bg-[#42D392]/10 text-[#42D392]' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {b.status}
                              </span>

                              {b.assigned && (
                                <span className="text-[10px] text-[#64748B] font-bold">
                                  Assigned: {b.assigned}
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-extrabold text-[#1E293B]">{b.title}</h4>
                            
                            {b.steps && (
                              <p className="text-[11px] text-[#64748B] leading-relaxed font-semibold bg-[#F4FAFF] p-2 rounded-lg">
                                <strong className="text-slate-500 font-extrabold">Steps: </strong> {b.steps}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {b.status === 'Open' ? (
                              <button
                                onClick={() => handleUpdateBugStatus(b.id, 'Resolved')}
                                className="px-2.5 py-1.5 bg-[#42D392]/10 hover:bg-[#42D392] hover:text-white text-[#42D392] rounded-lg text-[10px] font-black transition-colors"
                              >
                                Resolve
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateBugStatus(b.id, 'Open')}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black transition-colors"
                              >
                                Reopen
                              </button>
                            )}

                            <button
                              onClick={() => handleRemoveBug(b.id)}
                              className="text-slate-400 hover:text-[#FF7D7D] p-1.5 rounded-full hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: FEATURES */}
              {activeTab === 'features' && (
                <div className="space-y-6">
                  {/* Create Feature */}
                  <div className="grid sm:grid-cols-4 gap-3 bg-[#F4FAFF] p-4.5 rounded-[22px] border border-slate-100 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)]">
                    <input 
                      type="text" 
                      value={featureTitle}
                      onChange={(e) => setFeatureTitle(e.target.value)}
                      placeholder="Add unreleased feature / idea..." 
                      className="sm:col-span-2 px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B] focus:shadow-[0_0_0_4px_rgba(51,169,255,0.15)]"
                    />
                    
                    <select
                      value={featureStatus}
                      onChange={(e: any) => setFeatureStatus(e.target.value)}
                      className="px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B]"
                    >
                      <option value="Requested">Requested</option>
                      <option value="Future Idea">Future Idea</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <button
                      onClick={handleAddFeature}
                      className="py-3 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:scale-[1.02] text-white font-extrabold text-xs rounded-xl shadow-[3px_3px_8px_rgba(29,155,255,0.2)] transition-all"
                    >
                      Log Feature
                    </button>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-3">
                    {(!project.features || project.features.length === 0) ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 font-bold">No unreleased software proposals logged.</p>
                    ) : (
                      project.features.map((f) => (
                        <div key={f.id} className="p-4 bg-white border border-slate-100 rounded-[20px] flex items-center justify-between gap-3 text-xs shadow-[4px_4px_12px_rgba(170,200,220,0.12)]">
                          <div className="min-w-0 flex-1 font-bold text-[#1E293B]">
                            <span className="truncate leading-snug block">{f.title}</span>
                          </div>

                          <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                            <span className={`text-[9px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full ${
                              f.status === 'Completed' ? 'bg-[#42D392]/10 text-[#42D392]' :
                              f.status === 'Requested' ? 'bg-[#FFC857]/10 text-[#FFC857]' :
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {f.status}
                            </span>

                            <button
                              onClick={() => handleRemoveFeature(f.id)}
                              className="text-slate-400 hover:text-[#FF7D7D] p-1.5 rounded-full hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: CHANGELOGS */}
              {activeTab === 'changelogs' && (
                <div className="space-y-6">
                  {/* Create Changelog */}
                  <div className="bg-[#F4FAFF] p-5 rounded-[22px] border border-slate-100 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)] space-y-3.5 text-xs">
                    <span className="font-extrabold text-[#64748B] block">Commit Version Release Log</span>
                    
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        value={changeVersion}
                        onChange={(e) => setChangeVersion(e.target.value)}
                        placeholder="Version e.g. v1.1.0" 
                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-bold outline-none text-[#1E293B] focus:shadow-[0_0_0_4px_rgba(51,169,255,0.15)]"
                      />
                      <input 
                        type="text" 
                        value={changeTitle}
                        onChange={(e) => setChangeTitle(e.target.value)}
                        placeholder="Release Title e.g. Payment Gateway..." 
                        className="sm:col-span-2 px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-bold outline-none text-[#1E293B] focus:shadow-[0_0_0_4px_rgba(51,169,255,0.15)]"
                      />
                    </div>

                    <input 
                      type="text" 
                      value={changeDesc}
                      onChange={(e) => setChangeDesc(e.target.value)}
                      placeholder="Release Description brief summary..." 
                      className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-semibold outline-none text-[#1E293B]"
                    />

                    {/* Sub bullet changes */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={changeNoteInput}
                        onChange={(e) => setChangeNoteInput(e.target.value)}
                        placeholder="Bullet Point changelog entry (e.g. Added stripe webhooks)..." 
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-semibold outline-none text-[#1E293B]"
                      />
                      <button 
                        type="button"
                        onClick={handleAddChangeToList}
                        className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-150 font-extrabold rounded-xl text-xs text-[#1D9BFF]"
                      >
                        Add Bullet
                      </button>
                    </div>

                    {changesList.length > 0 && (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-[#64748B]">Bullets pending release:</span>
                        <ul className="list-disc pl-4 text-[11px] font-bold text-slate-600">
                          {changesList.map((ch, i) => <li key={i}>{ch}</li>)}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={handleAddChangelog}
                      className="w-full py-3 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:scale-[1.01] text-white font-extrabold text-xs rounded-xl shadow-[3px_3px_8px_rgba(29,155,255,0.2)] transition-all"
                    >
                      Publish Version Log
                    </button>
                  </div>

                  {/* Changelog display */}
                  <div className="space-y-6">
                    {(!project.changelogs || project.changelogs.length === 0) ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 font-bold">No release history tracked.</p>
                    ) : (
                      project.changelogs.map((log) => (
                        <div key={log.id} className="bg-white p-5 border-l-4 border-[#1D9BFF] rounded-r-[20px] shadow-[4px_4px_12px_rgba(170,200,220,0.12)] space-y-2.5 text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-extrabold text-[#1E293B] text-sm">
                              {log.title} <span className="text-[#1D9BFF] font-black">({log.version})</span>
                            </span>
                            <div className="flex items-center gap-2.5 text-[#64748B] text-[11px] font-bold">
                              <span>{log.date}</span>
                              <button 
                                onClick={() => handleRemoveChangelog(log.id)} 
                                className="text-slate-400 hover:text-[#FF7D7D] p-1.5 rounded-full hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {log.description && <p className="text-[11px] text-[#64748B] font-semibold leading-relaxed">{log.description}</p>}
                          
                          {log.changes?.length > 0 && (
                            <ul className="list-disc pl-4 text-[11px] font-bold text-slate-500 space-y-1">
                              {log.changes.map((ch, idx) => <li key={idx}>{ch}</li>)}
                            </ul>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: APIS COLLECTION */}
              {activeTab === 'apis' && (
                <div className="space-y-6 text-xs">
                  {/* Create Endpoint */}
                  <div className="bg-[#F4FAFF] p-5 rounded-[22px] border border-slate-100 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)] space-y-3.5">
                    <span className="font-extrabold text-[#64748B] block">Configure REST API Endpoint Schema</span>
                    
                    <div className="grid sm:grid-cols-4 gap-3">
                      <select
                        value={apiMethod}
                        onChange={(e: any) => setApiMethod(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-bold text-[#1E293B]"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>

                      <input 
                        type="text" 
                        value={apiPath}
                        onChange={(e) => setApiPath(e.target.value)}
                        placeholder="e.g. /api/users/login" 
                        className="sm:col-span-2 px-4 py-2.5 bg-white border border-slate-100 rounded-xl font-bold outline-none text-[#1E293B]"
                      />

                      <button
                        onClick={handleAddApi}
                        className="py-2.5 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] text-white font-extrabold text-xs rounded-xl shadow-[3px_3px_8px_rgba(29,155,255,0.2)]"
                      >
                        Save Schema
                      </button>
                    </div>

                    <input 
                      type="text" 
                      value={apiDesc}
                      onChange={(e) => setApiDesc(e.target.value)}
                      placeholder="e.g. Validates client credentials, issues authorization JWT token payload" 
                      className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl outline-none text-[#1E293B] placeholder-slate-400 font-semibold"
                    />
                  </div>

                  {/* Schema breakdown */}
                  <div className="space-y-3">
                    {(!project.apiCollection?.endpoints || project.apiCollection.endpoints.length === 0) ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 font-bold">No endpoint schemas cataloged.</p>
                    ) : (
                      project.apiCollection.endpoints.map((e) => (
                        <div key={e.id} className="p-4 bg-white border border-slate-100 rounded-[20px] flex items-center justify-between gap-3 font-semibold text-xs shadow-[4px_4px_12_rgba(170,200,220,0.12)]">
                          <div className="min-w-0 flex-1 flex gap-3 items-center">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg font-mono shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] ${
                              e.method === 'GET' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              e.method === 'POST' ? 'bg-[#EAF6FF] text-[#1D9BFF] border border-blue-100' :
                              e.method === 'PUT' ? 'bg-amber-50 text-[#FFC857]' :
                              e.method === 'DELETE' ? 'bg-rose-50 text-[#FF7D7D]' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {e.method}
                            </span>
                            <div className="truncate">
                              <span className="font-mono text-[#1E293B] font-extrabold text-xs">{e.path}</span>
                              <p className="text-[10px] text-[#64748B] font-bold truncate mt-0.5">{e.description || 'No description provided'}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleRemoveApi(e.id)} 
                            className="text-slate-400 hover:text-[#FF7D7D] p-1.5 rounded-full hover:bg-rose-50 flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: SECRETS VAULT */}
              {activeTab === 'secrets' && (
                <div className="space-y-6 text-xs font-bold">
                  {/* Master key Unlock Panel */}
                  <div className="bg-[#F4FAFF] p-4.5 rounded-[22px] border border-slate-100 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.15)] space-y-3">
                    <div className="flex items-center gap-1.5 font-extrabold text-[#64748B]">
                      <KeyRound className="w-4 h-4 text-[#33A9FF]" />
                      <span>Authenticate Master Vault Key</span>
                    </div>
                    
                    <div className="flex gap-2.5">
                      <input 
                        type="password" 
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder="Enter your profile account password..." 
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-100 rounded-xl outline-none text-[#1E293B] placeholder-slate-400"
                      />
                      <button 
                        onClick={() => {
                          setMasterPassword('');
                          setRevealedCreds({});
                          info('Unlocked credentials flushed.', 'Vault Cleared');
                        }}
                        className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-150 rounded-xl text-xs font-extrabold text-[#FF7D7D]"
                      >
                        Flush Vault
                      </button>
                    </div>
                  </div>

                  {/* Secret entries mapping */}
                  <div className="space-y-3.5">
                    {(!project.credentials || project.credentials.length === 0) ? (
                      <p className="text-xs text-slate-400 italic text-center py-10 font-bold">No credentials configurations recorded.</p>
                    ) : (
                      project.credentials.map((c) => {
                        const revealedVal = revealedCreds[c.id];
                        const isRevealing = isRevealingId === c.id;
                        
                        return (
                          <div key={c.id} className="p-4 bg-white border border-slate-100 rounded-[20px] flex items-center justify-between gap-3 flex-wrap shadow-[4px_4px_12_rgba(170,200,220,0.12)]">
                            <div className="min-w-0 flex-1">
                              <span className="font-extrabold text-[#1E293B] text-xs block">{c.key}</span>
                              <span className="text-[10px] text-[#64748B] mt-1 block truncate leading-tight font-semibold">{c.description || 'No description'}</span>
                            </div>

                            <div className="flex items-center gap-3 ml-3">
                              <div className="bg-[#F4FAFF] shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)] px-3 py-2 font-mono rounded-lg text-[10px] text-[#1E293B] select-all max-w-[150px] truncate">
                                {revealedVal || '••••••••'}
                              </div>

                              {!revealedVal ? (
                                <button
                                  type="button"
                                  disabled={isRevealing}
                                  onClick={() => handleRevealCredential(c.id)}
                                  className="text-[#1D9BFF] font-black hover:underline text-[11px] flex items-center gap-1.5 py-1.5 px-3 bg-[#EAF6FF] rounded-lg shadow-[1px_1px_3px_rgba(170,200,220,0.15)] hover:scale-[1.02] transition-transform"
                                >
                                  {isRevealing ? 'Decrypting...' : 'Reveal'}
                                </button>
                              ) : (
                                <span className="text-[#42D392] font-black text-[9px] tracking-wider border border-[#42D392]/20 bg-[#42D392]/10 px-2.5 py-1 rounded-full">UNLOCKED</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB: ASSETS/RESOURCES */}
              {activeTab === 'resources' && (
                <div className="space-y-4 text-xs font-bold">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-2">Connected Canvas Mockups & Requirements</h4>
                  
                  <div className="grid sm:grid-cols-2 gap-3.5">
                    {[
                      { name: 'Figma Project Board', val: project.resources?.figmaLink, color: 'text-amber-500 bg-amber-50 border-amber-100/50' },
                      { name: 'Canva Mockup Slides', val: project.resources?.canvaLink, color: 'text-sky-500 bg-sky-50 border-sky-100/50' },
                      { name: 'Google Drive Assets', val: project.resources?.googleDrive, color: 'text-emerald-500 bg-emerald-50 border-emerald-100/50' },
                      { name: 'Technical Docs Wiki', val: project.resources?.documentation, color: 'text-indigo-500 bg-indigo-50 border-indigo-100/50' },
                      { name: 'Product Requirement Doc (PRD)', val: project.resources?.requirementDocument, color: 'text-purple-500 bg-purple-50 border-purple-100/50' },
                      { name: 'Database ER Diagram', val: project.resources?.erDiagram, color: 'text-rose-500 bg-rose-50 border-rose-100/50' },
                      { name: 'System UX Flowchart', val: project.resources?.flowchart, color: 'text-teal-500 bg-teal-50 border-teal-100/50' },
                      { name: 'Meeting Sprint Transcripts', val: project.resources?.meetingNotes, color: 'text-indigo-500 bg-[#EAF6FF]/30 border-blue-100/50' }
                    ].map((res, idx) => {
                      if (!res.val) return null;
                      return (
                        <a
                          key={idx}
                          href={res.val}
                          target="_blank"
                          rel="noreferrer"
                          className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 hover:scale-[1.01] hover:shadow-xs transition-all ${res.color}`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-slate-400 block font-bold leading-none mb-1">Asset Link</span>
                            <span className="truncate block text-[#1E293B] font-extrabold leading-tight">{res.name}</span>
                          </div>
                          <ExternalLink className="w-4 h-4 flex-shrink-0 text-[#33A9FF]" />
                        </a>
                      );
                    })}

                    {Object.values(project.resources || {}).filter(Boolean).length === 0 && (
                      <div className="sm:col-span-2 py-10 text-center text-slate-400 italic">
                        No Canva, Figma, Drive, or Notion resources currently cataloged.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Quick Footer indicator */}
          <div className="p-4 bg-[#F4FAFF]/60 border-t border-[#EAF6FF] text-[10px] text-[#64748B] font-bold text-center">
            Last Modified State: {project.updatedAt ? new Date(project.updatedAt).toLocaleString() : 'N/A'}
          </div>

        </div>

      </div>

    </div>
  );
}
