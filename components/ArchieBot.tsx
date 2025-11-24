import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToArchie } from '../services/geminiService';
import { ViewState, UserRole } from '../types';

interface ArchieBotProps {
  currentView: ViewState;
  userRole: UserRole;
  language: 'en' | 'ar';
}

const ArchieBot: React.FC<ArchieBotProps> = ({ currentView, userRole, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'bot', text: language === 'ar' ? 'مرحباً. أنا آرشي، رفيقك الذكي. كيف يمكنني مساعدتك؟' : 'Greetings. I am Archie. How can I assist you with the Architex protocol today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await sendMessageToArchie(userMsg, currentView, userRole);
    
    setMessages(prev => [...prev, { sender: 'bot', text: response }]);
    setIsLoading(false);
  };

  return (
    <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-50 flex flex-col ${language === 'ar' ? 'items-start' : 'items-end'}`}>
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-900/20 overflow-hidden flex flex-col h-[500px] transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3 border-b border-cyan-500/20 flex justify-between items-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <h3 className="text-cyan-400 font-mono font-bold text-sm">ARCHIE.AI // SYSTEM ACTIVE</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-cyan-900/40 text-cyan-50 border border-cyan-700/50' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400 font-mono animate-pulse">
                  NEURAL PROCESSING...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={language === 'ar' ? "اطرح سؤالاً..." : "Query protocol parameters..."}
              className="flex-1 bg-slate-950 border border-slate-700 rounded text-sm p-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button 
              onClick={handleSend}
              className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded w-10 flex items-center justify-center transition-colors"
            >
              <i className={`fas ${language === 'ar' ? 'fa-paper-plane fa-flip-horizontal' : 'fa-paper-plane'}`}></i>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-full shadow-lg shadow-cyan-500/30 hover:scale-110 transition-transform duration-300"
      >
        <div className="absolute inset-0 rounded-full border border-white/20"></div>
        <i className={`fas fa-robot text-2xl text-white ${isOpen ? 'rotate-0' : 'animate-bounce'}`}></i>
        
        {/* Status indicator */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></span>
      </button>
    </div>
  );
};

export default ArchieBot;