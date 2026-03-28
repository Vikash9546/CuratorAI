import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  Bot, 
  Loader2, 
  Plus, 
  Mic, 
  Activity,
  ChevronDown,
  UserPlus,
  MicOff
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { predict, uploadFiles } from '../services/api';

const Chat = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput((prev) => prev + (prev ? ' ' : '') + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsLoading(true);
        try {
            await uploadFiles(files);
            setMessages((prev) => [...prev, { 
                role: 'assistant', 
                content: `Successfully uploaded ${files.length} file(s) to the knowledge base. I can now reference them in our conversation.` 
            }]);
        } catch (err) {
            setError('Failed to upload files through the chat interface.');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const data = await predict(input, messages);
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: data.response,
                contexts: data.contexts || []
            }]);
        } catch (err) {
            setError('The neural engine encountered an error. Please check your connection.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#212121] text-white relative overflow-hidden font-sans selection:bg-[#4eeab8]/30">
            {/* Minimal Header */}
            <header className="px-5 py-4 flex items-center justify-between z-20">
               <div className="flex items-center gap-1 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all group">
                  <span className="text-lg font-semibold text-gray-200">Curator AI</span>
                  <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="p-2 hover:bg-white/5 rounded-full transition-all cursor-pointer">
                     <UserPlus className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 border border-white/10 flex items-center justify-center p-0.5 cursor-pointer shadow-lg overflow-hidden translate-y-[-1px]">
                     <img src="https://ui-avatars.com/api/?name=User&background=4eeab8&color=000" alt="Avatar" className="rounded-full" />
                  </div>
               </div>
            </header>

            {/* Messages Area / Center Content */}
            <div 
                ref={scrollRef} 
                className={`flex-1 overflow-y-auto px-4 scroll-smooth custom-scrollbar z-10 flex flex-col ${messages.length === 0 ? 'items-center justify-center pb-32' : 'pt-8 pb-32 space-y-8'}`}
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center animate-slide-up">
                        <h1 className="text-4xl font-semibold text-white mb-12 tracking-tight">What are you working on?</h1>
                    </div>
                ) : (
                    <div className="max-w-3xl w-full mx-auto space-y-8">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${
                                        msg.role === 'user' 
                                            ? 'bg-white/10' 
                                            : 'bg-emerald-600'
                                    }`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4 text-gray-300" /> : <Bot className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`text-[15px] leading-relaxed ${
                                            msg.role === 'user' 
                                                ? 'bg-[#2f2f2f] px-5 py-3 rounded-[24px] text-white' 
                                                : 'text-gray-200'
                                        }`}>
                                            <div className="markdown prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#1a1c21] prose-pre:rounded-xl prose-sm max-w-none">
                                                <ReactMarkdown 
                                                    components={{
                                                        p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                                                        code: ({node, inline, ...props}) => 
                                                            inline 
                                                                ? <code className="bg-white/10 px-1 rounded text-emerald-400" {...props} /> 
                                                                : <code className="block bg-[#1a1c21] p-4 rounded-xl text-emerald-400 my-4" {...props} />
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {isLoading && (
                    <div className="max-w-3xl w-full mx-auto flex justify-start pl-12 animate-in fade-in duration-300">
                        <div className="flex gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce"></div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mx-auto max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                        <p className="text-sm text-red-400 font-normal">{error}</p>
                    </div>
                )}
            </div>

            {/* Centered Floating Input Bar - EXACT CHATGPT STYLE */}
            <div className="absolute bottom-0 left-0 w-full px-4 pb-8 pt-10 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent z-20">
                <form 
                    onSubmit={handleSendMessage}
                    className="max-w-3xl mx-auto relative group"
                >
                    <div className="flex items-center p-2 bg-[#2f2f2f] rounded-full border border-white/5 focus-within:border-white/10 transition-all shadow-2xl min-h-[64px]">
                        {/* Plus Button - File Upload */}
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 ml-1 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all flex items-center justify-center"
                        >
                            <Plus className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <input 
                            type="file" 
                            multiple 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload} 
                        />

                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                               if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage(e);
                               }
                            }}
                            placeholder="Ask anything"
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white text-[16px] px-4 py-2 resize-none font-normal placeholder:text-gray-500 custom-scrollbar h-auto"
                        />

                        {/* Mic & Soundwave Pill */}
                        <div className="flex items-center gap-2 pr-2">
                            <button 
                                type="button" 
                                onClick={toggleListening}
                                className={`p-3 rounded-full transition-all flex items-center justify-center ${
                                    isListening ? 'bg-red-500/10 text-red-500 animate-pulse' : 'hover:bg-white/5 text-gray-400 hover:text-white'
                                }`}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" strokeWidth={2.5} />}
                            </button>
                            
                            <button 
                                type="submit" 
                                disabled={!input.trim() || isLoading}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                    !input.trim() || isLoading 
                                        ? 'bg-[#3c3c3c] text-gray-600' 
                                        : 'bg-white text-black hover:bg-gray-100 shadow-lg scale-100 hover:scale-105 active:scale-95'
                                }`}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" strokeWidth={3} />}
                            </button>
                        </div>
                    </div>
                    
                    <p className="text-center mt-3 text-[11px] text-gray-500 font-medium">
                       Curator AI can make mistakes. Check important info.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Chat;
