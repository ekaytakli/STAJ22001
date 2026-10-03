import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

// Kullanıcının sisteme giriş yaptığı sayfa bileşeni.
function Login() {
    // Kullanıcının form kutularına yazdığı anlık değerleri tutuyoruz.
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Redux aksiyonlarını tetiklemek ve sayfalar arası geçiş yapmak için gereken kancalar.
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // Redux hafızasından giriş sırasındaki yüklenme durumu ve olası hata mesajını çekiyoruz.
    const { loading, error } = useAppSelector((state) => state.auth);

    // Giriş formu gönderildiğinde (submit) çalışacak ana fonksiyon.
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        // Tarayıcının varsayılan sayfa yenileme davranışını durduruyoruz.
        event.preventDefault();

        // Redux thunk'ı aracılığıyla kullanıcı adı ve şifreyi backend'e yolluyoruz.
        const result = await dispatch(loginUser({ username, password }));

        // Bilgiler doğruysa ve sunucu onay verdiyse kullanıcıyı görevler sayfasına yönlendiriyoruz.
        if (loginUser.fulfilled.match(result)) {
            navigate("/todos");
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            {/* Formun ortada durmasını sağlayan modern kart kutusu */}
            <div
                className="rounded-4 p-4 p-sm-5"
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "#ffffff",
                    boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.08)",
                    border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
            >
                {/* Karşılama başlığı ve logosu */}
                <div className="text-center mb-4">
                    <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>✨</div>
                    <h2
                        style={{
                            fontWeight: 800,
                            fontSize: "1.75rem",
                            letterSpacing: "-0.5px",
                            background:
                                "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            margin: 0,
                        }}
                    >
                        Todo App
                    </h2>
                    <p className="text-muted small mt-1 mb-0">Hesabınıza giriş yapın</p>
                </div>

                {/* Yanlış şifre veya kullanıcı adı girildiğinde gösterilen kırmızı hata kutusu */}
                {error && (
                    <div
                        className="alert alert-danger rounded-3 py-2 px-3 small text-center mb-3"
                        style={{ border: "none", background: "#fee2e2", color: "#b91c1c" }}
                    >
                        {error}
                    </div>
                )}

                {/* Giriş formu */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label
                            className="form-label small"
                            style={{ fontWeight: 600, color: "#475569" }}
                        >
                            Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            className="form-control rounded-3 py-2 px-3"
                            placeholder="Kullanıcı adınızı girin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                border: "1.5px solid #e2e8f0",
                                fontSize: "0.95rem",
                                boxShadow: "none",
                            }}
                        />
                    </div>

                    <div className="mb-4">
                        <label
                            className="form-label small"
                            style={{ fontWeight: 600, color: "#475569" }}
                        >
                            Şifre
                        </label>
                        <input
                            type="password"
                            className="form-control rounded-3 py-2 px-3"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                border: "1.5px solid #e2e8f0",
                                fontSize: "0.95rem",
                                boxShadow: "none",
                            }}
                        />
                    </div>

                    {/* İstek sunucudayken çift tıklamayı önlemek için buton disabled olur */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn text-white w-100 py-2 rounded-3"
                        style={{
                            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                            fontWeight: 600,
                            border: "none",
                            boxShadow: "0 8px 16px -4px rgba(79, 70, 229, 0.35)",
                            transition: "transform 0.15s ease",
                        }}
                    >
                        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                    </button>
                </form>

                {/* Hesabı olmayanlar için kayıt sayfasına geçiş köprüsü */}
                <div className="text-center mt-4 pt-2 border-top border-light">
                    <p className="small text-muted m-0">
                        Hesabınız yok mu?{" "}
                        <Link
                            to="/register"
                            style={{
                                color: "#6366f1",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            Kayıt Ol
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;