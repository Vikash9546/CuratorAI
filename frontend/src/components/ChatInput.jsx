import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

/**
 * ChatInput - A professional, ChatGPT-style pill-shaped input component.
 * Features: Auto-resizing textarea, Enter-to-send, loading states, and clean dark UI.
 */
const ChatInput = ({ onSend, loading }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !loading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-0">
      <div className="relative flex items-end w-full bg-[#2f2f2f] rounded-[28px] border border-white/5 shadow-2xl transition-all focus-within:border-white/10 p-2 pl-5 pr-2 min-h-[52px] group">
        
        {/* Auto-resizing Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message AI..."
          disabled={loading}
          className="flex-1 bg-transparent border-none focus:ring-0 text-white text-[16px] py-3 pr-2 resize-none font-normal placeholder:text-gray-500 custom-scrollbar leading-relaxed"
          style={{ maxHeight: '200px' }}
        />

        {/* Action Button */}
        <div className="flex items-center justify-center pb-1 pr-1">
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
              !message.trim() || loading 
                ? 'bg-[#404040] text-gray-600 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-gray-200 scale-100 active:scale-90 shadow-lg'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5 stroke-[3px]" />
            )}
          </button>
        </div>

      </div>
      
      {/* Subtle brand/info footer */}
      <p className="text-center mt-3 text-[11px] text-gray-500 font-medium tracking-tight">
        Curator AI can make mistakes. Consider checking important info.
      </p>
    </div>
  );
};

export default ChatInput;
