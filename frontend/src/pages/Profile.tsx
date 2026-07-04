import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/Toast.js';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Github, 
  Linkedin, 
  Award,
  PenSquare,
  Lock,
  Compass,
  CheckCircle2
} from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();
  
  // Local profile states
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setGithubUrl(user.githubUrl || '');
      setLinkedinUrl(user.linkedinUrl || '');
      setWebsiteUrl(user.websiteUrl || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        role: role.trim(),
        bio: bio.trim(),
        location: location.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        websiteUrl: websiteUrl.trim()
      });
      
      setEditing(false);
      success('Profile portfolio credentials updated successfully.', 'Portfolio Saved');
    } catch (err) {
      error('Failed to update portfolio credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      
      {/* 1. Header Hero Banner */}
      <section className="bg-white border border-white rounded-[32px] overflow-hidden relative shadow-[10px_10px_24px_rgba(170,200,220,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)]">
        {/* Colorful gradient backdrop */}
        <div className="h-36 bg-gradient-to-r from-[#4FC3FF] via-[#33A9FF] to-[#1D9BFF] relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
        </div>

        <div className="p-6 pt-0 relative flex flex-col sm:flex-row gap-5 sm:items-end -mt-12 sm:-mt-14">
          {/* Avatar Icon (Clay raised style) */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-3xl border-4 border-white shadow-[6px_6px_15px_rgba(170,200,220,0.22)] flex items-center justify-center text-slate-400 flex-shrink-0">
            <div className="w-full h-full bg-[#EAF6FF] rounded-[20px] flex items-center justify-center shadow-[inset_1px_1px_3px_rgba(170,200,220,0.25)]">
              <User className="w-12 h-12 text-[#1D9BFF]" />
            </div>
          </div>

          <div className="flex-1 pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1E293B] tracking-tight leading-tight">{user.username}</h2>
                <p className="text-xs font-bold text-[#64748B] mt-1.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#33A9FF]" />
                  <span>{role || 'Software Engineer'}</span>
                </p>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className={`py-3 px-5 border rounded-[16px] text-xs font-bold transition-all flex items-center gap-2 ${
                  editing 
                    ? 'bg-[#FF7D7D]/10 border-transparent text-[#FF7D7D]' 
                    : 'bg-white border-white text-[#64748B] hover:text-[#1D9BFF] shadow-[2px_2px_5px_rgba(170,200,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:scale-[1.02]'
                }`}
              >
                <PenSquare className="w-4 h-4" />
                <span>{editing ? 'Cancel' : 'Update Portfolio'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bio segment */}
        <div className="p-6 border-t border-[#EAF6FF] text-xs font-semibold space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">Biographical Brief</span>
            <p className="text-[#1E293B] leading-relaxed font-semibold">
              {bio || 'Define your software stack focus, professional portfolio achievements, and background parameters.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 pt-2 text-[11px] text-[#64748B] font-bold">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#33A9FF]" />
              <span className="truncate">{user.email}</span>
            </div>

            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#33A9FF]" />
                <span className="truncate">{location}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#33A9FF]" />
              <span>Created {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Professional Portfolio Connections */}
      <section className="bg-white border border-white p-6 rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-4 text-xs font-semibold">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Connected Social Integrations</h3>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'GitHub Profile', url: githubUrl, icon: Github },
            { label: 'LinkedIn Profile', url: linkedinUrl, icon: Linkedin },
            { label: 'Workspace Portfolio', url: websiteUrl, icon: LinkIcon }
          ].map((soc, idx) => (
            <div key={idx} className="p-4 bg-[#F4FAFF]/60 border border-slate-50 rounded-xl flex items-center justify-between gap-3 text-xs shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <soc.icon className="w-4 h-4 text-[#33A9FF] flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#64748B] block font-bold leading-none mb-1">{soc.label}</span>
                  {soc.url ? (
                    <a href={soc.url} target="_blank" rel="noreferrer" className="text-[#1D9BFF] font-extrabold truncate block leading-tight hover:underline">
                      {soc.url}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic font-bold leading-tight">Unlinked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Form Editor (Shows up when editing state matches true) */}
      {editing && (
        <form onSubmit={handleUpdateProfile} className="bg-white border border-white p-6 rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-5 text-xs font-semibold">
          <div className="flex items-center gap-2 border-b border-[#EAF6FF] pb-3">
            <PenSquare className="w-4 h-4 text-[#33A9FF]" />
            <span className="text-sm font-black text-[#1E293B] tracking-tight">Configure Developer Profile</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Professional Title / Role</label>
              <input 
                type="text" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer" 
                className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Developer Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA" 
                className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Developer Bio Summary</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a brief professional roadmap..." 
              rows={3}
              className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400 resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">GitHub Url</label>
              <input 
                type="url" 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/Username" 
                className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">LinkedIn Url</label>
              <input 
                type="url" 
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/Username" 
                className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Personal Website Portfolio</label>
              <input 
                type="url" 
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourdomain.dev" 
                className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl font-bold outline-none text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#EAF6FF]">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="py-2.5 px-4 bg-white border border-slate-100 hover:bg-[#F4FAFF] rounded-xl text-xs font-bold text-slate-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:scale-[1.02] text-white rounded-xl text-xs font-bold transition-all shadow-[2px_2px_5px_rgba(29,155,255,0.2)] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
