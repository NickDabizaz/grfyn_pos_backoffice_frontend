import { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, Warehouse,
  FileBarChart, Settings, LogOut, Store, ChevronDown, ReceiptText,
  Beaker, Coins, Lock
} from 'lucide-react';

const menu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Master', icon: Package, children: [
      { to: '/master/barang', label: 'Barang' },
      { to: '/master/supplier', label: 'Supplier' },
      { to: '/master/customer', label: 'Customer' },
      { to: '/master/akun', label: 'Akun' },
    ]
  },
  { to: '/pembelian', label: 'Pembelian', icon: ShoppingBag },
  { to: '/penjualan', label: 'Penjualan', icon: ReceiptText },
  {
    label: 'Stok', icon: Warehouse, children: [
      { to: '/stok/saldoawal', label: 'Saldo Awal Stok' },
      { to: '/stok/penyesuaian', label: 'Penyesuaian Stok / Opname Stok' },
    ]
  },
  { to: '/kas', label: 'Kas', icon: Coins },
  {
    label: 'Laporan', icon: FileBarChart, children: [
      { to: '/laporan/penjualan', label: 'Penjualan' },
      { to: '/laporan/pembelian', label: 'Pembelian' },
      { to: '/laporan/master/barang', label: 'Barang' },
      { to: '/laporan/stok/sekarang', label: 'Stok Sekarang' },
      { to: '/laporan/stok/kartustok', label: 'Kartu Stok' },
      { to: '/laporan/stok/opname', label: 'Opname Stok' },
      { to: '/laporan/stok/transfer', label: 'Transfer Stok' },
    ]
  },
  {
    label: 'Setting', icon: Settings, children: [
      { to: '/setting', label: 'Perusahaan' },
    ]
  },
];

function MenuItem({ item, level = 0, openSet, toggle }) {
  const location = useLocation();
  const isOpen = openSet.has(item.label);

  if (item.children) {
    const hasActiveChild = item.children.some((c) =>
      c.to ? location.pathname.startsWith(c.to) : false
    ) || item.children.some((c) =>
      c.children ? c.children.some((cc) => location.pathname.startsWith(cc.to)) : false
    );

    return (
      <div>
        <button
          onClick={() => toggle(item.label)}
          className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
            level === 0 ? 'px-3 py-2.5 text-dark-400 hover:bg-warm-50' : 'px-3 py-2 text-dark-400 hover:bg-warm-50'
          }`}
        >
          {level === 0 && item.icon && <item.icon className="w-4 h-4" />}
          {level > 0 && <span className="w-4" />}
          <span className={level > 0 ? 'text-xs' : ''}>{item.label}</span>
          <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {isOpen && (
          <div className={`${level === 0 ? 'ml-7' : 'ml-9'} mt-0.5 space-y-0.5`}>
            {item.children.map((c) => (
              <MenuItem key={c.label || c.to} item={c} level={level + 1} openSet={openSet} toggle={toggle} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `block rounded-xl transition-all ${
          level === 0
            ? `flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-dark-400 hover:bg-warm-50 hover:text-dark-500'}`
            : `px-3 py-2 text-xs font-medium ${isActive ? 'bg-primary-50 text-primary-600' : 'text-dark-400 hover:text-dark-600 hover:bg-warm-50'}`
        }`
      }
    >
      {level === 0 && item.icon && <item.icon className="w-4 h-4" />}
      {item.label}
    </NavLink>
  );
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  // Auto-open groups that contain active route
  const getInitialOpen = useCallback(() => {
    const set = new Set();
    function walk(items) {
      for (const item of items) {
        if (item.children) {
          const childActive = item.children.some((c) => {
            if (c.to && location.pathname.startsWith(c.to)) return true;
            if (c.children) return c.children.some((cc) => cc.to && location.pathname.startsWith(cc.to));
            return false;
          });
          if (childActive) {
            set.add(item.label);
            walk(item.children);
          }
        }
      }
    }
    walk(menu);
    return set;
  }, [location.pathname]);

  const [openSet, setOpenSet] = useState(() => getInitialOpen());

  const toggle = (label) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-primary-100 flex flex-col fixed left-0 top-0 z-40">
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
        {menu.map((m) => (
          <MenuItem key={m.label || m.to} item={m} level={0} openSet={openSet} toggle={toggle} />
        ))}
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
