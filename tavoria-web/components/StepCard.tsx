type Props = {
  n: string;
  title: string;
  body: string;
};

export default function StepCard({ n, title, body }: Props) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-ink/5 bg-surface p-8 transition-shadow hover:shadow-xl">
      <div className="font-serif text-2xl font-bold text-brass">{n}</div>
      <h3 className="mt-4 font-serif text-2xl text-navy leading-tight">
        {title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-mute">{body}</p>
    </div>
  );
}
