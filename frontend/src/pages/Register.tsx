import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector((state) => state.auth);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const result = await dispatch(registerUser({ username, email, password }));
        if (registerUser.fulfilled.match(result)) {
            navigate("/");
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
                {/* Başlık Alanı */}
                <div className="text-center mb-4">
                    <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>🚀</div>
                    <h2
                        style={{
                            fontWeight: 800,
                            fontSize: "1.75rem",
                            letterSpacing: "-0.5px",
                            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            margin: 0,
                        }}
                    >
                        Hesap Oluştur
                    </h2>
                    <p className="text-muted small mt-1 mb-0">Hemen kaydolun ve görevlerinizi yönetin</p>
                </div>

                {/* Hata Mesajı */}
                {error && (
                    <div
                        className="alert alert-danger rounded-3 py-2 px-3 small text-center mb-3"
                        style={{ border: "none", background: "#fee2e2", color: "#b91c1c" }}
                    >
                        {error}
                    </div>
                )}

                {/* Kayıt Formu */}
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
                            placeholder="Bir kullanıcı adı belirleyin"
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

                    <div className="mb-3">
                        <label
                            className="form-label small"
                            style={{ fontWeight: 600, color: "#475569" }}
                        >
                            E-posta Adresi
                        </label>
                        <input
                            type="email"
                            className="form-control rounded-3 py-2 px-3"
                            placeholder="ornek@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            placeholder="En az 6 karakter"
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
                        {loading ? "Kaydediliyor..." : "Kayıt Ol"}
                    </button>
                </form>

                {/* Giriş Yap Bağlantısı */}
                <div className="text-center mt-4 pt-2 border-top border-light">
                    <p className="small text-muted m-0">
                        Zaten hesabınız var mı?{" "}
                        <Link
                            to="/"
                            style={{
                                color: "#6366f1",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            Giriş Yap
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;