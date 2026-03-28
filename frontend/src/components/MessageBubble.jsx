import React from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MessageBubble = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border border-white/10 shadow-lg ${
          isUser ? 'bg-white/10' : 'bg-emerald-600'
        }`}>
          {isUser ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5 text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`text-[15px] leading-relaxed group relative ${
            isUser ? 'bg-[#2f2f2f] px-5 py-3 rounded-[24px] text-white shadow-md' : 'text-gray-200 pt-1'
          }`}>
            <div className={`markdown prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:rounded-xl prose-sm max-w-none ${isUser ? 'font-medium' : ''}`}>
              <ReactMarkdown 
                components={{
                  p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline 
                      ? <code className="bg-white/10 px-1.5 py-0.5 rounded text-emerald-400" {...props} /> 
                      : <code className="block bg-black/40 p-4 rounded-xl text-emerald-400 my-4 border border-white/5 overflow-x-auto" {...props} />
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Copy Button (Only for AI) */}
            {!isUser && (
              <button 
                onClick={handleCopy}
                className="absolute -right-12 top-0 p-2 text-gray-500 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
                title="Copy response"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Contexts / Citations (Only for AI) */}
          {message.contexts && message.contexts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.contexts.map((ctx, idx) => (
                <div key={idx} className="group relative">
                  <span className="text-[10px] px-2 py-1 bg-white/5 border border-white/5 rounded-md text-gray-500 font-bold uppercase tracking-wider hover:text-emerald-400 hover:border-emerald-400/30 transition-all cursor-default">
                    Source {idx + 1}
                  </span>
                  <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-[#171717] border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                    <p className="text-[10px] text-gray-400 leading-relaxed italic">{ctx}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
