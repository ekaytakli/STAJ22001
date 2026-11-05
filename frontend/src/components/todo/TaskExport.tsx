import { useEffect, useRef, useState } from "react";
import { getTodos } from "../../api/todoService";
import { getApiErrorMessage } from "../../api/errors";
import { getSessionToken } from "../../store/session";
import { todosToCsv } from "./workspaceHelpers";
import { localDateKey } from "./todoHelpers";
import TodoIcon from "./TodoIcon";

export default function TaskExport({ disabled }: { disabled: boolean }) {
  const request = useRef<AbortController | null>(null);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => () => request.current?.abort(), []);

  const download = async () => {
    if (request.current) return;
    const controller = new AbortController();
    const token = getSessionToken();
    request.current = controller;
    setExporting(true);
    setNotice("");
    try {
      const { data } = await getTodos("all", controller.signal);
      if (controller.signal.aborted || token !== getSessionToken()) return;
      const url = URL.createObjectURL(new Blob([todosToCsv(data)], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `odak-gorevler-${localDateKey()}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`${data.length} görev CSV dosyasına aktarıldı.`);
    } catch (error) {
      if (!controller.signal.aborted && token === getSessionToken()) {
        setNotice(getApiErrorMessage(error, "Görevler dışa aktarılamadı. Tekrar deneyebilirsin."));
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setExporting(false);
    }
  };

  return <div className="task-export">
    <button className="workspace-tool" onClick={download} disabled={disabled || exporting}
      aria-label="Tüm görevleri CSV olarak indir" title="Filtrelerden bağımsız tüm görevlerini CSV olarak indir">
      <TodoIcon name="download" size={16} /><span>{exporting ? "Hazırlanıyor…" : "Dışa aktar"}</span>
    </button>
    {notice && <p role="status" className="export-notice">{notice}<button onClick={() => setNotice("")} aria-label="Dışa aktarma bildirimini kapat"><TodoIcon name="close" size={14} /></button></p>}
  </div>;
}
