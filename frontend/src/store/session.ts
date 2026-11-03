export interface SessionUser {
    id: number;
    username: string;
}

export function tokenExpiresAt(token: string): number {
    try {
        if (token.split(".").length !== 3) return 0;
        const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const claims = JSON.parse(atob(payload));
        return typeof claims.exp === "number" && Number.isFinite(claims.exp) ? claims.exp * 1000 : 0;
    } catch {
        return 0;
    }
}

// Bu kontrol yalnızca arayüz oturumu içindir; imzayı backend doğrular.
function restoreSession(): { user: SessionUser | null; token: string | null } {
    try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") ?? "null");
        if (token && tokenExpiresAt(token) > Date.now() && user
                && Number.isSafeInteger(user.id) && user.id > 0 && typeof user.username === "string") {
            return { token, user };
        }
    } catch {
        // Bozuk veya erişilemeyen storage uygulamanın açılmasını engellemez.
    }
    return { user: null, token: null };
}

export const restoredSession = restoreSession();
let currentToken = restoredSession.token;
export const getSessionToken = () => currentToken;

export function persistSession(user: SessionUser | null, token: string | null) {
    currentToken = token;
    try {
        if (user && token) {
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        }
    } catch {
        // Storage kullanılamadığında oturum bellekte çalışmaya devam eder.
    }
}
