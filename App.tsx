import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, VestingSchedule, VestingCategory, Language, SystemConfig } from './types';
import ArchieBot from './components/ArchieBot';
import GodMode from './components/GodMode';
import VestingVault from './components/VestingVault';
import SocialFi from './components/SocialFi';
import IoTConnect from './components/IoTConnect';
import DeFiHub from './components/DeFiHub'; 
import CommerceHub from './components/CommerceHub'; 
import ArchitexGo from './components/ArchitexGo'; 
import ArbitrationCouncil from './components/ArbitrationCouncil'; 
import EnterprisePortal from './components/EnterprisePortal';
import { checkTrustline, UtilityContracts, OraclePriceFeed, SecurityContract } from './services/stellarService';
import { t, getDir } from './services/localization';
import { requestPiPayment, showPiAd } from './services/piService';

// Initial Mock Data
const INITIAL_USER: User = {
  id: 'u1',
  username: 'SuperAdmin_Arch',
  role: UserRole.SUPER_ADMIN,
  piWalletAddress: 'GBIZ...ARCH',
  artxBalance: 15000,
  hasTrustline: false,
  kycVerified: true,
  isPremium: false,
  stakedAmount: 5000,
  acceleratorExpiry: 0,
  vendorVerified: false,
  isProvider: false,
  rating: 0,
  reputationScore: 950,
  badges: [],
  isFrozen: false,
  companyName: 'Architex Foundation'
};

const INITIAL_CONFIG: SystemConfig = {
  maintenanceMode: false,
  globalAnnouncement: null,
  forcedLanguage: null,
  adsEnabled: true,
  feeRoutingTarget: 'TREASURY'
};

const INITIAL_VESTING: VestingSchedule[] = [
  { category: VestingCategory.LIQUIDITY_POOL, totalAllocation: 20000000, unlocked: 20000000, locked: 0, releaseRule: 'AMM Locked', color: '#06b6d4' },
  { category: VestingCategory.REWARDS_VAULT, totalAllocation: 35000000, unlocked: 150000, locked: 34850000, releaseRule: 'Daily Emission', color: '#8b5cf6' },
  { category: VestingCategory.TEAM_FOUNDERS, totalAllocation: 20000000, unlocked: 0, locked: 20000000, releaseRule: '6 Mo Cliff / 24 Mo Lin', color: '#f59e0b' },
  { category: VestingCategory.STRATEGIC_RESERVE, totalAllocation: 15000000, unlocked: 0, locked: 15000000, releaseRule: 'Multi-Sig Only', color: '#64748b' },
  { category: VestingCategory.MARKETING, totalAllocation: 10000000, unlocked: 200000, locked: 9800000, releaseRule: '1% Monthly', color: '#ec4899' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [totalSupply, setTotalSupply] = useState(100000000);
  const [vestingData, setVestingData] = useState<VestingSchedule[]>(INITIAL_VESTING);
  const [lang, setLang] = useState<Language>('en');
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  
  // Phase 3.3: Monitor Bot State
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Phase 6: Hands Free Mode
  const [isHandsFree, setIsHandsFree] = useState(false);

  // Language Resolution
  const currentLang = config.forcedLanguage || lang;
  const dir = getDir(currentLang);

  // Mock Users Database for God Mode
  const [usersDb, setUsersDb] = useState<User[]>([INITIAL_USER, { ...INITIAL_USER, id: 'u2', username: 'Trader_Joe', role: UserRole.USER, isPremium: false, acceleratorExpiry: 0 }]);

  // Simulate Pi Network Login & Pay-to-Load Protocol
  useEffect(() => {
    const initAuth = async () => {
      // Trustline Check
      const hasTrust = await checkTrustline(user.piWalletAddress);
      setUser(prev => ({ ...prev, hasTrustline: hasTrust }));
      
      // Pay-to-Load / Premium Check simulation
      if (!user.isPremium && user.role !== UserRole.SUPER_ADMIN) {
        // Trigger Interstitial Ad if free user
        if (config.adsEnabled) {
          await showPiAd();
        }
      }
    };
    initAuth();
  }, [user.piWalletAddress, user.isPremium, config.adsEnabled]);

  // Phase 3.3: Treasury Monitor Bot Logic
  useEffect(() => {
    const monitorInterval = setInterval(async () => {
        const oracle = await OraclePriceFeed.getRate('ARTX/Pi');
        // Simple Logic: Alert if price fluctuates drastically (Simulated)
        if (oracle.confidence < 0.8) {
            setAlertMessage("WARNING: Price volatility detected by Treasury Monitor.");
            setTimeout(() => setAlertMessage(null), 5000);
        }
    }, 30000);
    return () => clearInterval(monitorInterval);
  }, []);

  const handlePayToLoad = async () => {
    try {
      setIsLoading(true);
      const amount = 1; // 1 Pi
      // 1. Request Payment
      await requestPiPayment(amount, "Architex Pro Upgrade");
      
      // 2. Route Revenue to Escrow/Treasury (Phase 3.2)
      await UtilityContracts.depositRevenue(amount);

      setUser(prev => ({ ...prev, isPremium: true }));
      alert("Upgrade Successful! Revenue routed to Protocol Treasury.");
    } catch (e) {
      alert("Payment Cancelled.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePanic = async () => {
      if (window.confirm("ARE YOU SURE? This will immediately FREEZE your account assets. Only Multi-Sig Admin can unlock.")) {
          await SecurityContract.triggerPanic(user.id);
          setUser(prev => ({ ...prev, isFrozen: true }));
          setAlertMessage("SECURITY LOCKDOWN: ACCOUNT FROZEN");
      }
  };

  const toggleRole = () => {
    // For demo purposes only
    const newRole = user.role === UserRole.SUPER_ADMIN ? UserRole.USER : UserRole.SUPER_ADMIN;
    setUser({ ...user, role: newRole });
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsersDb(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (userId === user.id) setUser(prev => ({ ...prev, role: newRole }));
  };

  // Maintenance Mode Guard
  if (config.maintenanceMode && user.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 text-white font-mono">
        <div className="text-4xl text-neon-gold mb-4"><i className="fas fa-tools"></i></div>
        <h1 className="text-2xl font-bold">SYSTEM MAINTENANCE</h1>
        <p className="text-slate-400 mt-2">Architex Protocol is undergoing upgrades. Check back soon.</p>
      </div>
    );
  }

  // Account Frozen Guard (Panic Button Triggered)
  if (user.isFrozen) {
      return (
        <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center text-center p-6 text-white font-mono border-8 border-red-600">
            <div className="text-6xl text-red-500 mb-6 animate-pulse"><i className="fas fa-lock"></i></div>
            <h1 className="text-4xl font-bold mb-4">ACCOUNT FROZEN</h1>
            <p className="text-red-200 mb-8 max-w-md">
                Security Protocol 7 has been triggered. Your assets are safe but locked. Please contact Arbitration Council for identity verification unlock.
            </p>
            <div className="bg-black p-4 rounded text-xs text-red-500 font-mono">
                REF: PANIC_TX_{user.id}
            </div>
        </div>
      );
  }

  const renderContent = () => {
    switch (view) {
      case 'DASHBOARD':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Wallet Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
              <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">{t('balance', currentLang)}</h3>
              <div className="text-4xl font-mono text-white font-bold mb-1">
                {user.artxBalance.toLocaleString()} <span className="text-cyan-500 text-lg">ARTX</span>
              </div>
              <div className="text-xs text-slate-500 font-mono mb-4">
                ≈ {(user.artxBalance * 1.05).toFixed(2)} Pi
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded text-sm font-bold transition">{t('send', currentLang)}</button>
                <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-bold transition">{t('receive', currentLang)}</button>
              </div>
            </div>

            {/* Proof of Install (Phase 4) */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <i className="fas fa-mobile-alt text-6xl text-white"></i>
                </div>
                <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Device Security</h3>
                <div className="flex items-center gap-3 mb-4">
                     <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                         <i className="fas fa-check text-green-500 text-xl"></i>
                     </div>
                     <div>
                         <div className="font-bold text-white">Proof of Install</div>
                         <div className="text-xs text-slate-500">Verified Mobile Integrity</div>
                     </div>
                </div>
                <button disabled className="w-full bg-slate-700/50 text-slate-400 border border-slate-600 py-2 rounded text-xs font-bold cursor-not-allowed">
                    VERIFIED BADGE ACTIVE
                </button>
            </div>

            {/* Trustline Status */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">{t('trustline', currentLang)}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${user.hasTrustline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                  <span className="text-white font-bold">{user.hasTrustline ? t('trustlineConnected', currentLang) : t('trustlineMissing', currentLang)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {user.hasTrustline 
                    ? t('trustlineDesc', currentLang)
                    : t('trustlineMissingDesc', currentLang)}
                </p>
              </div>
              {!user.hasTrustline && (
                 <button className="mt-4 w-full bg-neon-gold/20 text-neon-gold border border-neon-gold hover:bg-neon-gold hover:text-black py-2 rounded text-sm font-bold transition">
                   {t('addTrustline', currentLang)} (+0.5 XLM Reserve)
                 </button>
              )}
            </div>

             {/* Ad Placeholder (Pi Ads) or Premium Status */}
            {user.isPremium ? (
              <div className="bg-gradient-to-br from-purple-900/50 to-slate-900 p-6 rounded-xl border border-purple-500/30 flex items-center justify-center">
                 <div className="text-center">
                   <div className="text-purple-400 text-3xl mb-2"><i className="fas fa-diamond"></i></div>
                   <h3 className="text-white font-bold">Palladium Pro</h3>
                   <p className="text-xs text-purple-300">Active Subscription</p>
                 </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => showPiAd()}>
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                 <div className="text-center relative z-10">
                   <p className="text-xs text-slate-600 uppercase tracking-widest mb-1">{t('sponsored', currentLang)}</p>
                   <h4 className="text-white font-bold">{t('piAds', currentLang)}</h4>
                   <p className="text-xs text-slate-500 mt-2">{t('supportEco', currentLang)}</p>
                 </div>
              </div>
            )}
          </div>
        );
      case 'GOD_MODE':
        if (user.role !== UserRole.SUPER_ADMIN) return <div className="text-red-500 p-10 text-center">ACCESS DENIED</div>;
        return (
          <GodMode 
            supply={totalSupply} 
            onSupplyChange={setTotalSupply} 
            vestingData={vestingData}
            systemConfig={config}
            onConfigChange={setConfig}
            users={usersDb}
            onUpdateRole={updateUserRole}
            currentUser={user}
          />
        );
      case 'VESTING':
        return <VestingVault schedules={vestingData} />;
      case 'SOCIAL':
        return <SocialFi currentUser={user} language={currentLang} />;
      case 'IOT':
        return <IoTConnect />;
      case 'DEFI':
        return (
            <DeFiHub 
                user={user} 
                onUpdateBalance={(bal) => setUser(prev => ({...prev, artxBalance: bal}))} 
                onUpdateStaked={(amt) => setUser(prev => ({...prev, stakedAmount: amt}))}
                onUpdateAccelerator={(exp) => setUser(prev => ({...prev, acceleratorExpiry: exp}))}
            />
        );
      case 'COMMERCE':
        return (
            <CommerceHub 
                user={user}
                onUpdateUser={(u) => setUser(prev => ({...prev, ...u}))}
                onUpdateBalance={(bal) => setUser(prev => ({...prev, artxBalance: bal}))}
            />
        );
      case 'ARCHITEX_GO':
        return (
          <ArchitexGo 
            user={user}
            onUpdateUser={(u) => setUser(prev => ({...prev, ...u}))}
            onUpdateBalance={(bal) => setUser(prev => ({...prev, artxBalance: bal}))}
            isHandsFree={isHandsFree}
            onToggleHandsFree={setIsHandsFree}
          />
        );
      case 'ARBITRATION':
          return (
              <ArbitrationCouncil 
                  user={user}
                  onUpdateUser={(u) => setUser(prev => ({...prev, ...u}))}
                  onUpdateBalance={(bal) => setUser(prev => ({...prev, artxBalance: bal}))}
              />
          );
      case 'ENTERPRISE':
          return (
              <EnterprisePortal 
                  user={user}
                  onUpdateUser={(u) => setUser(prev => ({...prev, ...u}))}
                  onUpdateBalance={(bal) => setUser(prev => ({...prev, artxBalance: bal}))}
              />
          );
      default:
        return <div>View not implemented</div>;
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Alert Overlay */}
      {alertMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce font-bold flex items-center gap-3">
              <i className="fas fa-exclamation-triangle"></i>
              {alertMessage}
          </div>
      )}

      {/* Panic Button (Fixed Bottom Right) */}
      {!isHandsFree && !user.isFrozen && (
          <button 
            onClick={handlePanic}
            className="fixed bottom-6 right-6 md:right-auto md:left-6 z-50 w-14 h-14 rounded-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center text-white text-2xl hover:bg-red-700 hover:scale-110 transition active:scale-95 border-4 border-red-800"
            title="EMERGENCY FREEZE"
          >
              <i className="fas fa-radiation"></i>
          </button>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <span className="text-white font-bold -rotate-45 text-lg">A</span>
          </div>
          <h1 className="text-xl font-bold tracking-wider text-white hidden md:block">
            ARCHITEX <span className="text-cyan-500 text-xs font-mono ml-1">PALLADIUM</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Pay-to-Load / Premium Button */}
           {!user.isPremium && (
             <button 
               onClick={handlePayToLoad} 
               disabled={isLoading}
               className="hidden md:flex items-center gap-2 bg-gradient-to-r from-neon-gold to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold hover:brightness-110"
             >
               {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-crown"></i>}
               Upgrade to Pro (1 Pi)
             </button>
           )}

           <button onClick={toggleLang} className="text-xs text-slate-400 hover:text-white font-mono uppercase border border-slate-700 px-2 py-1 rounded">
             {currentLang}
           </button>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
             <div className="w-2 h-2 rounded-full bg-green-400"></div>
             <span className="text-xs text-slate-400 font-mono">{t('piMainnet', currentLang)}</span>
          </div>
          
          <button 
            onClick={toggleRole}
            className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-400 hover:text-white"
          >
            {t('role', currentLang)}: {user.role}
          </button>

          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-500 overflow-hidden">
             <img src={`https://picsum.photos/seed/${user.username}/200`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 hidden md:flex flex-col gap-2">
          <MenuButton icon="fa-home" label={t('dashboard', currentLang)} active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
          <MenuButton icon="fa-coins" label="DeFi Hub" active={view === 'DEFI'} onClick={() => setView('DEFI')} />
          <MenuButton icon="fa-store" label="Commerce" active={view === 'COMMERCE'} onClick={() => setView('COMMERCE')} />
          <MenuButton icon="fa-running" label="Architex Go" active={view === 'ARCHITEX_GO'} onClick={() => setView('ARCHITEX_GO')} />
          <MenuButton icon="fa-balance-scale" label="Arbitration" active={view === 'ARBITRATION'} onClick={() => setView('ARBITRATION')} />
          <MenuButton icon="fa-building" label="Enterprise" active={view === 'ENTERPRISE'} onClick={() => setView('ENTERPRISE')} />
          <MenuButton icon="fa-users" label={t('socialFi', currentLang)} active={view === 'SOCIAL'} onClick={() => setView('SOCIAL')} />
          <MenuButton icon="fa-vault" label={t('vestingVault', currentLang)} active={view === 'VESTING'} onClick={() => setView('VESTING')} />
          <MenuButton icon="fa-network-wired" label={t('iot', currentLang)} active={view === 'IOT'} onClick={() => setView('IOT')} />
          
          {user.role === UserRole.SUPER_ADMIN && (
            <>
              <div className="my-2 border-t border-slate-800"></div>
              <div className="px-4 py-2 text-xs text-slate-500 font-bold uppercase">{t('centralCommand', currentLang)}</div>
              <MenuButton icon="fa-crown" label={t('godMode', currentLang)} active={view === 'GOD_MODE'} onClick={() => setView('GOD_MODE')} color="text-neon-gold" />
            </>
          )}
        </aside>

        {/* Mobile Navigation Bar */}
         <div className="md:hidden flex overflow-x-auto gap-2 p-2 bg-slate-900 border-b border-slate-800">
            <MobileNavButton icon="fa-home" active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
            <MobileNavButton icon="fa-coins" active={view === 'DEFI'} onClick={() => setView('DEFI')} />
            <MobileNavButton icon="fa-store" active={view === 'COMMERCE'} onClick={() => setView('COMMERCE')} />
            <MobileNavButton icon="fa-running" active={view === 'ARCHITEX_GO'} onClick={() => setView('ARCHITEX_GO')} />
            <MobileNavButton icon="fa-building" active={view === 'ENTERPRISE'} onClick={() => setView('ENTERPRISE')} />
            <MobileNavButton icon="fa-users" active={view === 'SOCIAL'} onClick={() => setView('SOCIAL')} />
            <MobileNavButton icon="fa-vault" active={view === 'VESTING'} onClick={() => setView('VESTING')} />
            {user.role === UserRole.SUPER_ADMIN && (
              <MobileNavButton icon="fa-crown" active={view === 'GOD_MODE'} onClick={() => setView('GOD_MODE')} color="text-neon-gold" />
            )}
         </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-950 relative">
          {/* Background subtle effect */}
          <div className="absolute top-0 left-0 w-full h-96 bg-cyan-900/5 blur-3xl pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Header hidden in Hands Free mode is handled inside ArchitexGo component */}
            {!isHandsFree && (
              <header className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-1">
                  {view === 'GOD_MODE' ? t('godMode', currentLang) : 
                   view === 'IOT' ? t('iot', currentLang) : 
                   view === 'VESTING' ? t('vestingVault', currentLang) :
                   view === 'SOCIAL' ? t('socialFi', currentLang) :
                   view === 'DEFI' ? 'DeFi Economy' :
                   view === 'COMMERCE' ? 'Commerce Hub' :
                   view === 'ARCHITEX_GO' ? 'Gig Network' :
                   view === 'ARBITRATION' ? 'Arbitration Council' :
                   view === 'ENTERPRISE' ? 'Enterprise Portal' :
                   t('dashboard', currentLang)}
                </h2>
                <p className="text-slate-400 text-sm">{t('welcome', currentLang)}, {user.username}.</p>
              </header>
            )}
            
            {renderContent()}
          </div>
        </main>
      </div>

      {/* AI Companion - Hide in hands free mode as it has its own overlay */}
      {!isHandsFree && <ArchieBot currentView={view} userRole={user.role} language={currentLang} />}
    </div>
  );
};

const MenuButton = ({ icon, label, active, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group w-full ${
      active ? 'bg-cyan-900/20 text-white shadow-lg shadow-cyan-900/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <i className={`fas ${icon} w-5 text-center ${active ? (color || 'text-cyan-400') : 'group-hover:text-cyan-400'} transition-colors`}></i>
    <span className="font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>}
  </button>
);

const MobileNavButton = ({ icon, active, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 min-w-[60px] flex items-center justify-center py-3 rounded-lg transition ${
      active ? 'bg-cyan-900/20 text-white' : 'text-slate-400 bg-slate-800'
    }`}
  >
    <i className={`fas ${icon} ${active ? (color || 'text-cyan-400') : ''}`}></i>
  </button>
);

export default App;