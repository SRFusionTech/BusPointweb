import { MapPin } from 'lucide-react';

const links = {
  Product: ['Features', 'Pricing', 'How it works', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Legal:   ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
};

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-[#020817] px-6 pt-16 pb-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                <MapPin size={15} className="text-white" />
              </div>
              <span className="text-lg font-black text-white">
                Bus<span className="text-sky-400">Point</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Real-time school bus tracking for modern schools. Safe, simple, reliable.
            </p>
          </div>

          {/* Link cols */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{group}</div>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} BusPoint Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-600">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
