
import React, { useState, useEffect } from 'react';
import { User, Plugin, PluginCategory } from '../types';
import { EcosystemContract } from '../services/stellarService';

interface EcosystemHubProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const EcosystemHub: React.FC<EcosystemHubProps> = ({ user, onUpdateBalance, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'MY_LIBRARY' | 'SDK_DOCS'>('MARKETPLACE');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [installed, setInstalled] = useState<string[]>(user.installedPlugins || []);

  useEffect(() => {
    const loadPlugins = async () => {
        const catalog = await EcosystemContract.getPlugins();
        // Sync with user's installed state
        const updatedCatalog = catalog.map(p => ({
            ...p,
            installed: installed.includes(p.id)
        }));
        setPlugins(updatedCatalog);
    };
    loadPlugins();
  }, [installed]);

  const handleInstall = async (plugin: Plugin) => {
      if (user.artxBalance < plugin.price) return alert("Insufficient ARTX.");
      
      setLoading(true);
      try {
          const tx = await EcosystemContract.installPlugin(user.id, plugin.id, plugin.price);
          
          onUpdateBalance(user.artxBalance - tx.amount);
          
          const newInstalled = [...installed, plugin.id];
          setInstalled(newInstalled);
          onUpdateUser({ installedPlugins: newInstalled });
          
          alert(`Successfully installed ${plugin.name}!`);
      } catch (e) {
          alert("Installation Failed.");
      } finally {
          setLoading(false);
      }
  };

  const handleUninstall = (pluginId: string) => {
      if (!window.confirm("Uninstall this plugin? Settings may be lost.")) return;
      const newInstalled = installed.filter(id => id !== pluginId);
      setInstalled(newInstalled);
      onUpdateUser({ installedPlugins: newInstalled });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
                    Ecosystem <span className="text-cyan-500">Hub</span>
                </h2>
                <p className="text-xs font-mono text-slate-400">Plugin Store & Developer SDK</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('MARKETPLACE')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'MARKETPLACE' ? 'bg-cyan-700 text-white' : 'bg-slate-700 text-slate-300'}`}>Store</button>
                <button onClick={() => setActiveTab('MY_LIBRARY')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'MY_LIBRARY' ? 'bg-cyan-700 text-white' : 'bg-slate-700 text-slate-300'}`}>My Library</button>
                <button onClick={() => setActiveTab('SDK_DOCS')} className={`px-4 py-2 rounded text-xs font-bold transition ${activeTab === 'SDK_DOCS' ? 'bg-cyan-700 text-white' : 'bg-slate-700 text-slate-300'}`}>Dev SDK</button>
            </div>
        </div>

        {activeTab === 'MARKETPLACE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plugins.map(plugin => (
                    <div key={plugin.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col hover:border-cyan-500/50 transition group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-cyan-400 border border-slate-600 group-hover:scale-110 transition">
                                <i className={`fas ${plugin.icon} text-xl`}></i>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${plugin.price > 0 ? 'bg-purple-900/30 text-purple-400' : 'bg-green-900/30 text-green-400'}`}>
                                {plugin.price > 0 ? `${plugin.price} ARTX` : 'FREE'}
                            </span>
                        </div>
                        
                        <h3 className="text-white font-bold mb-1">{plugin.name}</h3>
                        <p className="text-slate-400 text-xs mb-4 flex-1">{plugin.description}</p>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-4 font-mono">
                            <span>v{plugin.version}</span>
                            <span className="flex items-center gap-1"><i className="fas fa-star text-yellow-500"></i> {plugin.rating}</span>
                        </div>

                        {plugin.installed ? (
                            <button disabled className="w-full bg-slate-700 text-slate-400 py-2 rounded font-bold text-sm cursor-not-allowed border border-slate-600">
                                <i className="fas fa-check mr-2"></i> Installed
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleInstall(plugin)}
                                disabled={loading}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded font-bold text-sm transition shadow-lg shadow-cyan-900/20"
                            >
                                {loading ? 'Installing...' : 'Install'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'MY_LIBRARY' && (
            <div className="space-y-4">
                {plugins.filter(p => p.installed).length === 0 ? (
                    <div className="text-center p-8 text-slate-500 italic">No plugins installed yet. Visit the store.</div>
                ) : (
                    plugins.filter(p => p.installed).map(plugin => (
                        <div key={plugin.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center text-cyan-400">
                                    <i className={`fas ${plugin.icon}`}></i>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">{plugin.name}</h4>
                                    <div className="text-xs text-slate-500">{plugin.category}</div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="text-xs bg-slate-700 text-white px-3 py-2 rounded hover:bg-slate-600">Configure</button>
                                <button onClick={() => handleUninstall(plugin.id)} className="text-xs bg-red-900/30 text-red-400 border border-red-600/30 px-3 py-2 rounded hover:bg-red-900/50">Uninstall</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {activeTab === 'SDK_DOCS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4"><i className="fas fa-code text-neon-gold mr-2"></i> Architex SDK v1.0</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        Build decentralized extensions directly on the Architex protocol. Access the Soroban smart contract bindings, UI component library, and identity services.
                    </p>
                    
                    <div className="bg-black p-4 rounded border border-slate-600 font-mono text-xs text-green-400 mb-6">
                        $ npm install @architex/sdk<br/>
                        $ architex init my-plugin<br/>
                        $ architex deploy --network pi-mainnet
                    </div>

                    <button className="bg-neon-gold hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded transition flex items-center gap-2">
                        <i className="fas fa-download"></i> Download CLI Tool
                    </button>
                </div>

                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">Developer Grants</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        We fund innovative plugins. Submit your proposal to the Governance Council to receive up to 10,000 ARTX in funding.
                    </p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-slate-900 p-3 rounded">
                            <span className="text-xs text-slate-300">DeFi Integrations</span>
                            <span className="text-xs font-bold text-green-400">High Priority</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900 p-3 rounded">
                            <span className="text-xs text-slate-300">Localization Packs</span>
                            <span className="text-xs font-bold text-yellow-400">Medium Priority</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default EcosystemHub;