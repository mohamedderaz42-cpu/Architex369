import React, { useState, useEffect } from 'react';
import { IoTDevice } from '../types';

const MOCK_DEVICES: IoTDevice[] = [
  { id: 'dev-001', name: 'HQ Main Gate', type: 'ACCESS_POINT', status: 'ONLINE', location: 'Zone A', lastPing: Date.now() },
  { id: 'dev-002', name: 'Lobby Sensor Array', type: 'SENSOR', status: 'ONLINE', location: 'Zone A', lastPing: Date.now() },
  { id: 'dev-003', name: 'Executive Drone Alpha', type: 'DRONE', status: 'MAINTENANCE', location: 'Hangar 1', lastPing: Date.now() - 50000 },
  { id: 'dev-004', name: 'Conf Room Display', type: 'DISPLAY', status: 'OFFLINE', location: 'Zone B', lastPing: Date.now() - 900000 },
];

const IoTConnect: React.FC = () => {
  const [devices, setDevices] = useState<IoTDevice[]>(MOCK_DEVICES);
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      // Simulate finding a new device
      if (Math.random() > 0.7) {
        const newDev: IoTDevice = {
          id: `dev-${Date.now()}`,
          name: 'New AR Marker',
          type: 'SENSOR',
          status: 'ONLINE',
          location: 'Nearby',
          lastPing: Date.now()
        };
        setDevices(prev => [...prev, newDev]);
      }
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ONLINE': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'MAINTENANCE': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'OFFLINE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-cyan-500">IoT</span> Grid
          </h2>
          <p className="text-xs font-mono text-slate-400">Physical Integration & Asset Tracking</p>
        </div>
        <button 
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 px-4 py-2 rounded hover:bg-cyan-900/50 transition disabled:opacity-50"
        >
          <i className={`fas fa-radar ${scanning ? 'animate-spin' : ''}`}></i>
          {scanning ? 'Scanning...' : 'Scan Network'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => (
          <div key={device.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
              <i className="fas fa-microchip text-4xl text-white"></i>
            </div>
            
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600">
                    <i className={`fas ${device.type === 'DRONE' ? 'fa-plane' : device.type === 'SENSOR' ? 'fa-wifi' : device.type === 'ACCESS_POINT' ? 'fa-door-closed' : 'fa-tv'} text-slate-300`}></i>
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-200 text-sm">{device.name}</h3>
                   <span className="text-xs text-slate-500 font-mono">ID: {device.id}</span>
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(device.status)}`}>
                {device.status}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <i className="fas fa-map-marker-alt"></i> {device.location}
              </span>
            </div>
          </div>
        ))}

        {/* AR Trigger Card */}
        <div className="bg-slate-800/50 border border-dashed border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-800 transition cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-2 text-purple-400">
            <i className="fas fa-vr-cardboard text-xl"></i>
          </div>
          <h3 className="font-bold text-slate-300 text-sm">Launch AR Viewer</h3>
          <p className="text-xs text-slate-500 mt-1">Scan QR Codes to view metadata</p>
        </div>
      </div>
    </div>
  );
};

export default IoTConnect;