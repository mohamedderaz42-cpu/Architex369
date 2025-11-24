import React, { useState } from 'react';
import { SocialPost, User } from '../types';
import { tipUser } from '../services/stellarService';

interface SocialFiProps {
  currentUser: User;
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

const SocialFi: React.FC<SocialFiProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<SocialPost[]>(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState('');

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
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
              placeholder="Share your alpha..."
              className="w-full bg-transparent text-white border-none focus:ring-0 placeholder-slate-500 resize-none h-20"
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
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                  {post.authorName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white hover:underline cursor-pointer">{post.authorName}</span>
                    {post.verified && <i className="fas fa-check-circle text-cyan-400 text-xs" title="KYC Verified"></i>}
                    <span className="text-slate-500 text-sm">· {new Date(post.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-sm leading-relaxed">{post.content}</p>
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
              <button className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition text-sm">
                <i className="fas fa-retweet"></i>
              </button>
              
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
  );
};

export default SocialFi;