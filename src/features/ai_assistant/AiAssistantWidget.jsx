import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  FileText, 
  ShoppingCart, 
  Package, 
  ShieldCheck, 
  Maximize2, 
  Minimize2,
  ChevronRight,
  Plus,
  FolderPlus,
  Folder,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  PanelLeft,
  Check
} from 'lucide-react';
import MonthlyReportModal from './MonthlyReportModal';
import { useTheme } from '../../core/theme/ThemeContext';
import { aiAPI } from '../../services/apiService';


export default function AiAssistantWidget({ setActiveTab, onOpenAddProduct }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assistantError, setAssistantError] = useState(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState('');

  const quickPrompts = [
    "Show today's sales",
    'Find low stock products',
    'Summarize branch performance',
    "Who are today's active employees?",
    'Generate business report',
  ];

  const { darkMode, setThemeMode } = useTheme();
  const chatEndRef = useRef(null);

  // ─── Projects & Chat Storage ──────────────────────────────────────────────
  const [projects, setProjects] = useState([
    { id: 'proj_default', name: 'General Operations', color: 'indigo' }
  ]);

  const [activeProjectId, setActiveProjectId] = useState('proj_default');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [chats, setChats] = useState([]);

  const [activeChatId, setActiveChatId] = useState(() => {
    return chats[0]?.id || null;
  });

  useEffect(() => {
    let mounted = true;
    aiAPI.listConversations()
      .then((res) => {
        if (!mounted) return;
        const mapped = (res.conversations || []).map(mapConversation);
        setChats(mapped);
        setActiveChatId(mapped[0]?.id || null);
      })
      .catch((err) => setAssistantError(err.message || 'Failed to load AI conversations.'));
    return () => { mounted = false; };
  }, []);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeMessages = activeChat ? activeChat.messages : [];

  function mapConversation(conversation) {
    return {
      id: conversation._id,
      projectId: 'proj_default',
      title: conversation.title || 'New Conversation',
      timestamp: conversation.updatedAt || conversation.createdAt,
      pinned: !!conversation.pinned,
      messages: (conversation.messages || []).map((message) => ({
        id: message._id,
        sender: message.role === 'assistant' ? 'ai' : 'user',
        text: message.content,
        timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })),
    };
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, loading]);

  // ─── Actions & Commands ──────────────────────────────────────────────────
  const triggerAction = (actionType) => {
    switch (actionType) {
      case 'TRIGGER_REPORT':
        setIsReportOpen(true);
        addAiMessage("Opening the Executive Monthly Intelligence Report for you right now!");
        break;
      case 'NAV_SALES':
        if (setActiveTab) setActiveTab('sales');
        addAiMessage("Navigated to POS & Sales Terminal.");
        break;
      case 'NAV_PRODUCTS':
        if (setActiveTab) setActiveTab('products');
        addAiMessage("Navigated to Products & Inventory Catalog.");
        break;
      case 'NAV_AUDIT':
        if (setActiveTab) setActiveTab('audit');
        addAiMessage("Navigated to Security & Audit Monitor.");
        break;
      case 'NAV_SETTINGS':
        if (setActiveTab) setActiveTab('settings');
        addAiMessage("Navigated to Enterprise Settings.");
        break;
      case 'OPEN_ADD_PRODUCT':
        if (onOpenAddProduct) onOpenAddProduct();
        addAiMessage("Opened New Product Entry Modal.");
        break;
      default:
        break;
    }
  };

  const addAiMessage = (text, actionChips = []) => {
    const newMsg = {
      id: `m_${Date.now()}_${Math.random()}`,
      sender: 'ai',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionChips
    };

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return { ...c, messages: [...c.messages, newMsg] };
      }
      return c;
    }));
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setAssistantError(null);

    let conversationId = activeChatId;
    if (!conversationId) {
      try {
        const created = await aiAPI.createConversation('New Conversation');
        const mapped = mapConversation(created.conversation);
        conversationId = mapped.id;
        setChats(prev => [mapped, ...prev]);
        setActiveChatId(conversationId);
      } catch (err) {
        setAssistantError(err.message || 'Failed to create conversation.');
        return;
      }
    }

    // Append User Message to Active Chat
    const userMsg = {
      id: `m_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => prev.map(c => {
      if (c.id === conversationId) {
        // Update title if it's the default title
        const newTitle = c.messages.length <= 1 ? userText.slice(0, 30) + '...' : c.title;
        return { ...c, title: newTitle, messages: [...c.messages, userMsg] };
      }
      return c;
    }));

    setLoading(true);

    try {
      const res = await aiAPI.sendMessage(conversationId, userText);
      const mapped = mapConversation(res.conversation);
      setChats(prev => prev.map(c => c.id === mapped.id ? mapped : c));
    } catch (error) {
      setLastFailedPrompt(userText);
      setAssistantError(error.message || 'AI request failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Chat & Project Management Handlers ──────────────────────────────────
  const startNewChat = async () => {
    try {
      const res = await aiAPI.createConversation('New Conversation');
      const newChat = mapConversation(res.conversation);
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setShowSidebar(false);
    } catch (err) {
      setAssistantError(err.message || 'Failed to create conversation.');
    }
  };

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const newProj = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      color: 'indigo'
    };
    setProjects(prev => [...prev, newProj]);
    setNewProjectName('');
    setIsCreatingProject(false);
    setActiveProjectId(newProj.id);
  };

  const deleteProject = (projId, e) => {
    e.stopPropagation();
    if (projects.length <= 1) return;
    setProjects(prev => prev.filter(p => p.id !== projId));
    setChats(prev => prev.filter(c => c.projectId !== projId));
    if (activeProjectId === projId) {
      const nextProj = projects.find(p => p.id !== projId);
      if (nextProj) setActiveProjectId(nextProj.id);
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (chats.length <= 1) return;
    try {
      await aiAPI.deleteConversation(chatId);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        const nextChat = chats.find(c => c.id !== chatId);
        if (nextChat) setActiveChatId(nextChat.id);
      }
    } catch (err) {
      setAssistantError(err.message || 'Failed to delete conversation.');
    }
  };

  const filteredChats = chats.filter(c => {
    const matchesProj = c.projectId === activeProjectId;
    const matchesSearch = searchQuery
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesProj && matchesSearch;
  });

  return (
    <>
      {/* Monthly Report Modal */}
      <MonthlyReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
      />

      {/* Floating Widget Root */}
      <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
        
        {/* Chat Drawer Window */}
        {isOpen && (
          <div 
            className={`glass-panel rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl flex flex-col transition-all duration-300 overflow-hidden mb-4 animate-scale-up ${
              isExpanded 
                ? 'w-[92vw] max-w-4xl h-[82vh]' 
                : 'w-[calc(100vw-1.5rem)] sm:w-[420px] h-[min(580px,calc(100dvh-6rem))] sm:h-[580px]'
            }`}
          >
            {/* Top Header Bar */}
            <div className="p-3.5 px-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
                  title="Toggle Assistant Workspace Sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl capsule-mesh-gradient flex items-center justify-center text-white shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{activeChat?.title || 'AI Assistant'}</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Project: {projects.find(p => p.id === activeProjectId)?.name || 'General'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button 
                  onClick={() => startNewChat()}
                  className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-all text-indigo-600 dark:text-indigo-400"
                  title="New Chat"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-all hidden sm:block"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 hover:text-rose-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Area (Sidebar + Messages) */}
            <div className="flex-1 flex min-h-0 relative">
              
              {/* AI Workspace Sidebar (Projects & Conversation History) */}
              {showSidebar && (
                <div className="absolute inset-y-0 left-0 w-[min(16rem,82vw)] border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 flex flex-col p-3 z-20 space-y-3 animate-fade-in text-xs shadow-xl sm:static sm:w-64 sm:shadow-none">
                  
                  {/* New Chat Button */}
                  <button
                    onClick={() => startNewChat()}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all btn-micro text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Chat</span>
                  </button>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Projects Header & List */}
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scroll pr-1">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                        <span>Projects</span>
                        <button 
                          onClick={() => setIsCreatingProject(true)}
                          className="hover:text-indigo-500"
                          title="Create Project"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Add Project inline form */}
                      {isCreatingProject && (
                        <div className="mb-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/30 flex items-center gap-1">
                          <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project name..."
                            className="flex-1 bg-transparent text-[11px] text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button onClick={createProject} className="text-emerald-500 hover:text-emerald-400 p-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setIsCreatingProject(false)} className="text-slate-400 p-0.5">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="space-y-1">
                        {projects.map((proj) => (
                          <div
                            key={proj.id}
                            onClick={() => setActiveProjectId(proj.id)}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                              activeProjectId === proj.id
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">{proj.name}</span>
                            </div>

                            {projects.length > 1 && (
                              <button
                                onClick={(e) => deleteProject(proj.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conversations List inside active Project */}
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                        Conversations ({filteredChats.length})
                      </div>

                      <div className="space-y-1">
                        {filteredChats.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => { setActiveChatId(c.id); setShowSidebar(false); }}
                            className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all text-[11px] ${
                              activeChatId === c.id
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-slate-200/70 dark:border-slate-800'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/60 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                              <span className="truncate">{c.title}</span>
                            </div>

                            {chats.length > 1 && (
                              <button
                                onClick={(e) => deleteChat(c.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Chat Messages Body */}
              <div className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-slate-900/40">
                
                {/* Scrollable Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                  {!activeMessages.length && !loading && (
                    <div className="py-8 text-center animate-fade-in-up">
                      <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-500" />
                      <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Your business copilot is ready</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Ask about your permitted workspace facts.</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => setInput(prompt)} className="px-3 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10 transition-all">{prompt}</button>)}
                      </div>
                    </div>
                  )}
                  {activeMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}
                    >
                      <div className="flex items-start gap-2.5 max-w-[85%]">
                        {msg.sender === 'ai' && (
                          <div className="w-7 h-7 rounded-xl capsule-mesh-gradient flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        
                        <div 
                          className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-br-none font-semibold'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/60'
                          }`}
                        >
                          {msg.text}

                          {/* Action Chips */}
                          {msg.actionChips && msg.actionChips.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                              {msg.actionChips.map((chip, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => triggerAction(chip.action)}
                                  className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold transition-all flex items-center gap-1 btn-micro"
                                >
                                  <span>{chip.label}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-[9px] text-slate-400 mt-1 px-1 font-semibold">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {/* Animated Typing Indicator */}
                  {loading && (
                    <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold animate-pulse">
                      <div className="w-7 h-7 rounded-xl capsule-mesh-gradient flex items-center justify-center text-white shrink-0">
                        <Sparkles className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                        <span>AI Assistant is typing</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping delay-100" />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping delay-200" />
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Bottom Input Form */}
                <form onSubmit={handleSend} className="relative p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex items-center gap-2">
                  {assistantError && (
                    <div className="absolute left-4 right-4 bottom-[68px] rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] font-bold text-rose-500">
                      <div className="flex items-center justify-between gap-3"><span>{assistantError.includes('temporarily unavailable') ? 'Assistant temporarily unavailable.' : assistantError}</span>{lastFailedPrompt && <button type="button" onClick={() => { setInput(lastFailedPrompt); setAssistantError(null); }} className="shrink-0 underline hover:no-underline">Retry</button>}</div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI Assistant anything..."
                    className="flex-1 px-4 py-2.5 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 btn-micro"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>

            </div>

          </div>
        )}

        {/* Floating AI Orb Launcher Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center justify-center focus:outline-none"
          title="Open AI Assistant Workspace"
        >
          {/* Animated Outer Glow Ring */}
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />

          {/* Launcher Circle */}
          <div className="relative w-14 h-14 rounded-2xl capsule-mesh-gradient flex items-center justify-center text-white shadow-2xl border border-white/30 transform group-hover:scale-105 transition-all duration-300">
            <Sparkles className="w-7 h-7 drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-spin-slow" />
          </div>
        </button>

      </div>
    </>
  );
}
