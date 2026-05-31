import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';

export default function DatePicker({ value, onChange, className = '', placeholder = 'Pilih tanggal', ...props }) {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="relative">
      <Flatpickr
        value={value}
        onChange={(_, dateStr) => onChange(dateStr)}
        options={{ dateFormat: 'Y-m-d', locale: 'id' }}
        className={`${className} pr-9`}
        placeholder={placeholder}
        {...props}
      />
      <button
        type="button"
        onClick={() => {
          setTimeout(() => containerRef.current?.querySelector('input')?.click(), 0);
        }}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-dark-300 transition-colors hover:text-primary-600"
        aria-label="Buka kalender"
      >
        <CalendarDays className="h-4 w-4" />
      </button>
    </div>
  );
}
