import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, VestingSchedule, VestingCategory, Language, SystemConfig } from './types';
import ArchieBot from './components/ArchieBot';
import GodMode from './components/GodMode';
import VestingVault from './components/VestingVault';
import SocialFi from './components/SocialFi';
import IoTConnect from './components/IoTConnect';
import { checkTrustline } from './services/stellarService';
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
  isPremium: false // Set to true to bypass pay-to-load simulation
};

const INITIAL_CONFIG: SystemConfig = {
  maintenanceMode: false,
  globalAnnouncement: null,
  forcedLanguage: null,
  adsEnabled: true
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

  // Language Resolution
  const currentLang = config.forcedLanguage || lang;
  const dir = getDir(currentLang);

  // Mock Users Database for God Mode
  const [usersDb, setUsersDb] = useState<User[]>([INITIAL_USER, { ...INITIAL_USER, id: 'u2', username: 'Trader_Joe', role: UserRole.USER, isPremium: false }]);

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

  const handlePayToLoad = async () => {
    try {
      setIsLoading(true);
      await requestPiPayment(1, "Architex Pro Upgrade");
      setUser(prev => ({ ...prev, isPremium: true }));
      alert("Upgrade Successful! Welcome to Architex Pro.");
    } catch (e) {
      alert("Payment Cancelled.");
    } finally {
      setIsLoading(false);
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
                ≈ {(user.artxBalance * 1.00).toFixed(2)} Pi
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded text-sm font-bold transition">{t('send', currentLang)}</button>
                <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-bold transition">{t('receive', currentLang)}</button>
              </div>
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
          />
        );
      case 'VESTING':
        return <VestingVault schedules={vestingData} />;
      case 'SOCIAL':
        return <SocialFi currentUser={user} />;
      case 'IOT':
        return <IoTConnect />;
      default:
        return <div>View not implemented</div>;
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      
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
            <MobileNavButton icon="fa-users" active={view === 'SOCIAL'} onClick={() => setView('SOCIAL')} />
            <MobileNavButton icon="fa-vault" active={view === 'VESTING'} onClick={() => setView('VESTING')} />
            <MobileNavButton icon="fa-network-wired" active={view === 'IOT'} onClick={() => setView('IOT')} />
            {user.role === UserRole.SUPER_ADMIN && (
              <MobileNavButton icon="fa-crown" active={view === 'GOD_MODE'} onClick={() => setView('GOD_MODE')} color="text-neon-gold" />
            )}
         </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-950 relative">
          {/* Background subtle effect */}
          <div className="absolute top-0 left-0 w-full h-96 bg-cyan-900/5 blur-3xl pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-1">
                {view === 'GOD_MODE' ? t('godMode', currentLang) : 
                 view === 'IOT' ? t('iot', currentLang) : 
                 view === 'VESTING' ? t('vestingVault', currentLang) :
                 view === 'SOCIAL' ? t('socialFi', currentLang) :
                 t('dashboard', currentLang)}
              </h2>
              <p className="text-slate-400 text-sm">{t('welcome', currentLang)}, {user.username}.</p>
            </header>
            
            {renderContent()}
          </div>
        </main>
      </div>

      {/* AI Companion */}
      <ArchieBot currentView={view} userRole={user.role} language={currentLang} />
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