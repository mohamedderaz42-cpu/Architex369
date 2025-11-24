import React, { useState, useEffect } from 'react';
import { User, ServiceGig, GigStatus } from '../types';
import { GigServiceContract } from '../services/stellarService';
import { sendMessageToArchie } from '../services/geminiService';

interface ArchitexGoProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onUpdateBalance: (newBalance: number) => void;
  isHandsFree: boolean;
  onToggleHandsFree: (enabled: boolean) => void;
}

const ArchitexGo: React.FC<ArchitexGoProps> = ({ user, onUpdateUser, onUpdateBalance, isHandsFree, onToggleHandsFree }) => {
  const [activeTab, setActiveTab] = useState<'GIGS' | 'PROFILE' | 'QR'>('GIGS');
  const [gigs, setGigs] = useState<ServiceGig[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProvider, setIsProvider] = useState(user.isProvider || false);
  
  // Voice Simulation State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');

  useEffect(() => {
    // Load some mock gigs
    const loadGigs = async () => {
       // Create dummy available gigs
       const mockGigs: ServiceGig[] = [
           { id: 'gig-101', consumerId: 'u5', title: 'Smart Contract Audit', description: 'Review Rust code for Soroban', price: 500, status: GigStatus.OPEN, location: 'Remote', timestamp: Date.now() },
           { id: 'gig-102', consumerId: 'u8', title: 'Local Pi Node Setup', description: 'Help setup Node on PC', price: 50, status: GigStatus.OPEN, location: 'Downtown', timestamp: Date.now() - 3600000 }
       ];
       setGigs(mockGigs);
    };
    loadGigs();
  }, []);

  const handleBecomeProvider = () => {
    setIsProvider(true);
    onUpdateUser({ isProvider: true, rating: 5.0 });
    alert("You are now active on Architex Go Network!");
  };

  const handleAcceptGig = async (gigId: string) => {
    setLoading(true);
    await GigServiceContract.acceptGig(gigId, user.id);
    setGigs(prev => prev.map(g => g.id === gigId ? {...g, status: GigStatus.IN_PROGRESS, providerId: user.id} : g));
    setLoading(false);
  };

  const handleCompleteGig = async (gigId: string, price: number) => {
    setLoading(true);
    const tx = await GigServiceContract.completeGig(gigId, price);
    setGigs(prev => prev.map(g => g.id === gigId ? {...g, status: GigStatus.COMPLETED} : g));
    onUpdateBalance(user.artxBalance + tx.amount); // Receive payment minus fee
    setLoading(false);
    alert(`Gig Completed! Received ${tx.amount} ARTX (Fees deducted).`);
  };

  // Mock Voice Interaction
  const handleVoiceCommand = async () => {
    if (isListening) return;
    setIsListening(true);
    setVoiceTranscript("Listening...");
    
    // Simulate speech-to-text delay
    setTimeout(async () => {
        const simulatedCommand = "Find nearby gigs"; // Hardcoded simulation
        setVoiceTranscript(simulatedCommand);
        
        // Query Archie
        const response = await sendMessageToArchie(simulatedCommand, "ARCHITEX_GO", user.role);
        setVoiceResponse(response);
        setIsListening(false);
    }, 2000);
  };

  // --- HANDS FREE UI OVERLAY ---
  if (isHandsFree) {
      return (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-8 font-mono animate-fadeIn">
              <div className="w-full flex justify-between items-center text-cyan-500 border-b border-cyan-900 pb-4">
                  <span className="animate-pulse">● LIVE VOICE NET</span>
                  <button onClick={() => onToggleHandsFree(false)} className="border border-cyan-500 px-4 py-1 rounded hover:bg-cyan-900">EXIT MODE</button>
              </div>

              <div className="text-center space-y-8 w-full max-w-md">
                  <div className="text-6xl text-white font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  
                  <div className="h-32 flex items-center justify-center">
                     {isListening ? (
                         <div className="flex gap-2 h-10 items-end">
                             <div className="w-2 bg-cyan-400 animate-pulse h-full"></div>
                             <div className="w-2 bg-cyan-400 animate-pulse h-2/3"></div>
                             <div className="w-2 bg-cyan-400 animate-pulse h-full"></div>
                             <div className="w-2 bg-cyan-400 animate-pulse h-1/2"></div>
                             <div className="w-2 bg-cyan-400 animate-pulse h-full"></div>
                         </div>
                     ) : (
                         <div className="text-slate-500 text-xl">"Archie, check active gigs..."</div>
                     )}
                  </div>

                  {voiceResponse && (
                      <div className="bg-slate-900/80 border border-cyan-500/30 p-4 rounded-xl text-cyan-100 text-lg">
                          "{voiceResponse}"
                      </div>
                  )}
              </div>

              <button 
                onClick={handleVoiceCommand}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-transform active:scale-95 ${isListening ? 'bg-red-500 text-white' : 'bg-cyan-600 text-white'}`}
              >
                <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
              </button>
          </div>
      );
  }

  // --- STANDARD UI ---
  return (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
           <div>
               <h2 className="text-2xl font-bold text-white italic">Architex <span className="text-neon-gold">GO</span></h2>
               <p className="text-xs text-slate-400">Mobile Gig & Service Network</p>
           </div>
           <button 
            onClick={() => onToggleHandsFree(true)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-full border border-slate-500 transition"
           >
               <i className="fas fa-headset"></i> Hands-Free
           </button>
       </div>

       <div className="flex border-b border-slate-700">
            <button onClick={() => setActiveTab('GIGS')} className={`flex-1 py-3 font-bold text-sm border-b-2 transition ${activeTab === 'GIGS' ? 'border-neon-gold text-neon-gold' : 'border-transparent text-slate-500'}`}>GIG RADAR</button>
            <button onClick={() => setActiveTab('PROFILE')} className={`flex-1 py-3 font-bold text-sm border-b-2 transition ${activeTab === 'PROFILE' ? 'border-neon-gold text-neon-gold' : 'border-transparent text-slate-500'}`}>PROVIDER ID</button>
            <button onClick={() => setActiveTab('QR')} className={`flex-1 py-3 font-bold text-sm border-b-2 transition ${activeTab === 'QR' ? 'border-neon-gold text-neon-gold' : 'border-transparent text-slate-500'}`}>SCAN QR</button>
       </div>

       {activeTab === 'GIGS' && (
           <div className="space-y-4">
               {!isProvider ? (
                   <div className="text-center p-8 bg-slate-800 rounded-xl border border-dashed border-slate-600">
                       <i className="fas fa-briefcase text-4xl text-slate-500 mb-4"></i>
                       <h3 className="text-white font-bold mb-2">Become a Service Provider</h3>
                       <p className="text-slate-400 text-sm mb-4">Earn ARTX by offering local or digital services.</p>
                       <button onClick={handleBecomeProvider} className="bg-neon-gold text-black font-bold px-6 py-2 rounded hover:brightness-110">Activate Profile</button>
                   </div>
               ) : (
                   <div className="space-y-4">
                       {gigs.map(gig => (
                           <div key={gig.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between gap-4">
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <span className="text-neon-gold font-bold">{gig.title}</span>
                                       <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{gig.location}</span>
                                   </div>
                                   <p className="text-sm text-slate-400">{gig.description}</p>
                                   <div className="mt-2 text-xs text-slate-500">Posted {new Date(gig.timestamp).toLocaleTimeString()}</div>
                               </div>
                               <div className="flex flex-col items-end justify-between min-w-[120px]">
                                   <div className="text-xl font-mono font-bold text-white">{gig.price} <span className="text-sm text-slate-500">ARTX</span></div>
                                   {gig.status === GigStatus.OPEN && (
                                       <button onClick={() => handleAcceptGig(gig.id)} disabled={loading} className="w-full bg-cyan-600 text-white text-xs font-bold py-2 rounded hover:bg-cyan-500">ACCEPT GIG</button>
                                   )}
                                   {gig.status === GigStatus.IN_PROGRESS && gig.providerId === user.id && (
                                       <button onClick={() => handleCompleteGig(gig.id, gig.price)} disabled={loading} className="w-full bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-500">COMPLETE</button>
                                   )}
                                    {gig.status === GigStatus.COMPLETED && (
                                       <div className="text-green-500 text-xs font-bold"><i className="fas fa-check-double"></i> PAID</div>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
       )}

       {activeTab === 'PROFILE' && (
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
               <div className="flex items-center gap-4 mb-6">
                   <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-gold to-orange-600 flex items-center justify-center text-black font-bold text-2xl">
                       {user.username[0]}
                   </div>
                   <div>
                       <h3 className="text-xl font-bold text-white">{user.username}</h3>
                       <div className="flex items-center gap-2 text-sm text-slate-400">
                           <span>Level 5 Provider</span>
                           <i className="fas fa-star text-yellow-500"></i>
                           <span className="text-white font-bold">{user.rating || 'N/A'}</span>
                       </div>
                   </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-slate-900 p-3 rounded border border-slate-700 text-center">
                       <div className="text-2xl font-bold text-white">12</div>
                       <div className="text-xs text-slate-500 uppercase">Gigs Completed</div>
                   </div>
                   <div className="bg-slate-900 p-3 rounded border border-slate-700 text-center">
                       <div className="text-2xl font-bold text-neon-gold">98%</div>
                       <div className="text-xs text-slate-500 uppercase">Success Rate</div>
                   </div>
               </div>
               
               <div className="bg-slate-900/50 p-4 rounded border border-slate-600">
                   <h4 className="font-bold text-white mb-2 text-sm">Skills & Badges</h4>
                   <div className="flex flex-wrap gap-2">
                       <span className="bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs">Soroban Dev</span>
                       <span className="bg-purple-900/30 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-xs">Pi Validator</span>
                       <span className="bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-1 rounded text-xs">Verified Human</span>
                   </div>
               </div>
           </div>
       )}

       {activeTab === 'QR' && (
           <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl">
               <div className="w-64 h-64 bg-black p-2 rounded-lg mb-4 relative overflow-hidden">
                   {/* Mock QR Code Visual */}
                   <div className="absolute inset-0 border-[16px] border-white bg-white flex flex-wrap content-start">
                       {Array.from({length: 100}).map((_,i) => (
                           <div key={i} className={`w-[10%] h-[10%] ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}></div>
                       ))}
                       {/* Corner Markers */}
                       <div className="absolute top-4 left-4 w-12 h-12 border-4 border-black bg-white flex items-center justify-center"><div className="w-6 h-6 bg-black"></div></div>
                       <div className="absolute top-4 right-4 w-12 h-12 border-4 border-black bg-white flex items-center justify-center"><div className="w-6 h-6 bg-black"></div></div>
                       <div className="absolute bottom-4 left-4 w-12 h-12 border-4 border-black bg-white flex items-center justify-center"><div className="w-6 h-6 bg-black"></div></div>
                   </div>
                   {/* Logo Overlay */}
                   <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1">
                           <div className="w-full h-full bg-black rounded-full text-white flex items-center justify-center font-bold">A</div>
                       </div>
                   </div>
               </div>
               <h3 className="text-black font-bold text-lg mb-1">{user.username}</h3>
               <p className="text-slate-500 text-sm mb-4">Scan to Verify or Pay Provider</p>
               <button className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800 transition">
                   <i className="fas fa-download mr-2"></i> Save Badge
               </button>
           </div>
       )}
    </div>
  );
};

export default ArchitexGo;