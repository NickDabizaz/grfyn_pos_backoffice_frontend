import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { formatRupiah } from '../lib/utils';
import { Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────── Browse Modals ───────────────

export function BrowseBarangModal({
  onSelect,
  onClose,
  jenis,
  excludeJenis,
  priceType = 'jual',
  showStock = true,
}) {
  const [barangList, setBarangList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      const params = { limit: search ? 50 : 10 };
      if (search) params.search = search;
      if (jenis) params.jenis = jenis;
      if (excludeJenis) params.excludeJenis = excludeJenis;

      setLoading(true);
      setError('');
      api.get('/barang/browse-barang', { params, signal: controller.signal })
        .then(r => setBarangList(Array.isArray(r.data) ? r.data : []))
        .catch(err => {
          if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
          const message = err.response?.data?.message || 'Gagal memuat barang';
          setBarangList([]);
          setError(message);
          toast.error(message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, search ? 300 : 0);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [search, jenis, excludeJenis]);

  const priceField = priceType === 'beli' ? 'hargabeli_terbaru' : 'hargajual_terbaru';
  const priceLabel = priceType === 'beli' ? 'Harga Beli' : 'Harga Jual';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Barang</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari kode / nama barang..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading && (
              <p className="text-sm text-dark-300 text-center py-8">Memuat...</p>
            )}
            {!loading && error && (
              <div className="text-center py-8">
                <p className="text-sm font-medium text-red-500">{error}</p>
                <p className="text-xs text-dark-300 mt-1">Coba buka lagi atau cek koneksi server.</p>
              </div>
            )}
            {!loading && !error && barangList.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-8">{search ? 'Tidak ada hasil' : 'Belum ada barang aktif'}</p>
            )}
            {!loading && !error && barangList.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-50">
                    <th className="text-left px-3 py-2 text-xs text-dark-300">Kode</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300">Nama Barang</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300">Satuan</th>
                    {showStock && <th className="text-right px-3 py-2 text-xs text-dark-300">Stok</th>}
                    <th className="text-right px-3 py-2 text-xs text-dark-300">{priceLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {barangList.map(b => (
                    <tr key={b.idbarang} onClick={() => onSelect(b)}
                      className="border-b border-primary-50/50 hover:bg-warm-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-300">{b.kodebarang}</td>
                      <td className="px-3 py-2.5 font-medium text-dark-500">{b.namabarang}</td>
                      <td className="px-3 py-2.5 text-dark-400 text-xs">
                        {b.satuanbesar || b.satuansedang || b.satuankecil || '-'}
                      </td>
                      {showStock && (
                        <td className={`px-3 py-2.5 text-right font-mono text-xs font-semibold ${Number(b.stok) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {Number(b.stok || 0)}
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-right font-mono text-dark-400 text-xs">
                        {formatRupiah(b[priceField])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseCustomerModal({ onSelect, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/customer', search ? { params: { search } } : {}).then(r => setCustomers(r.data));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Customer</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari customer..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-0.5">
            {customers.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-6">Tidak ada customer ditemukan</p>
            )}
            {customers.map(c => (
              <button key={c.idcustomer} onClick={() => onSelect(c)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors">
                <p className="text-sm font-semibold text-dark-500">{c.namacustomer}</p>
                <p className="text-xs text-dark-300">{c.kodecustomer}{c.hp ? ` \u2022 ${c.hp}` : ''}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseSupplierModal({ onSelect, onClose }) {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = search ? { params: { search } } : {};
    api.get('/supplier', params).then(r => setSuppliers(r.data));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Supplier</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari supplier..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-0.5">
            {suppliers.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-6">Tidak ada supplier ditemukan</p>
            )}
            {suppliers.map(s => (
              <button key={s.idsupplier} onClick={() => onSelect(s)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors">
                <p className="text-sm font-semibold text-dark-500">{s.namasupplier}</p>
                <p className="text-xs text-dark-300">{s.kodesupplier}{s.hp ? ` \u2022 ${s.hp}` : ''}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseLokasiModal({ onSelect, onClose }) {
  const [lokasiList, setLokasiList] = useState([]);

  useEffect(() => { api.get('/lokasi').then(r => setLokasiList(r.data)); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Lokasi</h3>
        </div>
        <div className="p-4 space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
          {lokasiList.map(l => (
            <button key={l.idlokasi} onClick={() => onSelect(l)}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors">
              <p className="text-sm font-semibold text-dark-500">{l.namalokasi}</p>
              <p className="text-xs text-dark-300">{l.kodelokasi}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrowsePOModal({ onSelect, onClose }) {
  const [poList, setPoList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { available: 1 };
    if (search) params.search = search;
    api.get('/purchase-order', { params })
      .then(r => setPoList(r.data))
      .catch(() => setPoList([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Purchase Order</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari PO..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading && (
              <p className="text-sm text-dark-300 text-center py-8">Memuat...</p>
            )}
            {!loading && poList.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-8">{search ? 'Tidak ada PO ditemukan' : 'Tidak ada PO yang bisa dipilih'}</p>
            )}
            {!loading && poList.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50">
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Kode</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Tanggal</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Supplier</th>
                    <th className="text-right px-3 py-2 text-xs text-dark-300 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {poList.map(po => (
                    <tr key={po.idpo} onClick={() => onSelect(po)}
                      className="border-b border-primary-50/50 hover:bg-warm-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-400">{po.kodepo}</td>
                      <td className="px-3 py-2.5 text-xs text-dark-400">{String(po.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-sm text-dark-500">{po.namasupplier}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-accent-600">{formatRupiah(po.grandtotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseBPBModal({ onSelect, onClose }) {
  const [bpbList, setBpbList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { available: 1 };
    if (search) params.search = search;
    api.get('/bpb', { params })
      .then(r => setBpbList(r.data))
      .catch(() => setBpbList([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih BPB (Bukti Penerimaan Barang)</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari BPB..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading && (
              <p className="text-sm text-dark-300 text-center py-8">Memuat...</p>
            )}
            {!loading && bpbList.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-8">{search ? 'Tidak ada BPB ditemukan' : 'Tidak ada BPB yang bisa dipilih'}</p>
            )}
            {!loading && bpbList.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50">
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Kode</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Tanggal</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Supplier</th>
                    <th className="text-right px-3 py-2 text-xs text-dark-300 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bpbList.map(BPB => (
                    <tr key={BPB.idbpb} onClick={() => onSelect(BPB)}
                      className="border-b border-primary-50/50 hover:bg-warm-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-400">{BPB.kodebpb}</td>
                      <td className="px-3 py-2.5 text-xs text-dark-400">{String(BPB.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-sm text-dark-500">{BPB.namasupplier}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-accent-600">{formatRupiah(BPB.grandtotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseBeliModal({ onSelect, onClose }) {
  const [beliList, setBeliList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { available: 1 };
    if (search) params.search = search;
    api.get('/beli', { params })
      .then(r => setBeliList(r.data))
      .catch(() => setBeliList([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Pembelian</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari pembelian..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading && (
              <p className="text-sm text-dark-300 text-center py-8">Memuat...</p>
            )}
            {!loading && beliList.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-8">{search ? 'Tidak ada pembelian ditemukan' : 'Tidak ada pembelian yang bisa dipilih'}</p>
            )}
            {!loading && beliList.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50">
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Kode</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Tanggal</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Supplier</th>
                    <th className="text-right px-3 py-2 text-xs text-dark-300 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {beliList.map(beli => (
                    <tr key={beli.idbeli} onClick={() => onSelect(beli)}
                      className="border-b border-primary-50/50 hover:bg-warm-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-400">{beli.kodebeli}</td>
                      <td className="px-3 py-2.5 text-xs text-dark-400">{String(beli.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-sm text-dark-500">{beli.namasupplier}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-accent-600">{formatRupiah(beli.grandtotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseSOModal({ onSelect, onClose }) {
  const [soList, setSoList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { available: 1 };
    if (search) params.search = search;
    api.get('/sales-order', { params })
      .then(r => setSoList(r.data))
      .catch(() => setSoList([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Sales Order</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari SO..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading && <p className="text-sm text-dark-300 text-center py-8">Memuat...</p>}
            {!loading && soList.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-8">{search ? 'Tidak ada SO ditemukan' : 'Tidak ada SO yang bisa dipilih'}</p>
            )}
            {!loading && soList.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50">
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Kode</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Tanggal</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Customer</th>
                    <th className="text-right px-3 py-2 text-xs text-dark-300 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {soList.map(so => (
                    <tr key={so.idso} onClick={() => onSelect(so)}
                      className="border-b border-primary-50/50 hover:bg-warm-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-400">{so.kodeso}</td>
                      <td className="px-3 py-2.5 text-xs text-dark-400">{String(so.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-sm text-dark-500">{so.namacustomer}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-accent-600">{formatRupiah(so.grandtotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseBPKModal({ onSelect, onClose }) {
  const [bpkList, setBpkList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { available: 1 };
    if (search) params.search = search;
    api.get('/bpk-jual', { params })
      .then(r => setBpkList(r.data))
      .catch(() => setBpkList([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih BPK (Bukti Pengeluaran Barang)</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari BPK..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading && <p className="text-sm text-dark-300 text-center py-8">Memuat...</p>}
            {!loading && bpkList.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-8">{search ? 'Tidak ada BPK ditemukan' : 'Tidak ada BPK yang bisa dipilih'}</p>
            )}
            {!loading && bpkList.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50">
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Kode</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Tanggal</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Customer</th>
                    <th className="text-right px-3 py-2 text-xs text-dark-300 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bpkList.map(bpk => (
                    <tr key={bpk.idbpk} onClick={() => onSelect(bpk)}
                      className="border-b border-primary-50/50 hover:bg-warm-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-400">{bpk.kodebpk}</td>
                      <td className="px-3 py-2.5 text-xs text-dark-400">{String(bpk.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-sm text-dark-500">{bpk.namacustomer}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-accent-600">{formatRupiah(bpk.grandtotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseJualModal({ onSelect, onClose }) {
  const [jualList, setJualList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { available: 1 };
    if (search) params.search = search;
    api.get('/jual', { params })
      .then(r => setJualList(r.data))
      .catch(() => setJualList([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Penjualan</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari penjualan..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading && <p className="text-sm text-dark-300 text-center py-8">Memuat...</p>}
            {!loading && jualList.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-8">{search ? 'Tidak ada penjualan ditemukan' : 'Tidak ada penjualan yang bisa dipilih'}</p>
            )}
            {!loading && jualList.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50">
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Kode</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Tanggal</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300 font-semibold">Customer</th>
                    <th className="text-right px-3 py-2 text-xs text-dark-300 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {jualList.map(jual => (
                    <tr key={jual.idjual} onClick={() => onSelect(jual)}
                      className="border-b border-primary-50/50 hover:bg-warm-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-400">{jual.kodejual}</td>
                      <td className="px-3 py-2.5 text-xs text-dark-400">{String(jual.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-sm text-dark-500">{jual.namacustomer}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-accent-600">{formatRupiah(jual.grandtotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────── PPN Dropdown ───────────────

export function PpnDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
      });
    }
  }, [open]);

  const isInclude = value === 'INCLUDE';

  return (
    <div ref={ref}>
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center justify-between gap-1.5 w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
          isInclude
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
        }`}>
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isInclude ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {isInclude ? 'INCLUDE' : 'TIDAK'}
        </span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div style={dropdownStyle} className="z-[100] bg-white rounded-xl border border-primary-100 shadow-xl overflow-hidden">
          <button type="button" onClick={() => { onChange('INCLUDE'); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors ${
              isInclude ? 'bg-emerald-50 text-emerald-700' : 'text-dark-500 hover:bg-emerald-50 hover:text-emerald-700'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> INCLUDE
          </button>
          <button type="button" onClick={() => { onChange('TIDAK_PAKAI'); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors ${
              !isInclude ? 'bg-red-50 text-red-700' : 'text-dark-500 hover:bg-red-50 hover:text-red-700'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> TIDAK
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────── Item Helpers ───────────────

export function getSatuanOptions(item) {
  const opts = [];
  if (item.satuanbesar) opts.push(item.satuanbesar);
  if (item.satuansedang) opts.push(item.satuansedang);
  if (item.satuankecil) opts.push(item.satuankecil);
  return opts.length ? opts : ['PCS'];
}

export function getDefaultSatuan(b) {
  const s = [b.satuanbesar, b.satuansedang, b.satuankecil].find(v => v && String(v).trim());
  return s ? String(s).trim() : 'PCS';
}

export function getDefaultSatuanPenjualan(b) {
  const s = [b.satuankecil, b.satuansedang, b.satuanbesar].find(v => v && String(v).trim());
  return s ? String(s).trim() : 'PCS';
}

export function isJmlValid(val) {
  const n = parseFloat(String(val).trim());
  return !isNaN(n) && n > 0;
}

export function isFloatValid(val) {
  const s = String(val).trim();
  return s !== '' && /^\d+([.,]\d+)?$/.test(s) && parseFloat(s.replace(',', '.')) >= 0;
}

export function parseFloatVal(val) {
  return parseFloat(String(val).trim().replace(',', '.')) || 0;
}
