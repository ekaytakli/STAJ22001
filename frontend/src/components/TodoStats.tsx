type Props = { total: number; completed: number; busy: boolean; listError: boolean };
export default function TodoStats({ total, completed, busy, listError }: Props) {
    const percentage = total ? Math.round(completed / total * 100) : 0;
    return <section className="bg-white border rounded-4 p-3 mb-4" aria-labelledby="todo-stats-heading" aria-busy={busy}>
        <h5 id="todo-stats-heading">Görev istatistikleri</h5>
        <p className="small text-muted">Arama ve filtrelerden bağımsız tüm görevleriniz.</p>
        {busy ? <p role="status">İstatistikler yükleniyor...</p> : listError ? <p role="alert">İstatistikler alınamadı. Listeyi yeniden yüklemeyi deneyin.</p> : <>
            <dl className="row text-center mb-2">
                <div className="col-4"><dt>Toplam</dt><dd>{total}</dd></div>
                <div className="col-4"><dt>Bekleyen</dt><dd>{total - completed}</dd></div>
                <div className="col-4"><dt>Tamamlanan</dt><dd>{completed}</dd></div>
            </dl>
            <p>Tamamlanma oranı: %{percentage}</p>
            <div className="progress" role="progressbar" aria-label="Tamamlanma oranı" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar bg-success" style={{ width: percentage + "%" }} />
            </div>
        </>}
    </section>;
}
