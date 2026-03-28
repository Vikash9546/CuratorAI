import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Modal from './components/Modal';
import { 
  Plus, 
  Sparkles, 
  Archive, 
  MessageSquare,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Trash2,
  Trash,
  RefreshCw,
  Library
} from 'lucide-react';
import { listFiles, deleteFile, wipeCollection } from './services/api';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);
  
  // -- Modal State --
  const [modalType, setModalType] = useState(null); // 'wipe' | 'delete_chat'
  const [targetId, setTargetId] = useState(null);

  // -- Multi-Chat State --
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('curator_chats');
    return saved ? JSON.parse(saved) : [
      { id: Date.now().toString(), title: 'Initial Conversation', messages: [] }
    ];
  });
  
  const [activeChatId, setActiveChatId] = useState(() => {
    const savedId = localStorage.getItem('curator_active_id');
    return savedId || (chats.length > 0 ? chats[0].id : '');
  });

  const fetchFiles = async () => {
    try {
      const data = await listFiles();
      setIndexedFiles(data.files || []);
    } catch (err) {
      console.error('Failed to fetch indexed files', err);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('curator_chats', JSON.stringify(chats));
    localStorage.setItem('curator_active_id', activeChatId);
  }, [chats, activeChatId]);

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newChat = { id: newId, title: 'New Chat', messages: [] };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const confirmDeleteChat = (id) => {
    const filtered = chats.filter(c => c.id !== id);
    if (filtered.length === 0) {
      const resetId = Date.now().toString();
      setChats([{ id: resetId, title: 'Initial Conversation', messages: [] }]);
      setActiveChatId(resetId);
    } else {
      setChats(filtered);
      if (activeChatId === id) setActiveChatId(filtered[0].id);
    }
  };

  const handleRemoveFile = async (filename, e) => {
    e.stopPropagation();
    setIsDeleting(filename);
    try {
      await deleteFile(filename);
      await fetchFiles();
    } catch (err) {
      console.error('Delete failed');
    } finally {
      setIsDeleting(null);
    }
  };

  const confirmWipeAll = async () => {
    try {
      await wipeCollection();
      await fetchFiles();
    } catch (err) {
      console.error('Wipe failed');
    }
  };

  const addMessageToActiveChat = (content, role, contexts = []) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        const isFirstUserMsg = role === 'user' && chat.messages.length === 0;
        const newTitle = isFirstUserMsg ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : chat.title;
        return {
          ...chat,
          title: newTitle,
          messages: [...chat.messages, { role, content, contexts, id: Date.now() }]
        };
      }
      return chat;
    }));
    if (role === 'assistant' && content.includes('indexed')) {
      setTimeout(fetchFiles, 1000);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121] text-white selection:bg-[#4eeab8]/30 selection:text-[#4eeab8] font-sans">
      
      {/* --- In-Page Modals --- */}
      <Modal 
        isOpen={modalType === 'wipe'}
        onClose={() => setModalType(null)}
        onConfirm={confirmWipeAll}
        title="Wipe Knowledge Base?"
        message="This will permanently delete all indexed PDF, Markdown, and Text documents. This action cannot be undone."
        confirmText="Wipe Everything"
      />
      <Modal 
        isOpen={modalType === 'delete_chat'}
        onClose={() => setModalType(null)}
        onConfirm={() => confirmDeleteChat(targetId)}
        title="Delete Conversation?"
        message="Are you sure you want to remove this chat session? All message history will be lost."
        confirmText="Delete Chat"
      />

      <aside 
        className={`fixed md:relative z-40 h-full bg-[#171717] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'
        }`}
      >
        <div className={`flex flex-col h-full w-[280px] p-4 ${!isSidebarOpen && 'invisible'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-[#4eeab8] flex items-center justify-center text-black shadow-[0_0_15px_rgba(78,234,184,0.3)]">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <h1 className="text-sm font-black tracking-tight text-white leading-none uppercase">Curator AI</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="hidden md:flex p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all">
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <button onClick={handleNewChat} className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-white/5 shadow-inner mb-6 group text-gray-400 hover:text-white hover:bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
               <Plus className="w-5 h-5" />
            </div>
            New Reasoning
          </button>

          <nav className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-1 pb-4">
            <section>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3 shrink-0 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                History
              </div>
              <div className="space-y-1">
                {chats.map(chat => (
                   <button 
                     key={chat.id} 
                     onClick={() => { setActiveChatId(chat.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                     className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                       activeChatId === chat.id ? 'bg-white/5 text-white ring-1 ring-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                     }`}
                   >
                      <span className="truncate text-sm font-medium">{chat.title}</span>
                      <X onClick={(e) => { e.stopPropagation(); setTargetId(chat.id); setModalType('delete_chat'); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all text-gray-500 hover:text-red-400 w-5 h-5" />
                   </button>
                ))}
              </div>
            </section>

            <section>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className="w-3 h-3" />
                  Knowledge
                </div>
                <button onClick={fetchFiles} className="hover:text-emerald-400 transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              
              <div className="space-y-1">
                {indexedFiles.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] text-gray-600 font-medium italic">No indexed neural sources</div>
                ) : (
                  indexedFiles.map(file => (
                    <div key={file} className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 transition-all border border-transparent hover:border-white/5">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-emerald-400/50 shrink-0" />
                        <span className="truncate text-xs font-medium">{file}</span>
                      </div>
                      <button onClick={(e) => handleRemoveFile(file, e)} disabled={isDeleting === file} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all">
                        {isDeleting === file ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </nav>

          <div className="mt-auto pt-4 border-t border-white/5 shrink-0 flex flex-col gap-1">
             <button onClick={() => setModalType('wipe')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group">
               <Trash className="w-4 h-4" />
               Purge Index
             </button>
             <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all group">
               <Archive className="w-4 h-4" />
               Archives
             </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">
        {!isSidebarOpen && (
          <div className="absolute top-4 left-4 z-50">
             <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-[#171717] hover:bg-[#2f2f2f] border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all shadow-xl">
                <PanelLeftOpen className="w-5 h-5" />
             </button>
          </div>
        )}
        <Home messages={activeChat.messages} addMessage={addMessageToActiveChat} isSidebarOpen={isSidebarOpen} />
      </main>
    </div>
  );
}

export default App;
