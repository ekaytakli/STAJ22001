import api from "./axios";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../types";

/**
 * Kullanıcının giriş isteğini backend'e gönderir.
 *
 * loginData içerisinde kullanıcı adı ve şifre bilgileri bulunur.
 * Backend başarılı cevap verirse JWT ve kullanıcı bilgileri döner.
 *
 * Endpoint:
 * POST /api/auth/login
 */
export const login = (loginData: LoginRequest) => {
  return api.post<LoginResponse>("/auth/login", loginData);
};

/**
 * Yeni kullanıcı kayıt isteğini backend'e gönderir.
 *
 * registerData içerisinde kullanıcı adı, e-posta ve şifre bulunur.
 * Backend başarılı cevap verirse oluşturulan kullanıcı bilgileri döner.
 *
 * Endpoint:
 * POST /api/auth/register
 */
export const register = (registerData: RegisterRequest) => {
  return api.post<User>("/auth/register", registerData);
};