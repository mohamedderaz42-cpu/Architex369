import React, { useState, useEffect } from 'react';
import { User, Dispute, DisputeStatus, SoulboundBadge, UserRole } from '../types';
import { ArbitrationContract, UtilityContracts, SecurityContract } from '../services/stellarService';

interface ArbitrationCouncilProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onUpdateBalance: (newBalance: number) => void;
}

const ArbitrationCouncil: React.FC<ArbitrationCouncilProps> = ({ user, onUpdateUser, onUpdateBalance }) => {
  const [activeTab, setActiveTab] = useState<'REPUTATION' | 'DISPUTES' | 'ARBITER'>('REPUTATION');
  const [loading, setLoading] = useState(false);
  const [badges, setBadges] = useState<SoulboundBadge[]>(user.badges || []);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reputation, setReputation] = useState(user.reputationScore || 750); // Mock Start Score

  useEffect(() => {
    // Initial Load
    const loadData = async () => {
        if (badges.length === 0) {
            // Give a starter badge
            const badge = await UtilityContracts.mintBadge(user.id, 'OG');
            setBadges([badge]);
            onUpdateUser({ badges: [badge], reputationScore: 750 });
        }
        
        // Mock Disputes
        if (activeTab === 'DISPUTES' || activeTab === 'ARBITER') {
            const mockDispute: Dispute = {
                id: 'disp-001',
                relatedOrderId: 'ord-1234',
                plaintiffId: 'u5',
                defendantId: 'vendor-tech-store',
                reason: 'Item received damaged and seller refused refund.',
                evidenceHash: 'ipfs://...',
                status: DisputeStatus.VOTING,
                assignedArbiters: [],
                votesForPlaintiff: 1,
                votesForDefendant: 0,
                createdAt: Date.now() - 86400000
            };
            setDisputes([mockDispute]);
        }
    };
    loadData();
  }, [activeTab]);

  const handleApplyArbiter = async () => {
      setLoading(true);
      const isEligible = await SecurityContract.verifyArbiter(user.id, reputation);
      if (isEligible) {
          const badge = await UtilityContracts.mintBadge(user.id, 'ARBITER');
          setBadges(prev => [...prev, badge]);
          onUpdateUser({ role: UserRole.ARBITER, badges: [...badges, badge] });
          alert("Congratulations! You are now a Certified Arbiter.");
      } else {
          alert("Reputation too low. Need 800+ Score.");
      }
      setLoading(false);
  };

  const handleVote = async (disputeId: string, votePlaintiff: boolean) => {
      setLoading(true);
      const tx = await ArbitrationContract.voteOnDispute(disputeId, user.id, votePlaintiff);
      
      setDisputes(prev => prev.map(d => 
          d.id === disputeId ? {
              ...d, 
              votesForPlaintiff: votePlaintiff ? d.votesForPlaintiff + 1 : d.votesForPlaintiff,
              votesForDefendant: !votePlaintiff ? d.votesForDefendant + 1 : d.votesForDefendant
          } : d
      ));

      onUpdateBalance(user.artxBalance + tx.amount);
      alert(`Vote Cast! Received ${tx.amount} ARTX reward.`);
      setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
         {/* Reputation Header */}
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-4">
                 <div className="relative">
                     <svg className="w-24 h-24 transform -rotate-90">
                         <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                         <circle cx="48" cy="48" r="40" stroke={reputation > 800 ? '#10b981' : '#f59e0b'} strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - reputation / 1000)} className="transition-all duration-1000" />
                     </svg>
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                         <div className="text-2xl font-bold text-white">{reputation}</div>
                         <div className="text-[10px] text-slate-500 uppercase">Trust Score</div>
                     </div>
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-white">Identity & Reputation</h2>
                     <p className="text-sm text-slate-400">Soulbound Tokens (SBT) verify your history.</p>
                 </div>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => setActiveTab('REPUTATION')} className={`px-4 py-2 rounded font-bold text-xs transition ${activeTab === 'REPUTATION' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}>My Badges</button>
                 <button onClick={() => setActiveTab('ARBITER')} className={`px-4 py-2 rounded font-bold text-xs transition ${activeTab === 'ARBITER' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}>Arbitration</button>
             </div>
         </div>

         {activeTab === 'REPUTATION' && (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {badges.map(badge => (
                     <div key={badge.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col items-center text-center group hover:border-neon-gold transition relative overflow-hidden">
                         <div className="absolute inset-0 bg-neon-gold/5 opacity-0 group-hover:opacity-100 transition"></div>
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${badge.rarity === 'EPIC' ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                             <i className={`fas ${badge.icon} text-2xl`}></i>
                         </div>
                         <h3 className="font-bold text-white text-sm">{badge.name}</h3>
                         <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                         <span className="mt-2 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-600 uppercase">{badge.rarity}</span>
                     </div>
                 ))}
                 {/* Empty Slots */}
                 {[1,2,3].map(i => (
                     <div key={i} className="bg-slate-900/50 border border-dashed border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center opacity-50">
                         <div className="w-12 h-12 rounded-full bg-slate-800 mb-2"></div>
                         <div className="w-20 h-4 bg-slate-800 rounded"></div>
                     </div>
                 ))}
             </div>
         )}

         {activeTab === 'ARBITER' && (
             <div className="space-y-6">
                 {!badges.find(b => b.name === 'Justice Gavel') ? (
                     <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-8 rounded-xl border border-purple-500/30 text-center">
                         <i className="fas fa-balance-scale text-5xl text-purple-400 mb-4"></i>
                         <h2 className="text-2xl font-bold text-white mb-2">Join the High Council</h2>
                         <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                             Arbiters earn 5 ARTX for every dispute resolved. You need a Reputation Score of 800+ to apply.
                         </p>
                         <button 
                             onClick={handleApplyArbiter}
                             disabled={loading}
                             className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-purple-900/20 transition"
                         >
                             {loading ? 'Verifying...' : 'Apply for Arbitration Seat'}
                         </button>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-white">Active Disputes</h3>
                             <span className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded">Status: Active Arbiter</span>
                         </div>
                         
                         {disputes.map(dispute => (
                             <div key={dispute.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                 <div className="flex justify-between items-start mb-4">
                                     <div>
                                         <div className="text-xs text-slate-500 uppercase font-bold mb-1">Case ID: {dispute.id}</div>
                                         <h4 className="text-white font-bold">{dispute.reason}</h4>
                                     </div>
                                     <span className="bg-yellow-900/30 text-yellow-400 border border-yellow-600/30 px-3 py-1 rounded text-xs font-bold animate-pulse">
                                         VOTING OPEN
                                     </span>
                                 </div>
                                 
                                 <div className="bg-slate-900 p-4 rounded mb-4 text-sm text-slate-300 font-mono">
                                     EVIDENCE HASH: {dispute.evidenceHash.substring(0, 20)}... <br/>
                                     PLAINTIFF: {dispute.plaintiffId} vs DEFENDANT: {dispute.defendantId}
                                 </div>

                                 <div className="flex gap-4">
                                     <button 
                                         onClick={() => handleVote(dispute.id, true)}
                                         disabled={loading}
                                         className="flex-1 bg-green-900/30 border border-green-600/50 text-green-400 py-3 rounded hover:bg-green-900/50 transition font-bold text-sm"
                                     >
                                         Vote Plaintiff (Refund)
                                     </button>
                                     <button 
                                         onClick={() => handleVote(dispute.id, false)}
                                         disabled={loading}
                                         className="flex-1 bg-red-900/30 border border-red-600/50 text-red-400 py-3 rounded hover:bg-red-900/50 transition font-bold text-sm"
                                     >
                                         Vote Defendant (Release)
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
         )}
    </div>
  );
};

export default ArbitrationCouncil;
