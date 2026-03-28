import React, { useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import InputBox from '../components/InputBox';
import Dialog from '../components/Dialog';
import { predict, uploadFiles } from '../services/api';
import { 
  ChevronDown, 
  UserPlus,
  Mail,
  Share2,
  Copy,
  Settings,
  LogOut,
  Shield,
  CreditCard
} from 'lucide-react';

const Home = ({ messages, addMessage, isSidebarOpen }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSend = async (content) => {
    if (!content.trim() || isLoading) return;
    addMessage(content, 'user');
    setIsLoading(true);
    setError(null);
    try {
      const data = await predict(content, messages);
      addMessage(data.response, 'assistant', data.contexts || []);
    } catch (err) {
      setError('Neural engine error. Please check your connection.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files?.length) return;
    setIsLoading(true);
    try {
      await uploadFiles(files);
      addMessage(`${files.length} file(s) indexed. I'm ready to synthesize them from the knowledge vault.`, 'assistant');
    } catch (e) {
      setError('File upload failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://curator-ai.app/invite/774b-992a-331');
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#212121] relative overflow-hidden">
      
      {/* --- Modals Implementation --- */}
      <Dialog 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)}
        title="Invite Collaborators"
      >
        <div className="space-y-6">
          <p className="text-gray-500 text-sm leading-relaxed">
            Invite your team to this reasoning session. Collaborators can view history and index their own specialized documents.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-emerald-500/80 tracking-widest pl-1">Email Address</label>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="teammate@company.com" 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#4eeab8] focus:outline-none transition-all placeholder:text-gray-600"
              />
              <button className="px-6 py-2 bg-[#4eeab8] text-black font-bold text-sm rounded-xl hover:bg-[#3dd9a7] transition-all shadow-lg active:scale-95">
                Invite
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
             <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Share Session Link</label>
             <div className="flex items-center gap-2 p-3 bg-black/40 border border-white/5 rounded-2xl">
               <span className="flex-1 truncate text-xs text-gray-400 font-mono">https://curator-ai.app/invite/774b-992a-331</span>
               <button 
                 onClick={handleCopyLink}
                 className="p-2 hover:bg-white/5 rounded-lg text-[#4eeab8] transition-all active:scale-90"
                 title="Copy to clipboard"
               >
                 {linkCopied ? <span className="text-[10px] font-bold">Copied!</span> : <Copy className="w-4 h-4" />}
               </button>
             </div>
          </div>
        </div>
      </Dialog>

      <Dialog 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        title="Account Preferences"
      >
        <div className="space-y-4">
          <div className="bg-white/5 rounded-[24px] p-6 flex flex-col items-center gap-4 text-center border border-white/5 mb-4">
             <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-3xl font-black text-white shadow-[0_0_20px_rgba(78,234,184,0.2)]">US</div>
             <div>
                <h4 className="text-lg font-bold">User@Curator.ai</h4>
                <p className="text-xs text-[#4eeab8] font-bold tracking-widest uppercase mt-1">Founders Tier</p>
             </div>
          </div>
          
          <div className="space-y-1">
             <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-4">
                   <Settings className="w-5 h-5 text-gray-500 group-hover:text-white" />
                   <span className="text-sm font-semibold">General Settings</span>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-gray-600" />
             </button>
             <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-4">
                   <Shield className="w-5 h-5 text-gray-500 group-hover:text-white" />
                   <span className="text-sm font-semibold">Security & Privacy</span>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-gray-600" />
             </button>
             <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-4">
                   <CreditCard className="w-5 h-5 text-gray-500 group-hover:text-white" />
                   <span className="text-sm font-semibold">Billing & Tier</span>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-gray-600" />
             </button>
             <div className="pt-4 border-t border-white/5 mt-4">
               <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-red-400 transition-all group">
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-bold">Disconnect Account</span>
               </button>
             </div>
          </div>
        </div>
      </Dialog>

      {/* --- Main Page Header --- */}
      <header className={`px-5 py-4 flex items-center justify-between z-20 transition-all duration-300 ${!isSidebarOpen ? 'pl-20' : ''}`}>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all group">
           <span className="text-lg font-bold text-gray-200">Curator AI</span>
           <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
        </div>
        <div className="flex items-center gap-4">
           {/* Invite Collaborator Trigger */}
           <div 
             onClick={() => setShowInviteModal(true)}
             className="p-2 hover:bg-white/5 rounded-full transition-all cursor-pointer group"
             title="Invite Collaborators"
           >
              <UserPlus className="w-5 h-5 text-gray-500 group-hover:text-[#4eeab8]" />
           </div>
           
           {/* Profile Avatar Trigger */}
           <div 
             onClick={() => setShowProfileModal(true)}
             className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg border-2 border-transparent hover:border-[#4eeab8] p-0.5 overflow-hidden cursor-pointer transition-all active:scale-95 group"
           >
              <div className="w-full h-full rounded-full flex items-center justify-center text-sm font-black text-white group-hover:scale-110 transition-transform">US</div>
           </div>
        </div>
      </header>

      {/* Chat Content */}
      <ChatWindow messages={messages} isLoading={isLoading} />

      {/* Centered Floating Input Bar */}
      <div className="absolute bottom-0 left-0 w-full px-4 pb-8 pt-10 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent z-20">
         {error && (
            <div className="mx-auto max-w-2xl mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
               <p className="text-xs text-red-400 font-medium">{error}</p>
            </div>
         )}
         <InputBox onSend={handleSend} onFileUpload={handleFileUpload} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Home;
