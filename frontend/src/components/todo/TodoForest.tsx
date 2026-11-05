import { useState } from "react";
import type { Todo } from "../../types";
import TodoIcon from "./TodoIcon";
import { TreeShape } from "./ForestTree";
import type { TreeKind } from "./ForestTree";
import { forestProgress, readForestStyle, TREES_PER_GROVE } from "./forestHelpers";
import type { ForestStyle } from "./forestHelpers";
import "./TodoForest.css";

const positions = [
  [170, 111, .80], [286, 105, .75], [402, 112, .82], [514, 104, .75],
  [226, 155, .94], [344, 152, .91], [465, 152, .93], [570, 157, .91],
  [137, 193, 1.08], [278, 202, 1.12], [414, 200, 1.07], [545, 204, 1.12],
];

type Props = {
  userId: number;
  completed: number | null;
  pendingCount: number;
  pendingTodos: Todo[];
  busy: boolean;
  stale: boolean;
  onPlant: (id: number) => void;
  onFindTask: () => void;
};

export default function TodoForest({ userId, completed, pendingCount, pendingTodos, busy, stale, onPlant, onFindTask }: Props) {
  const [style, setStyle] = useState<ForestStyle>(() => readForestStyle(userId));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [requestedGrove, setRequestedGrove] = useState(0);
  const forest = forestProgress(completed ?? 0);
  const grove = Math.min(requestedGrove, forest.groves - 1);
  const visibleCount = Math.max(0, Math.min(TREES_PER_GROVE, forest.count - grove * TREES_PER_GROVE));
  const selected = pendingTodos.find((todo) => todo.id === selectedId) ?? pendingTodos[0];
  const ready = completed !== null;
  const changeStyle = (next: ForestStyle) => {
    setStyle(next);
    try { localStorage.setItem(`odak:forest-style:${userId}`, next); } catch { /* The garden still works without storage. */ }
  };

  return (
    <section className="forest-panel" id="my-forest" aria-labelledby="forest-heading" aria-busy={!stale && (!ready || busy)} tabIndex={-1}>
      <header className="forest-heading">
        <div><span className="eyebrow">EMEĞİN KÖK SALSIN</span><h2 id="forest-heading">Benim ormanım</h2></div>
        <span className="forest-count"><TodoIcon name="tree" size={21} /><strong>{ready ? forest.count : "—"}</strong> ağaç</span>
      </header>
      <div className="forest-intro"><p>Bir görev tamamla. Bir ağaç büyüt.</p>
        <label><span className="visually-hidden">Orman görünümü</span><select value={style} onChange={(event) => changeStyle(event.target.value as ForestStyle)}>
          <option value="mixed">Karma orman</option><option value="pine">Çam ormanı</option><option value="blossom">Bahar korusu</option>
        </select></label>
      </div>
      <div className={"forest-landscape" + (!ready ? " is-loading" : "")}>
        <svg viewBox="0 0 680 270" className="forest-scene" aria-hidden="true">
          <rect width="680" height="270" fill="#f1f5e9" />
          <circle cx="559" cy="43" r="23" fill="#e9ddb1" opacity=".7" />
          <path d="M0 131Q113 47 258 112T497 98 680 111V270H0" fill="#e0ead5" />
          <path d="M0 174Q119 103 294 153T680 133V270H0" fill="#d2e2c6" />
          <path d="M0 226Q187 155 370 211T680 188V270H0" fill="#c2d7b4" />
          <path d="M344 270Q402 235 374 212T350 178Q371 158 335 144" stroke="#e8e8ca" strokeWidth="25" fill="none" strokeLinecap="round" />
          <g fill="#8eaf7c" opacity=".7"><ellipse cx="75" cy="204" rx="4" ry="2" /><ellipse cx="608" cy="183" rx="3" ry="2" /><ellipse cx="211" cy="229" rx="4" ry="2" /><ellipse cx="470" cy="241" rx="4" ry="2" /></g>
          {positions.map(([x, y, scale], index) => {
            if (index >= visibleCount) return null;
            const absoluteIndex = grove * TREES_PER_GROVE + index;
            const kind: TreeKind = style === "mixed" ? (["oak", "pine", "oak", "blossom"] as const)[absoluteIndex % 4] : style;
            return <g key={absoluteIndex} transform={`translate(${x - 50 * scale} ${y - 100 * scale}) scale(${scale})`}>
              <g className="forest-planted-tree" data-tree-number={absoluteIndex + 1}><TreeShape kind={kind} /></g>
            </g>;
          })}
          {ready && visibleCount === 0 && <g className="forest-seedling">
            <ellipse cx="340" cy="192" rx="24" ry="6" fill="#809b65" opacity=".2" />
            <path d="M340 191v-31" stroke="#668455" strokeWidth="4" strokeLinecap="round" />
            <path d="M340 176c-23 2-28-15-27-23 18-2 29 7 27 23" fill="#90b174" />
            <path d="M340 166c-1-18 14-23 26-20-1 16-12 23-26 20" fill="#6f985e" />
          </g>}
        </svg>
        <span className="forest-level"><span />{ready ? forest.level : stale ? "Orman bilgisi alınamadı" : "Ormanın hazırlanıyor…"}</span>
        {ready && forest.count === 0 && <span className="forest-empty-caption">İlk ağacın için yerin hazır.</span>}
      </div>
      <div className="forest-details">
        <div className="forest-milestone">
          <div><strong>{ready ? `${forest.next} ağaçlık hedef` : "Hedefin hazırlanıyor"}</strong><span>{ready ? `${forest.remaining} görev kaldı` : "—"}</span></div>
          <div className="forest-progress" role="progressbar" aria-label="Bir sonraki orman hedefine ilerleme" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ready ? forest.percentage : undefined}><span style={{ width: (ready ? forest.percentage : 0) + "%" }} /></div>
        </div>
        {ready && forest.groves > 1 && <nav className="forest-pagination" aria-label="Orman alanları">
          <button disabled={grove === 0} onClick={() => setRequestedGrove(grove - 1)} aria-label="Önceki orman alanı">←</button>
          <span>Alan {grove + 1} / {forest.groves}</span>
          <button disabled={grove + 1 >= forest.groves} onClick={() => setRequestedGrove(grove + 1)} aria-label="Sonraki orman alanı">→</button>
        </nav>}
        {ready && selected ? <div className="forest-planting">
          <label htmlFor="forest-task">Bu listedeki bekleyen görevlerden birini seç</label>
          <select id="forest-task" className="form-select" value={selected.id} disabled={busy || stale} onChange={(event) => setSelectedId(Number(event.target.value))}>
            {pendingTodos.map((todo) => <option key={todo.id} value={todo.id}>{todo.title}</option>)}
          </select>
          <button className="todo-primary forest-plant-button" disabled={busy || stale} onClick={() => onPlant(selected.id)}>
            <TodoIcon name="tree" size={20} />Görevi tamamla ve ağaç dik
          </button>
        </div> : ready && <button className="forest-find-task" disabled={busy || stale} onClick={onFindTask}>
          <TodoIcon name="plus" size={18} />{pendingCount > 0 ? "Ağaç dikmek için bekleyenleri göster" : "Yeni bir ağaç için görev ekle"}
        </button>}
        <p className="forest-rule">{stale ? "Orman bilgisi güncellenemedi. Görev listesini yeniden yükle." : "Her tamamlanan görev bir ağaçtır. Geri aldığın veya sildiğin görevlerin ağaçları da kaldırılır."}</p>
        <p className="visually-hidden" role="status">{ready ? `Ormanında ${forest.count} sanal ağaç var.` : stale ? "Orman bilgisi alınamadı." : "Orman bilgisi yükleniyor."}</p>
      </div>
    </section>
  );
}
