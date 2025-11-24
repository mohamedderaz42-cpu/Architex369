import React, { useState } from 'react';
import { User, CommerceOrder, ShippingStatus, UserRole } from '../types';
import { CommerceContract, ArbitrationContract } from '../services/stellarService';

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

  // --- PHASE 7 LINK: DISPUTE BUTTON ---
  const handleFileDispute = async (orderId: string) => {
      if (!window.confirm("Are you sure you want to escalate this to the Arbitration Council? This will freeze funds.")) return;
      setLoading(true);
      try {
          // 1. Update Order Status locally to reflect UI immediately
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: ShippingStatus.DISPUTED } : o));
          
          // 2. Call Contract to File Dispute
          await ArbitrationContract.fileDispute(user.id, orderId, "Item not received / Damaged");
          
          // 3. Update Shipping Status on Commerce Contract (Mock)
          await CommerceContract.updateShipping(orderId, ShippingStatus.DISPUTED);
          
          alert("Dispute Filed. An Arbiter will be assigned shortly in the Arbitration Council.");
      } catch (e) {
          alert("Failed to file dispute.");
      } finally {
          setLoading(false);
      }
  };

  const renderStatusBadge = (status: ShippingStatus) => {
      const colors = {
          [ShippingStatus.PENDING]: 'bg-slate-700 text-slate-300',
          [ShippingStatus.PROCESSING]: 'bg-blue-900 text-blue-300',
          [ShippingStatus.SHIPPED]: 'bg-purple-900 text-purple-300',
          [ShippingStatus.DELIVERED]: 'bg-green-900 text-green-300',
          [ShippingStatus.DISPUTED]: 'bg-red-900 text-red-300 animate-pulse'
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
            <div className="space-y-8">
                {/* Product Grid */}
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

                {/* Buyer Orders List */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4">My Orders</h3>
                    {orders.filter(o => o.buyerId === user.id).length === 0 ? (
                        <div className="text-slate-500 text-sm">No active orders.</div>
                    ) : (
                        <div className="space-y-4">
                            {orders.filter(o => o.buyerId === user.id).map(order => (
                                <div key={order.id} className="bg-slate-900 p-4 rounded border border-slate-700 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-white">{order.item}</div>
                                        <div className="text-xs text-slate-500">ID: {order.id}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {renderStatusBadge(order.status)}
                                        {/* DISPUTE BUTTON - Phase 7 Link */}
                                        {order.status !== ShippingStatus.DISPUTED && order.status !== ShippingStatus.DELIVERED && (
                                            <button 
                                                onClick={() => handleFileDispute(order.id)}
                                                className="text-xs bg-red-900/30 text-red-400 border border-red-600/30 px-3 py-1 rounded hover:bg-red-900"
                                            >
                                                File Dispute
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'VENDOR_CONSOLE' && (
            <div className="space-y-6">
                {!user.vendorVerified ? (
                    <div className="bg-slate-800 p-8 text-center rounded-xl border border-slate-700">
                        <i className="fas fa-store text-5xl text-slate-500 mb-4"></i>
                        <h3 className="text-xl font-bold text-white mb-2">Vendor KYB Verification</h3>
                        <p className="text-slate-400 mb-4 max-w-md mx-auto">To list items and access the ERP bridge, you must verify your business identity on the Pi Network.</p>
                        <div className="max-w-sm mx-auto space-y-4">
                            <input 
                                type="text" 
                                placeholder="Business Name" 
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white"
                            />
                            <button 
                                onClick={handleRegisterVendor}
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded transition"
                            >
                                {loading ? 'Verifying...' : 'Start KYB Process'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                         {/* ERP Sync */}
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                             <div>
                                 <h3 className="font-bold text-white">ERP Bridge</h3>
                                 <div className="text-xs text-slate-500">
                                     {user.erpConnected ? <span className="text-green-400">● Connected to Oracle NetSuite</span> : <span className="text-slate-500">● Not Connected</span>}
                                 </div>
                             </div>
                             <button 
                                 onClick={handleSyncERP}
                                 disabled={erpSyncing || user.erpConnected}
                                 className={`px-4 py-2 rounded font-bold text-sm ${user.erpConnected ? 'bg-green-900/20 text-green-400 border border-green-500/30' : 'bg-slate-700 text-white'}`}
                             >
                                 {erpSyncing ? 'Syncing...' : user.erpConnected ? 'Synced' : 'Connect ERP'}
                             </button>
                         </div>

                         {/* Vendor Order Management */}
                         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                             <h3 className="font-bold text-white mb-4">Incoming Orders</h3>
                             {orders.length === 0 ? (
                                 <div className="text-slate-500 text-sm">No orders yet.</div>
                             ) : (
                                 <div className="space-y-4">
                                     {orders.map(order => (
                                         <div key={order.id} className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                                             <div>
                                                 <div className="font-bold text-white">{order.item}</div>
                                                 <div className="text-xs text-slate-500">Total: {order.amount} ARTX</div>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 {renderStatusBadge(order.status)}
                                                 
                                                 {order.status === ShippingStatus.PENDING && (
                                                     <button onClick={() => handleUpdateShipping(order.id, ShippingStatus.PROCESSING)} className="text-xs bg-blue-900/30 text-blue-400 border border-blue-500/30 px-3 py-1 rounded">Process</button>
                                                 )}
                                                 {order.status === ShippingStatus.PROCESSING && (
                                                     <button onClick={() => handleUpdateShipping(order.id, ShippingStatus.SHIPPED)} className="text-xs bg-purple-900/30 text-purple-400 border border-purple-500/30 px-3 py-1 rounded">Ship</button>
                                                 )}
                                                 {order.status === ShippingStatus.SHIPPED && (
                                                     <button onClick={() => handleUpdateShipping(order.id, ShippingStatus.DELIVERED)} className="text-xs bg-green-900/30 text-green-400 border border-green-500/30 px-3 py-1 rounded">Mark Delivered</button>
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
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                     <i className="fas fa-shield-virus text-9xl text-green-500"></i>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-4">Vendor Shield Protocol</h3>
                 <p className="text-slate-400 mb-6 text-sm">
                     The Vendor Shield creates a decentralized micro-insurance pool. 2% of every transaction is locked until successful delivery is verified.
                 </p>
                 <div className="grid grid-cols-2 gap-4 max-w-md">
                     <div className="bg-slate-900 p-4 rounded border border-slate-700">
                         <div className="text-xs text-slate-500 uppercase">Active Coverage</div>
                         <div className="text-xl font-mono text-white">{(orders.length * 500).toLocaleString()} ARTX</div>
                     </div>
                     <div className="bg-slate-900 p-4 rounded border border-slate-700">
                         <div className="text-xs text-slate-500 uppercase">Claims Rate</div>
                         <div className="text-xl font-mono text-green-400">0.0%</div>
                     </div>
                 </div>
            </div>
        )}
    </div>
  );
};

export default CommerceHub;