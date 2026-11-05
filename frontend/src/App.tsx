import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TodoPage from "./pages/TodoPage";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { logout } from "./store/authSlice";
import { tokenExpiresAt } from "./store/session";

/**
 * Giriş yapmamış kullanıcıların korumalı sayfalara (TodoPage gibi)
 * erişmesini engelleyen özel güvenlik bileşeni (Route Koruması).
 */
function PrivateRoute({ children }: { children: ReactElement }) {
    // Redux hafızasından giriş yapmış bir kullanıcı olup olmadığını kontrol ediyoruz.
    const user = useAppSelector((state) => state.auth.user);
    const token = useAppSelector((state) => state.auth.token);

    // Kullanıcı varsa gitmek istediği sayfayı (children) aç, yoksa ana giriş sayfasına (/) yönlendir.
    // Check the current clock on every route render so an expired token never opens the page.
    // eslint-disable-next-line react-hooks/purity -- Deliberate expiry guard; App also schedules logout.
    return user && token && tokenExpiresAt(token) > Date.now()
        ? children : <Navigate to="/" replace />;
}

/**
 * Uygulamanın ana bileşeni ve sayfa yönlendirme (routing) merkezi.
 */
function App() {
    const dispatch = useAppDispatch();
    const token = useAppSelector((state) => state.auth.token);
    const userId = useAppSelector((state) => state.auth.user?.id);
    useEffect(() => {
        if (!token) return;
        const checkExpiration = () => {
            if (tokenExpiresAt(token) <= Date.now()) dispatch(logout());
        };
        checkExpiration();
        const timer = window.setInterval(checkExpiration, 1000);
        window.addEventListener("focus", checkExpiration);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener("focus", checkExpiration);
        };
    }, [dispatch, token]);

    return (
        // Tarayıcıdaki adres çubuğunu dinleyip sayfa geçişlerini yöneten ana sarmalayıcı.
        <BrowserRouter>
            {/* Tanımlı tüm rotaların (URL yollarının) listesi */}
            <Routes>
                {/* Ana adres: Giriş ekranını gösterir */}
                <Route path="/" element={<Login />} />

                {/* Kayıt olma adresi: Hesap oluşturma ekranını gösterir */}
                <Route path="/register" element={<Register />} />

                {/*
          Görevler sayfası: PrivateRoute ile kilitlenmiştir.
          Sadece geçerli bir oturumu olan kullanıcılar görebilir.
        */}
                <Route
                    path="/todos"
                    element={
                        <PrivateRoute>
                            <TodoPage key={userId} />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
