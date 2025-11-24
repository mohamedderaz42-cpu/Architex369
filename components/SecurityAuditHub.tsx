
import React, { useState, useEffect } from 'react';
import { User, AuditReport, BountySubmission } from '../types';
import { SecurityAuditContract } from '../services/stellarService';

interface SecurityAuditHubProps {
  user: User;
}

const SecurityAuditHub: React.FC<SecurityAuditHubProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'AUDITS' | 'CODE_FREEZE' | 'BUG_BOUNTY'>('AUDITS');
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  // Bounty Form
  const [bountyDesc, setBountyDesc] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'>('LOW');
  const [submissions, setSubmissions] = useState<BountySubmission[]>([]);

  useEffect(() => {
    const loadData = async () => {
        const rpts = await SecurityAuditContract.getAuditReports();
        setReports(rpts);
        const bal = await SecurityAuditContract.getBugBountyVaultBalance();
        setVaultBalance(bal);
    };
    loadData();
  }, []);

  const handleSubmitBounty = async () => {
      if (!bountyDesc) return;
      setLoading(true);
      try {
          const sub = await SecurityAuditContract.submitVulnerability(user.id, severity, bountyDesc);
          setSubmissions(prev => [sub, ...prev]);
          setBountyDesc('');
          alert("Vulnerability Report Submitted. Encrypted & Sent to Auditors.");
      } catch (e) {
          alert("Submission Failed.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <i className="fas fa-lock text-9xl text-white"></i>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
                    Security <span className="text-cyan-500">Audit</span>
                </h2>
                <p className="text-xs font-mono text-slate-400">Protocol Hardening & Risk Management</p>
            </div>
            <div className="flex gap-2 relative z-10">
                <button onClick={() => setActiveTab('AUDITS')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'AUDITS' ? 'bg-cyan-700 text-white' : 'bg-slate-700 text-slate-300'}`}>Audit Reports</button>
                <button onClick={() => setActiveTab('CODE_FREEZE')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'CODE_FREEZE' ? 'bg-cyan-700 text-white' : 'bg-slate-700 text-slate-300'}`}>Code Freeze</button>
                <button onClick={() => setActiveTab('BUG_BOUNTY')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'BUG_BOUNTY' ? 'bg-cyan-700 text-white' : 'bg-slate-700 text-slate-300'}`}>Bug Bounty</button>
            </div>
        </div>

        {activeTab === 'AUDITS' && (
            <div className="grid grid-cols-1 gap-4">
                {reports.map(report => (
                    <div key={report.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${report.score > 90 ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}>
                                <span className="text-xl font-bold">{report.score}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{report.firm}</h3>
                                <div className="text-xs text-slate-400">Date: {new Date(report.date).toLocaleDateString()}</div>
                                <div className="text-xs text-slate-400">Findings: {report.findings}</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${report.status === 'PASSED' ? 'bg-green-900/30 text-green-400' : report.status === 'PENDING' ? 'bg-slate-700 text-slate-300' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                {report.status}
                            </span>
                            <button className="text-cyan-400 hover:text-white transition">
                                <i className="fas fa-file-pdf text-2xl"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'CODE_FREEZE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-4 border-cyan-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse">
                        <i className="fas fa-snowflake text-5xl text-cyan-400"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">CODE FROZEN</h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                        Smart contracts are immutable. No logic changes can be made without a Multi-Sig Governance vote.
                    </p>
                    <div className="mt-6 text-xs font-mono text-cyan-500 bg-cyan-900/20 px-4 py-2 rounded border border-cyan-500/30">
                        COMMIT_HASH: 0x7f8a9...b2c1
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4">Contract Integrity Check</h3>
                    <div className="space-y-3">
                        {['Governance Cluster', 'DeFi Core', 'Commerce Engine', 'Social Logic', 'Privacy Module'].map((mod, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800">
                                <span className="text-slate-300 text-sm">{mod}</span>
                                <span className="flex items-center gap-2 text-green-400 text-xs font-bold">
                                    <i className="fas fa-check-circle"></i> VERIFIED
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'BUG_BOUNTY' && (
            <div className="space-y-6">
                {/* Vault Stats */}
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-xl border border-indigo-500/30 flex justify-between items-center">
                    <div>
                        <h3 className="text-indigo-400 font-bold uppercase text-xs">Bounty Vault Liquidity</h3>
                        <div className="text-3xl font-mono text-white font-bold">{vaultBalance.toLocaleString()} <span className="text-sm text-slate-500">ARTX</span></div>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-400">Max Critical Payout</div>
                        <div className="text-white font-bold">50,000 ARTX</div>
                    </div>
                </div>

                {/* Submission Form */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4">Submit Vulnerability</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold">Severity Level</label>
                            <div className="flex gap-2 mt-2">
                                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(lvl => (
                                    <button 
                                        key={lvl} 
                                        onClick={() => setSeverity(lvl as any)}
                                        className={`flex-1 py-2 rounded text-xs font-bold border ${severity === lvl ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-slate-900 border-slate-600 text-slate-500'}`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold">Description & Proof of Concept</label>
                            <textarea 
                                value={bountyDesc}
                                onChange={(e) => setBountyDesc(e.target.value)}
                                className="w-full h-32 bg-slate-900 border border-slate-600 rounded p-3 text-white mt-1 text-sm font-mono"
                                placeholder="// Describe the vector..."
                            />
                        </div>
                        <button 
                            onClick={handleSubmitBounty}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition"
                        >
                            {loading ? 'Encrypting...' : 'Submit Report (Whitehat)'}
                        </button>
                    </div>
                </div>

                {/* My Submissions */}
                {submissions.length > 0 && (
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="font-bold text-white mb-4">My Reports</h3>
                        <div className="space-y-2">
                            {submissions.map(sub => (
                                <div key={sub.id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800">
                                    <div>
                                        <div className="text-white font-bold text-sm">{sub.id}</div>
                                        <div className="text-xs text-slate-500">{sub.severity} - {new Date(sub.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{sub.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default SecurityAuditHub;
