import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, Warehouse, FileBarChart, Settings, LogOut, Store, Users, Truck, ChevronDown, ReceiptText, Beaker, DollarSign, Coins, Lock
} from 'lucide-react';

const menu = [
  { to: '/',    label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/pos', label: 'POS / Kasir', icon: ShoppingCart },
  {
    label: 'Master', icon: Package, children: [
      { to: '/master/barang',   label: 'Barang' },
      { to: '/master/supplier', label: 'Supplier' },
      { to: '/master/customer', label: 'Customer' },
      { to: '/master/akun',     label: 'Akun' },
    ]
  },
  { to: '/pembelian', label: 'Pembelian', icon: ShoppingBag },
  { to: '/penjualan', label: 'Penjualan', icon: ReceiptText },
  { to: '/stok',      label: 'Stok',      icon: Warehouse },
  { to: '/closing',   label: 'Closing',   icon: Lock },
  { to: '/resep',     label: 'Perhitungan Resep',     icon: Beaker },
  { to: '/kas',       label: 'Kas',       icon: Coins },
  { to: '/laporan',   label: 'Laporan',   icon: FileBarChart },
  { to: '/setting',   label: 'Setting',   icon: Settings },
];

export default function Sidebar() {
  const user                        = useAuthStore((s) => s.user);
  const logout                      = useAuthStore((s) => s.logout);
  const [openMaster, setOpenMaster] = useState(true);

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-primary-100 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-primary-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-dark-500 leading-tight">{user?.namatoko || 'Grfyn POS'}</h1>
            <p className="text-[10px] text-dark-300">Point of Sale</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {menu.map((m) =>
          m.children ? (
            <div key={m.label}>
              <button onClick={() => setOpenMaster(!openMaster)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-dark-400 hover:bg-warm-50 transition-colors">
                <m.icon className="w-4 h-4" />
                {m.label}
                <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${openMaster ? 'rotate-0' : '-rotate-90'}`} />
              </button>
              {openMaster && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {m.children.map((c) => (
                    <NavLink key={c.to} to={c.to} end
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive ? 'bg-primary-50 text-primary-600' : 'text-dark-400 hover:text-dark-600 hover:bg-warm-50'}`
                      }>
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink key={m.to} to={m.to} end={m.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-dark-400 hover:bg-warm-50 hover:text-dark-500'}`
              }>
              <m.icon className="w-4 h-4" />
              {m.label}
            </NavLink>
          )
        )}
      </nav>
      <div className="p-4 border-t border-primary-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center text-xs font-bold text-accent-600">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-dark-500 truncate">{user?.username || 'Admin'}</p>
            <p className="text-[10px] text-dark-300 truncate">{user?.email || '-'}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-dark-300 hover:bg-red-50 hover:text-red-500 transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Keluar
        </button>
      </div>
    </aside>
  );
}
