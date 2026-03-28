import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, MicOff, Activity, Loader2 } from 'lucide-react';

const InputBox = ({ onSend, onFileUpload, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((p) => p + (p ? ' ' : '') + transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full relative">
      <div className="flex items-center gap-1 p-2 bg-[#2f2f2f] rounded-[32px] border border-white/5 transition-all shadow-xl min-h-[60px] focus-within:border-white/10 group">
        
        {/* File Upload */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 ml-1 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all outline-none"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => onFileUpload(e.target.files)} 
        />

        {/* Text Input */}
        <textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none focus:ring-0 text-white text-[16px] px-3 py-2.5 resize-none font-normal placeholder:text-gray-500 custom-scrollbar h-auto max-h-48 scroll-smooth"
        />

        {/* Controls */}
        <div className="flex items-center gap-1.5 pr-2">
          {/* Mic */}
          <button 
            onClick={toggleListening}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center outline-none ${
              isListening ? 'bg-red-500/10 text-red-500 animate-pulse' : 'hover:bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" strokeWidth={2.5} />}
          </button>
          
          {/* Send */}
          <button 
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all outline-none ${
              !input.trim() || isLoading 
                ? 'bg-[#3c3c3c] text-gray-600' 
                : 'bg-white text-black hover:bg-gray-100 shadow-lg group-active:scale-95'
            }`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" strokeWidth={3} />}
          </button>
        </div>
      </div>
      <p className="text-center mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose">
        Curator AI can make mistakes. Check important information.
      </p>
    </div>
  );
};

export default InputBox;
