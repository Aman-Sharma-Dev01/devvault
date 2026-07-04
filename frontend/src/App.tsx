import { useState } from 'react';
import { useAuth } from './context/AuthContext.js';
import Sidebar from './components/Sidebar.js';
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';
import ProjectDetail from './pages/ProjectDetail.js';
import Analytics from './pages/Analytics.js';
import Profile from './pages/Profile.js';
import Settings from './pages/Settings.js';
import ProjectForm from './pages/ProjectForm.js';
import { Project } from './types.js';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'dashboard' | 'projects' | 'analytics' | 'profile' | 'settings';

export default function App() {
  const { user } = useAuth();
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Modal/Drawer states
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(undefined);

  // Handle modal actions
  const handleOpenCreateModal = () => {
    setProjectToEdit(undefined);
    setIsProjectFormOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectFormOpen(true);
  };

  const handleProjectSuccess = (project: Project) => {
    setIsProjectFormOpen(false);
    setProjectToEdit(undefined);
    // Auto navigate to detail page of the new or updated config
    setSelectedProjectId(project.id);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('projects');
  };

  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
    setActiveTab('dashboard');
  };

  // Switch tabs
  const handleTabChange = (tab: TabType) => {
    setSelectedProjectId(null);
    setActiveTab(tab);
  };

  // If user is not authenticated, show Register/Login screen
  if (!user) {
    return (
      <div className="min-h-screen clay-bg-gradient flex items-center justify-center p-4 relative overflow-hidden">
        {/* Soft abstract floating blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#4FC3FF]/15 blur-[120px] animate-slow-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#1D9BFF]/10 blur-[150px] animate-slow-blob" style={{ animationDelay: '4s' }} />
        </div>
        <div className="relative z-10 w-full max-w-md">
          <Login />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen clay-bg-gradient text-slate-800 transition-colors flex flex-col md:flex-row relative overflow-x-hidden font-sans">
      
      {/* Soft abstract floating blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#4FC3FF]/15 blur-[120px] animate-slow-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#1D9BFF]/10 blur-[150px] animate-slow-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-indigo-300/10 blur-[100px] animate-slow-blob" style={{ animationDelay: '8s' }} />
      </div>

      {/* LEFT SIDEBAR NAVIGATION */}
      <div className="relative z-10">
        <Sidebar 
          currentTab={selectedProjectId ? 'projects' : activeTab} 
          setCurrentTab={(tab: any) => handleTabChange(tab)}
          onOpenCreateModal={handleOpenCreateModal}
          notificationCount={notificationCount}
        />
      </div>

      {/* RIGHT CONTENT WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full md:ml-64 relative z-10 transition-all">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedProjectId ? `project-${selectedProjectId}` : activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full"
          >
            {/* Project detailed viewer portal */}
            {selectedProjectId ? (
              <ProjectDetail 
                projectId={selectedProjectId} 
                onBack={handleBackToDashboard} 
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    onOpenCreateModal={handleOpenCreateModal} 
                    onEditProject={handleOpenEditModal}
                    onSelectProject={handleSelectProject}
                    setNotificationCount={setNotificationCount}
                  />
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    {/* Projects listing tab fallback */}
                    <Dashboard 
                      onOpenCreateModal={handleOpenCreateModal} 
                      onEditProject={handleOpenEditModal}
                      onSelectProject={handleSelectProject}
                      setNotificationCount={setNotificationCount}
                    />
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <Analytics />
                )}

                {activeTab === 'profile' && (
                  <Profile />
                )}

                {activeTab === 'settings' && (
                  <Settings />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* SECURE SIDE DRAWER MODAL OVERLAYS */}
      {isProjectFormOpen && (
        <ProjectForm 
          project={projectToEdit}
          onClose={() => {
            setIsProjectFormOpen(false);
            setProjectToEdit(undefined);
          }}
          onSuccess={handleProjectSuccess}
        />
      )}

    </div>
  );
}
