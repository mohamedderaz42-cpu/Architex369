import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { VestingSchedule, SystemConfig, User, UserRole, Language } from '../types';
import { mintTokens, burnTokens } from '../services/stellarService';

interface GodModeProps {
  supply: number;
  onSupplyChange: (newSupply: number) => void;
  vestingData: VestingSchedule[];
  systemConfig: SystemConfig;
  onConfigChange: (newConfig: SystemConfig) => void;
  users: User[];
  onUpdateRole: (userId: string, newRole: UserRole) => void;
}

type Tab = 'ECONOMY' | 'TEAM' | 'SYSTEM' | 'CONTENT';

const GodMode: React.FC<GodModeProps> = ({ 
  supply, 
  onSupplyChange, 
  vestingData, 
  systemConfig, 
  onConfigChange,
  users,
  onUpdateRole
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('ECONOMY');
  const [actionAmount, setActionAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');

  // --- Economy Handlers ---
  const handleMint = async () => {
    if (actionAmount <= 0) return;
    setProcessing(true);
    setStatus('Initiating Soroban Mint Sequence...');
    try {
      await mintTokens(actionAmount);
      onSupplyChange(supply + actionAmount);
      setStatus(`Successfully minted ${actionAmount.toLocaleString()} ARTX.`);
    } catch (e) {
      setStatus('Mint Failed: Signature Rejected.');
    } finally {
      setProcessing(false);
      setActionAmount(0);
    }
  };

  const handleBurn = async () => {
    if (actionAmount <= 0) return;
    setProcessing(true);
    setStatus('Initiating Soroban Burn Sequence...');
    try {
      await burnTokens(actionAmount);
      onSupplyChange(supply - actionAmount);
      setStatus(`Successfully burned ${actionAmount.toLocaleString()} ARTX.`);
    } catch (e) {
      setStatus('Burn Failed.');
    } finally {
      setProcessing(false);
      setActionAmount(0);
    }
  };

  // --- System Handlers ---
  const toggleMaintenance = () => {
    onConfigChange({ ...systemConfig, maintenanceMode: !systemConfig.maintenanceMode });
  };

  const toggleAds = () => {
    onConfigChange({ ...systemConfig, adsEnabled: !systemConfig.adsEnabled });
  };

  const toggleLanguage = (lang: Language | null) => {
    onConfigChange({ ...systemConfig, forcedLanguage: lang });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-l-4 border-neon-gold bg-slate-900/50 p-6 rounded-r-lg flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-neon-gold uppercase tracking-widest flex items-center gap-3">
            <i className="fas fa-crown"></i> God Mode
          </h2>
          <p className="text-slate-400 mt-2 font-mono text-xs">
            CAUTION: CENTRAL BANK & ADMIN ACCESS. ACTIONS ARE IMMUTABLE.
          </p>
        </div>
        <div className="flex gap-2">
          {['ECONOMY', 'TEAM', 'SYSTEM'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`px-4 py-2 rounded font-bold text-xs font-mono transition ${
                activeTab === tab 
                  ? 'bg-neon-gold text-black' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'ECONOMY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Economic Policy Controls */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-coins text-cyan-400"></i> Monetary Policy
            </h3>
            
            <div className="mb-6">
              <div className="text-sm text-slate-400 mb-1">Total Circulating Supply</div>
              <div className="text-4xl font-mono text-white tracking-wider">
                {supply.toLocaleString()} <span className="text-cyan-500 text-lg">ARTX</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-slate-500">Operation Amount</label>
                <input 
                  type="number" 
                  value={actionAmount || ''}
                  onChange={(e) => setActionAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white font-mono mt-1 focus:border-neon-gold outline-none"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleMint}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded transition shadow-lg shadow-green-900/20 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'MINT (Inflate)'}
                </button>
                <button 
                  onClick={handleBurn}
                  disabled={processing}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded transition shadow-lg shadow-red-900/20 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'BURN (Deflate)'}
                </button>
              </div>
              {status && (
                <div className="text-xs font-mono text-neon-gold bg-yellow-900/20 p-2 rounded border border-yellow-700/30">
                  > {status}
                </div>
              )}
            </div>
          </div>

          {/* Global Distribution Visualization */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-chart-pie text-purple-400"></i> Token Distribution
            </h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vestingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="totalAllocation"
                  >
                    {vestingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                    formatter={(value: number) => `${value.toLocaleString()} ARTX`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TEAM' && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <i className="fas fa-users-cog text-cyan-400"></i> Team Management Unit
           </h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                 <tr>
                   <th className="p-3">User</th>
                   <th className="p-3">Role</th>
                   <th className="p-3">Status</th>
                   <th className="p-3">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-700">
                 {users.map(u => (
                   <tr key={u.id} className="hover:bg-slate-700/30">
                     <td className="p-3">
                       <div className="font-bold text-white">{u.username}</div>
                       <div className="text-xs font-mono text-slate-500">{u.piWalletAddress.substring(0, 8)}...</div>
                     </td>
                     <td className="p-3">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                         u.role === UserRole.SUPER_ADMIN ? 'bg-neon-gold/20 text-neon-gold' : 
                         u.role === UserRole.EXECUTIVE ? 'bg-purple-500/20 text-purple-400' :
                         'bg-slate-600/20 text-slate-300'
                       }`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="p-3">
                        {u.kycVerified ? <i className="fas fa-check-circle text-green-500" title="KYC Verified"></i> : <i className="fas fa-times-circle text-red-500"></i>}
                     </td>
                     <td className="p-3 flex gap-2">
                       {u.role !== UserRole.SUPER_ADMIN && (
                         <>
                           <button onClick={() => onUpdateRole(u.id, UserRole.EXECUTIVE)} className="text-xs bg-purple-900/50 text-purple-400 px-2 py-1 rounded hover:bg-purple-900 border border-purple-800">Promote</button>
                           <button onClick={() => onUpdateRole(u.id, UserRole.USER)} className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded hover:bg-red-900 border border-red-800">Demote</button>
                         </>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'SYSTEM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h3 className="text-lg font-bold text-white mb-4">Core Engines</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-slate-900 rounded">
                 <div>
                   <div className="font-bold">Maintenance Mode</div>
                   <div className="text-xs text-slate-500">Locks all non-admin access</div>
                 </div>
                 <button 
                  onClick={toggleMaintenance}
                  className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.maintenanceMode ? 'bg-red-500' : 'bg-slate-600'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${systemConfig.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                 </button>
               </div>

               <div className="flex justify-between items-center p-3 bg-slate-900 rounded">
                 <div>
                   <div className="font-bold">Pi Ads Engine</div>
                   <div className="text-xs text-slate-500">Global interstitial logic</div>
                 </div>
                 <button 
                  onClick={toggleAds}
                  className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.adsEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${systemConfig.adsEnabled ? 'left-7' : 'left-1'}`}></div>
                 </button>
               </div>
             </div>
           </div>

           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h3 className="text-lg font-bold text-white mb-4">Localization Override</h3>
             <div className="grid grid-cols-3 gap-2">
               <button 
                onClick={() => toggleLanguage(null)}
                className={`p-3 rounded border text-sm ${!systemConfig.forcedLanguage ? 'bg-cyan-600 border-cyan-400 text-white' : 'border-slate-600 text-slate-400'}`}
               >
                 Auto (User)
               </button>
               <button 
                onClick={() => toggleLanguage('en')}
                className={`p-3 rounded border text-sm ${systemConfig.forcedLanguage === 'en' ? 'bg-cyan-600 border-cyan-400 text-white' : 'border-slate-600 text-slate-400'}`}
               >
                 Force English
               </button>
               <button 
                onClick={() => toggleLanguage('ar')}
                className={`p-3 rounded border text-sm ${systemConfig.forcedLanguage === 'ar' ? 'bg-cyan-600 border-cyan-400 text-white' : 'border-slate-600 text-slate-400'}`}
               >
                 Force Arabic
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GodMode;