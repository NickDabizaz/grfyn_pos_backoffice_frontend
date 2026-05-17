const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[ch]));

const num = (value) => Number(value || 0).toLocaleString('id-ID');
const date = (value) => String(value || '').slice(0, 10);

export function printFakturA4({ title, codeLabel, code, partnerLabel, partner, data, user, items }) {
  const rows = items || data?.items || [];
  const ppnTotal = rows.reduce((sum, item) => sum + Number(item.ppn || 0), 0);
  const grandtotal = Number(data?.grandtotal || data?.total || rows.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(title)} - ${esc(code)}</title>
<style>
  @page{size:A4;margin:14mm}
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#222;font-size:11px;margin:0}
  .head{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #222;padding-bottom:12px}
  h1{font-size:18px;margin:0 0 4px;letter-spacing:.4px}
  h2{font-size:15px;margin:0;text-align:right}
  .muted{color:#666}
  .info{display:grid;grid-template-columns:120px 1fr 120px 1fr;gap:5px 10px;margin:16px 0 12px}
  .label{font-weight:700;color:#444}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{border:1px solid #333;background:#f2f2f2;padding:6px;text-align:left;font-size:10px}
  td{border:1px solid #bbb;padding:6px;vertical-align:top}
  .c{text-align:center}.r{text-align:right}
  .summary{margin-left:auto;margin-top:12px;width:260px}
  .summary div{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:5px 0}
  .summary .grand{font-weight:700;font-size:13px;border-bottom:2px solid #222}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:42px;text-align:center}
  .line{border-top:1px solid #222;margin-top:54px;padding-top:5px}
  @media print{body{margin:0}}
</style></head><body>
<div class="head">
  <div>
    <h1>${esc(user?.namatenant || 'GRFYN POS')}</h1>
    <div class="muted">${esc(user?.tenant_alamat || user?.alamat || '')}</div>
    <div class="muted">${esc(user?.tenant_hp || user?.hp || '')}</div>
  </div>
  <div>
    <h2>${esc(title)}</h2>
    <div class="muted">${esc(code)}</div>
  </div>
</div>
<div class="info">
  <div class="label">${esc(codeLabel)}</div><div>${esc(code)}</div>
  <div class="label">Tanggal</div><div>${esc(date(data?.tgltrans))}</div>
  <div class="label">${esc(partnerLabel)}</div><div>${esc(partner || '-')}</div>
  <div class="label">Lokasi</div><div>${esc(data?.namalokasi || user?.namalokasi || '-')}</div>
  <div class="label">Status</div><div>${esc(data?.status || '-')}</div>
  <div class="label">Catatan</div><div>${esc(data?.catatan || '-')}</div>
</div>
<table><thead><tr>
  <th class="c" style="width:34px">No</th>
  <th style="width:92px">Kode</th>
  <th>Nama Barang</th>
  <th class="c" style="width:52px">Sat</th>
  <th class="r" style="width:64px">Jml</th>
  <th class="r" style="width:86px">Harga</th>
  <th class="r" style="width:76px">PPN</th>
  <th class="r" style="width:96px">Subtotal</th>
</tr></thead><tbody>
${rows.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${esc(item.kodebarang || '')}</td>
  <td>${esc(item.namabarang || '')}</td>
  <td class="c">${esc(item.satuan || '')}</td>
  <td class="r">${num(item.jml)}</td>
  <td class="r">${num(item.harga)}</td>
  <td class="r">${num(item.ppn)}</td>
  <td class="r">${num(item.subtotal)}</td>
</tr>`).join('')}
</tbody></table>
<div class="summary">
  <div><span>Total PPN</span><strong>${num(ppnTotal)}</strong></div>
  <div class="grand"><span>Grand Total</span><span>${num(grandtotal)}</span></div>
</div>
<div class="sign"><div><div>Dibuat Oleh</div><div class="line">${esc(user?.namauser || user?.username || '')}</div></div><div><div>Disetujui Oleh</div><div class="line">&nbsp;</div></div></div>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
