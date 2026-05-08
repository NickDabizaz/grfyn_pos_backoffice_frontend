import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import useTabStore from '../store/tabStore';
import api from '../api/axios';
import { getPage, openPageFromSidebar } from '../lib/pageRegistry.jsx';
import {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, Warehouse,
  FileBarChart, Settings, LogOut, Store, ChevronDown, ReceiptText,
  Coins, UserCog, MapPin, ClipboardList
} from 'lucide-react';

const iconMap = {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, Warehouse,
  FileBarChart, Settings, Store, ReceiptText, Coins, UserCog, MapPin, ClipboardList,
};

function getIcon(name) {
  return iconMap[name] || Package;
}

function MenuItem({ item, level = 0, openSet, toggle, onNavigate }) {
  const isOpen = openSet.has(item.kodemenu);

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={() => toggle(item.kodemenu)}
          className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
            level === 0 ? 'px-3 py-2.5 text-dark-400 hover:bg-warm-50' : 'px-3 py-2 text-dark-400 hover:bg-warm-50'
          }`}
        >
          {level === 0 && item.icon && (() => { const I = getIcon(item.icon); return <I className="w-4 h-4" />; })()}
          {level > 0 && <span className="w-4" />}
          <span className={level > 0 ? 'text-xs' : ''}>{item.namamenu}</span>
          <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {isOpen && (
          <div className={`${level === 0 ? 'ml-7' : 'ml-9'} mt-0.5 space-y-0.5`}>
            {item.children.map((c) => (
              <MenuItem key={c.idmenu} item={c} level={level + 1} openSet={openSet} toggle={toggle} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const Icon = item.icon ? getIcon(item.icon) : null;

  return (
    <button
      onClick={() => onNavigate(item)}
      className={`w-full flex items-center gap-3 rounded-xl transition-all text-left ${
        level === 0
          ? `px-3 py-2.5 text-sm font-medium text-dark-400 hover:bg-warm-50 hover:text-dark-500`
          : `px-3 py-2 text-xs font-medium text-dark-400 hover:text-dark-600 hover:bg-warm-50`
      }`}
    >
      {level === 0 && Icon && <Icon className="w-4 h-4" />}
      {level > 0 && <span className="w-4" />}
      {item.namamenu}
    </button>
  );
}

export default function Sidebar({ onLogout }) {
  const { user, lokasi } = useAuthStore();
  const [menuTree, setMenuTree] = useState([]);
  const [openSet, setOpenSet] = useState(new Set());
  const openOrFocus = useTabStore((s) => s.openOrFocusTab);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/menu/my').then(res => {
      setMenuTree(res.data);
    }).catch(() => {});
  }, []);

  const toggle = (kodemenu) => {
    setOpenSet(prev => {
      const next = new Set(prev);
      if (next.has(kodemenu)) next.delete(kodemenu);
      else next.add(kodemenu);
      return next;
    });
  };

  const handleNavigate = useCallback((item) => {
    if (!item.kodemenu) return;
    if (item.kodemenu === 'pos') {
      navigate('/pos');
      return;
    }
    openPageFromSidebar(item.kodemenu, openOrFocus);
  }, [openOrFocus, navigate]);

  return (
    <aside className="w-64 h-screen bg-white border-r border-primary-100 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-primary-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-dark-500 leading-tight">{user?.namatenant || 'Grfyn POS'}</h1>
            <p className="text-[10px] text-dark-300">{lokasi?.namalokasi || 'Lokasi'}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {menuTree.filter((m) => m.kodemenu !== 'pos').map((m) => (
          <MenuItem key={m.idmenu} item={m} level={0} openSet={openSet} toggle={toggle} onNavigate={handleNavigate} />
        ))}
      </nav>
      <div className="p-4 border-t border-primary-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center text-xs font-bold text-accent-600">
            {user?.namauser?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-dark-500 truncate">{user?.namauser || user?.username || '-'}</p>
            <p className="text-[10px] text-dark-300 truncate">{user?.email || '-'}</p>
          </div>
        </div>
        {(() => {
          const posItem = menuTree.find((m) => m.kodemenu === 'pos');
          if (!posItem) return null;
          const Icon = posItem.icon ? getIcon(posItem.icon) : ShoppingCart;
          return (
            <button
              onClick={() => handleNavigate(posItem)}
              className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-xs font-medium text-dark-400 hover:bg-warm-50 hover:text-dark-500 transition-colors">
              <Icon className="w-3.5 h-3.5" /> {posItem.namamenu}
            </button>
          );
        })()}
        <button onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-dark-300 hover:bg-red-50 hover:text-red-500 transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Keluar
        </button>
      </div>
    </aside>
  );
}
