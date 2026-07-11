import Link from "next/link";
import { CalendarDays, FileCheck2, Scale } from "lucide-react";
import { LEGAL_EFFECTIVE_DATE, TERMS_VERSION } from "@/lib/legal";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalDocument({
  eyebrow,
  title,
  introduction,
  sections,
  sources = [],
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  sections: LegalSection[];
  sources?: { label: string; href: string }[];
}) {
  return (
    <div className="page-enter bg-white">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]"><Scale size={14} /> {eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black text-[var(--ink)]">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">{introduction}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.68rem] font-semibold text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Effective {LEGAL_EFFECTIVE_DATE}</span>
            <span className="inline-flex items-center gap-1.5"><FileCheck2 size={13} /> Version {TERMS_VERSION}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <nav className="hidden self-start border-l border-[var(--line)] pl-4 lg:sticky lg:top-24 lg:block" aria-label={`${title} sections`}>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">On this page</p>
          <div className="mt-3 grid gap-1.5">{sections.map((section, index) => <a key={section.id} href={`#${section.id}`} className="text-xs leading-5 text-[var(--muted)] transition hover:text-[var(--brand-dark)]">{index + 1}. {section.title}</a>)}</div>
        </nav>

        <main className="min-w-0 max-w-3xl">
          <div className="divide-y divide-[var(--line)]">
            {sections.map((section, index) => (
              <section id={section.id} key={section.id} className="scroll-mt-24 py-5 first:pt-0">
                <h2 className="text-base font-black text-[var(--ink)]">{index + 1}. {section.title}</h2>
                <div className="mt-2.5 space-y-2.5 text-sm leading-7 text-[var(--muted)]">
                  {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets?.length ? <ul className="grid gap-2 pl-5">{section.bullets.map((bullet) => <li key={bullet} className="list-disc pl-1">{bullet}</li>)}</ul> : null}
                </div>
              </section>
            ))}
          </div>

          {sources.length ? (
            <aside className="mt-6 border-t border-[var(--line)] pt-5">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Ghana legal references</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{sources.map((source) => <Link key={source.href} href={source.href} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--brand-dark)] hover:underline">{source.label}</Link>)}</div>
            </aside>
          ) : null}
        </main>
      </div>
    </div>
  );
}
