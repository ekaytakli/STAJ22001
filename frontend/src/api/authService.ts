import api from "./axios";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../types";

// Kullanıcı adı ve şifreyi backend'e gönderir. Bilgiler doğruysa sunucu bize bilet (JWT) üretip döner.
export const login = (loginData: LoginRequest) => {
  return api.post<LoginResponse>("/auth/login", loginData);
};

// Yeni kullanıcıyı sisteme kaydeder. Başarılı olursa açılan hesabın temel bilgilerini teslim alır.
export const register = (registerData: RegisterRequest) => {
  return api.post<User>("/auth/register", registerData);
};