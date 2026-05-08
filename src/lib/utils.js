// export function formatRupiah(num) {
//   if (num == null || isNaN(num)) return 'Rp 0';
//   return 'Rp ' + Number(num).toLocaleString('id-ID');
// }

export function formatRupiah(num) {
  if (num == null || isNaN(num)) return 'Rp 0';
  return '' + Number(num).toLocaleString('id-ID');
}

export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
