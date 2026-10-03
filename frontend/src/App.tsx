import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TodoPage from "./pages/TodoPage";
import { useAppSelector } from "./store/hooks";

/**
 * Giriş yapmamış kullanıcıların korumalı sayfalara (TodoPage gibi)
 * erişmesini engelleyen özel güvenlik bileşeni (Route Koruması).
 */
function PrivateRoute({ children }: { children: ReactElement }) {
    // Redux hafızasından giriş yapmış bir kullanıcı olup olmadığını kontrol ediyoruz.
    const user = useAppSelector((state) => state.auth.user);

    // Kullanıcı varsa gitmek istediği sayfayı (children) aç, yoksa ana giriş sayfasına (/) yönlendir.
    return user ? children : <Navigate to="/" replace />;
}

/**
 * Uygulamanın ana bileşeni ve sayfa yönlendirme (routing) merkezi.
 */
function App() {
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
                            <TodoPage />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;