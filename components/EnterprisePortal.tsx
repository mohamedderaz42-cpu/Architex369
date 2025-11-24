import React, { useState, useEffect } from 'react';
import { User, Tender, TenderStatus, ZkProof, UserRole } from '../types';
import { EnterpriseContract, UtilityContracts } from '../services/stellarService';

interface EnterprisePortalProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onUpdateBalance: (newBalance: number) => void;
}

const EnterprisePortal: React.FC<EnterprisePortalProps> = ({ user, onUpdateUser, onUpdateBalance }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TENDERS' | 'ZK_VAULT'>('DASHBOARD');
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [zkProof, setZkProof] = useState<ZkProof | null>(null);

  // Form States
  const [tenderTitle, setTenderTitle] = useState('');
  const [tenderBudget, setTenderBudget] = useState('');

  useEffect(() => {
    const loadTenders = async () => {
        // Mock Tenders
        setTenders([
            {
                id: 'tender-001',
                enterpriseId: 'ent-mega-corp',
                title: 'Global Marketing Campaign - Phase 1',
                description: 'Seeking verified agencies for Pi Network ad rollout.',
                budgetCap: 50000,
                status: TenderStatus.OPEN,
                bids: [],
                deadline: Date.now() + 864000000
            }
        ]);
    };
    loadTenders();
  }, []);

  const handleCreateTender = async () => {
      if (!tenderTitle || !tenderBudget) return;
      setLoading(true);
      try {
          const newTender = await EnterpriseContract.createTender(user.id, tenderTitle, Number(tenderBudget));
          setTenders(prev => [...prev, newTender]);
          alert("Tender Contract Deployed Successfully!");
          setTenderTitle('');
          setTenderBudget('');
      } catch (e) {
          alert("Failed to create tender.");
      } finally {
          setLoading(false);
      }
  };

  const handleBid = async (tenderId: string) => {
      const bidAmount = prompt("Enter Bid Amount (ARTX):");
      if (!bidAmount) return;
      
      setLoading(true);
      await EnterpriseContract.submitBid(tenderId, user.id, Number(bidAmount));
      // Mock UI update
      setTenders(prev => prev.map(t => t.id === tenderId ? { 
          ...t, 
          bids: [...t.bids, { vendorId: user.id, vendorName: user.username, amount: Number(bidAmount), proposalHash: '0x...', timestamp: Date.now() }] 
      } : t));
      alert("Bid Submitted to Smart Contract.");
      setLoading(false);
  };

  const handleGenerateProof = async (type: 'SOLVENCY' | 'IDENTITY') => {
      setLoading(true);
      try {
          // Verify > 1000 ARTX solvency without revealing balance
          const proof = await UtilityContracts.generateZkProof(user.id, type, { threshold: 1000 });
          setZkProof(proof);
      } catch (e) {
          alert("Proof generation failed.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
        {/* Corporate Header */}
        <div className="bg-slate-900 border-b border-slate-700 pb-4 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
                    Enterprise <span className="text-slate-500">Portal</span>
                </h2>
                <p className="text-xs font-mono text-slate-400">B2B Procurement & Privacy Layer</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 text-xs font-bold rounded transition ${activeTab === 'DASHBOARD' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Overview</button>
                <button onClick={() => setActiveTab('TENDERS')} className={`px-4 py-2 text-xs font-bold rounded transition ${activeTab === 'TENDERS' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Tender Market</button>
                <button onClick={() => setActiveTab('ZK_VAULT')} className={`px-4 py-2 text-xs font-bold rounded transition ${activeTab === 'ZK_VAULT' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>ZK Vault</button>
            </div>
        </div>

        {activeTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Organization</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
                            <i className="fas fa-building text-white"></i>
                        </div>
                        <div>
                            <div className="text-white font-bold">{user.companyName || 'Independent Entity'}</div>
                            <div className="text-xs text-slate-500">{user.role === UserRole.EXECUTIVE || user.role === UserRole.SUPER_ADMIN ? 'Administrator' : 'Member'}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Active Contracts</h3>
                    <div className="text-3xl font-mono text-white">{tenders.length}</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Privacy Score</h3>
                    <div className="text-3xl font-mono text-green-400">A+</div>
                    <div className="text-[10px] text-slate-500">ZK-Proofs Active</div>
                </div>
            </div>
        )}

        {activeTab === 'TENDERS' && (
            <div className="space-y-6">
                {/* Create Tender (Admin/Exec Only) */}
                {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.EXECUTIVE) && (
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-white font-bold mb-4">Create Procurement Tender</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input 
                                type="text" 
                                placeholder="Tender Title" 
                                value={tenderTitle}
                                onChange={(e) => setTenderTitle(e.target.value)}
                                className="bg-slate-900 border border-slate-600 rounded p-3 text-white"
                            />
                            <input 
                                type="number" 
                                placeholder="Budget Cap (ARTX)" 
                                value={tenderBudget}
                                onChange={(e) => setTenderBudget(e.target.value)}
                                className="bg-slate-900 border border-slate-600 rounded p-3 text-white"
                            />
                            <button 
                                onClick={handleCreateTender}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition"
                            >
                                {loading ? 'Deploying...' : 'Deploy Contract'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tender List */}
                <div className="space-y-4">
                    {tenders.map(tender => (
                        <div key={tender.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <span className="bg-blue-900/30 text-blue-400 text-[10px] px-2 py-1 rounded border border-blue-500/30 uppercase font-bold mb-2 inline-block">
                                    {tender.status}
                                </span>
                                <h3 className="text-xl font-bold text-white">{tender.title}</h3>
                                <p className="text-slate-400 text-sm mb-2">{tender.description}</p>
                                <div className="text-xs text-slate-500 font-mono">ID: {tender.id}</div>
                            </div>
                            <div className="text-right min-w-[150px]">
                                <div className="text-sm text-slate-400">Budget Cap</div>
                                <div className="text-2xl font-mono text-white font-bold">{tender.budgetCap.toLocaleString()}</div>
                                <div className="text-xs text-slate-500 mb-4">{tender.bids.length} Bids Placed</div>
                                
                                <button 
                                    onClick={() => handleBid(tender.id)}
                                    disabled={loading || tender.status !== TenderStatus.OPEN}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-bold text-sm transition"
                                >
                                    Place Bid
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'ZK_VAULT' && (
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                    <i className="fas fa-fingerprint text-9xl text-white"></i>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">Zero-Knowledge Verification</h3>
                <p className="text-slate-400 mb-8 max-w-xl">
                    Generate cryptographic proofs of your assets or identity without revealing sensitive data to the public ledger.
                </p>

                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => handleGenerateProof('SOLVENCY')}
                        disabled={loading}
                        className="bg-slate-900 border border-slate-600 p-4 rounded-xl text-left hover:border-green-500 transition w-full md:w-64"
                    >
                        <i className="fas fa-wallet text-green-500 text-2xl mb-2"></i>
                        <div className="font-bold text-white">Proof of Solvency</div>
                        <div className="text-xs text-slate-500">Verify > 1000 ARTX</div>
                    </button>
                    
                    <button 
                         onClick={() => handleGenerateProof('IDENTITY')}
                         disabled={loading}
                         className="bg-slate-900 border border-slate-600 p-4 rounded-xl text-left hover:border-blue-500 transition w-full md:w-64"
                    >
                        <i className="fas fa-id-card text-blue-500 text-2xl mb-2"></i>
                        <div className="font-bold text-white">Proof of Identity</div>
                        <div className="text-xs text-slate-500">Verify Organization</div>
                    </button>
                </div>

                {zkProof && (
                    <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-xl animate-fadeIn">
                        <div className="flex items-center gap-3 mb-2">
                            <i className="fas fa-check-circle text-green-500 text-xl"></i>
                            <h4 className="font-bold text-green-400">Proof Generated Successfully</h4>
                        </div>
                        <div className="bg-black p-3 rounded font-mono text-xs text-green-300 overflow-hidden text-ellipsis mb-2">
                            {zkProof.proofHash}
                        </div>
                        <p className="text-xs text-slate-400">
                            This hash can be shared with Enterprise partners to verify your status without revealing your actual balance or ID details.
                        </p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default EnterprisePortal;