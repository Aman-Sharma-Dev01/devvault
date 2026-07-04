import mongoose, { Schema, Document } from 'mongoose';

// ==================== User Model ====================

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  developerBio?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  profileImage?: string;
  theme?: 'light' | 'dark';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  developerBio: String,
  portfolioUrl: String,
  githubUrl: String,
  linkedinUrl: String,
  resumeUrl: String,
  profileImage: String,
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      (ret as any).id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      (ret as any).id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  }
});

const UserModel = mongoose.model<IUser>('User', UserSchema);

// ==================== Project Model ====================

export interface IProject extends Document {
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
  version?: string;
  teamMembers: string[];
  favorite: boolean;
  pinned: boolean;
  colorLabel?: string;
  notes?: string;
  techStack: Record<string, any>;
  repository: Record<string, any>;
  deployment: Record<string, any>;
  apiCollection: Record<string, any>;
  credentials: Array<{ id: string; key: string; value: string; description?: string }>;
  resources: Record<string, any>;
  todos: any[];
  bugs: any[];
  features: any[];
  changelogs: any[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  status: { type: String, enum: ['Idea', 'Development', 'Testing', 'Production', 'Archived'], default: 'Idea' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  projectImage: String,
  tags: { type: [String], default: [] },
  startDate: String,
  endDate: String,
  version: { type: String, default: '1.0.0' },
  teamMembers: { type: [String], default: [] },
  favorite: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  colorLabel: { type: String, default: '#6366f1' },
  notes: String,
  techStack: { type: Schema.Types.Mixed, default: {} },
  repository: { type: Schema.Types.Mixed, default: { isPrivate: false } },
  deployment: { type: Schema.Types.Mixed, default: { sslEnabled: true } },
  apiCollection: { type: Schema.Types.Mixed, default: { endpoints: [] } },
  credentials: { type: Schema.Types.Mixed, default: [] },
  resources: { type: Schema.Types.Mixed, default: {} },
  todos: { type: Schema.Types.Mixed, default: [] },
  bugs: { type: Schema.Types.Mixed, default: [] },
  features: { type: Schema.Types.Mixed, default: [] },
  changelogs: { type: Schema.Types.Mixed, default: [] },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      (ret as any).id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      (ret as any).id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  }
});

const ProjectModel = mongoose.model<IProject>('Project', ProjectSchema);

// ==================== Backward-compatible type exports ====================

export type User = ReturnType<IUser['toJSON']>;
export type Project = ReturnType<IProject['toJSON']>;

// ==================== Database Operations ====================

export const DB = {
  // ---- Users ----

  async findUserById(id: string) {
    const user = await UserModel.findById(id).lean();
    if (!user) return undefined;
    return { ...user, id: (user._id as any).toString(), _id: undefined } as any;
  },

  async findUserByEmail(email: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    if (!user) return undefined;
    return { ...user, id: (user._id as any).toString(), _id: undefined } as any;
  },

  async findUserByUsername(username: string) {
    const user = await UserModel.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();
    if (!user) return undefined;
    return { ...user, id: (user._id as any).toString(), _id: undefined } as any;
  },

  async createUser(userData: { username: string; email: string; passwordHash: string; theme?: string }) {
    const user = await UserModel.create(userData as any);
    return user.toJSON() as any;
  },

  async updateUser(id: string, updates: Record<string, any>) {
    const user = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!user) return undefined;
    return { ...user, id: (user._id as any).toString(), _id: undefined } as any;
  },

  async deleteUser(id: string) {
    const result = await UserModel.findByIdAndDelete(id);
    if (!result) return false;
    // Delete all user's projects
    await ProjectModel.deleteMany({ userId: id });
    return true;
  },

  // ---- Projects ----

  async getProjectsByUserId(userId: string) {
    const projects = await ProjectModel.find({ userId }).lean();
    return projects.map(p => ({ ...p, id: (p._id as any).toString(), _id: undefined })) as any[];
  },

  async findProjectById(id: string) {
    const project = await ProjectModel.findById(id).lean();
    if (!project) return undefined;
    return { ...project, id: (project._id as any).toString(), _id: undefined } as any;
  },

  async createProject(userId: string, projectData: Record<string, any>) {
    const project = await ProjectModel.create({ ...projectData, userId });
    return project.toJSON() as any;
  },

  async updateProject(id: string, userId: string, updates: Record<string, any>) {
    // Find existing project first to merge nested objects
    const existing = await ProjectModel.findOne({ _id: id, userId });
    if (!existing) return undefined;

    // Merge nested objects safely
    const mergedUpdates = { ...updates };
    if (updates.techStack) mergedUpdates.techStack = { ...existing.techStack, ...updates.techStack };
    if (updates.repository) mergedUpdates.repository = { ...existing.repository, ...updates.repository };
    if (updates.deployment) mergedUpdates.deployment = { ...existing.deployment, ...updates.deployment };
    if (updates.apiCollection) mergedUpdates.apiCollection = { ...existing.apiCollection, ...updates.apiCollection };
    if (updates.resources) mergedUpdates.resources = { ...existing.resources, ...updates.resources };

    const project = await ProjectModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: mergedUpdates },
      { new: true }
    ).lean();

    if (!project) return undefined;
    return { ...project, id: (project._id as any).toString(), _id: undefined } as any;
  },

  async deleteProject(id: string, userId: string) {
    const result = await ProjectModel.findOneAndDelete({ _id: id, userId });
    return !!result;
  },
};
