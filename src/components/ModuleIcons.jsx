// Iconos de linea para modulos y acciones (reemplazan emojis en el rediseno Nube suave).
const PATHS = {
  play: (<><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l5.5-3.5L10 8.5Z" /></>),
  heart: (<path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.6 4.5 6.1 4.5c2 0 3.4 1.1 4.2 2.4.3.5 1.1.5 1.4 0 .8-1.3 2.2-2.4 4.2-2.4 3.5 0 5.2 3.7 3.7 7.2C19.5 16.4 12 21 12 21Z" />),
  family: (<><circle cx="9" cy="7" r="3" /><path d="M3 18c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="11" r="2.5" /><path d="M14.5 20c.3-1.8 1.9-3.2 3.8-3.2 1.3 0 2.4.6 3.1 1.6" /></>),
  camera: (<><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.2-2h5.6L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Z" /><circle cx="12" cy="12.5" r="3.3" /></>),
  baby: (<><circle cx="12" cy="9" r="5" /><path d="M9.5 9.2h.01M14.5 9.2h.01M10.5 11.5c.9.7 2.1.7 3 0" /><path d="M7 20c.6-2.4 2.6-3.8 5-3.8s4.4 1.4 5 3.8" /></>),
  steth: (<><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M10 13v2a4 4 0 0 0 8 0v-1.5" /><circle cx="18" cy="12" r="2" /></>),
  carnet: (<><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h4" /></>),
  mind: (<><path d="M12 20s-7-4.2-7-10a4.5 4.5 0 0 1 7-3.5A4.5 4.5 0 0 1 19 10c0 5.8-7 10-7 10Z" /><path d="M9.5 11.5c.8 1 4.2 1 5 0" /></>),
  pill: (<><rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)" /><path d="m9.2 9.8 5.6 4.4" /></>),
  bell: (<><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15L6 17Z" /><path d="M10 21h4" /></>),
  folder: (<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.2l2 2.2H18A2.5 2.5 0 0 1 20.5 9.7v7.8A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5Z" />),
  book: (<><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M8 7h8M8 11h8" /></>),
  pulse: (<path d="M3 12h4l2.5-6 4 12 2.5-6H21" />),
  sprout: (<><path d="M12 21v-9" /><path d="M12 12c0-4 2.5-6.5 7-6.5 0 4-2.5 6.5-7 6.5Z" /><path d="M12 15c0-3-2-5-6-5 0 3 2 5 6 5Z" /></>),
  hourglass: (<><path d="M7 3h10M7 21h10" /><path d="M8 3c0 5 8 5 8 9s-8 4-8 9" /><path d="M16 3c0 5-8 5-8 9s8 4 8 9" /></>),
  calendar: (<><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></>),
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  alert: (<><path d="M12 4 2.8 19.5h18.4Z" /><path d="M12 10v4.5M12 17.2h.01" /></>),
  gem: (<><path d="M6.5 4h11l3.5 5-9 11-9-11Z" /><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" /></>),
  storybook: (<><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z" /><path d="M12 6.5V19.5" /><path d="m16.2 9.2.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5Z" /></>),
  plus: (<path d="M12 5v14M5 12h14" />),
  close: (<path d="M6 6l12 12M18 6 6 18" />),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5h.01" /></>),
  check: (<path d="m5 12.5 4.5 4.5L19 7.5" />),
  image: (<><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M5 17l4.5-4.5a2 2 0 0 1 2.8 0L18 18" /></>),
  cloud: (<path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 9.5a4.2 4.2 0 0 1 0 8.5Z" />),
  stroller: (<><path d="M5 5h2l1.5 8h9a6 6 0 0 0-6-6H8" /><circle cx="9" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>),
};

export default function ModuleIcon({ name, className = 'w-6 h-6', strokeWidth = 1.9 }) {
  const body = PATHS[name] || PATHS.heart;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {body}
    </svg>
  );
}
