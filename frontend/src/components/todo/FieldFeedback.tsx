import { FIELD_LIMIT } from "./todoHelpers";

export default function FieldFeedback({ id, value, error }: { id: string; value: string; error?: string }) {
    return (
        <div id={id} className="small mb-2">
            {error && <div className="text-danger" role="alert">{error}</div>}
            <div className="text-muted text-end">{value.length}/{FIELD_LIMIT} karakter</div>
        </div>
    );
}

