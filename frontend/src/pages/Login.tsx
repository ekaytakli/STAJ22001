import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthError, loginUser } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import AuthLayout from "../components/AuthLayout";
import TodoIcon from "../components/todo/TodoIcon";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = (location.state as { registered?: boolean } | null)
    ?.registered;
  const { loading, error } = useAppSelector((state) => state.auth);
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const result = await dispatch(loginUser({ username, password }));
    if (loginUser.fulfilled.match(result)) navigate("/todos");
  };
  return (
    <AuthLayout>
      <span className="auth-form-icon">
        <TodoIcon name="leaf" size={24} />
      </span>
      <p className="auth-eyebrow">KALDIĞIN YERDEN DEVAM ET</p>
      <h2>Tekrar hoş geldin.</h2>
      <p className="auth-form-description">
        Görevlerin ve yeni başlangıçların seni bekliyor.
      </p>
      {registered && (
        <p role="status" className="auth-success">
          Hesabın hazır. Şimdi giriş yapabilirsin.
        </p>
      )}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-username">Kullanıcı adı</label>
          <input
            id="login-username"
            autoComplete="username"
            placeholder="Kullanıcı adını yaz"
            maxLength={255}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Şifre</label>
          <div className="auth-password">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Şifreni yaz"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Gizle" : "Göster"}
            </button>
          </div>
        </div>
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
          <TodoIcon name="arrow" size={18} />
        </button>
      </form>
      <p className="auth-switch">
        Henüz hesabın yok mu? <Link to="/register">Bir hesap oluştur</Link>
      </p>
    </AuthLayout>
  );
}
