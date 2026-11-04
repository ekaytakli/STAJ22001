import TodoIcon from "./todo/TodoIcon";
type Props = {
  total: number;
  completed: number;
  busy: boolean;
  listError: boolean;
};
export default function TodoStats({
  total,
  completed,
  busy,
  listError,
}: Props) {
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const value = (number: number) => (listError ? "—" : number);
  return (
    <section
      className="todo-stats"
      aria-label="Görev istatistikleri"
      aria-busy={busy}
    >
      <div className="stat-card">
        <span className="stat-icon stat-neutral">
          <TodoIcon name="grid" />
        </span>
        <div>
          <p>Toplam görev</p>
          <strong>{value(total)}</strong>
        </div>
        <span className="stat-foot">Planın bir arada</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon stat-peach">
          <TodoIcon name="clock" />
        </span>
        <div>
          <p>Bekleyen</p>
          <strong>{value(total - completed)}</strong>
        </div>
        <span className="stat-foot">Bir sonraki adımın</span>
      </div>
      <div className="stat-card">
        <span className="stat-icon stat-green">
          <TodoIcon name="check" />
        </span>
        <div>
          <p>Tamamlanan</p>
          <strong>{value(completed)}</strong>
        </div>
        <span className="stat-foot">Emeğinin karşılığı</span>
      </div>
      <div className="stat-card stat-progress">
        <div className="progress-label">
          <p>Tamamlanma oranı</p>
          <TodoIcon name="leaf" size={18} />
        </div>
        <strong>{listError ? "—" : "%" + percentage}</strong>
        <div
          className="stat-progress-track"
          role="progressbar"
          aria-label="Tamamlanma oranı"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: percentage + "%" }} />
        </div>
      </div>
      {listError && (
        <p className="stats-error" role="alert">
          İstatistikler alınamadı. Listeyi yeniden yüklemeyi deneyin.
        </p>
      )}
    </section>
  );
}
