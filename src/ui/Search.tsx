// Search across everything on the map, in both languages at once.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { HEROES, ITEMS, PLACE, PLACES, loadTexts, nameOf } from '../content';
import { t } from '../i18n';
import { iconFor, unlocked } from '../map/features';
import { lang, openItem, peek, searchOpen, seen, texts } from '../state';
import type { Texts } from '../types';
import { Ico } from './bits';

interface Entry { id: string; name: string; sub: string; keys: string[]; icon: string }
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ё/g, 'е').replace(/[„“”"'’()]/g, '');

function build(T: Texts, other: Texts | null): Entry[] {
  const canSee = (n: number) => seen(n) || peek.value === n;
  const out: Entry[] = [];
  for (const it of Object.values(ITEMS)) {
    if (!unlocked(it, canSee) || it.kind === 'point') continue;
    const name = nameOf(it.id, T);
    const kind = it.kind === 'place' ? t(it.side!) : it.kind === 'titem' || it.kind === 'tline' ? T.themes[it.theme!].name : t(it.kind as 'event');
    const sub = it.parent ? `${kind} · ${nameOf(it.parent, T)}` : kind;
    const keys = [name, other ? nameOf(it.id, other) : '', it.kind === 'place' ? PLACE[it.id].greek || '' : ''];
    out.push({ id: it.id, name, sub, keys: keys.filter(Boolean).map(norm), icon: iconFor(it) });
  }
  for (const h of HEROES) {
    if (h.reveals && !canSee(h.reveals)) continue;
    const name = T.reader.names[h.id];
    // a person's home may be a place or a site of the action (the farm of Laertes, the farmstead of Eumaeus)
    out.push({ id: 'hero:' + h.id, name, sub: `${t('hero')} · ${nameOf(h.home, T)}`, keys: [name, other?.reader.names[h.id] || ''].filter(Boolean).map(norm), icon: ITEMS[h.home] ? iconFor(ITEMS[h.home]) : '' });
  }
  for (const p of PLACES) {
    if (!unlocked(ITEMS[p.id], canSee)) continue;
    (T.places[p.id].heroes || []).forEach((h, i) => {
      const o = other?.places[p.id].heroes?.[i]?.name || '';
      out.push({ id: p.id, name: h.name, sub: `${t('heroes')} · ${T.places[p.id].name}`, keys: [h.name, o].filter(Boolean).map(norm), icon: iconFor(ITEMS[p.id]) });
    });
  }
  return out;
}

function score(e: Entry, q: string): number {
  let best = 0;
  for (const k of e.keys) {
    const i = k.indexOf(q);
    if (i < 0) continue;
    best = Math.max(best, i === 0 ? (k.length === q.length ? 100 : 80) : /[\s(\-·,/]/.test(k[i - 1]) ? 60 : 30);
  }
  return best;
}

export function Search() {
  const T = texts.value!;
  const [q, setQ] = useState('');
  const [other, setOther] = useState<Texts | null>(null);
  const [act, setAct] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const open = searchOpen.value;

  useEffect(() => { if (open) { setQ(''); setAct(0); input.current?.focus(); loadTexts(lang.value === 'bg' ? 'en' : 'bg').then(setOther).catch(() => {}); } }, [open]);
  const index = useMemo(() => (open ? build(T, other) : []), [open, T, other]);
  const results = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return [];
    return index.map(e => ({ e, s: score(e, n) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.e.name.length - b.e.name.length).slice(0, 30).map(x => x.e);
  }, [q, index]);

  if (!open) return null;
  const pick = (e: Entry) => { searchOpen.value = false; openItem(e.id); };
  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') searchOpen.value = false;
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); setAct(a => Math.min(a + 1, results.length - 1)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setAct(a => Math.max(a - 1, 0)); }
    else if (ev.key === 'Enter' && results[act]) pick(results[act]);
  };
  return (
    <div class="search" role="dialog" aria-label={t('search')} onClick={e => { if (e.target === e.currentTarget) searchOpen.value = false; }}>
      <div class="search-box">
        <div class="search-in">
          <span aria-hidden="true">⌕</span>
          <input ref={input} type="search" placeholder={t('search')} value={q} onInput={e => { setQ((e.currentTarget as HTMLInputElement).value); setAct(0); }} onKeyDown={onKey} />
          <button type="button" class="x" aria-label={t('close')} onClick={() => { searchOpen.value = false; }}>×</button>
        </div>
        <div class="search-res">
          {!q.trim() ? <p class="small pad">{t('searchHint')}</p> : !results.length ? <p class="small pad">{t('searchNone')}</p>
            : results.map((e, i) => (
              <button type="button" class={'row' + (i === act ? ' on' : '')} onClick={() => pick(e)} onMouseEnter={() => setAct(i)}>
                {e.icon ? <Ico name={e.icon} /> : <span class="ico wave">≈</span>}
                <span class="row-t"><b>{e.name}</b><small>{e.sub}</small></span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
