import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Key, 
  Clock, 
  RefreshCw, 
  X, 
  AlertTriangle, 
  History, 
  ArrowRight,
  Save,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface MongoSecurityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLoginPin: string;
  onPinUpdated: (newPin: string) => void;
}

interface PasswordLogItem {
  _id?: string;
  pinType: string;
  oldPassword: string;
  newPassword: string;
  timestamp: string | Date;
}

export const MongoSecurityLogsModal: React.FC<MongoSecurityLogsModalProps> = ({
  isOpen,
  onClose,
  currentLoginPin,
  onPinUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'change' | 'password_logs'>('change');
  
  // Password Change Form State
  const [pinType, setPinType] = useState<'loginPin' | 'searchPin'>('loginPin');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Logs State
  const [passwordLogs, setPasswordLogs] = useState<PasswordLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; source: string }>({ isConnected: false, source: 'checking' });

  // Fetch password audit logs and DB status
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const [pwdRes, pinRes] = await Promise.all([
        fetch('/api/logs/passwords'),
        fetch('/api/pins')
      ]);

      if (pwdRes.ok) {
        const data = await pwdRes.json();
        if (data.logs) setPasswordLogs(data.logs);
      }

      if (pinRes.ok) {
        const data = await pinRes.json();
        setDbStatus({
          isConnected: Boolean(data.mongoConfigured || data.source === 'mongodb'),
          source: data.source || 'mongodb'
        });
      }
    } catch (e) {
      console.warn('[MongoLogs] Error fetching logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setOldPassword(currentLoginPin || '');
      setNewPassword('');
      setConfirmPassword('');
      fetchLogs();
    }
  }, [isOpen, currentLoginPin]);

  if (!isOpen) return null;

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!newPassword.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a new password/PIN.' });
      return;
    }

    if (newPassword.trim().length < 4) {
      setFeedback({ type: 'error', message: 'New PIN must be at least 4 digits.' });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setFeedback({ type: 'error', message: 'New PIN and confirmation PIN do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pin/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinType,
          oldPassword: oldPassword.trim() || currentLoginPin,
          newPassword: newPassword.trim(),
          source: 'security_manager_modal'
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `Success! Password changed (Old: ${data.oldPassword} -> New: ${data.newPassword}) and recorded to MongoDB.`
        });
        
        if (pinType === 'loginPin') {
          onPinUpdated(newPassword.trim());
        }

        setOldPassword(newPassword.trim());
        setNewPassword('');
        setConfirmPassword('');
        
        // Refresh password logs
        await fetchLogs();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to update PIN in MongoDB.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Network error communicating with MongoDB security service: ' + err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#020d06]/85 backdrop-blur-md overflow-y-auto overscroll-contain min-h-[100dvh]"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[92dvh] bg-[#071510] border-2 border-[#1a5c35] rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,255,213,0.2)] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Corners */}
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#0f3320] bg-[#020d06]/60 sticky top-0 z-10 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#020d06] border border-[#00ffd5] flex items-center justify-center text-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)] shrink-0">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-['Orbitron'] text-xs sm:text-base font-bold text-[#f0fff4] uppercase tracking-wider truncate">
                  MONGODB SECURITY AUDIT
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#00ffd5]/15 border border-[#00ffd5]/40 text-[#00ffd5] font-['JetBrains_Mono'] text-[8px] sm:text-[9px] uppercase font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] animate-ping" />
                  <span>{dbStatus.isConnected ? 'MONGO CONNECTED' : 'LIVE SYNC ACTIVE'}</span>
                </span>
              </div>
              <p className="font-['JetBrains_Mono'] text-[9px] sm:text-[11px] text-[#3d7a52] uppercase truncate">
                CHANGED PASSWORDS & PERMANENT SECURITY PINS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer touch-manipulation min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 pt-2 sm:pt-3 border-b border-[#0f3320] bg-[#020d06]/40 overflow-x-auto no-scrollbar touch-pan-x shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('change')}
            className={`px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-['Orbitron'] font-bold uppercase transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 cursor-pointer shrink-0 touch-manipulation whitespace-nowrap ${
              activeTab === 'change'
                ? 'border-[#00ffd5] text-[#00ffd5] bg-[#00ffd5]/10 rounded-t-lg'
                : 'border-transparent text-[#3d7a52] hover:text-[#a3e635]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>CHANGE PIN & LOG TO MONGO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('password_logs');
              fetchLogs();
            }}
            className={`px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-['Orbitron'] font-bold uppercase transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 cursor-pointer shrink-0 touch-manipulation whitespace-nowrap ${
              activeTab === 'password_logs'
                ? 'border-[#c8ff00] text-[#c8ff00] bg-[#c8ff00]/10 rounded-t-lg'
                : 'border-transparent text-[#3d7a52] hover:text-[#a3e635]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>MONGO CHANGED PASSWORD LOGS ({passwordLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoadingLogs}
            className="ml-auto p-2 rounded-lg bg-[#020d06] border border-[#0f3320] text-[#3d7a52] hover:text-[#00ffd5] hover:border-[#00ffd5] transition-colors cursor-pointer touch-manipulation shrink-0"
            title="Refresh logs from MongoDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin text-[#00ffd5]' : ''}`} />
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1">
          
          {/* TAB 1: Change Password & Record to Mongo */}
          {activeTab === 'change' && (
            <div className="space-y-4">
              <div className="p-3 sm:p-4 rounded-xl bg-[#020d06] border border-[#1a5c35] space-y-1">
                <div className="flex items-center gap-2 text-xs font-['Orbitron'] text-[#c8ff00] font-bold uppercase">
                  <Database className="w-4 h-4" />
                  <span>Strict Database Policy: Changed Passwords & Permanent PINs Only</span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50]">
                  Your MongoDB database exclusively retains changed passwords in <code className="text-[#00ffd5] font-bold">password_audit_logs</code> (with <strong className="text-[#ff4060]">Old Password</strong> and <strong className="text-[#c8ff00]">New Password</strong>) along with permanent security PINs in <code className="text-[#00ffd5] font-bold">system_security_pins</code>. All other logs and access attempts are completely disabled.
                </p>
              </div>

              {feedback && (
                <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs font-['JetBrains_Mono'] ${
                  feedback.type === 'success' 
                    ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00]' 
                    : 'bg-[#ff4060]/10 border-[#ff4060] text-[#ff4060]'
                }`}>
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#c8ff00] shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#ff4060] shrink-0 mt-0.5" />
                  )}
                  <p>{feedback.message}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-['Orbitron'] text-[#3d7a52] uppercase mb-1 font-bold">
                      Target PIN Type
                    </label>
                    <select
                      value={pinType}
                      onChange={(e) => setPinType(e.target.value as any)}
                      className="w-full bg-[#020d06] border border-[#1a5c35] focus:border-[#00ffd5] rounded-xl px-3 py-2 text-xs font-['JetBrains_Mono'] text-[#f0fff4] outline-none"
                    >
                      <option value="loginPin">Master System Login PIN</option>
                      <option value="searchPin">Search Gate Verification PIN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-['Orbitron'] text-[#3d7a52] uppercase mb-1 font-bold">
                      Current Password (Old)
                    </label>
                    <input
                      type="text"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Current PIN"
                      className="w-full bg-[#020d06] border border-[#1a5c35] focus:border-[#00ffd5] rounded-xl px-3 py-2 text-xs font-['JetBrains_Mono'] text-[#ff4060] outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-['Orbitron'] text-[#3d7a52] uppercase mb-1 font-bold">
                      New Password / PIN
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new 4+ digit PIN"
                      maxLength={12}
                      className="w-full bg-[#020d06] border border-[#1a5c35] focus:border-[#00ffd5] rounded-xl px-3 py-2 text-xs font-['JetBrains_Mono'] text-[#c8ff00] outline-none font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-['Orbitron'] text-[#3d7a52] uppercase mb-1 font-bold">
                      Confirm New PIN
                    </label>
                    <input
                      type="text"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new PIN"
                      maxLength={12}
                      className="w-full bg-[#020d06] border border-[#1a5c35] focus:border-[#00ffd5] rounded-xl px-3 py-2 text-xs font-['JetBrains_Mono'] text-[#c8ff00] outline-none font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#020d06]/50 border border-[#0f3320] flex flex-wrap items-center justify-between gap-2 text-[11px] font-['JetBrains_Mono'] text-[#3d7a52]">
                  <div>SYSTEM SECURITY PINS:</div>
                  <div className="flex items-center gap-3">
                    <span>STATUS: <strong className="text-[#c8ff00]">ENFORCED</strong></span>
                    <span>STORAGE: <strong className="text-[#00ffd5]">MONGODB</strong></span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#00ffd5]/20 hover:bg-[#00ffd5]/30 border border-[#00ffd5] text-[#00ffd5] font-['Orbitron'] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,255,213,0.2)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>UPDATING & LOGGING TO MONGODB...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>SAVE NEW PASSWORD & RECORD AUDIT TO MONGODB</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MongoDB Changed Password Audit Logs */}
          {activeTab === 'password_logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
                <span>MONGODB COLLECTION: <strong className="text-[#c8ff00]">password_audit_logs</strong></span>
                <span>{passwordLogs.length} RECORDS STORED</span>
              </div>

              {passwordLogs.length === 0 ? (
                <div className="p-8 text-center bg-[#020d06] border border-[#0f3320] rounded-2xl text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
                  NO PASSWORD CHANGE AUDIT LOGS FOUND IN DATABASE.
                </div>
              ) : (
                <div className="space-y-2">
                  {passwordLogs.map((log, idx) => (
                    <div 
                      key={log._id || idx}
                      className="p-3 rounded-xl bg-[#020d06] border border-[#1a5c35] hover:border-[#00ffd5] transition-all text-xs font-['JetBrains_Mono'] space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0f3320] pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#00ffd5]/15 text-[#00ffd5] font-bold text-[10px]">
                            PASSWORD_CHANGED
                          </span>
                          <span className="text-[#3d7a52] text-[10px]">
                            TYPE: <strong className="text-[#f0fff4]">{log.pinType || 'loginPin'}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#3d7a52]">
                          <Clock className="w-3 h-3 text-[#c8ff00]" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-[#ff4060] font-bold">OLD PASSWORD:</span>
                          <span className="px-2 py-0.5 rounded bg-[#ff4060]/15 border border-[#ff4060]/40 text-[#ff4060] font-mono font-bold">
                            {log.oldPassword}
                          </span>
                        </div>

                        <ArrowRight className="w-4 h-4 text-[#00ffd5]" />

                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-[#c8ff00] font-bold">NEW PASSWORD:</span>
                          <span className="px-2 py-0.5 rounded bg-[#c8ff00]/15 border border-[#c8ff00]/40 text-[#c8ff00] font-mono font-bold">
                            {log.newPassword}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#0f3320] bg-[#020d06]/60 flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
            <span>EXCLUSIVELY RETAINING: CHANGED PASSWORDS & SYSTEM PINS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#020d06] border border-[#1a5c35] hover:border-[#00ffd5] text-[#f0fff4] hover:text-[#00ffd5] text-xs transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
