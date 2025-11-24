import React from 'react';
import { VestingSchedule } from '../types';

interface VestingVaultProps {
  schedules: VestingSchedule[];
}

const VestingVault: React.FC<VestingVaultProps> = ({ schedules }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          <span className="text-cyan-500">Vesting</span> Vault
        </h2>
        <div className="text-xs font-mono text-slate-500">CONTRACT: 0xSOROBAN...VAULT</div>
      </div>

      <div className="grid gap-6">
        {schedules.map((schedule, idx) => {
          const percentageUnlocked = (schedule.unlocked / schedule.totalAllocation) * 100;
          
          return (
            <div key={idx} className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
              {/* Decorative background element */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-12 rounded-full ${schedule.color.replace('text', 'bg').replace('#', 'bg-[') + ']'}`} style={{backgroundColor: schedule.color}}></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{schedule.category}</h3>
                    <p className="text-xs text-slate-400 font-mono">{schedule.releaseRule}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-slate-200">
                    {schedule.totalAllocation.toLocaleString()} <span className="text-xs text-slate-500">ARTX</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative z-10">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Locked: {(schedule.locked).toLocaleString()}</span>
                  <span>Unlocked: {(schedule.unlocked).toLocaleString()} ({percentageUnlocked.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${percentageUnlocked}%`, backgroundColor: schedule.color }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Simulated) */}
              <div className="mt-4 flex gap-2 justify-end opacity-50 group-hover:opacity-100 transition-opacity">
                 <button disabled={true} className="text-xs border border-slate-600 text-slate-400 px-3 py-1 rounded hover:text-white hover:border-white transition cursor-not-allowed">
                    <i className="fas fa-lock mr-1"></i> Claim Unavailable
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VestingVault;