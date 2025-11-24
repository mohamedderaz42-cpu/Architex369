import React, { useState, useEffect } from 'react';
import { User, OracleData, LiquidityPool, Transaction } from '../types';
import { OraclePriceFeed, NativeSwapAMM, StakingRewardsContract, ArtxTokenContract } from '../services/stellarService';

interface DeFiHubProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
  onUpdateStaked: (newStaked: number) => void;
}

const DeFiHub: React.FC<DeFiHubProps> = ({ user, onUpdateBalance, onUpdateStaked }) => {
  const [activeTab, setActiveTab] = useState<'SWAP' | 'STAKE'>('SWAP');
  const [oracleData, setOracleData] = useState<OracleData | null>(null);
  const [poolData, setPoolData] = useState<LiquidityPool | null>(null);
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const oracle = await OraclePriceFeed.getRate('ARTX/Pi');
      setOracleData(oracle);
      const pool = await NativeSwapAMM.getPoolStats();
      setPoolData(pool);
      const userRewards = await StakingRewardsContract.getRewards(user.id);
      setRewards(userRewards);
    };
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [user.id]);

  const handleSwap = async () => {
    if (!swapAmount || isNaN(Number(swapAmount))) return;
    setLoading(true);
    try {
      // 3.1 & 3.2: Swap includes fee routing via service
      const { tx, fee } = await NativeSwapAMM.swap('Pi', Number(swapAmount));
      
      // Simulate Pi -> ARTX swap (simplified)
      const inputAmount = Number(swapAmount);
      const received = (inputAmount - fee) * (1 / (oracleData?.price || 1));
      
      onUpdateBalance(user.artxBalance + received);
      setSwapAmount('');
      alert(`Swap Successful! Received ~${received.toFixed(2)} ARTX\n(Fee: ${fee.toFixed(4)} Pi routed to Treasury)`);
    } catch (e) {
      alert("Swap Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || isNaN(Number(stakeAmount))) return;
    const amount = Number(stakeAmount);
    if (amount > user.artxBalance) return alert("Insufficient Balance");
    
    setLoading(true);
    try {
      await StakingRewardsContract.stake(user.id, amount);
      onUpdateBalance(user.artxBalance - amount);
      onUpdateStaked(user.stakedAmount + amount);
      setStakeAmount('');
      alert("Staking Successful! Earning rewards now.");
    } catch (e) {
      alert("Staking Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Market Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
           <div>
             <div className="text-xs text-slate-500 uppercase font-bold">Oracle Price (ARTX/Pi)</div>
             <div className="text-xl font-mono text-white font-bold">{oracleData?.price.toFixed(4)} <span className="text-cyan-500">Pi</span></div>
           </div>
           <i className="fas fa-chart-line text-cyan-500/50 text-2xl"></i>
        </div>
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
           <div>
             <div className="text-xs text-slate-500 uppercase font-bold">AMM TVL</div>
             <div className="text-xl font-mono text-white font-bold">{(poolData ? (poolData.reserveA + poolData.reserveB).toLocaleString() : '---')} <span className="text-slate-500 text-sm">Total</span></div>
           </div>
           <i className="fas fa-water text-blue-500/50 text-2xl"></i>
        </div>
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
           <div>
             <div className="text-xs text-slate-500 uppercase font-bold">Staking APR</div>
             <div className="text-xl font-mono text-white font-bold text-green-400">12.5%</div>
           </div>
           <i className="fas fa-percentage text-green-500/50 text-2xl"></i>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interaction Panel */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="flex border-b border-slate-700">
            <button 
              onClick={() => setActiveTab('SWAP')}
              className={`flex-1 py-4 font-bold text-sm transition ${activeTab === 'SWAP' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
            >
              NATIVE SWAP
            </button>
            <button 
              onClick={() => setActiveTab('STAKE')}
              className={`flex-1 py-4 font-bold text-sm transition ${activeTab === 'STAKE' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-400' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
            >
              STAKING VAULT
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'SWAP' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase font-bold">Selling (Pi)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-600 rounded p-4 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="absolute right-4 top-4 text-slate-500 font-bold">Pi</span>
                  </div>
                </div>
                <div className="flex justify-center">
                  <i className="fas fa-arrow-down text-slate-500"></i>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase font-bold">Buying (ARTX)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={swapAmount ? (Number(swapAmount) * (1 / (oracleData?.price || 1))).toFixed(4) : ''}
                      disabled
                      className="w-full bg-slate-900/50 border border-slate-700 rounded p-4 text-slate-400 font-mono"
                    />
                    <span className="absolute right-4 top-4 text-cyan-600 font-bold">ARTX</span>
                  </div>
                </div>
                
                <div className="text-xs text-slate-500 flex justify-between px-1">
                    <span>Protocol Fee (0.3%)</span>
                    <span className="text-neon-gold">Routed to Treasury</span>
                </div>

                <button 
                  onClick={handleSwap}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-cyan-900/20 transition disabled:opacity-50"
                >
                  {loading ? 'SWAPPING...' : 'EXECUTE ATOMIC SWAP'}
                </button>
              </div>
            )}

            {activeTab === 'STAKE' && (
              <div className="space-y-6">
                <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg text-center">
                  <div className="text-xs text-purple-300 uppercase">Your Staked Balance</div>
                  <div className="text-2xl font-mono font-bold text-white">{user.stakedAmount.toLocaleString()} ARTX</div>
                  <div className="text-xs text-slate-400 mt-1">Pending Rewards: <span className="text-green-400">+{rewards.toFixed(4)} ARTX</span></div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase font-bold">Amount to Stake</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-600 rounded p-4 text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                    <span className="absolute right-4 top-4 text-slate-500 font-bold">ARTX</span>
                  </div>
                </div>
                <button 
                  onClick={handleStake}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-purple-900/20 transition disabled:opacity-50"
                >
                  {loading ? 'LOCKING ASSETS...' : 'STAKE ASSETS'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2">
               <i className="fas fa-info-circle text-cyan-400"></i> Liquidity Pool Info
             </h3>
             <div className="space-y-3 text-sm text-slate-300">
               <div className="flex justify-between border-b border-slate-700 pb-2">
                 <span>Contract ID</span>
                 <span className="font-mono text-slate-500 text-xs">0xCA...7F2A</span>
               </div>
               <div className="flex justify-between border-b border-slate-700 pb-2">
                 <span>Reserves (ARTX)</span>
                 <span className="font-mono">{poolData?.reserveA.toLocaleString()}</span>
               </div>
               <div className="flex justify-between border-b border-slate-700 pb-2">
                 <span>Reserves (Pi)</span>
                 <span className="font-mono">{poolData?.reserveB.toLocaleString()}</span>
               </div>
               <div className="flex justify-between">
                 <span>Fee Tier</span>
                 <span className="font-mono">0.3%</span>
               </div>
             </div>
           </div>

           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <i className="fas fa-shield-alt text-6xl text-white"></i>
             </div>
             <h3 className="text-white font-bold mb-2">Insurance & Security</h3>
             <p className="text-xs text-slate-400 mb-4">
               All smart contracts are audited. The Insurance Pool covers up to 1M ARTX in exploit damages.
             </p>
             <button className="text-xs text-cyan-400 hover:text-white border border-cyan-500/30 bg-cyan-900/20 px-3 py-1 rounded transition">
               View Bug Bounty Vault
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DeFiHub;