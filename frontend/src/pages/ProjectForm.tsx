import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Project, TechStack, RepositoryDetails, DeploymentDetails, ProjectCredential, ProjectResources } from '../types.js';
import { projectService } from '../services/api.js';
import { useToast } from '../components/Toast.js';
import { X, Code2, ShieldAlert, Globe, Link2, KeyRound, Check, FileText } from 'lucide-react';

interface ProjectFormProps {
  project?: Project; // If provided, we are in EDIT mode
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export default function ProjectForm({ project, onClose, onSuccess }: ProjectFormProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'tech' | 'repo' | 'deploy' | 'secrets' | 'resources'>('basics');
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  // Lists for tags and credentials
  const [tags, setTags] = useState<string[]>(project?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  const [credentials, setCredentials] = useState<Array<{ id: string; key: string; value: string; description: string }>>(
    project?.credentials?.map(c => ({
      id: c.id,
      key: c.key,
      value: c.value, // will be '••••••••' in edit mode, backend preserves if unmodified
      description: c.description || ''
    })) || []
  );
  const [newCredKey, setNewCredKey] = useState('');
  const [newCredVal, setNewCredVal] = useState('');
  const [newCredDesc, setNewCredDesc] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      category: project?.category || 'General',
      status: project?.status || 'Idea',
      priority: project?.priority || 'Medium',
      projectImage: project?.projectImage || '',
      startDate: project?.startDate?.split('T')[0] || '',
      endDate: project?.endDate?.split('T')[0] || '',
      version: project?.version || '1.0.0',
      teamMembers: project?.teamMembers?.join(', ') || '',
      favorite: project?.favorite || false,
      pinned: project?.pinned || false,
      colorLabel: project?.colorLabel || '#6366f1',
      notes: project?.notes || '',

      // Tech Stack
      'techStack.frontend': project?.techStack?.frontend || '',
      'techStack.backend': project?.techStack?.backend || '',
      'techStack.database': project?.techStack?.database || '',
      'techStack.authentication': project?.techStack?.authentication || '',
      'techStack.stateManagement': project?.techStack?.stateManagement || '',
      'techStack.hosting': project?.techStack?.hosting || '',
      'techStack.otherTools': project?.techStack?.otherTools || '',

      // Repository Details
      'repository.githubUrl': project?.repository?.githubUrl || '',
      'repository.frontendRepo': project?.repository?.frontendRepo || '',
      'repository.backendRepo': project?.repository?.backendRepo || '',
      'repository.branch': project?.repository?.branch || 'main',
      'repository.isPrivate': project?.repository?.isPrivate || false,

      // Deployment Details
      'deployment.frontendHosting': project?.deployment?.frontendHosting || '',
      'deployment.frontendUrl': project?.deployment?.frontendUrl || '',
      'deployment.backendHosting': project?.deployment?.backendHosting || '',
      'deployment.backendUrl': project?.deployment?.backendUrl || '',
      'deployment.mongodbAtlasUrl': project?.deployment?.mongodbAtlasUrl || '',
      'deployment.databaseName': project?.deployment?.databaseName || '',
      'deployment.envVariablesNotes': project?.deployment?.envVariablesNotes || '',
      'deployment.customDomain': project?.deployment?.customDomain || '',
      'deployment.sslEnabled': project?.deployment?.sslEnabled ?? true,
      'deployment.productionStatus': project?.deployment?.productionStatus || 'Active',

      // Resources
      'resources.figmaLink': project?.resources?.figmaLink || '',
      'resources.canvaLink': project?.resources?.canvaLink || '',
      'resources.googleDrive': project?.resources?.googleDrive || '',
      'resources.documentation': project?.resources?.documentation || '',
      'resources.requirementDocument': project?.resources?.requirementDocument || '',
      'resources.erDiagram': project?.resources?.erDiagram || '',
      'resources.flowchart': project?.resources?.flowchart || '',
      'resources.meetingNotes': project?.resources?.meetingNotes || '',
    }
  });

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddCredential = () => {
    if (newCredKey.trim() && newCredVal.trim()) {
      setCredentials([
        ...credentials,
        {
          id: Math.random().toString(36).substring(2, 11),
          key: newCredKey.trim(),
          value: newCredVal.trim(),
          description: newCredDesc.trim()
        }
      ]);
      setNewCredKey('');
      setNewCredVal('');
      setNewCredDesc('');
    }
  };

  const handleRemoveCredential = (idToRemove: string) => {
    setCredentials(credentials.filter(c => c.id !== idToRemove));
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Structure Nested fields
      const payload: Partial<Project> = {
        name: data.name,
        description: data.description,
        category: data.category,
        status: data.status,
        priority: data.priority,
        projectImage: data.projectImage,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        version: data.version,
        teamMembers: data.teamMembers ? data.teamMembers.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        favorite: !!data.favorite,
        pinned: !!data.pinned,
        colorLabel: data.colorLabel,
        notes: data.notes,
        tags,

        techStack: {
          frontend: (data['techStack.frontend'] ?? data.techStack?.frontend) || '',
          backend: (data['techStack.backend'] ?? data.techStack?.backend) || '',
          database: (data['techStack.database'] ?? data.techStack?.database) || '',
          authentication: (data['techStack.authentication'] ?? data.techStack?.authentication) || '',
          stateManagement: (data['techStack.stateManagement'] ?? data.techStack?.stateManagement) || '',
          hosting: (data['techStack.hosting'] ?? data.techStack?.hosting) || '',
          otherTools: (data['techStack.otherTools'] ?? data.techStack?.otherTools) || '',
        },

        repository: {
          githubUrl: (data['repository.githubUrl'] ?? data.repository?.githubUrl) || '',
          frontendRepo: (data['repository.frontendRepo'] ?? data.repository?.frontendRepo) || '',
          backendRepo: (data['repository.backendRepo'] ?? data.repository?.backendRepo) || '',
          branch: (data['repository.branch'] ?? data.repository?.branch) || 'main',
          isPrivate: !!(data['repository.isPrivate'] ?? data.repository?.isPrivate),
        },

        deployment: {
          frontendHosting: (data['deployment.frontendHosting'] ?? data.deployment?.frontendHosting) || '',
          frontendUrl: (data['deployment.frontendUrl'] ?? data.deployment?.frontendUrl) || '',
          backendHosting: (data['deployment.backendHosting'] ?? data.deployment?.backendHosting) || '',
          backendUrl: (data['deployment.backendUrl'] ?? data.deployment?.backendUrl) || '',
          mongodbAtlasUrl: (data['deployment.mongodbAtlasUrl'] ?? data.deployment?.mongodbAtlasUrl) || '',
          databaseName: (data['deployment.databaseName'] ?? data.deployment?.databaseName) || '',
          envVariablesNotes: (data['deployment.envVariablesNotes'] ?? data.deployment?.envVariablesNotes) || '',
          customDomain: (data['deployment.customDomain'] ?? data.deployment?.customDomain) || '',
          sslEnabled: !!(data['deployment.sslEnabled'] ?? data.deployment?.sslEnabled ?? true),
          productionStatus: (data['deployment.productionStatus'] ?? data.deployment?.productionStatus) || 'Active',
        },

        resources: {
          figmaLink: (data['resources.figmaLink'] ?? data.resources?.figmaLink) || '',
          canvaLink: (data['resources.canvaLink'] ?? data.resources?.canvaLink) || '',
          googleDrive: (data['resources.googleDrive'] ?? data.resources?.googleDrive) || '',
          documentation: (data['resources.documentation'] ?? data.resources?.documentation) || '',
          requirementDocument: (data['resources.requirementDocument'] ?? data.resources?.requirementDocument) || '',
          erDiagram: (data['resources.erDiagram'] ?? data.resources?.erDiagram) || '',
          flowchart: (data['resources.flowchart'] ?? data.resources?.flowchart) || '',
          meetingNotes: (data['resources.meetingNotes'] ?? data.resources?.meetingNotes) || '',
        },

        credentials: credentials.map(c => ({
          id: c.id,
          key: c.key,
          value: c.value,
          description: c.description
        })),
      };

      let savedProject: Project;
      if (project) {
        savedProject = await projectService.updateProject(project.id, payload);
        success(`Project "${savedProject.name}" updated successfully!`, 'Project Saved');
      } else {
        savedProject = await projectService.createProject(payload);
        success(`Project "${savedProject.name}" provisioned successfully!`, 'Project Created');
      }

      onSuccess(savedProject);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save project config.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity" 
      />

      {/* Drawer Container (Soft, rounded and floating feel) */}
      <div className="relative bg-[#EAF6FF] border-l border-white w-full max-w-3xl h-full shadow-[20px_0px_50px_rgba(170,200,220,0.4)] flex flex-col justify-between overflow-hidden">
        
        {/* Drawer Header (Clay styled) */}
        <div className="p-6 border-b border-white flex items-center justify-between bg-white shadow-[0px_4px_15px_rgba(170,200,220,0.1)]">
          <div>
            <h3 className="text-xl font-extrabold text-[#1E293B] tracking-tight">
              {project ? 'Configure Project Settings' : 'Initialize New Project'}
            </h3>
            <p className="text-xs text-[#64748B] font-semibold mt-1">
              {project ? `Modify operational details for ${project.name}.` : 'Setup full-stack developer operational parameters.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white border border-white text-slate-400 hover:text-[#1D9BFF] rounded-2xl shadow-[2px_2px_5px_rgba(170,200,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:scale-[1.03] active:scale-[0.97] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Nav Tabs (Clay tabs) */}
        <div className="px-6 py-2.5 bg-white border-b border-[#EAF6FF] flex gap-2 overflow-x-auto scrollbar-none shadow-[inset_0px_-2px_5px_rgba(170,200,220,0.05)]">
          {[
            { id: 'basics', label: 'Basics', icon: Code2 },
            { id: 'tech', label: 'Tech Stack', icon: ShieldAlert },
            { id: 'repo', label: 'Repositories', icon: Link2 },
            { id: 'deploy', label: 'Deployments', icon: Globe },
            { id: 'secrets', label: 'Secrets Vault', icon: KeyRound },
            { id: 'resources', label: 'Resources', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all outline-none border ${
                  isSel 
                    ? 'bg-[#EAF6FF] border-[#33A9FF]/30 text-[#1D9BFF] shadow-[inset_1px_1px_3px_rgba(170,200,220,0.2)]' 
                    : 'bg-white border-transparent text-[#64748B] hover:text-[#1D9BFF]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="bg-white p-6 border border-white rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.12),-8px_-8px_20px_rgba(255,255,255,0.9)] space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Project Name *</label>
                  <input 
                    type="text" 
                    {...register('name', { required: 'Name is required' })}
                    placeholder="e.g. Acme SaaS" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                  {errors.name && <p className="text-[10px] text-[#FF7D7D] font-bold mt-1">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Category</label>
                  <input 
                    type="text" 
                    {...register('category')}
                    placeholder="e.g. Web App, CLI, Mobile" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748B]">Short Description</label>
                <textarea 
                  rows={3}
                  {...register('description')}
                  placeholder="Summarize the project's purpose and target outcomes..." 
                  className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Status</label>
                  <select 
                    {...register('status')}
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none transition-all cursor-pointer"
                  >
                    <option value="Idea">Idea</option>
                    <option value="Development">Development</option>
                    <option value="Testing">Testing</option>
                    <option value="Production">Production</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Priority</label>
                  <select 
                    {...register('priority')}
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none transition-all cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Version</label>
                  <input 
                    type="text" 
                    {...register('version')}
                    placeholder="e.g. 1.0.0" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Start Date</label>
                  <input 
                    type="date" 
                    {...register('startDate')}
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none transition-all cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">End Date (optional)</label>
                  <input 
                    type="date" 
                    {...register('endDate')}
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Custom Color Tag</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="color" 
                      {...register('colorLabel')}
                      className="w-11 h-11 rounded-xl border border-slate-100 overflow-hidden outline-none bg-white cursor-pointer shadow-[2px_2px_5px_rgba(170,200,220,0.15)]"
                    />
                    <span className="text-xs text-[#64748B] font-bold">Select card theme identifier</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Bookmarks</label>
                  <div className="flex gap-5 py-2">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input type="checkbox" {...register('pinned')} className="rounded border-slate-300 text-[#1D9BFF] focus:ring-[#33A9FF]" />
                      <span>Pin on Sidebar</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input type="checkbox" {...register('favorite')} className="rounded border-slate-300 text-[#1D9BFF] focus:ring-[#33A9FF]" />
                      <span>Favorite Project</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#64748B]">Tags / Tech Stack Keywords</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="e.g. NextJS, Firebase, Docker (Press Enter)" 
                    className="flex-1 px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                  <button 
                    type="button"
                    onClick={handleAddTag}
                    className="px-5 py-3 bg-white border border-white hover:bg-[#F4FAFF] hover:scale-[1.02] text-xs font-bold text-slate-700 hover:text-[#1D9BFF] rounded-xl shadow-[2px_2px_5px_rgba(170,200,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all"
                  >
                    Add
                  </button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {tags.map((t, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-[#EAF6FF] text-[#1D9BFF] text-xs px-3 py-1.5 rounded-full font-bold border border-white shadow-[2px_2px_5px_rgba(170,200,220,0.08)]">
                        <span>{t}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(idx)}
                          className="hover:bg-white rounded-full p-0.5 text-[#33A9FF] hover:text-[#1D9BFF]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* General Project Image & Team */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Project Logo / Image URL</label>
                  <input 
                    type="text" 
                    {...register('projectImage')}
                    placeholder="https://images.unsplash.com/photo-..." 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Team Members (comma separated)</label>
                  <input 
                    type="text" 
                    {...register('teamMembers')}
                    placeholder="Nishant, Ashish, Rahul" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748B]">Project Notes / Canvas Scratchpad</label>
                <textarea 
                  rows={4}
                  {...register('notes')}
                  placeholder="Jot down quick operational ideas or checklists..." 
                  className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all resize-none"
                />
              </div>

            </div>
          )}

          {/* TAB 2: TECH STACK */}
          {activeTab === 'tech' && (
            <div className="bg-white p-6 border border-white rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.12),-8px_-8px_20px_rgba(255,255,255,0.9)] space-y-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Configure Software Stack</h4>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Frontend Engine</label>
                  <input 
                    type="text" 
                    {...register('techStack.frontend')}
                    placeholder="e.g. React 19, TypeScript, Tailwind" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Backend API Layer</label>
                  <input 
                    type="text" 
                    {...register('techStack.backend')}
                    placeholder="e.g. Node.js + Express" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Database Engine</label>
                  <input 
                    type="text" 
                    {...register('techStack.database')}
                    placeholder="e.g. MongoDB Atlas (Mongoose)" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Authentication / Identity</label>
                  <input 
                    type="text" 
                    {...register('techStack.authentication')}
                    placeholder="e.g. Auth0, JWT, Firebase Auth" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">State Management</label>
                  <input 
                    type="text" 
                    {...register('techStack.stateManagement')}
                    placeholder="e.g. Redux Toolkit, Zustand, Context API" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Cloud Hosting</label>
                  <input 
                    type="text" 
                    {...register('techStack.hosting')}
                    placeholder="e.g. Vercel + AWS EC2, Cloud Run" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748B]">Other DevTools / CI-CD</label>
                <input 
                  type="text" 
                  {...register('techStack.otherTools')}
                  placeholder="e.g. GitHub Actions, Docker, Swagger, Postman" 
                  className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                />
              </div>
            </div>
          )}

          {/* TAB 3: REPOS */}
          {activeTab === 'repo' && (
            <div className="bg-white p-6 border border-white rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.12),-8px_-8px_20px_rgba(255,255,255,0.9)] space-y-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Version Control Links</h4>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748B]">Main GitHub Repository URL</label>
                <input 
                  type="text" 
                  {...register('repository.githubUrl')}
                  placeholder="https://github.com/user/acme-saas" 
                  className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Frontend Sub-Repository</label>
                  <input 
                    type="text" 
                    {...register('repository.frontendRepo')}
                    placeholder="https://github.com/user/acme-client" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Backend Sub-Repository</label>
                  <input 
                    type="text" 
                    {...register('repository.backendRepo')}
                    placeholder="https://github.com/user/acme-api" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Primary Branch</label>
                  <input 
                    type="text" 
                    {...register('repository.branch')}
                    placeholder="e.g. main, master, staging" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Repository Status</label>
                  <div className="py-2.5">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input type="checkbox" {...register('repository.isPrivate')} className="rounded border-slate-300 text-[#1D9BFF] focus:ring-[#33A9FF]" />
                      <span>This is a Private Repository</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEPLOY */}
          {activeTab === 'deploy' && (
            <div className="bg-white p-6 border border-white rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.12),-8px_-8px_20px_rgba(255,255,255,0.9)] space-y-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Operational Environments</h4>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Frontend Cloud Host</label>
                  <input 
                    type="text" 
                    {...register('deployment.frontendHosting')}
                    placeholder="e.g. Vercel, Netlify, Cloudflare" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Frontend Live URL</label>
                  <input 
                    type="text" 
                    {...register('deployment.frontendUrl')}
                    placeholder="https://acme-saas.vercel.app" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Backend Cloud Host</label>
                  <input 
                    type="text" 
                    {...register('deployment.backendHosting')}
                    placeholder="e.g. Render, Railway, Fly.io, AWS" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Backend Server URL</label>
                  <input 
                    type="text" 
                    {...register('deployment.backendUrl')}
                    placeholder="https://acme-api.render.com" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">MongoDB Connection URL (hidden)</label>
                  <input 
                    type="text" 
                    {...register('deployment.mongodbAtlasUrl')}
                    placeholder="mongodb+srv://admin:pass@acme.cluster.mongodb.net" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Primary Database Name</label>
                  <input 
                    type="text" 
                    {...register('deployment.databaseName')}
                    placeholder="e.g. acme_db" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Custom Web Domain</label>
                  <input 
                    type="text" 
                    {...register('deployment.customDomain')}
                    placeholder="e.g. acme.com" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Domain Certificate SSL</label>
                  <div className="py-2.5">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input type="checkbox" {...register('deployment.sslEnabled')} className="rounded border-slate-300 text-[#1D9BFF] focus:ring-[#33A9FF]" />
                      <span>Enable Secure Sockets Layer (SSL)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748B]">Environment Variables Notes</label>
                <textarea 
                  rows={3}
                  {...register('deployment.envVariablesNotes')}
                  placeholder="e.g. PORT=5000, JWT_SECRET=vault-key, CLOUDINARY_URL=..." 
                  className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 5: SECRETS VAULT */}
          {activeTab === 'secrets' && (
            <div className="bg-white p-6 border border-white rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.12),-8px_-8px_20px_rgba(255,255,255,0.9)] space-y-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Credentials Crypt Vault</h4>
              <p className="text-[10px] text-[#33A9FF] font-bold leading-relaxed bg-[#EAF6FF]/80 p-3 rounded-xl border border-white shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)]">
                ⚠️ All keys entered here are encrypted with AES-256-CBC at rest on the server before storage. To inspect secret keys later, developers must supply their current profile password (Master Vault Key).
              </p>

              {/* Add New Secret Fields */}
              <div className="bg-[#F4FAFF] p-5 rounded-2xl border border-white space-y-4 shadow-[inset_1px_1px_4px_rgba(170,200,220,0.1)]">
                <span className="text-xs font-black text-[#1E293B] block">Add Credentials Entry</span>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#64748B]">Key Name</label>
                    <input 
                      type="text" 
                      value={newCredKey}
                      onChange={(e) => setNewCredKey(e.target.value)}
                      placeholder="e.g. STRIPE_SECRET_KEY" 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B] focus:border-[#33A9FF] placeholder-slate-400 shadow-[inset_1px_1px_2px_rgba(170,200,220,0.05)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#64748B]">Sensitive Value</label>
                    <input 
                      type="password" 
                      value={newCredVal}
                      onChange={(e) => setNewCredVal(e.target.value)}
                      placeholder="e.g. sk_live_abc123" 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B] focus:border-[#33A9FF] placeholder-slate-400 shadow-[inset_1px_1px_2px_rgba(170,200,220,0.05)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B]">Key Description (optional)</label>
                  <input 
                    type="text" 
                    value={newCredDesc}
                    onChange={(e) => setNewCredDesc(e.target.value)}
                    placeholder="e.g. Live webhook payment signing API keys" 
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-[#1E293B] focus:border-[#33A9FF] placeholder-slate-400 shadow-[inset_1px_1px_2px_rgba(170,200,220,0.05)]"
                  />
                </div>

                <button 
                  type="button"
                  onClick={handleAddCredential}
                  className="py-2.5 px-4 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:scale-[1.01] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-[2px_2px_5px_rgba(29,155,255,0.15)]"
                >
                  Add Secure Key
                </button>
              </div>

              {/* Active Secrets list */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-500">Active Keys Locked ({credentials.length})</span>
                {credentials.length === 0 ? (
                  <p className="text-[11px] text-[#64748B] italic font-semibold">No credentials configured for this project environment.</p>
                ) : (
                  <div className="space-y-2">
                    {credentials.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3.5 bg-[#F4FAFF] border border-white rounded-xl text-xs shadow-[2px_2px_5px_rgba(170,200,220,0.05)]">
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-[#1E293B] truncate">{c.key}</p>
                          <p className="text-[10px] text-[#64748B] font-semibold truncate mt-0.5">{c.description || 'No description provided'}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="font-mono text-[10px] text-[#1D9BFF] bg-[#EAF6FF] px-2 py-0.5 rounded-lg border border-white shadow-[1px_1px_2px_rgba(170,200,220,0.05)]">Encrypted</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveCredential(c.id)}
                            className="p-1.5 hover:bg-white text-[#FF7D7D] hover:text-[#FF7D7D]/90 rounded-lg shadow-sm transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: RESOURCES */}
          {activeTab === 'resources' && (
            <div className="bg-white p-6 border border-white rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.12),-8px_-8px_20px_rgba(255,255,255,0.9)] space-y-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#64748B]">External Document Assets</h4>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Figma Mockup Design Link</label>
                  <input 
                    type="text" 
                    {...register('resources.figmaLink')}
                    placeholder="https://figma.com/file/..." 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Canva / Whiteboard Canvas</label>
                  <input 
                    type="text" 
                    {...register('resources.canvaLink')}
                    placeholder="https://canva.com/design/..." 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Google Drive Assets Shared Folder</label>
                  <input 
                    type="text" 
                    {...register('resources.googleDrive')}
                    placeholder="https://drive.google.com/drive/folders/..." 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">Swagger / OpenAPI Docs URL</label>
                  <input 
                    type="text" 
                    {...register('resources.documentation')}
                    placeholder="https://docs.acme-saas.com" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748B]">Requirement Brief / PRD Document</label>
                <input 
                  type="text" 
                  {...register('resources.requirementDocument')}
                  placeholder="Link to Notion PRD, Google Docs" 
                  className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">ER Database Diagram URL</label>
                  <input 
                    type="text" 
                    {...register('resources.erDiagram')}
                    placeholder="Link to dbdiagram.io, dbml link" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B]">UX Flowchart Diagram URL</label>
                  <input 
                    type="text" 
                    {...register('resources.flowchart')}
                    placeholder="Link to Miro canvas, Whimsical, Mermaid" 
                    className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748B]">Sprint Meeting Notes Doc Link</label>
                <input 
                  type="text" 
                  {...register('resources.meetingNotes')}
                  placeholder="https://notion.so/meeting-notes" 
                  className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl text-sm font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 transition-all"
                />
              </div>
            </div>
          )}

        </form>

        {/* Drawer Footer Actions (Clay styled) */}
        <div className="p-6 border-t border-white flex gap-3.5 justify-end bg-white shadow-[0px_-4px_15px_rgba(170,200,220,0.08)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 bg-white border border-slate-100 hover:bg-[#F4FAFF] rounded-xl text-xs font-bold text-slate-500 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit(onSubmit)}
            className="px-6 py-3 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:scale-[1.02] text-white font-bold text-xs rounded-xl shadow-[2px_2px_5px_rgba(29,155,255,0.2)] disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{project ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
