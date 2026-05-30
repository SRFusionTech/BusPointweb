interface BadgeProps { label: string; color: 'green' | 'red' | 'yellow' | 'sky' | 'slate'; }

const styles = {
  green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  sky:    'bg-sky-500/10 text-sky-400 border-sky-500/20',
  slate:  'bg-slate-700/50 text-slate-400 border-slate-600/30',
};

export default function Badge({ label, color }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[color]}`}>
      {label}
    </span>
  );
}
