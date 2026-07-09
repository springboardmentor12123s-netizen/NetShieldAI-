export default function PageHeader({ eyebrow = "NETSHIELD AI", title, description, action }) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-xs font-bold tracking-[0.24em] text-cyan">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}
      </div>
      {action}
    </header>
  );
}
