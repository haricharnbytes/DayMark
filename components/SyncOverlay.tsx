
import React, { useState } from 'react';
import { exportDatabase, importDatabase } from '../utils/db';

interface SyncOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

const SyncOverlay: React.FC<SyncOverlayProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const [mode, setMode] = useState<'selection' | 'push' | 'pull'>('selection');
  const [token, setToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsProcessing(true);
    try {
      const newToken = await exportDatabase();
      setToken(newToken);
      setMode('push');
    } catch (e) {
      setError('Failed to generate sync token');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePull = async () => {
    if (!token.trim()) return;
    setIsProcessing(true);
    setError('');
    try {
      await importDatabase(token);
      onSyncComplete();
      onClose();
    } catch (e) {
      setError('Invalid or corrupted sync token');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 dark:bg-black/80 backdrop-blur-2xl transition-all p-6">
      <div className="bg-white dark:bg-stone-900 rounded-[3.5rem] p-12 w-full max-w-xl shadow-2xl border border-stone-100 dark:border-stone-800 fade-in flex flex-col relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#a31621]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#a31621]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-start mb-12 relative z-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#a31621] font-bold block mb-2">Cloud Sync</span>
            <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">
              {mode === 'selection' && 'Transfer Data'}
              {mode === 'push' && 'Your Sync Token'}
              {mode === 'pull' && 'Restore Data'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-300 dark:text-stone-600 hover:text-[#a31621] transition-all p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative z-10">
          {mode === 'selection' && (
            <div className="grid grid-cols-1 gap-6">
              <button 
                onClick={handlePush}
                disabled={isProcessing}
                className="group flex items-center justify-between p-8 rounded-[2rem] bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-800 hover:shadow-xl hover:shadow-[#a31621]/5 transition-all text-left"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Push to Cloud</h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 font-medium leading-relaxed">Generate a token to move your data <br/>to another device.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 shadow-sm group-hover:bg-[#a31621] group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
              </button>

              <button 
                onClick={() => setMode('pull')}
                className="group flex items-center justify-between p-8 rounded-[2rem] bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-800 hover:shadow-xl hover:shadow-[#a31621]/5 transition-all text-left"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Pull from Cloud</h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 font-medium leading-relaxed">Enter a token from another device <br/>to restore your workspace.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 shadow-sm group-hover:bg-[#a31621] group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {mode === 'push' && (
            <div className="space-y-8 fade-in">
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                Copy this unique token and use it on your other device to synchronize your data.
              </p>
              
              <div className="relative group">
                <div className="w-full bg-stone-50 dark:bg-stone-800 rounded-3xl p-6 font-mono text-[10px] break-all text-stone-400 dark:text-stone-500 border border-stone-100 dark:border-stone-700 max-h-48 overflow-y-auto selection:bg-[#a31621]/20 custom-scrollbar">
                  {token}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="absolute bottom-4 right-4 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  {showCopied ? 'Copied' : 'Copy Token'}
                </button>
              </div>

              <div className="flex justify-center">
                 <button 
                  onClick={() => setMode('selection')}
                  className="text-[10px] uppercase tracking-[0.3em] text-stone-400 hover:text-[#a31621] transition-colors font-bold"
                >
                  Return to Menu
                </button>
              </div>
            </div>
          )}

          {mode === 'pull' && (
            <div className="space-y-8 fade-in">
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                Enter your Sync Token below to overwrite this device with your cloud data.
              </p>
              
              <div>
                <textarea 
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setError(''); }}
                  placeholder="Paste token here..."
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-800 rounded-3xl px-6 py-5 focus:ring-1 focus:ring-[#a31621]/30 transition-all outline-none text-stone-700 dark:text-stone-200 text-[10px] font-mono h-40 resize-none placeholder:italic"
                  disabled={isProcessing}
                />
              </div>

              {error && (
                <div className="text-red-400 text-[10px] text-center uppercase tracking-widest font-bold animate-pulse">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-6">
                <button 
                  onClick={handlePull}
                  disabled={isProcessing || !token}
                  className={`w-full py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] font-bold transition-all duration-500 shadow-xl
                    ${isProcessing 
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
                      : 'bg-stone-800 dark:bg-[#a31621] text-white dark:text-stone-900 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                >
                  {isProcessing ? 'Syncing...' : 'Restore from Cloud'}
                </button>
                <button 
                  onClick={() => setMode('selection')}
                  className="text-[10px] uppercase tracking-[0.3em] text-stone-400 hover:text-stone-600 transition-colors font-bold mx-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 pt-10 border-t border-stone-50 dark:border-stone-800 text-center relative z-10">
          <p className="text-[9px] uppercase tracking-[0.5em] text-stone-300 dark:text-stone-700 font-bold">
            End-to-End Local Sync &bull; DayMark
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyncOverlay;
