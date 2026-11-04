import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthError, registerUser } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import AuthLayout from "../components/AuthLayout";
import TodoIcon from "../components/todo/TodoIcon";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const result = await dispatch(registerUser({ username, email, password }));
    if (registerUser.fulfilled.match(result))
      navigate("/", { state: { registered: true } });
  };
  return (
    <AuthLayout>
      <span className="auth-form-icon">
        <TodoIcon name="plus" size={24} />
      </span>
      <p className="auth-eyebrow">KENDİNE BİR ALAN AÇ</p>
      <h2>Yeni bir sayfa.</h2>
      <p className="auth-form-description">
        Görevlerini düzenlemek için ilk küçük adımını at.
      </p>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-username">Kullanıcı adı</label>
          <input
            id="register-username"
            autoComplete="username"
            placeholder="Sana nasıl seslenelim?"
            maxLength={255}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">E-posta adresi</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="ornek@eposta.com"
            maxLength={255}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">Şifre</label>
          <div className="auth-password">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="En az 8 karakter"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              aria-describedby="password-hint"
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
          <p id="password-hint">8–72 karakter arasında bir şifre belirle.</p>
        </div>
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
          <TodoIcon name="arrow" size={18} />
        </button>
      </form>
      <p className="auth-switch">
        Zaten bir hesabın var mı? <Link to="/">Giriş yap</Link>
      </p>
    </AuthLayout>
  );
}
