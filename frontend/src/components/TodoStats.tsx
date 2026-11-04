import { useEffect, useState } from "react";
import { getTodos } from "../api/todoService";
import type { Todo, TodoFilter } from "../types";

type Props = { todos: Todo[]; filter: TodoFilter; busy: boolean; listError: boolean };

export default function TodoStats({ todos, filter, busy, listError }: Props) {
    const [result, setResult] = useState<{ source: Todo[]; items: Todo[] | null } | null>(null);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        if (filter === "all" || busy) return;
        const controller = new AbortController();
        getTodos("all", controller.signal).then((response) => {
            if (!controller.signal.aborted) setResult({ source: todos, items: response.data });
        }).catch(() => {
            if (!controller.signal.aborted) setResult({ source: todos, items: null });
        });
        return () => controller.abort();
    }, [todos, filter, busy, retry]);

    const items = filter === "all" ? todos : result?.source === todos ? result.items : undefined;
    const failed = filter === "all" ? listError : items === null;
    const pending = busy || (!failed && items === undefined);
    const total = items?.length ?? 0;
    const completed = items?.filter((todo) => todo.completed).length ?? 0;
    const percentage = total ? Math.round(completed / total * 100) : 0;

    return (
        <section className="bg-white border rounded-4 p-3 mb-4" aria-labelledby="todo-stats-heading" aria-busy={pending}>
            <h5 id="todo-stats-heading">Görev istatistikleri</h5>
            <p className="small text-muted">Arama ve filtrelerden bağımsız tüm görevleriniz.</p>
            {pending ? <p role="status" className="mb-0">İstatistikler yükleniyor...</p> : failed ? (
                <div role="alert">
                    <p>İstatistikler alınamadı.</p>
                    {filter !== "all" && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => {
                        setResult(null);
                        setRetry((value) => value + 1);
                    }}>Yeniden dene</button>}
                </div>
            ) : <>
                <dl className="row text-center mb-2">
                    <div className="col-4"><dt>Toplam</dt><dd className="fs-4 mb-0">{total}</dd></div>
                    <div className="col-4"><dt>Bekleyen</dt><dd className="fs-4 mb-0">{total - completed}</dd></div>
                    <div className="col-4"><dt>Tamamlanan</dt><dd className="fs-4 mb-0">{completed}</dd></div>
                </dl>
                <p className="small mb-1">Tamamlanma oranı: %{percentage}</p>
                <div className="progress" role="progressbar" aria-label="Tamamlanma oranı" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar bg-success" style={{ width: percentage + "%" }} />
                </div>
            </>}
        </section>
    );
}
