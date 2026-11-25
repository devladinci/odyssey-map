// Small shared pieces of the interface.
import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { ITEMS, nameOf } from '../content';
import { iconSvg } from '../map/icons';
import { iconFor } from '../map/features';
import { openItem, peek, progress, seen, texts } from '../state';
import { t } from '../i18n';
import type { Certainty } from '../types';

const TAG = /\{\{(\d+)\|([^{}]*)\}\}/g;
/** Interface word for each group of people. */
export const GROUP_KEY = { house: 'gHouse', suitors: 'gSuitors', hosts: 'gHosts', wander: 'gWander' } as const;

/** Text with spoiler tags. A tagged piece stays hidden until the reader has reached that book, or taps it. */
export function Rich({ text }: { text: string }) {
  const [open, setOpen] = useState<number[]>([]);
  void progress.value; void peek.value;
  const parts: ComponentChildren[] = [];
  let last = 0, i = 0;
  for (const m of text.matchAll(TAG)) {
    const n = +m[1], k = i++;
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (seen(n) || peek.value === n || open.includes(k)) parts.push(m[2]);
    else parts.push(<button type="button" class="sp" title={t('spoilerTitle')} onClick={() => setOpen([...open, k])}>{n > 24 ? t('spoilerEnd') : t('spoiler', { n })}</button>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
/** The same text with hidden pieces left out, for places that cannot hold a button. */
export const plain = (text: string) => text.replace(TAG, (_, n, s) => (seen(+n) ? s : '')).replace(/\s+/g, ' ').trim();

export function Ico({ name, size = 18 }: { name: string; size?: number }) {
  return <span class="ico" dangerouslySetInnerHTML={{ __html: iconSvg(name, size) }} />;
}

export function CertTag({ c }: { c: Certainty }) {
  return <span class={'tag c' + c}><i class={'dot d' + c} />{t(('c' + c) as 'c1')}</span>;
}

/** A row that opens an item: its marker, its name and an optional second line. */
export function ItemRow({ id, sub, onPick }: { id: string; sub?: ComponentChildren; onPick?: () => void }) {
  const T = texts.value!, it = ITEMS[id];
  const icon = it ? iconFor(it) : 'point';
  return (
    <button type="button" class="row" onClick={() => { onPick?.(); openItem(id); }}>
      {it?.pts ? <span class="swatch" style={{ '--c': it.color }} /> : icon ? <Ico name={icon} /> : <span class="ico wave">≈</span>}
      <span class="row-t"><b>{nameOf(id, T)}</b>{sub ? <small>{sub}</small> : null}</span>
    </button>
  );
}

export function Chip(p: { on?: boolean; tool?: boolean; onClick: () => void; children: ComponentChildren; label?: string }) {
  return <button type="button" class={'chip' + (p.on ? ' on' : '') + (p.tool ? ' tool' : '')} aria-pressed={p.on} aria-label={p.label} onClick={p.onClick}>{p.children}</button>;
}

/** A chip for a filter that is on: the label reopens its panel, the cross turns the filter off. */
export function FilterChip(p: { onOpen: () => void; onClear: () => void; clearLabel: string; children: ComponentChildren }) {
  return (
    <span class="chip on split">
      <button type="button" class="chip-main" onClick={p.onOpen}>{p.children}</button>
      <button type="button" class="chip-x" aria-label={p.clearLabel} title={p.clearLabel} onClick={p.onClear}>×</button>
    </span>
  );
}
