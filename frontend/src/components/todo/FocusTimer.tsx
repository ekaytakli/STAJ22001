import { useEffect, useState } from "react";
import TodoIcon from "./TodoIcon";
import { remainingSeconds } from "./workspaceHelpers";
import ForestTree from "./ForestTree";

export default function FocusTimer() {
  const [timer, setTimer] = useState({ duration: 25 * 60, remaining: 25 * 60, endAt: null as number | null });
  const running = timer.endAt !== null;
  const finished = timer.remaining === 0;

  useEffect(() => {
    if (!running) return;
    const tick = () => setTimer((previous) => {
      if (previous.endAt === null) return previous;
      const remaining = remainingSeconds(previous.endAt, Date.now());
      return { ...previous, remaining, endAt: remaining ? previous.endAt : null };
    });
    // A deadline, rather than counting ticks, keeps time accurate in background tabs.
    const interval = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running]);

  const toggle = () => setTimer((previous) => {
    const now = Date.now();
    if (previous.endAt !== null) return {
      ...previous, remaining: remainingSeconds(previous.endAt, now), endAt: null,
    };
    const remaining = previous.remaining || previous.duration;
    return { ...previous, remaining, endAt: now + remaining * 1000 };
  });
  const minutes = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
  const seconds = String(timer.remaining % 60).padStart(2, "0");
  const progress = (timer.duration - timer.remaining) / timer.duration * 100;

  return (
    <section className="focus-panel" aria-labelledby="focus-heading">
      <div className="focus-heading">
        <span className="focus-icon"><TodoIcon name="clock" size={18} /></span>
        <div><span className="eyebrow">BİR ŞEYE YER AÇ</span><h2 id="focus-heading">Odak zamanı</h2></div>
        <span className={"focus-state" + (running ? " is-running" : "")}>{running ? "Odaktasın" : "Kendi ritminde"}</span>
      </div>
      <div className="focus-body">
        <div className={"focus-growing-tree" + (running ? " is-growing" : "") + (finished ? " is-grown" : "")} aria-hidden="true">
          <div className="focus-tree-size" style={{ transform: `scale(${.55 + progress / 100 * .45})` }}><ForestTree className="focus-tree-art" /></div>
          <span className="focus-tree-growth" style={{ height: progress + "%" }} />
          <small>{finished ? "✓" : <TodoIcon name="leaf" size={16} />}</small>
        </div>
        <div className="focus-clock" role="timer" aria-label="Kalan odak süresi" aria-live="off">{minutes}<span>:</span>{seconds}</div>
        <div className="focus-description"><p>{finished ? "Fidanın büyüdü. Şimdi bir nefes al." : "Dikkatini bir göreve ver. Fidanın büyüsün."}</p>
          <span>{finished ? "Görevini bitirdiysen tamamla; ormanına bir ağaç eklensin." : "Bu fidan oturumunu gösterir. Sayaç, sayfa yenilenince sıfırlanır."}</span></div>
        <div className="focus-controls">
          <label className="visually-hidden" htmlFor="focus-duration">Odak süresi</label>
          <select id="focus-duration" className="form-select" value={timer.duration / 60} disabled={running}
            onChange={(event) => { const duration = Number(event.target.value) * 60; setTimer({ duration, remaining: duration, endAt: null }); }}>
            <option value={15}>15 dakika</option><option value={25}>25 dakika</option><option value={50}>50 dakika</option>
          </select>
          <button className="todo-primary" onClick={toggle}><TodoIcon name={running ? "pause" : "play"} size={16} />{running ? "Duraklat" : finished ? "Yeniden başla" : timer.remaining < timer.duration ? "Devam et" : "Başlat"}</button>
          <button className="focus-reset" aria-label="Odak sayacını sıfırla" title="Sayacı sıfırla"
            onClick={() => setTimer({ ...timer, remaining: timer.duration, endAt: null })}><TodoIcon name="reset" size={18} /></button>
        </div>
      </div>
      <div className="focus-track" aria-hidden="true"><span style={{ width: progress + "%" }} /></div>
      <span className="visually-hidden" role="status">{finished ? "Odak süren tamamlandı. Mola zamanı." : ""}</span>
    </section>
  );
}
