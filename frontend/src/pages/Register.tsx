import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthError, registerUser } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

/**
 * Yeni kullanıcıların sisteme kayıt olmasını sağlayan sayfa bileşenidir.
 *
 * Bu bileşen:
 * - Kullanıcı adı, e-posta ve şifre bilgilerini form üzerinden alır.
 * - Redux üzerinden kayıt işlemini başlatır.
 * - Kayıt başarılı olursa kullanıcıyı giriş sayfasına yönlendirir.
 * - Yüklenme ve hata durumlarını kullanıcıya gösterir.
 */
function Register() {
  /**
   * Kullanıcıyı farklı bir route'a yönlendirmek için kullanılır.
   */
  const navigate = useNavigate();

  /**
   * Redux actionlarını çalıştırmak için kullanılan dispatch fonksiyonudur.
   */
  const dispatch = useAppDispatch();

  /**
   * Auth state içerisindeki yüklenme ve hata bilgilerini alır.
   */
  const { loading, error } = useAppSelector(
      (state) => state.auth
  );

  /**
   * Kayıt formunda girilen kullanıcı adı, e-posta ve şifre
   * bilgilerini component state içerisinde tutar.
   */
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  /**
   * Kayıt formu gönderildiğinde çalışır.
   *
   * Sayfanın yenilenmesini engeller ve form bilgileriyle
   * registerUser Redux actionını başlatır.
   *
   * Kayıt işlemi başarılı olursa kullanıcı giriş sayfasına yönlendirilir.
   */
  const handleSubmit = async (
      event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const result = await dispatch(registerUser(formData));

    /**
     * Dispatch sonucunun başarılı kayıt actionı olup olmadığını kontrol eder.
     */
    if (registerUser.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow">
              <div className="card-body">
                <h2 className="text-center mb-4">
                  Register
                </h2>

                {/**
                 * Kayıt işlemi sırasında hata oluşursa Redux state
                 * içerisindeki hata mesajı kullanıcıya gösterilir.
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
                           * Kullanıcı form alanını değiştirmeye başladığında
                           * önceki kayıt hata mesajı temizlenir.
                           */
                          dispatch(clearAuthError());

                          /**
                           * Yalnızca username alanı güncellenir.
                           * Email ve password değerleri korunur.
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
                      Email
                    </label>

                    <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={(event) => {
                          /**
                           * Kullanıcı form alanını değiştirdiğinde
                           * önceki hata mesajı temizlenir.
                           */
                          dispatch(clearAuthError());

                          /**
                           * Yalnızca email alanı güncellenir.
                           * Username ve password değerleri korunur.
                           */
                          setFormData({
                            ...formData,
                            email: event.target.value,
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
                           * Kullanıcı form alanını değiştirdiğinde
                           * önceki hata mesajı temizlenir.
                           */
                          dispatch(clearAuthError());

                          /**
                           * Yalnızca password alanı güncellenir.
                           * Username ve email değerleri korunur.
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
                      className="btn btn-success w-100"
                      type="submit"
                      disabled={loading}
                  >
                    {/**
                     * Kayıt isteği devam ederken buton devre dışı bırakılır.
                     * Böylece formun birden fazla kez gönderilmesi önlenir.
                     */}
                    {loading
                        ? "Kaydediliyor..."
                        : "Register"}
                  </button>
                </form>

                <div className="text-center mt-3">
                  {/**
                   * Daha önce hesabı bulunan kullanıcıyı
                   * giriş sayfasına yönlendirir.
                   */}
                  <Link to="/">
                    Zaten hesabın var mı? Giriş Yap
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default Register;