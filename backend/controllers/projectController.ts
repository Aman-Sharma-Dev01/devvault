import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { DB, Project } from '../services/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/crypto.js';

/**
 * Get all projects for current user with search, filter, and sorting
 */
export async function getProjects(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    let projects = await DB.getProjectsByUserId(req.user.id);

    // Filter by search query
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';
    if (search) {
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.tags.some(t => t.toLowerCase().includes(search)) ||
        (p.techStack?.frontend && p.techStack.frontend.toLowerCase().includes(search)) ||
        (p.techStack?.backend && p.techStack.backend.toLowerCase().includes(search)) ||
        (p.techStack?.database && p.techStack.database.toLowerCase().includes(search))
      );
    }

    // Filter by status
    const status = req.query.status ? String(req.query.status) : '';
    if (status) {
      projects = projects.filter(p => p.status === status);
    }

    // Filter by priority
    const priority = req.query.priority ? String(req.query.priority) : '';
    if (priority) {
      projects = projects.filter(p => p.priority === priority);
    }

    // Filter by category
    const category = req.query.category ? String(req.query.category) : '';
    if (category) {
      projects = projects.filter(p => p.category === category);
    }

    // Filter by technology
    const tech = req.query.tech ? String(req.query.tech).toLowerCase() : '';
    if (tech) {
      projects = projects.filter(p => 
        p.tags.some(t => t.toLowerCase().includes(tech)) ||
        (p.techStack?.frontend && p.techStack.frontend.toLowerCase().includes(tech)) ||
        (p.techStack?.backend && p.techStack.backend.toLowerCase().includes(tech)) ||
        (p.techStack?.database && p.techStack.database.toLowerCase().includes(tech))
      );
    }

    // Filter by hosting
    const hosting = req.query.hosting ? String(req.query.hosting).toLowerCase() : '';
    if (hosting) {
      projects = projects.filter(p => 
        (p.deployment?.frontendHosting && p.deployment.frontendHosting.toLowerCase().includes(hosting)) ||
        (p.deployment?.backendHosting && p.deployment.backendHosting.toLowerCase().includes(hosting))
      );
    }

    // Filter by database
    const dbName = req.query.database ? String(req.query.database).toLowerCase() : '';
    if (dbName) {
      projects = projects.filter(p => 
        (p.techStack?.database && p.techStack.database.toLowerCase().includes(dbName))
      );
    }

    // Favorite or Pinned
    if (req.query.favorite === 'true') {
      projects = projects.filter(p => p.favorite);
    }
    if (req.query.pinned === 'true') {
      projects = projects.filter(p => p.pinned);
    }

    // Sorting
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'updatedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    projects.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'priority') {
        const priorities: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
        comparison = (priorities[a.priority] || 0) - (priorities[b.priority] || 0);
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else { // default: updatedAt
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return comparison * sortOrder;
    });

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const total = projects.length;
    const paginatedProjects = projects.slice(startIndex, startIndex + limit);

    // Safe projects (credentials strip passwords or keep them encrypted)
    const sanitizedProjects = paginatedProjects.map(p => {
      const proj = { ...p };
      // Hide actual encrypted passwords from general index, provide placeholder
      proj.credentials = proj.credentials?.map((c: any) => ({
        ...c,
        value: '••••••••' // do not send encrypted value in index requests
      })) || [];
      return proj;
    });

    res.status(200).json({
      projects: sanitizedProjects,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch projects' });
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const project = await DB.findProjectById(id);

    if (!project || project.userId !== req.user.id) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Hide actual encrypted passwords but let client know keys
    const sanitized = { ...project };
    sanitized.credentials = sanitized.credentials?.map((c: any) => ({
      ...c,
      value: '••••••••' // Placeholder for index list, can request via specific decrypt route
    })) || [];

    res.status(200).json(sanitized);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch project' });
  }
}

/**
 * Create a new project
 */
export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const {
      name, description, category, status, priority, projectImage, tags,
      startDate, endDate, version, teamMembers, favorite, pinned, colorLabel, notes,
      techStack, repository, deployment, apiCollection, credentials, resources,
      todos, bugs, features, changelogs
    } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Project name is required' });
      return;
    }

    // Encrypt credentials if they were sent
    const encryptedCredentials = credentials?.map((c: any) => {
      const id = c.id || Math.random().toString(36).substring(2, 11);
      // We will encrypt using user default system key
      return {
        id,
        key: c.key,
        value: encrypt(c.value),
        description: c.description
      };
    }) || [];

    const newProject = await DB.createProject(req.user.id, {
      name,
      description: description || '',
      category: category || 'General',
      status: status || 'Idea',
      priority: priority || 'Medium',
      projectImage,
      tags: tags || [],
      startDate,
      endDate,
      version: version || '1.0.0',
      teamMembers: teamMembers || [],
      favorite: !!favorite,
      pinned: !!pinned,
      colorLabel: colorLabel || '#6366f1',
      notes: notes || '',
      techStack: techStack || {},
      repository: repository || { isPrivate: false },
      deployment: deployment || { sslEnabled: true },
      apiCollection: apiCollection || { endpoints: [] },
      credentials: encryptedCredentials,
      resources: resources || {},
      todos: todos || [],
      bugs: bugs || [],
      features: features || [],
      changelogs: changelogs || []
    });

    res.status(211).json(newProject);
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({ message: error.message || 'Failed to create project' });
  }
}

/**
 * Update project
 */
export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const project = await DB.findProjectById(id);

    if (!project || project.userId !== req.user.id) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Handle credential encryption before saving
    let updatedCredentials = req.body.credentials;
    if (updatedCredentials) {
      updatedCredentials = updatedCredentials.map((c: any) => {
        // If password value is placeholders (e.g. '••••••••'), keep the existing encrypted value!
        if (c.value === '••••••••') {
          const existing = project.credentials?.find((ec: any) => ec.id === c.id);
          return {
            id: c.id,
            key: c.key,
            value: existing ? existing.value : '',
            description: c.description
          };
        } else {
          return {
            id: c.id || Math.random().toString(36).substring(2, 11),
            key: c.key,
            value: encrypt(c.value),
            description: c.description
          };
        }
      });
    }

    const updates = {
      ...req.body,
    };
    if (updatedCredentials) {
      updates.credentials = updatedCredentials;
    }

    const updated = await DB.updateProject(id, req.user.id, updates);

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ message: error.message || 'Failed to update project' });
  }
}

/**
 * Delete project
 */
export async function deleteProject(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const success = await DB.deleteProject(id, req.user.id);

    if (!success) {
      res.status(404).json({ message: 'Project not found or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete project' });
  }
}

/**
 * Reveal Credential Password
 */
export async function revealCredential(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { projectId, credentialId, masterPassword } = req.body;
    if (!projectId || !credentialId || !masterPassword) {
      res.status(400).json({ message: 'Project ID, Credential ID and master password are required' });
      return;
    }

    const user = await DB.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify master password (which is current user password)
    const isMatch = await bcrypt.compare(masterPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid master password. Credentials cannot be revealed.' });
      return;
    }

    const project = await DB.findProjectById(projectId);
    if (!project || project.userId !== req.user.id) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const cred = project.credentials?.find((c: any) => c.id === credentialId);
    if (!cred) {
      res.status(404).json({ message: 'Credential entry not found' });
      return;
    }

    // Decrypt value
    const decryptedValue = decrypt(cred.value);

    res.status(200).json({ value: decryptedValue });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to decrypt credential' });
  }
}

/**
 * Backup / Export all project data
 */
export async function exportBackup(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const projects = await DB.getProjectsByUserId(req.user.id);
    
    // Decrypt credentials for the backup so they can restore them correctly elsewhere,
    // or keep them encrypted with system keys. Let's export them decrypted or in standard AES.
    // Let's decrypt them so they are readable in the JSON export, as is typical for credentials backup,
    // or encrypt them with a user-supplied key.
    const decryptedProjects = projects.map(p => {
      const clone = { ...p };
      clone.credentials = clone.credentials?.map((c: any) => ({
        ...c,
        value: decrypt(c.value) // export as plain text in the backup file
      })) || [];
      return clone;
    });

    res.status(200).json({
      exportDate: new Date().toISOString(),
      developer: req.user.username,
      version: 'DevVault-Backup-V1',
      projects: decryptedProjects
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to export backup' });
  }
}

/**
 * Restore / Import projects from JSON
 */
export async function importBackup(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { backupData } = req.body;
    if (!backupData || !backupData.projects || !Array.isArray(backupData.projects)) {
      res.status(400).json({ message: 'Invalid backup JSON data structure' });
      return;
    }

    const importedProjects: Project[] = [];
    
    for (const p of backupData.projects) {
      const credentials = p.credentials?.map((c: any) => ({
        id: c.id || Math.random().toString(36).substring(2, 11),
        key: c.key,
        value: encrypt(c.value), // encrypt using current system key
        description: c.description
      })) || [];

      const newProject = await DB.createProject(req.user.id, {
        name: p.name || 'Imported Project',
        description: p.description || '',
        category: p.category || 'General',
        status: p.status || 'Idea',
        priority: p.priority || 'Medium',
        projectImage: p.projectImage,
        tags: p.tags || [],
        startDate: p.startDate,
        endDate: p.endDate,
        version: p.version || '1.0.0',
        teamMembers: p.teamMembers || [],
        favorite: !!p.favorite,
        pinned: !!p.pinned,
        colorLabel: p.colorLabel || '#6366f1',
        notes: p.notes || '',
        techStack: p.techStack || {},
        repository: p.repository || { isPrivate: false },
        deployment: p.deployment || { sslEnabled: true },
        apiCollection: p.apiCollection || { endpoints: [] },
        credentials,
        resources: p.resources || {},
        todos: p.todos || [],
        bugs: p.bugs || [],
        features: p.features || [],
        changelogs: p.changelogs || []
      });

      importedProjects.push(newProject);
    }

    res.status(211).json({
      message: `${importedProjects.length} projects imported successfully!`,
      projects: importedProjects
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to import backup' });
  }
}

/**
 * Get Analytics breakdown
 */
export async function getAnalytics(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const projects = await DB.getProjectsByUserId(req.user.id);

    // Initial breakdown count
    let totalProjects = projects.length;
    let activeProjects = projects.filter(p => p.status === 'Development' || p.status === 'Testing').length;
    let completedProjects = projects.filter(p => p.status === 'Production').length;
    let archivedProjects = projects.filter(p => p.status === 'Archived').length;
    let ideaProjects = projects.filter(p => p.status === 'Idea').length;

    // Extra statistics
    let projectsDeployed = projects.filter(p => p.deployment?.frontendUrl || p.deployment?.backendUrl).length;
    let githubConnected = projects.filter(p => p.repository?.githubUrl).length;

    // Status distributions
    const statusDistribution = [
      { name: 'Idea', value: ideaProjects },
      { name: 'Development', value: projects.filter(p => p.status === 'Development').length },
      { name: 'Testing', value: projects.filter(p => p.status === 'Testing').length },
      { name: 'Production', value: completedProjects },
      { name: 'Archived', value: archivedProjects }
    ];

    // Priority distribution
    const priorityDistribution = [
      { name: 'Low', value: projects.filter(p => p.priority === 'Low').length },
      { name: 'Medium', value: projects.filter(p => p.priority === 'Medium').length },
      { name: 'High', value: projects.filter(p => p.priority === 'High').length }
    ];

    // Tech stack distribution
    const techStackUsage: Record<string, number> = {};
    const hostingUsage: Record<string, number> = {};
    const databaseUsage: Record<string, number> = {};

    projects.forEach(p => {
      // Tech tags
      p.tags?.forEach((t: string) => {
        const cleaned = t.trim();
        if (cleaned) {
          techStackUsage[cleaned] = (techStackUsage[cleaned] || 0) + 1;
        }
      });

      // Databases
      if (p.techStack?.database) {
        const db = p.techStack.database.trim();
        databaseUsage[db] = (databaseUsage[db] || 0) + 1;
      }

      // Hosting
      if (p.deployment?.frontendHosting) {
        const h = p.deployment.frontendHosting.trim();
        hostingUsage[h] = (hostingUsage[h] || 0) + 1;
      }
      if (p.deployment?.backendHosting) {
        const h = p.deployment.backendHosting.trim();
        hostingUsage[h] = (hostingUsage[h] || 0) + 1;
      }
    });

    const formatUsage = (record: Record<string, number>) => {
      return Object.entries(record)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8
    };

    // Created projects by month (last 6 months)
    const monthlyProjects: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Pre-populate last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthlyProjects[label] = 0;
    }

    projects.forEach(p => {
      try {
        const d = new Date(p.createdAt);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        if (monthlyProjects[label] !== undefined) {
          monthlyProjects[label] += 1;
        }
      } catch (e) {}
    });

    const monthlyCreated = Object.entries(monthlyProjects).map(([name, value]) => ({
      name,
      projects: value
    }));

    res.status(200).json({
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        archivedProjects,
        ideaProjects,
        projectsDeployed,
        githubConnected
      },
      statusDistribution,
      priorityDistribution,
      techStackUsage: formatUsage(techStackUsage),
      hostingUsage: formatUsage(hostingUsage),
      databaseUsage: formatUsage(databaseUsage),
      monthlyCreated
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to load analytics' });
  }
}

/**
 * Get active alerts / system notifications
 */
export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const projects = await DB.getProjectsByUserId(req.user.id);
    const notifications: Array<{
      id: string;
      type: 'warning' | 'info' | 'success';
      title: string;
      message: string;
      projectName: string;
      projectId: string;
    }> = [];

    projects.forEach(p => {
      // 1. Pending tasks that are high priority or past due
      const pendingTodos = p.todos?.filter((t: any) => t.status !== 'Completed') || [];
      pendingTodos.forEach((t: any) => {
        if (t.priority === 'High') {
          notifications.push({
            id: `todo-high-${t.id}`,
            type: 'warning',
            title: 'High Priority Task Pending',
            message: `Task "${t.name}" is marked High priority and is pending.`,
            projectName: p.name,
            projectId: p.id
          });
        }
        if (t.dueDate) {
          const due = new Date(t.dueDate).getTime();
          const today = new Date().getTime();
          if (due < today) {
            notifications.push({
              id: `todo-overdue-${t.id}`,
              type: 'warning',
              title: 'Overdue Task Alert',
              message: `Task "${t.name}" is overdue (due: ${new Date(t.dueDate).toLocaleDateString()}).`,
              projectName: p.name,
              projectId: p.id
            });
          }
        }
      });

      // 2. Incomplete deployments (production status warnings)
      if (p.status === 'Production') {
        const deploymentIncomplete = !p.deployment?.frontendUrl && !p.deployment?.backendUrl;
        if (deploymentIncomplete) {
          notifications.push({
            id: `deploy-incomplete-${p.id}`,
            type: 'info',
            title: 'Incomplete Production Deployment',
            message: `Project status is "Production" but no active deployment URLs are configured.`,
            projectName: p.name,
            projectId: p.id
          });
        }
      }

      // 3. High severity open bugs
      const activeBugs = p.bugs?.filter((b: any) => b.status === 'Open' || b.status === 'In Progress') || [];
      activeBugs.forEach((b: any) => {
        if (b.severity === 'Critical' || b.severity === 'High') {
          notifications.push({
            id: `bug-crit-${b.id}`,
            type: 'warning',
            title: `Critical Bug Unresolved`,
            message: `Bug "${b.title}" is marked as ${b.severity} severity and remains active.`,
            projectName: p.name,
            projectId: p.id
          });
        }
      });

      // 4. Upcoming Domain Expiry
      if (p.deployment?.customDomain && !p.deployment?.sslEnabled) {
        notifications.push({
          id: `domain-ssl-${p.id}`,
          type: 'info',
          title: 'SSL Disabled on Custom Domain',
          message: `The custom domain "${p.deployment.customDomain}" is active but SSL is disabled.`,
          projectName: p.name,
          projectId: p.id
        });
      }
    });

    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
  }
}
