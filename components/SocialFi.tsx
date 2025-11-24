import React, { useState } from 'react';
import { SocialPost, User, Language } from '../types';
import { tipUser, PrivacyContract } from '../services/stellarService';
import { translateContent } from '../services/geminiService';

interface SocialFiProps {
  currentUser: User;
  language: Language;
}

const MOCK_POSTS: SocialPost[] = [
  {
    id: '1',
    authorId: 'u2',
    authorName: 'CryptoPioneer',
    content: 'Just analyzed the new Soroban liquidity pools on Architex. The yield potential is massive! 🚀 #PiNetwork #DeFi',
    timestamp: Date.now() - 3600000,
    tips: 50,
    verified: true
  },
  {
    id: '2',
    authorId: 'u3',
    authorName: 'PiDev_Official',
    content: 'Working on a new plugin for the Architex ecosystem. Stay tuned for the GitHub drop.',
    timestamp: Date.now() - 7200000,
    tips: 120,
    verified: true
  }
];

const SocialFi: React.FC<SocialFiProps> = ({ currentUser, language }) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'GDPR'>('FEED');
  const [posts, setPosts] = useState<SocialPost[]>(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  
  // Translation State
  const [translations, setTranslations] = useState<{[key: string]: string}>({});
  const [translating, setTranslating] = useState<{[key: string]: boolean}>({});

  // GDPR State
  const [burning, setBurning] = useState(false);

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    const newPost: SocialPost = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.username,
      content: newPostContent,
      timestamp: Date.now(),
      tips: 0,
      verified: currentUser.kycVerified
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  const handleTip = async (postId: string, authorName: string) => {
    // In reality, this would trigger a wallet signature
    try {
      await tipUser(currentUser.piWalletAddress, 'recipient-addr', 5);
      setPosts(posts.map(p => p.id === postId ? { ...p, tips: p.tips + 5 } : p));
      alert(`Successfully tipped 5 ARTX to ${authorName}!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTranslate = async (postId: string, content: string) => {
      setTranslating(prev => ({...prev, [postId]: true}));
      const translated = await translateContent(content, language);
      setTranslations(prev => ({...prev, [postId]: translated}));
      setTranslating(prev => ({...prev, [postId]: false}));
  };

  const handleBurnData = async () => {
      if (!window.confirm("WARNING: GDPR DATA BURN\n\nThis action is irreversible. It will cryptographically shred your profile data, posts, and history from the Architex nodes.\n\nAre you absolutely sure?")) return;
      
      setBurning(true);
      try {
          await PrivacyContract.initiateBurn(currentUser.id);
          alert("Data Burn Protocol Initiated. You will be logged out upon completion.");
          // In a real app, logout user here
      } catch (e) {
          alert("Burn Failed.");
      } finally {
          setBurning(false);
      }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 mb-4">
            <button onClick={() => setActiveTab('FEED')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'FEED' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                <i className="fas fa-stream mr-2"></i> INSPIRATION FEED
            </button>
            <button onClick={() => setActiveTab('GDPR')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'GDPR' ? 'text-red-400 border-b-2 border-red-400' : 'text-slate-500 hover:text-white'}`}>
                <i className="fas fa-user-shield mr-2"></i> DATA PRIVACY
            </button>
        </div>

      {activeTab === 'FEED' && (
        <div className="space-y-6">
            {/* Create Post */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {currentUser.username[0]}
                </div>
                <div className="flex-1">
                    <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={language === 'ar' ? "شارك أفكارك مع المجتمع..." : "Share your alpha with the ecosystem..."}
                    className="w-full bg-transparent text-white border-none focus:ring-0 placeholder-slate-500 resize-none h-20"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                    <div className="flex justify-between items-center mt-2 border-t border-slate-700 pt-2">
                    <div className="text-cyan-500 space-x-3 text-sm">
                        <i className="fas fa-image cursor-pointer hover:text-white"></i>
                        <i className="fas fa-chart-bar cursor-pointer hover:text-white"></i>
                        <i className="fas fa-globe cursor-pointer hover:text-white"></i>
                    </div>
                    <button 
                        onClick={handlePost}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-1.5 rounded-full text-sm font-bold transition"
                    >
                        Post
                    </button>
                    </div>
                </div>
                </div>
            </div>

            {/* Feed */}
            <div className="space-y-4">
                {posts.map(post => (
                <div key={post.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition">
                    <div className="flex justify-between items-start">
                    <div className="flex gap-3 w-full">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
                        {post.authorName[0]}
                        </div>
                        <div className="w-full">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white hover:underline cursor-pointer">{post.authorName}</span>
                            {post.verified && <i className="fas fa-check-circle text-cyan-400 text-xs" title="KYC Verified"></i>}
                            <span className="text-slate-500 text-sm">· {new Date(post.timestamp).toLocaleTimeString()}</span>
                        </div>
                        
                        {/* Content & Translation */}
                        <p className="text-slate-300 mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                            {translations[post.id] || post.content}
                        </p>
                        
                        {translations[post.id] && (
                            <div className="text-[10px] text-cyan-500 mt-1 flex items-center gap-1">
                                <i className="fas fa-language"></i> Translated by Archie AI
                            </div>
                        )}
                        </div>
                    </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 ml-12">
                    <button className="flex items-center gap-2 text-slate-400 hover:text-pink-500 transition text-sm">
                        <i className="far fa-heart"></i>
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition text-sm">
                        <i className="far fa-comment"></i>
                    </button>
                    
                    {/* Translate Button */}
                    {!translations[post.id] && (
                        <button 
                            onClick={() => handleTranslate(post.id, post.content)}
                            disabled={translating[post.id]}
                            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition text-sm"
                        >
                            <i className={`fas fa-language ${translating[post.id] ? 'animate-spin' : ''}`}></i>
                        </button>
                    )}
                    
                    <div className="flex-1"></div>

                    <button 
                        onClick={() => handleTip(post.id, post.authorName)}
                        className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-neon-gold hover:border-neon-gold transition text-xs font-mono"
                    >
                        <i className="fas fa-coins"></i> TIP 5 ARTX
                        <span className="border-l border-slate-700 pl-2 ml-1 text-slate-400">{post.tips}</span>
                    </button>
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'GDPR' && (
          <div className="bg-slate-800 p-8 rounded-xl border border-red-900/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                  <i className="fas fa-trash-alt text-9xl text-red-500"></i>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <i className="fas fa-user-shield text-red-500"></i> Data Privacy Console
              </h3>
              
              <p className="text-slate-300 mb-6">
                  Architex respects your right to be forgotten. This module allows you to cryptographically burn your personal data from our decentralized storage nodes.
              </p>

              <div className="bg-slate-900 p-4 rounded border border-slate-700 mb-8">
                  <h4 className="font-bold text-white mb-2 text-sm">Data Footprint</h4>
                  <ul className="text-xs text-slate-400 space-y-2 font-mono">
                      <li className="flex justify-between"><span>Posts Stored:</span> <span className="text-white">{posts.filter(p => p.authorId === currentUser.id).length}</span></li>
                      <li className="flex justify-between"><span>Identity Hash:</span> <span className="text-white">{currentUser.id.substring(0, 16)}...</span></li>
                      <li className="flex justify-between"><span>Wallet Link:</span> <span className="text-white">{currentUser.piWalletAddress}</span></li>
                  </ul>
              </div>

              <div className="border-t border-slate-700 pt-6">
                  <button 
                    onClick={handleBurnData}
                    disabled={burning}
                    className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-700 font-bold py-3 px-6 rounded-lg w-full transition flex items-center justify-center gap-2"
                  >
                      {burning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-fire"></i>}
                      {burning ? 'EXECUTING DATA BURN...' : 'INITIATE DATA BURN (GDPR)'}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-2">
                      * This action cannot be undone. All social data will be permanently erased. Financial ledger entries remain for audit trails.
                  </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default SocialFi;