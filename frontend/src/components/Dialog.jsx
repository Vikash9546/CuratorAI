import React from 'react';
import { X } from 'lucide-react';

const Dialog = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#1e1e1e] border border-white/10 rounded-[32px] shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
