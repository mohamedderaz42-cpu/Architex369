import React, { useState, useEffect } from 'react';
import { User, Tender, TenderStatus, ZkProof, UserRole } from '../types';
import { EnterpriseContract, UtilityContracts } from '../services/stellarService';

interface EnterprisePortalProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onUpdateBalance: (newBalance: number) => void;
}

// Mock Org Members for RBAC Demo
const MOCK_MEMBERS = [
    { id: 'm1', name: 'Alice Director', role: 'ADMIN' },
    { id: 'm2', name: 'Bob Analyst', role: 'VIEWER' },
    { id: 'm3', name: 'Charlie Procurement', role: 'OPERATOR' }
];

const EnterprisePortal: React.FC<EnterprisePortalProps> = ({ user, onUpdateUser, onUpdateBalance }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TENDERS' | 'ZK_VAULT' | 'ORG'>('DASHBOARD');
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [zkProof, setZkProof] = useState<ZkProof | null>(null);
  const [orgMembers, setOrgMembers] = useState(MOCK_MEMBERS);

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
                bids: [
                    { vendorId: 'v1', vendorName: 'Alpha Agency', amount: 45000, proposalHash: '0x123', timestamp: Date.now() - 10000 }
                ],
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

  const handleAward = async (tenderId: string, vendorId: string, amount: number) => {
      if (!window.confirm(`Confirm Awarding Tender to Vendor ${vendorId} for ${amount} ARTX? This action is final.`)) return;
      
      setLoading(true);
      try {
          await EnterpriseContract.awardTender(tenderId, vendorId, amount);
          setTenders(prev => prev.map(t => t.id === tenderId ? { ...t, status: TenderStatus.AWARDED, awardedTo: vendorId } : t));
          alert("Tender Awarded! Smart Contract executed payout.");
      } catch (e) {
          alert("Failed to award tender.");
      } finally {
          setLoading(false);
      }
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
        <div className="bg-slate-900 border-b border-slate-700 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
                    Enterprise <span className="text-slate-500">Portal</span>
                </h2>
                <p className="text-xs font-mono text-slate-400">B2B Procurement & Privacy Layer</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 text-xs font-bold rounded transition ${activeTab === 'DASHBOARD' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Overview</button>
                <button onClick={() => setActiveTab('TENDERS')} className={`px-4 py-2 text-xs font-bold rounded transition ${activeTab === 'TENDERS' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Tender Market</button>
                <button onClick={() => setActiveTab('ZK_VAULT')} className={`px-4 py-2 text-xs font-bold rounded transition ${activeTab === 'ZK_VAULT' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>ZK Vault</button>
                <button onClick={() => setActiveTab('ORG')} className={`px-4 py-2 text-xs font-bold rounded transition ${activeTab === 'ORG' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Organization</button>
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
                {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.EXECUTIVE || user.role === UserRole.ENTERPRISE_ADMIN) && (
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
                        <div key={tender.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <span className={`text-[10px] px-2 py-1 rounded border uppercase font-bold mb-2 inline-block ${tender.status === TenderStatus.AWARDED ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-blue-900/30 text-blue-400 border-blue-500/30'}`}>
                                        {tender.status}
                                    </span>
                                    <h3 className="text-xl font-bold text-white">{tender.title}</h3>
                                    <p className="text-slate-400 text-sm mb-2">{tender.description}</p>
                                    <div className="text-xs text-slate-500 font-mono">ID: {tender.id}</div>
                                </div>
                                <div className="text-right min-w-[150px]">
                                    <div className="text-sm text-slate-400">Budget Cap</div>
                                    <div className="text-2xl font-mono text-white font-bold">{tender.budgetCap.toLocaleString()}</div>
                                    {tender.status === TenderStatus.OPEN && (
                                        <button 
                                            onClick={() => handleBid(tender.id)}
                                            disabled={loading}
                                            className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-bold text-sm transition"
                                        >
                                            Place Bid
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Bids Section */}
                            {tender.bids.length > 0 && (
                                <div className="bg-slate-900/50 rounded p-4 border border-slate-700">
                                    <h4 className="text-xs text-slate-400 uppercase font-bold mb-2">Incoming Bids</h4>
                                    <div className="space-y-2">
                                        {tender.bids.map((bid, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-300">
                                                        {bid.vendorName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-sm">{bid.vendorName}</div>
                                                        <div className="text-[10px] text-slate-500">{new Date(bid.timestamp).toLocaleTimeString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-neon-gold font-mono font-bold">{bid.amount.toLocaleString()} ARTX</div>
                                                    {/* Award Button (Only visible to owner/admin) */}
                                                    {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ENTERPRISE_ADMIN) && tender.status === TenderStatus.OPEN && (
                                                        <button 
                                                            onClick={() => handleAward(tender.id, bid.vendorId, bid.amount)}
                                                            disabled={loading}
                                                            className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded transition"
                                                        >
                                                            Award
                                                        </button>
                                                    )}
                                                    {tender.status === TenderStatus.AWARDED && tender.awardedTo === bid.vendorId && (
                                                        <span className="text-green-400 text-xs font-bold border border-green-500/30 px-2 py-1 rounded bg-green-900/20">WINNER</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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

        {activeTab === 'ORG' && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <i className="fas fa-sitemap text-blue-400"></i> Organizational Structure
                    </h3>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded transition">
                        + Invite Member
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th className="p-3">Member</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Access Level</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {orgMembers.map(member => (
                                <tr key={member.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition">
                                    <td className="p-3">
                                        <div className="font-bold text-white">{member.name}</div>
                                        <div className="text-xs text-slate-500">ID: {member.id}</div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${member.role === 'ADMIN' ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-700 text-slate-300'}`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-400 font-mono text-xs">
                                        {member.role === 'ADMIN' ? 'FULL_ACCESS' : 'READ_WRITE'}
                                    </td>
                                    <td className="p-3">
                                        <button className="text-xs text-blue-400 hover:text-blue-300 mr-3">Edit</button>
                                        <button className="text-xs text-red-400 hover:text-red-300">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 p-4 bg-slate-900 rounded border border-slate-700 text-xs text-slate-400">
                    <i className="fas fa-info-circle mr-2 text-blue-400"></i>
                    RBAC (Role-Based Access Control) changes are recorded on the Soroban ledger for audit trails.
                </div>
            </div>
        )}
    </div>
  );
};

export default EnterprisePortal;