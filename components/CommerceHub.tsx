import React, { useState } from 'react';
import { User, CommerceOrder, ShippingStatus, UserRole } from '../types';
import { CommerceContract } from '../services/stellarService';

interface CommerceHubProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onUpdateBalance: (newBalance: number) => void;
}

const CommerceHub: React.FC<CommerceHubProps> = ({ user, onUpdateUser, onUpdateBalance }) => {
  const [activeTab, setActiveTab] = useState<'MARKET' | 'VENDOR_CONSOLE' | 'SHIELD'>('MARKET');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  
  // Vendor Registration State
  const [vendorName, setVendorName] = useState('');
  
  // Create Order Mock Data
  const [selectedItem, setSelectedItem] = useState('');

  // ERP Sync State
  const [erpSyncing, setErpSyncing] = useState(false);

  // --- Handlers ---

  const handleRegisterVendor = async () => {
    if (!vendorName) return;
    setLoading(true);
    try {
      await CommerceContract.registerVendor(user.id, { name: vendorName });
      onUpdateUser({ role: UserRole.VENDOR, vendorVerified: true });
      alert("KYB Verification Successful! You are now a Verified Vendor.");
    } catch (e) {
      alert("Verification Failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (item: string, price: number) => {
    if (user.artxBalance < price) return alert("Insufficient ARTX.");
    setLoading(true);
    try {
      // Create Order
      const newOrder = await CommerceContract.createOrder(user.id, 'vendor-001', item, price);
      setOrders(prev => [newOrder, ...prev]);
      
      // Deduct Balance (Price + Insurance)
      onUpdateBalance(user.artxBalance - (newOrder.amount + newOrder.insuranceFee));
      
      alert(`Order Placed for ${item}. Funds held in Escrow Shield.`);
    } catch (e) {
      alert("Order Creation Failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShipping = async (orderId: string, status: ShippingStatus) => {
    setLoading(true);
    try {
       const result = await CommerceContract.updateShipping(orderId, status);
       setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
       
       if (result && result.type === 'COMMERCE_RELEASE') {
           alert("Smart Release Triggered: Funds released to Vendor wallet.");
       }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSyncERP = async () => {
      setErpSyncing(true);
      await CommerceContract.syncERP(user.id);
      onUpdateUser({ erpConnected: true });
      setErpSyncing(false);
  };

  const renderStatusBadge = (status: ShippingStatus) => {
      const colors = {
          [ShippingStatus.PENDING]: 'bg-slate-700 text-slate-300',
          [ShippingStatus.PROCESSING]: 'bg-blue-900 text-blue-300',
          [ShippingStatus.SHIPPED]: 'bg-purple-900 text-purple-300',
          [ShippingStatus.DELIVERED]: 'bg-green-900 text-green-300',
          [ShippingStatus.DISPUTED]: 'bg-red-900 text-red-300'
      };
      return <span className={`px-2 py-1 rounded text-xs font-bold ${colors[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
        {/* Header Tabs */}
        <div className="flex border-b border-slate-700">
            <button onClick={() => setActiveTab('MARKET')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'MARKET' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>MARKETPLACE</button>
            <button onClick={() => setActiveTab('VENDOR_CONSOLE')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'VENDOR_CONSOLE' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-white'}`}>VENDOR CONSOLE</button>
            <button onClick={() => setActiveTab('SHIELD')} className={`px-6 py-3 font-bold text-sm transition ${activeTab === 'SHIELD' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-500 hover:text-white'}`}>VENDOR SHIELD</button>
        </div>

        {activeTab === 'MARKET' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { name: 'Titanium Hardware Wallet', price: 500, img: 'fa-microchip' },
                    { name: 'Palladium Node License', price: 1200, img: 'fa-server' },
                    { name: 'Architex Merch Pack', price: 150, img: 'fa-tshirt' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition group">
                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <i className={`fas ${item.img} text-cyan-400 text-xl`}></i>
                        </div>
                        <h3 className="text-white font-bold mb-1">{item.name}</h3>
                        <div className="text-2xl font-mono text-slate-300 mb-4">{item.price} <span className="text-xs text-slate-500">ARTX</span></div>
                        
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                            <span><i className="fas fa-shield-alt text-green-500"></i> Shield Insured</span>
                            <span>Fee: {(item.price * 0.02).toFixed(1)} ARTX</span>
                        </div>

                        <button 
                            onClick={() => handleCreateOrder(item.name, item.price)}
                            disabled={loading}
                            className="w-full bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 py-2 rounded font-bold hover:bg-cyan-500 hover:text-white transition"
                        >
                            {loading ? 'Processing...' : 'Secure Buy'}
                        </button>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'VENDOR_CONSOLE' && (
            <div className="space-y-6">
                {!user.vendorVerified ? (
                    <div className="bg-slate-800 p-8 rounded-xl border border-purple-500/30 text-center max-w-2xl mx-auto">
                        <i className="fas fa-store-alt text-5xl text-purple-400 mb-4"></i>
                        <h2 className="text-2xl font-bold text-white mb-2">Become a Verified Vendor</h2>
                        <p className="text-slate-400 mb-6">Pass the Pi KYB (Know Your Business) check to unlock the Vendor Console and ERP Sync.</p>
                        
                        <input 
                            type="text" 
                            placeholder="Business Legal Name" 
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white mb-4 focus:border-purple-500 outline-none"
                        />
                        <button 
                            onClick={handleRegisterVendor}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded transition w-full"
                        >
                            {loading ? 'Verifying...' : 'Submit for KYB Verification'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                         {/* ERP Sync */}
                         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <i className="fas fa-network-wired text-purple-400"></i> Enterprise ERP Sync
                                </h3>
                                <p className="text-xs text-slate-400">Connect SAP/Oracle for automated inventory management.</p>
                            </div>
                            <button 
                                onClick={handleSyncERP}
                                disabled={erpSyncing || user.erpConnected}
                                className={`px-4 py-2 rounded text-sm font-bold border ${user.erpConnected ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-purple-500 text-purple-400 bg-purple-900/20'}`}
                            >
                                {user.erpConnected ? 'ERP ONLINE' : erpSyncing ? 'SYNCING...' : 'CONNECT ERP'}
                            </button>
                         </div>

                         {/* Active Orders List */}
                         <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                             <div className="p-4 border-b border-slate-700 font-bold text-white">Incoming Orders</div>
                             {orders.length === 0 ? (
                                 <div className="p-8 text-center text-slate-500">No active orders found.</div>
                             ) : (
                                 <div className="divide-y divide-slate-700">
                                     {orders.map(order => (
                                         <div key={order.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                             <div>
                                                 <div className="font-bold text-white">{order.item}</div>
                                                 <div className="text-xs text-slate-400">ID: {order.id} | Buyer: {order.buyerId.substring(0,6)}...</div>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 <div className="text-right">
                                                     <div className="font-mono text-white">{order.amount} ARTX</div>
                                                     {renderStatusBadge(order.status)}
                                                 </div>
                                                 
                                                 {/* Vendor Actions */}
                                                 {order.status === ShippingStatus.PENDING && (
                                                     <button onClick={() => handleUpdateShipping(order.id, ShippingStatus.SHIPPED)} className="text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded hover:bg-blue-800">MARK SHIPPED</button>
                                                 )}
                                                 {order.status === ShippingStatus.SHIPPED && (
                                                     <button onClick={() => handleUpdateShipping(order.id, ShippingStatus.DELIVERED)} className="text-xs bg-green-900 text-green-300 px-3 py-1 rounded hover:bg-green-800">CONFIRM DELIVERY</button>
                                                 )}
                                                 {order.status === ShippingStatus.DELIVERED && (
                                                     <div className="text-xs text-green-500 font-bold"><i className="fas fa-check"></i> FUNDS RELEASED</div>
                                                 )}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'SHIELD' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-900/20 to-slate-900 p-6 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center border border-green-500">
                            <i className="fas fa-shield-alt text-3xl text-green-400"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Vendor Shield™</h2>
                            <p className="text-sm text-slate-400">Decentralized Shipping Protection</p>
                        </div>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex gap-2"><i className="fas fa-check text-green-500 mt-1"></i> Funds held in Smart Escrow until delivery.</li>
                        <li className="flex gap-2"><i className="fas fa-check text-green-500 mt-1"></i> Micro-insurance (2%) covers lost shipments.</li>
                        <li className="flex gap-2"><i className="fas fa-check text-green-500 mt-1"></i> Automated dispute resolution via Multi-Sig.</li>
                    </ul>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                     <h3 className="font-bold text-white mb-4">Your Protection Stats</h3>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                             <span className="text-slate-400">Active Escrows</span>
                             <span className="text-white font-mono">{orders.filter(o => o.status !== ShippingStatus.DELIVERED).length}</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                             <span className="text-slate-400">Total Insured Value</span>
                             <span className="text-white font-mono">{orders.reduce((acc, o) => acc + o.amount, 0).toLocaleString()} ARTX</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <span className="text-slate-400">Shield Status</span>
                             <span className="text-green-400 font-bold uppercase">Active</span>
                         </div>
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CommerceHub;
