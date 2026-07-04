import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useToast } from '../components/Toast.js';
import { authService, projectService } from '../services/api.js';
import ConfirmationDialog from '../components/ConfirmationDialog.js';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Lock, 
  Database, 
  Trash2, 
  ShieldAlert, 
  FileJson, 
  UploadCloud, 
  RefreshCw 
} from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { success, error, info } = useToast();

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Import fields
  const [backupJsonStr, setBackupJsonStr] = useState('');
  const [restoring, setRestoring] = useState(false);

  // Destructive confirmations
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteUsername, setConfirmDeleteUsername] = useState('');

  // 1. Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      error('Please specify all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New password and password confirmation fields do not match.');
      return;
    }
    if (newPassword.length < 6) {
      error('New password must consist of at least 6 characters.');
      return;
    }

    setChangingPass(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      success('Master key credential updated successfully.', 'Credentials Configured');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update credentials. Please verify your current password.');
    } finally {
      setChangingPass(false);
    }
  };

  // 2. Full export back handler
  const handleExportAllBackup = async () => {
    try {
      const data = await projectService.exportBackup();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `DevVault_FullSystem_Backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      success('Unified backup manifest exported.', 'Export Success');
    } catch (err) {
      error('Failed to compile backup manifest.');
    }
  };

  // 3. Restore snapshot handler
  const handleRestoreBackup = async () => {
    if (!backupJsonStr.trim()) {
      error('Please paste or upload a valid JSON backup manifest.');
      return;
    }
    setRestoring(true);
    try {
      const parsed = JSON.parse(backupJsonStr);
      await projectService.importBackup(parsed);
      success('Full database snapshot restored! Reloading workspace parameters.', 'Restore Complete');
      setBackupJsonStr('');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      error('Invalid backup payload or schema format. Verification failed.');
    } finally {
      setRestoring(false);
    }
  };

  // 4. File uploads parsing to text-area helper
  const handleBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBackupJsonStr(event.target.result as string);
        info('Backup JSON file parsed. Click Restore to apply.', 'File Loaded');
      }
    };
    reader.readAsText(file);
  };

  // 5. Destructive Purge Handler
  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount();
      success('Developer workspace and account deleted successfully.', 'Account Purged');
      setShowDeleteModal(false);
      logout();
    } catch (err) {
      error('Purge request failed. Credentials verification rejected.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
          <span>Preferences & Core Setup</span>
          <SettingsIcon className="w-6.5 h-6.5 text-[#1D9BFF]" />
        </h2>
        <p className="text-xs text-[#64748B] font-semibold mt-1">
          Configure security credentials, theme preferences, and system recovery points.
        </p>
      </div>

      {/* 1. Environment Theme Setting */}
      <section className="bg-white border border-white p-6 rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-4 text-xs font-semibold">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#64748B]">Environment Preferences</h3>
        
        <div className="flex items-center justify-between p-4.5 bg-[#F4FAFF]/60 border border-slate-50 rounded-xl shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)]">
          <div>
            <span className="text-[#1E293B] font-extrabold block leading-none">Aesthetic Mood</span>
            <span className="text-[10px] text-[#64748B] font-semibold mt-1.5 block leading-tight">Switch between developer slate light and carbon eye-safe themes.</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-3 bg-white border border-white hover:bg-[#F4FAFF] hover:scale-[1.02] rounded-xl shadow-[2px_2px_5px_rgba(170,200,220,0.15),-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all flex items-center gap-2 text-xs font-extrabold text-slate-600 hover:text-[#1D9BFF]"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#1D9BFF]" />
                <span>Dark Theme</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 2. Security password manager */}
      <form onSubmit={handleChangePassword} className="bg-white border border-white p-6 rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-5 text-xs font-semibold">
        <div className="flex items-center gap-2 border-b border-[#EAF6FF] pb-3.5">
          <Lock className="w-4 h-4 text-[#33A9FF]" />
          <span className="text-sm font-black text-[#1E293B] tracking-tight">Security Credentials</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Current Profile Password</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl outline-none font-mono text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters" 
                className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl outline-none font-mono text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password" 
                className="w-full px-4 py-3 bg-[#F4FAFF] shadow-[inset_2px_2px_5px_rgba(170,200,220,0.15)] border border-transparent rounded-xl outline-none font-mono text-[#1E293B] focus:bg-white focus:border-[#33A9FF] focus:shadow-none placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#EAF6FF]">
          <button
            type="submit"
            disabled={changingPass}
            className="py-3 px-5 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] hover:scale-[1.02] text-white rounded-xl text-xs font-bold transition-all shadow-[2px_2px_5px_rgba(29,155,255,0.2)] disabled:opacity-50"
          >
            {changingPass ? 'Updating Credentials...' : 'Rotate Password Key'}
          </button>
        </div>
      </form>

      {/* 3. Databases backups recovery */}
      <section className="bg-white border border-white p-6 rounded-[28px] shadow-[8px_8px_20px_rgba(170,200,220,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] space-y-5 text-xs font-semibold">
        <div className="flex items-center gap-2 border-b border-[#EAF6FF] pb-3.5">
          <Database className="w-4 h-4 text-[#33A9FF]" />
          <span className="text-sm font-black text-[#1E293B] tracking-tight">System backups & Restores</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Export card */}
          <div className="p-5 bg-[#F4FAFF]/60 border border-slate-50 rounded-2xl flex flex-col justify-between space-y-4 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)]">
            <div>
              <span className="text-[#1E293B] font-extrabold block leading-none">Compile Backup Manifest</span>
              <p className="text-[10px] text-[#64748B] font-semibold mt-2 leading-relaxed">
                Generates a secure JSON file containing all projects, sprint tasks, api collections, changelogs, and resource attachments.
              </p>
            </div>

            <button
              onClick={handleExportAllBackup}
              className="py-3 px-4 bg-white border border-white hover:bg-[#F4FAFF] hover:scale-[1.01] rounded-xl transition-all font-bold text-slate-700 hover:text-[#1D9BFF] flex items-center justify-center gap-2 w-full shadow-[2px_2px_5px_rgba(170,200,220,0.12)]"
            >
              <FileJson className="w-4 h-4 text-[#1D9BFF]" />
              <span>Generate Export</span>
            </button>
          </div>

          {/* Import card */}
          <div className="p-5 bg-[#F4FAFF]/60 border border-slate-50 rounded-2xl flex flex-col justify-between space-y-4 shadow-[inset_1px_1px_3px_rgba(170,200,220,0.1)]">
            <div>
              <span className="text-[#1E293B] font-extrabold block leading-none">Restore Snapshot</span>
              <p className="text-[10px] text-[#64748B] font-semibold mt-2 leading-relaxed">
                Restore configurations directly from a local JSON backup. Warning: This action overwrites the current workspace database.
              </p>
            </div>

            <div className="space-y-2">
              <label className="py-3 px-4 bg-white border border-white hover:bg-[#F4FAFF] hover:scale-[1.01] rounded-xl transition-all font-bold text-slate-600 hover:text-[#1D9BFF] flex items-center justify-center gap-2 w-full cursor-pointer shadow-[2px_2px_5px_rgba(170,200,220,0.12)]">
                <UploadCloud className="w-4 h-4 text-[#1D9BFF]" />
                <span>Upload JSON file</span>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleBackupFileUpload}
                  className="hidden" 
                />
              </label>

              {backupJsonStr.trim() && (
                <button
                  onClick={handleRestoreBackup}
                  disabled={restoring}
                  className="py-3 bg-gradient-to-r from-[#4FC3FF] to-[#1D9BFF] text-white font-extrabold rounded-xl text-xs w-full flex items-center justify-center gap-2 shadow-[2px_2px_5px_rgba(29,155,255,0.2)]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${restoring ? 'animate-spin' : ''}`} />
                  <span>Restore Snapshot</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dangerous zone - Erase Account */}
      <section className="bg-[#FF7D7D]/5 border border-[#FF7D7D]/15 p-6 rounded-[28px] space-y-4 text-xs font-semibold shadow-[6px_6px_15px_rgba(255,125,125,0.05)]">
        <div className="flex items-center gap-2 text-[#FF7D7D] border-b border-[#FF7D7D]/10 pb-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-black tracking-tight">System Purges</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-md">
            <span className="text-[#1E293B] font-extrabold block leading-none">Purge DevVault Workspace</span>
            <p className="text-[10px] text-[#64748B] font-semibold mt-1.5 leading-relaxed">
              Delete your developer profile registration, flush key hashes, and wipe every single project setup completely.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="py-3 px-5 bg-[#FF7D7D] hover:bg-[#FF7D7D]/90 text-white rounded-xl text-xs font-extrabold transition-transform hover:scale-[1.02] whitespace-nowrap self-start sm:self-center flex items-center gap-1.5 shadow-[2px_2px_5px_rgba(255,125,125,0.2)]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Workspace</span>
          </button>
        </div>
      </section>

      {/* Destructive confirm dialogs */}
      <ConfirmationDialog
        isOpen={showDeleteModal}
        title="Destroy DevVault Account?"
        message="Are you sure you want to delete your profile? This erases all password keys and wipes your simulated databases completely. This action cannot be undone."
        confirmText="Confirm Destroy"
        cancelText="Preserve"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />

    </div>
  );
}
