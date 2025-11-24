import React, { useState, useEffect } from 'react';
import { User, OracleData, LiquidityPool, Transaction, PricePoint } from '../types';
import { OraclePriceFeed, NativeSwapAMM, StakingRewardsContract, ArtxTokenContract } from '../services/stellarService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DeFiHubProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
  onUpdateStaked: (newStaked: number) => void;
  onUpdateAccelerator: (expiry: number) => void;
}

const DeFiHub: React.FC<DeFiHubProps> = ({ user, onUpdateBalance, onUpdateStaked, onUpdateAccelerator }) => {
  const [activeTab, setActiveTab] = useState<'SWAP' | 'STAKE' | 'ACCELERATOR'>('SWAP');
  const [oracleData, setOracleData] = useState<OracleData | null>(null);
  const [poolData, setPoolData] = useState<LiquidityPool | null>(null);
  const [chartData, setChartData] = useState<PricePoint[]>([]);
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
      
      // Phase 4: Load History
      const history = await OraclePriceFeed.getHistory();
      setChartData(history);
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

  const handleSubscribe = async () => {
      if (user.artxBalance < 50) return alert("Insufficient ARTX Balance. Need 50 ARTX.");
      setLoading(true);
      try {
          await StakingRewardsContract.subscribeAccelerator(user.id);
          onUpdateBalance(user.artxBalance - 50);
          onUpdateAccelerator(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Days
          alert("Accelerator Activated! 2x APY Boost enabled for 30 days.");
      } catch (e) {
          alert("Subscription Failed.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Market Ticker & Chart (Phase 4) */}
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl">
          <div className="flex justify-between items-end mb-4">
              <div>
                  <h3 className="text-slate-400 font-bold text-sm uppercase">ARTX / Pi Market Index</h3>
                  <div className="text-3xl font-mono text-white font-bold flex items-center gap-3">
                      {oracleData?.price.toFixed(4)} <span className="text-sm text-cyan-500">Pi</span>
                      <span className="text-sm px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">+2.4%</span>
                  </div>
              </div>
              <div className="text-right hidden md:block">
                  <div className="text-xs text-slate-500">24H Volume</div>
                  <div className="text-white font-mono">1,240,500 ARTX</div>
              </div>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#06b6d4' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interaction Panel */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="flex border-b border-slate-700 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('SWAP')}
              className={`flex-1 py-4 font-bold text-sm min-w-[100px] transition ${activeTab === 'SWAP' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
            >
              NATIVE SWAP
            </button>
            <button 
              onClick={() => setActiveTab('STAKE')}
              className={`flex-1 py-4 font-bold text-sm min-w-[100px] transition ${activeTab === 'STAKE' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-400' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
            >
              STAKING
            </button>
            <button 
              onClick={() => setActiveTab('ACCELERATOR')}
              className={`flex-1 py-4 font-bold text-sm min-w-[100px] transition ${activeTab === 'ACCELERATOR' ? 'bg-slate-800 text-neon-gold border-b-2 border-neon-gold' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
            >
              ACCELERATOR
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
                  <div className="text-xs text-slate-400 mt-1">
                      Pending Rewards: <span className="text-green-400">+{rewards.toFixed(4)} ARTX</span>
                      {user.acceleratorExpiry > Date.now() && <span className="ml-2 bg-neon-gold text-black text-[10px] px-1 rounded font-bold">2X BOOST ACTIVE</span>}
                  </div>
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
            
            {activeTab === 'ACCELERATOR' && (
                <div className="space-y-6 text-center">
                    <div className="mb-4">
                        <i className="fas fa-rocket text-5xl text-neon-gold mb-3"></i>
                        <h3 className="text-xl font-bold text-white">Yield Accelerator</h3>
                        <p className="text-sm text-slate-400">Boost your staking APY by <span className="text-white font-bold">200%</span> for 30 days.</p>
                    </div>
                    
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Cost</span>
                            <span className="text-white font-mono font-bold">50.00 ARTX</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Current APY</span>
                            <span className="text-slate-500 line-through">12.5%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Boosted APY</span>
                            <span className="text-neon-gold font-bold text-lg">25.0%</span>
                        </div>
                    </div>

                    {user.acceleratorExpiry > Date.now() ? (
                        <button disabled className="w-full bg-green-600/50 text-white font-bold py-4 rounded-lg cursor-not-allowed border border-green-500">
                            ACTIVE UNTIL {new Date(user.acceleratorExpiry).toLocaleDateString()}
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-neon-gold to-orange-600 hover:brightness-110 text-black font-bold py-4 rounded-lg shadow-lg shadow-orange-900/20 transition"
                        >
                            {loading ? 'PROCESSING...' : 'ACTIVATE BOOST (50 ARTX)'}
                        </button>
                    )}
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
        </div>
      </div>
    </div>
  );
};

export default DeFiHub;