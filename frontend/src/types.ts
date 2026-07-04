export interface Developer {
  id: string;
  username: string;
  email: string;
  developerBio?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  profileImage?: string;
  theme?: 'light' | 'dark';
  createdAt: string;
}

export interface TechStack {
  frontend?: string;
  backend?: string;
  database?: string;
  authentication?: string;
  stateManagement?: string;
  hosting?: string;
  otherTools?: string;
}

export interface RepositoryDetails {
  githubUrl?: string;
  frontendRepo?: string;
  backendRepo?: string;
  branch?: string;
  lastUpdated?: string;
  isPrivate: boolean;
  githubToken?: string;
}

export interface DeploymentDetails {
  frontendHosting?: string;
  frontendUrl?: string;
  backendHosting?: string;
  backendUrl?: string;
  mongodbAtlasUrl?: string;
  databaseName?: string;
  envVariablesNotes?: string;
  customDomain?: string;
  sslEnabled: boolean;
  deploymentDate?: string;
  productionStatus?: string;
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
}

export interface ApiCollection {
  baseUrl?: string;
  documentationLink?: string;
  postmanCollection?: string;
  swaggerUrl?: string;
  endpoints: ApiEndpoint[];
}

export interface ProjectCredential {
  id: string;
  key: string;
  value: string; // Will show '••••••••' unless decrypted
  description?: string;
}

export interface ProjectResources {
  figmaLink?: string;
  canvaLink?: string;
  googleDrive?: string;
  documentation?: string;
  requirementDocument?: string;
  erDiagram?: string;
  flowchart?: string;
  meetingNotes?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ProjectTodo {
  id: string;
  name: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  progress: number; // 0 to 100
  checklist: ChecklistItem[];
}

export interface ProjectBug {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  steps?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assigned?: string;
  solution?: string;
  createdAt: string;
}

export interface ProjectFeature {
  id: string;
  title: string;
  status: 'Requested' | 'Completed' | 'Future Idea';
  notes?: string;
  createdAt: string;
}

export interface ProjectChangelog {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  changes: string[];
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  status: 'Idea' | 'Development' | 'Testing' | 'Production' | 'Archived';
  priority: 'Low' | 'Medium' | 'High';
  projectImage?: string;
  tags: string[];
  startDate?: string;
  endDate?: string;
  version: string;
  teamMembers: string[];
  favorite: boolean;
  pinned: boolean;
  colorLabel?: string;
  notes?: string;

  techStack: TechStack;
  repository: RepositoryDetails;
  deployment: DeploymentDetails;
  apiCollection: ApiCollection;
  credentials: ProjectCredential[];
  resources: ProjectResources;
  todos: ProjectTodo[];
  bugs: ProjectBug[];
  features: ProjectFeature[];
  changelogs: ProjectChangelog[];

  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  summary: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    archivedProjects: number;
    ideaProjects: number;
    projectsDeployed: number;
    githubConnected: number;
  };
  statusDistribution: Array<{ name: string; value: number }>;
  priorityDistribution: Array<{ name: string; value: number }>;
  techStackUsage: Array<{ name: string; value: number }>;
  hostingUsage: Array<{ name: string; value: number }>;
  databaseUsage: Array<{ name: string; value: number }>;
  monthlyCreated: Array<{ name: string; projects: number }>;
}

export interface SystemNotification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  projectName: string;
  projectId: string;
}
