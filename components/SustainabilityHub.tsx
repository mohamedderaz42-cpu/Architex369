
import React, { useState, useEffect } from 'react';
import { User, MaterialPassport, SustainabilityTag } from '../types';
import { SustainabilityContract } from '../services/stellarService';

interface SustainabilityHubProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const SustainabilityHub: React.FC<SustainabilityHubProps> = ({ user, onUpdateBalance, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'PASSPORTS' | 'CALCULATOR' | 'IMPACT'>('PASSPORTS');
  const [loading, setLoading] = useState(false);
  const [passports, setPassports] = useState<MaterialPassport[]>([]);
  
  // Calculator State
  const [calcDistance, setCalcDistance] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calculatedEmissions, setCalculatedEmissions] = useState<number | null>(null);

  useEffect(() => {
    // Load Mock Passports
    setPassports([
        {
            id: 'pass-001',
            name: 'Eco-Packaging v2',
            origin: 'Local Recycling Plant',
            composition: 'Recycled Cardboard 95%, Bio-Ink 5%',
            carbonFootprint: 2.5,
            recyclability: 100,
            tags: [SustainabilityTag.RECYCLED, SustainabilityTag.BIODEGRADABLE],
            issueDate: Date.now() - 100000000
        }
    ]);
  }, []);

  const handleMintPassport = async () => {
      setLoading(true);
      const newPassport = await SustainabilityContract.createPassport('New Product X', 'Factory A');
      setPassports(prev => [newPassport, ...prev]);
      setLoading(false);
      alert("Material Passport Minted on Soroban!");
  };

  const handleCalculate = () => {
      if (!calcDistance || !calcWeight) return;
      // Simple formula: 0.001 kg CO2 per km per kg (Truck transport approx)
      const emissions = Number(calcDistance) * Number(calcWeight) * 0.001;
      setCalculatedEmissions(Number(emissions.toFixed(2)));
  };

  const handleOffset = async () => {
      if (!calculatedEmissions) return;
      // Cost: 1 ARTX per 10kg CO2
      const cost = Math.ceil(calculatedEmissions / 10);
      
      if (user.artxBalance < cost) return alert("Insufficient ARTX for offset.");
      
      setLoading(true);
      const { tx, score } = await SustainabilityContract.purchaseOffset(user.id, cost);
      onUpdateBalance(user.artxBalance - tx.amount);
      onUpdateUser({ greenScore: score });
      setLoading(false);
      alert(`Offset Purchased! ${calculatedEmissions}kg CO2 neutralized. Green Score updated to ${score}.`);
      setCalculatedEmissions(null);
      setCalcDistance('');
      setCalcWeight('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <i className="fas fa-leaf text-9xl text-green-500"></i>
            </div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white">Sustainability <span className="text-green-400">Hub</span></h2>
                <p className="text-sm text-slate-400">Track materials, calculate impact, and offset emissions.</p>
            </div>
            <div className="flex gap-2 relative z-10">
                <button onClick={() => setActiveTab('PASSPORTS')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'PASSPORTS' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Material Passports</button>
                <button onClick={() => setActiveTab('CALCULATOR')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'CALCULATOR' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Carbon Calculator</button>
                <button onClick={() => setActiveTab('IMPACT')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'IMPACT' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>My Impact</button>
            </div>
        </div>

        {activeTab === 'PASSPORTS' && (
            <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded border border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold">Digital Material Passports</h3>
                        <p className="text-xs text-slate-500">Verify origin and composition on the blockchain.</p>
                    </div>
                    <button onClick={handleMintPassport} disabled={loading} className="bg-slate-800 text-green-400 border border-green-500/30 px-4 py-2 rounded text-sm font-bold hover:bg-slate-700">
                        {loading ? 'Minting...' : '+ Mint Passport'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {passports.map(pass => (
                        <div key={pass.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-green-500/50 transition">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-900/20 rounded flex items-center justify-center text-green-400">
                                        <i className="fas fa-recycle"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{pass.name}</h4>
                                        <div className="text-xs text-slate-500">{pass.id}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-400">Recyclability</div>
                                    <div className="text-lg font-mono font-bold text-green-400">{pass.recyclability}%</div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 p-3 rounded text-xs text-slate-300 mb-3 font-mono">
                                <p>ORIGIN: {pass.origin}</p>
                                <p>COMPOSITION: {pass.composition}</p>
                                <p>FOOTPRINT: {pass.carbonFootprint} kg CO2e</p>
                            </div>

                            <div className="flex gap-2">
                                {pass.tags.map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-1 rounded bg-slate-700 text-slate-300 border border-slate-600">{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'CALCULATOR' && (
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Logistics Carbon Estimator</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Distance (km)</label>
                        <input 
                            type="number" 
                            value={calcDistance}
                            onChange={(e) => setCalcDistance(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white mt-1 focus:border-green-500 outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Weight (kg)</label>
                        <input 
                            type="number" 
                            value={calcWeight}
                            onChange={(e) => setCalcWeight(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white mt-1 focus:border-green-500 outline-none"
                            placeholder="0"
                        />
                    </div>
                </div>

                <button onClick={handleCalculate} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded mb-6 transition">
                    Calculate Emissions
                </button>

                {calculatedEmissions !== null && (
                    <div className="bg-slate-900 border border-slate-600 p-6 rounded-xl text-center animate-fadeIn">
                        <div className="text-sm text-slate-400 mb-1">Estimated Footprint</div>
                        <div className="text-3xl font-mono font-bold text-white mb-4">{calculatedEmissions} <span className="text-sm text-slate-500">kg CO2e</span></div>
                        
                        <div className="flex justify-center items-center gap-2 mb-4">
                            <span className="text-xs text-slate-400">Offset Cost:</span>
                            <span className="text-neon-gold font-bold">{Math.ceil(calculatedEmissions / 10)} ARTX</span>
                        </div>

                        <button 
                            onClick={handleOffset}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-8 rounded-full shadow-lg shadow-green-900/20 transition"
                        >
                            {loading ? 'Processing...' : 'Purchase Offset'}
                        </button>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'IMPACT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="w-20 h-20 mx-auto bg-slate-900 rounded-full flex items-center justify-center mb-4 border-4 border-green-500">
                        <span className="text-2xl font-bold text-white">{user.greenScore || 0}</span>
                    </div>
                    <h3 className="font-bold text-white">Green Score</h3>
                    <p className="text-xs text-slate-500 mt-1">Based on offsets & recycling</p>
                </div>
                
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="text-4xl text-green-400 mb-4">
                        <i className="fas fa-tree"></i>
                    </div>
                    <h3 className="font-bold text-white">Carbon Offset</h3>
                    <div className="text-2xl font-mono text-white mt-2">120 <span className="text-sm text-slate-500">kg</span></div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="text-4xl text-blue-400 mb-4">
                        <i className="fas fa-box-open"></i>
                    </div>
                    <h3 className="font-bold text-white">Passports Minted</h3>
                    <div className="text-2xl font-mono text-white mt-2">{passports.length}</div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SustainabilityHub;
