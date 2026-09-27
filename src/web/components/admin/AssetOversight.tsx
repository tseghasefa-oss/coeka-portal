import React, { useState, useEffect } from 'react';
import {
  Building,
  BookOpen,
  Bed,
  Lock,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Layers,
  PieChart,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface AssetOversightData {
  library: {
    totalTitles: number;
    totalVolumes: number;
    availableVolumes: number;
    borrowedVolumes: number;
    utilizationRate: number;
  };
  hostels: {
    totalHalls: number;
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    lockedBeds: number;
    availableBeds: number;
    occupancyRate: number;
  };
}

export const AssetOversight: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  const [assets, setAssets] = useState<AssetOversightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/governance/assets');
      const data: any = await res.json();
      if (data.success && data.assets) {
        setAssets(data.assets);
      } else {
        setErrorMessage(data.error || 'Failed to retrieve asset oversight telemetry');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error fetching asset data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isNavy
            ? 'bg-gradient-to-r from-slate-900 via-slate-950 to-teal-950 border-teal-900/40 text-white'
            : 'bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 border-teal-700 text-white'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
              Institutional Physical Assets
            </span>
          </div>
          <h2 className="text-2xl font-black mt-1 flex items-center gap-2">
            <Building className="w-6 h-6 text-teal-400" />
            Asset & Infrastructure Oversight
          </h2>
          <p className="text-xs text-slate-200 mt-1 max-w-2xl">
            High-level telemetry monitoring physical inventory and capacity utilization across
            the College Library and Residential Student Hostels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAssets}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-teal-500" />
          <span className="text-xs font-bold">Scanning physical asset databases...</span>
        </div>
      ) : !assets ? (
        <div className="p-12 text-center text-slate-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
          <p className="text-sm font-bold">Unable to load asset telemetry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. College Library Inventory Section */}
          <div
            className={`p-6 rounded-2xl border shadow-sm space-y-5 ${
              isNavy ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">College Library Holdings</h3>
                  <p className="text-xs opacity-60">Physical book circulation and volume tracking</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                {assets.library.utilizationRate}% Utilization
              </span>
            </div>

            {/* Gauge Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="opacity-70">Circulation Load</span>
                <span className="text-teal-600 dark:text-teal-400">
                  {assets.library.borrowedVolumes} of {assets.library.totalVolumes} copies on loan
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${assets.library.utilizationRate}%` }}
                />
              </div>
            </div>

            {/* Metric Blocks */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="opacity-60 text-[10px] uppercase font-bold">Catalog Titles</div>
                <div className="text-xl font-black mt-0.5">{assets.library.totalTitles}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Unique books indexed</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="opacity-60 text-[10px] uppercase font-bold">Total Physical Copies</div>
                <div className="text-xl font-black mt-0.5">{assets.library.totalVolumes}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Across all shelves</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold">Available On Shelf</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {assets.library.availableVolumes}
                </div>
                <div className="text-[10px] text-emerald-600/70 mt-0.5">Ready for borrowing</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <div className="text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold">Active Loans</div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {assets.library.borrowedVolumes}
                </div>
                <div className="text-[10px] text-amber-600/70 mt-0.5">Currently with scholars</div>
              </div>
            </div>
          </div>

          {/* 2. Residential Hostels Section */}
          <div
            className={`p-6 rounded-2xl border shadow-sm space-y-5 ${
              isNavy ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Hostel Bedspace Capacity</h3>
                  <p className="text-xs opacity-60">Real-time room occupancy and payment locks</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {assets.hostels.occupancyRate}% Occupied
              </span>
            </div>

            {/* Gauge Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="opacity-70">Bed Allocation</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {assets.hostels.occupiedBeds} occupied + {assets.hostels.lockedBeds} locked of {assets.hostels.totalBeds} total
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-indigo-500 h-full transition-all duration-500"
                  style={{
                    width: `${assets.hostels.totalBeds > 0 ? (assets.hostels.occupiedBeds / assets.hostels.totalBeds) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{
                    width: `${assets.hostels.totalBeds > 0 ? (assets.hostels.lockedBeds / assets.hostels.totalBeds) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-4 text-[10px] mt-1.5 text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Confirmed Occupied
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> In 15m Payment Lock
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" /> Free
                </span>
              </div>
            </div>

            {/* Metric Blocks */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="opacity-60 text-[10px] uppercase font-bold">Halls & Rooms</div>
                <div className="text-xl font-black mt-0.5">
                  {assets.hostels.totalHalls} <span className="text-xs font-normal opacity-60">Halls</span> / {assets.hostels.totalRooms} <span className="text-xs font-normal opacity-60">Rooms</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Campus residential blocks</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="opacity-60 text-[10px] uppercase font-bold">Total Bed Capacity</div>
                <div className="text-xl font-black mt-0.5">{assets.hostels.totalBeds}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Individual bed spaces</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <div className="text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Under 15m Lock
                </div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {assets.hostels.lockedBeds}
                </div>
                <div className="text-[10px] text-amber-600/70 mt-0.5">Awaiting checkout payment</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold">Available Free Beds</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {assets.hostels.availableBeds}
                </div>
                <div className="text-[10px] text-emerald-600/70 mt-0.5">Ready for booking</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
