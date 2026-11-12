import { Broadcast, DeviceMobile, LockKey, Path } from '@phosphor-icons/react/dist/ssr';
import { Reveal } from '../Reveal';

const FACTS = [
  { Icon: Broadcast, title: 'Live, every few seconds', body: 'GPS from the driver’s phone, pushed straight to families and the school.' },
  { Icon: Path, title: 'Follows real roads', body: 'Routes and arrival times are calculated along the roads the bus actually takes.' },
  { Icon: LockKey, title: 'Role-based access', body: 'Families, drivers and admins each see exactly what they need — nothing more.' },
  { Icon: DeviceMobile, title: 'One product, every screen', body: 'Native apps for iOS and Android, and a web console for the transport office.' },
];

/** Product facts strip (no invented logos or numbers — add real customer logos here when available). */
export function Facts() {
  return (
    <section className="border-b border-line-subtle bg-surface">
      <div className="container-page grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {FACTS.map(({ Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 0.06} className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-action-soft text-fg-link">
              <Icon size={22} weight="duotone" />
            </span>
            <div>
              <h3 className="text-md font-semibold text-fg-primary">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-fg-muted">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
