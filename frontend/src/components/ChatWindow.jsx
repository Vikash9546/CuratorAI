import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { Sparkles, Loader2 } from 'lucide-react';

const ChatWindow = ({ messages, isLoading }) => {
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div 
      ref={scrollRef} 
      className={`flex-1 overflow-y-auto px-4 scroll-smooth custom-scrollbar z-10 flex flex-col ${
        messages.length === 0 ? 'items-center justify-center pb-32' : 'pt-8 pb-32 space-y-6'
      }`}
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center animate-slide-up text-center">
          <div className="w-16 h-16 rounded-[40%] bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-8 animate-pulse shadow-2xl">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-semibold text-white tracking-tight mb-4">What are you working on?</h1>
        </div>
      ) : (
        <div className="max-w-3xl w-full mx-auto">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start pl-12 animate-in fade-in duration-300">
              <div className="flex gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-bounce"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
