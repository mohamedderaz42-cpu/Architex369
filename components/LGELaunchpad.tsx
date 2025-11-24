
import React, { useState, useEffect } from 'react';
import { User, LGEStats } from '../types';
import { LGEManagerContract } from '../services/stellarService';

interface LGELaunchpadProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const LGELaunchpad: React.FC<LGELaunchpadProps> = ({ user, onUpdateBalance, onUpdateUser }) => {
  const [stats, setStats] = useState<LGEStats | null>(null);
  const [contribution, setContribution] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      const data = await LGEManagerContract.getStats();
      setStats(data);
      
      // Countdown Logic
      const interval = setInterval(() => {
          const now = Date.now();
          const diff = data.endTime - now;
          if (diff <= 0) {
              setTimeLeft('LGE COMPLETED');
              clearInterval(interval);
          } else {
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              setTimeLeft(`${days}d ${hours}h ${mins}m`);
          }
      }, 60000);
      return () => clearInterval(interval);
    };
    loadStats();
  }, []);

  const handleContribute = async () => {
      if (!contribution || isNaN(Number(contribution))) return;
      setLoading(true);
      try {
          // Execute Contribution
          const { tx, artxAmount } = await LGEManagerContract.contribute(user.id, Number(contribution));
          
          // Update User State (Balance doesn't increase because it's staked, but we might track staked amount)
          // In this mock, we assume StakingRewardsContract handles the staked balance updating on the backend
          // But for UI feedback, we can show the "Staked" balance increasing in DeFi Hub later.
          
          onUpdateUser({ hasBetaAccess: true }); // Unlock Beta
          
          alert(`Contribution Successful!\n\nSwapped: ${contribution} Pi\nReceived: ${artxAmount.toLocaleString()} ARTX\nStatus: AUTO-STAKED (Mandatory Vesting)\n\nWelcome to the Closed Beta.`);
          
          setContribution('');
          // Refresh stats
          const newStats = await LGEManagerContract.getStats();
          setStats(newStats);

      } catch (e) {
          alert("Contribution Failed.");
      } finally {
          setLoading(false);
      }
  };

  if (!stats) return <div className="p-10 text-center text-neon-gold animate-pulse">INITIALIZING LGE PROTOCOL...</div>;

  const progressPercent = (stats.raisedPi / stats.hardCapPi) * 100;

  return (
    <div className="space-y-8 animate-fadeIn">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-8 rounded-xl border border-neon-gold/50 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-gold shadow-[0_0_15px_#f59e0b]"></div>
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-neon-gold/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-4xl font-bold text-white mb-2 tracking-widest">HYBRID LIQUIDITY EVENT</h2>
            <p className="text-neon-gold font-mono text-sm mb-6">ESTABLISHING SMART PEG @ $1.00 USD</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
                <div className="bg-black/40 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="text-xs text-slate-400 uppercase">Time Remaining</div>
                    <div className="text-xl font-mono text-white">{timeLeft}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="text-xs text-slate-400 uppercase">Current Peg</div>
                    <div className="text-xl font-mono text-green-400">${stats.currentPeg.toFixed(2)}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="text-xs text-slate-400 uppercase">Participants</div>
                    <div className="text-xl font-mono text-white">{stats.participants.toLocaleString()}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="text-xs text-slate-400 uppercase">Hard Cap</div>
                    <div className="text-xl font-mono text-white">{(stats.hardCapPi / 1000).toFixed(0)}k Pi</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="max-w-3xl mx-auto relative">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Raised: {stats.raisedPi.toLocaleString()} Pi</span>
                    <span>{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-6 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-neon-gold to-yellow-600 transition-all duration-1000 relative"
                        style={{ width: `${progressPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contribution Panel */}
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <i className="fas fa-parachute-box text-cyan-400"></i> Contribute Liquidity
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Amount (Pi)</label>
                        <div className="relative mt-2">
                            <input 
                                type="number"
                                value={contribution}
                                onChange={(e) => setContribution(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-900 border border-slate-600 rounded p-4 text-white font-mono text-lg focus:border-neon-gold outline-none"
                            />
                            <span className="absolute right-4 top-4 text-slate-500 font-bold">Pi</span>
                        </div>
                        <div className="text-right text-xs text-slate-500 mt-1">
                            Est. ARTX: <span className="text-cyan-400 font-mono">{(Number(contribution) * 50).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg flex items-start gap-3">
                        <i className="fas fa-lock text-yellow-500 mt-1"></i>
                        <div>
                            <h4 className="text-yellow-500 font-bold text-sm">Mandatory Staking Active</h4>
                            <p className="text-xs text-yellow-200/70">
                                To protect the peg, all LGE tokens are automatically staked in the Rewards Vault for a minimum of 30 days. You will earn 12.5% APY immediately.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={handleContribute}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-neon-gold to-orange-600 hover:brightness-110 text-black font-bold py-4 rounded-lg shadow-lg shadow-orange-900/20 transition text-lg"
                    >
                        {loading ? 'PROCESSING...' : 'SWAP & STAKE'}
                    </button>
                </div>
            </div>

            {/* Rewards & Beta Pass */}
            <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${user.hasBetaAccess ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-900 text-slate-600 border border-slate-700'}`}>
                        <i className="fas fa-key"></i>
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Closed Beta Access</h3>
                        <p className="text-xs text-slate-400">
                            {user.hasBetaAccess 
                                ? "ACCESS GRANTED. You are a founding member." 
                                : "LOCKED. Contribute to LGE to unlock protocol features."}
                        </p>
                    </div>
                    {user.hasBetaAccess && <i className="fas fa-check-circle text-green-500 text-xl ml-auto"></i>}
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-white font-bold mb-4">LGE Allocation Breakdown</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between pb-2 border-b border-slate-700">
                            <span className="text-slate-400">Price per ARTX</span>
                            <span className="text-white font-mono">$1.00 (Pegged)</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-700">
                            <span className="text-slate-400">Vesting Period</span>
                            <span className="text-white font-mono">30 Days Linear</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-700">
                            <span className="text-slate-400">Bonus APY</span>
                            <span className="text-neon-gold font-mono font-bold">+2.5% Founder Boost</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Min Contribution</span>
                            <span className="text-white font-mono">1 Pi</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LGELaunchpad;
