import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, RefreshCw, Send, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import WebhookForm from './WebhookForm';

function LogsPane({ id, nama, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/webhook/${id}/logs`).then((r) => {
      setLogs(Array.isArray(r.data) ? r.data : []);
    }).catch(() => toast.error('Gagal memuat logs'))
    .finally(() => setLoading(false));
  }, [id]);

  const statusColor = (code) => {
    if (!code) return 'text-dark-300';
    if (code >= 200 && code < 300) return 'text-emerald-600';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-50">
          <div>
            <h3 className="text-base font-bold text-dark-500">Log Webhook</h3>
            <p className="text-xs text-dark-300">{nama} — 100 log terakhir</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400 text-lg">×</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading && <p className="text-sm text-dark-300 text-center py-8">Memuat...</p>}
          {!loading && logs.length === 0 && <p className="text-sm text-dark-300 text-center py-8">Belum ada log pengiriman</p>}
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="p-3 rounded-xl bg-warm-50 border border-primary-50">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${statusColor(log.status_code)}`}>
                    HTTP {log.status_code || '-'}
                  </span>
                  <span className="text-[10px] text-dark-300">{new Date(log.created_at).toLocaleString('id-ID')}</span>
                </div>
                <p className="text-xs text-dark-400 font-mono truncate">{log.event}</p>
                {log.response_body && (
                  <p className="text-[10px] text-dark-300 font-mono mt-1 truncate">{log.response_body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Webhook() {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [logsPane, setLogsPane] = useState(null);
  const [testing, setTesting] = useState({});
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('setting.webhook');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/webhook');
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat webhook'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Tambah Webhook', icon: Plus, component: WebhookForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (d) => {
    openTab({ label: `Edit ${d.namawebhook}`, icon: Pencil, component: WebhookForm, props: { mode: 'edit', id: d.idwebhook, data: d, onSuccess: load }, type: 'form_edit' });
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ message: 'Hapus webhook dan semua log-nya?' });
    if (!ok) return;
    try {
      await api.delete(`/webhook/${id}`);
      toast.success('Webhook dihapus');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  const handleTest = async (id, nama) => {
    setTesting((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/webhook/${id}/test`);
      toast.success(`Test payload terkirim ke ${nama}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal kirim test');
    } finally {
      setTesting((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Webhook Outbound</h2>
          <p className="text-sm text-dark-300">Kirim notifikasi ke sistem eksternal saat event terjadi</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Tambah Webhook
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        {data.length === 0 ? (
          <div className="bg-white rounded-2xl border border-primary-50 p-12 text-center">
            <Globe className="w-10 h-10 text-dark-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-dark-400">Belum ada webhook</p>
            <p className="text-xs text-dark-300 mt-1">Tambahkan webhook untuk mengirim notifikasi ke sistem lain</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((d) => (
              <div key={d.idwebhook} className="bg-white rounded-2xl border border-primary-50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-dark-300" />
                      <span className="text-sm font-bold text-dark-500">{d.namawebhook}</span>
                    </div>
                    <p className="text-xs font-mono text-dark-400 mb-2">{d.url}</p>
                    <div className="flex flex-wrap gap-1">
                      {(d.events || []).map((ev) => (
                        <span key={ev} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-50 text-accent-700">{ev}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button onClick={() => handleTest(d.idwebhook, d.namawebhook)} disabled={testing[d.idwebhook]}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-50 text-dark-400 text-xs font-semibold hover:bg-warm-100 disabled:opacity-50">
                      <Send className="w-3.5 h-3.5" /> {testing[d.idwebhook] ? 'Mengirim...' : 'Test'}
                    </button>
                    <button onClick={() => setLogsPane({ id: d.idwebhook, nama: d.namawebhook })}
                      className="px-3 py-1.5 rounded-lg bg-warm-50 text-dark-400 text-xs font-semibold hover:bg-warm-100">
                      Logs
                    </button>
                    {canUbah && (
                      <button onClick={() => handleEdit(d)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canTambah && (
                      <button onClick={() => handleDelete(d.idwebhook)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {logsPane && (
        <LogsPane id={logsPane.id} nama={logsPane.nama} onClose={() => setLogsPane(null)} />
      )}
    </div>
  );
}
