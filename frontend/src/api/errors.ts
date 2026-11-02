import { isAxiosError } from "axios";

interface ApiProblem {
    detail?: string;
    errors?: Record<string, string>;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!isAxiosError<ApiProblem>(error)) return fallback;
    if (!error.response) return "Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.";
    if (error.response.status >= 500) return "Sunucuda bir hata oluştu. Lütfen tekrar deneyin.";
    const problem = error.response.data;
    if (problem?.errors && typeof problem.errors === "object") {
        const messages = Object.values(problem.errors).filter((value) => typeof value === "string");
        if (messages.length) return messages.join(" ");
    }
    return typeof problem?.detail === "string" ? problem.detail : fallback;
}
