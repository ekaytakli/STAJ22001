import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthError, loginUser } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

/**
 * Kullanıcının sisteme giriş yapmasını sağlayan sayfa bileşenidir.
 *
 * Bu bileşen:
 * - Kullanıcı adı ve şifre bilgilerini form üzerinden alır.
 * - Redux üzerinden login işlemini başlatır.
 * - Giriş başarılı olursa kullanıcıyı Todo sayfasına yönlendirir.
 * - Hata ve yüklenme durumlarını kullanıcıya gösterir.
 */
function Login() {
  /**
   * Kullanıcıyı farklı bir route'a yönlendirmek için kullanılır.
   */
  const navigate = useNavigate();

  /**
   * Redux actionlarını çalıştırmak için kullanılan dispatch fonksiyonudur.
   */
  const dispatch = useAppDispatch();

  /**
   * Auth state içerisindeki kullanıcı, yüklenme ve hata bilgilerini alır.
   */
  const { user, loading, error } = useAppSelector(
      (state) => state.auth
  );

  /**
   * Form alanlarında girilen kullanıcı adı ve şifre bilgilerini tutar.
   */
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  /**
   * Auth state içerisinde kullanıcı oluştuğunda Todo sayfasına yönlendirir.
   *
   * Bu kontrol, kullanıcı daha önce giriş yaptıysa Login sayfasında
   * kalmasını önler.
   */
  useEffect(() => {
    if (user) {
      navigate("/todos");
    }
  }, [user, navigate]);

  /**
   * Login formu gönderildiğinde çalışır.
   *
   * Sayfanın yenilenmesini engeller ve form bilgileriyle
   * loginUser Redux actionını çalıştırır.
   *
   * Giriş isteği başarılı olursa kullanıcı Todo sayfasına yönlendirilir.
   */
  const handleSubmit = async (
      event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const result = await dispatch(loginUser(formData));

    /**
     * Dispatch sonucunun başarılı login actionı olup olmadığını kontrol eder.
     */
    if (loginUser.fulfilled.match(result)) {
      navigate("/todos");
    }
  };

  return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow">
              <div className="card-body">
                <h2 className="text-center mb-4">
                  Todo App Login
                </h2>

                {/**
                 * Login sırasında hata oluşursa Redux state içerisindeki
                 * hata mesajı kullanıcıya gösterilir.
                 */}
                {error && (
                    <div className="alert alert-danger">
                      {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3 text-start">
                    <label className="form-label">
                      Username
                    </label>

                    <input
                        type="text"
                        className="form-control"
                        name="username"
                        value={formData.username}
                        onChange={(event) => {
                          /**
                           * Kullanıcı tekrar yazmaya başladığında önceki
                           * login hata mesajı temizlenir.
                           */
                          dispatch(clearAuthError());

                          /**
                           * Yalnızca username alanı güncellenir,
                           * password değeri korunur.
                           */
                          setFormData({
                            ...formData,
                            username: event.target.value,
                          });
                        }}
                        required
                    />
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label">
                      Password
                    </label>

                    <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={(event) => {
                          /**
                           * Kullanıcı tekrar yazmaya başladığında önceki
                           * login hata mesajı temizlenir.
                           */
                          dispatch(clearAuthError());

                          /**
                           * Yalnızca password alanı güncellenir,
                           * username değeri korunur.
                           */
                          setFormData({
                            ...formData,
                            password: event.target.value,
                          });
                        }}
                        required
                    />
                  </div>

                  <button
                      className="btn btn-primary w-100"
                      type="submit"
                      disabled={loading}
                  >
                    {/**
                     * Login isteği devam ederken buton devre dışı bırakılır.
                     * Böylece aynı istek birden fazla kez gönderilmez.
                     */}
                    {loading
                        ? "Giriş yapılıyor..."
                        : "Login"}
                  </button>
                </form>

                <div className="text-center mt-3">
                  {/**
                   * Hesabı olmayan kullanıcıyı kayıt sayfasına yönlendirir.
                   */}
                  <Link to="/register">
                    Hesabın yok mu? Kayıt Ol
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default Login;