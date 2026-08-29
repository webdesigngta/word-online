import { Ban, Clock, Download, Infinity, Save, ShieldCheck, UserX } from 'lucide-react';

const commonFeatureItems = [
  { title: 'No sign-up', detail: 'Start instantly', Icon: UserX },
  { title: 'No ads', detail: 'Zero distractions', Icon: Ban },
  { title: 'No limits', detail: 'Use tools freely', Icon: Infinity },
  { title: 'Unlimited downloads', detail: 'Save every result', Icon: Download },
  { title: 'Safe & private', detail: 'Your files stay protected', Icon: ShieldCheck },
] as const;

export function ToolFeatureStrip({ storageMode = 'temporary' }: { storageMode?: 'temporary' | 'local' }) {
  const finalItem = storageMode === 'local'
    ? { title: 'Local autosave', detail: 'Stored in this browser', Icon: Save }
    : { title: 'Deleted after 10 min', detail: 'Temporary files are removed', Icon: Clock };
  const featureItems = [...commonFeatureItems, finalItem];

  return (
    <section className="platform-task-features" aria-label="DOC321 tool benefits">
      {featureItems.map(({ title, detail, Icon }) => (
        <article className="platform-task-feature" key={title}>
          <span className="platform-task-feature-icon"><Icon size={19} aria-hidden="true" /></span>
          <span><strong>{title}</strong><small>{detail}</small></span>
        </article>
      ))}
    </section>
  );
}
