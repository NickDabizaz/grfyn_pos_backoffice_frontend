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
  return toDateInputValue(new Date());
}

export function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function toDateInputValue(value) {
  if (!value) return today();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return today();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
