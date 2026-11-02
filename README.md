# Todo App

Spring Boot, PostgreSQL ve React ile geliştirilmiş full-stack Todo uygulaması.

## Teknolojiler

- Backend: Spring Boot, Spring Security, JWT, Spring Data JPA, PostgreSQL
- Frontend: React, TypeScript, Redux Toolkit, React Router, Axios
- Deploy/Docker: Docker, Docker Compose, Render backend yapılandırması, Vercel frontend yapılandırması

## Local Çalıştırma

Backend için PostgreSQL çalışırken:

```bash
cd backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Docker ile:

```bash
docker compose up --build
```

## Ortam Değişkenleri

Backend değişkenleri `backend/.env.example`, frontend değişkenleri `frontend/.env.example` dosyasında örneklenmiştir.

### Zorunlu gizli değerler

`DB_PASSWORD` ve `JWT_SECRET` için varsayılan değer yoktur. Eksik veya boş
değerlerle backend başlamaz. JWT anahtarı UTF-8 olarak en az 32 bayt olmalıdır;
uzunluk tek başına güvenlik sağlamaz, kriptografik olarak rastgele üretilmiş
ve başka ortamlarda kullanılmayan bir anahtar seçin. Gerçek değerleri Git'e eklemeyin.

Docker Compose için kökteki `.env.example` dosyasını kökte `.env` olarak
kopyalayıp iki değeri doldurun. Compose bu dosyayı otomatik okur ve boş
değerlerde başlatmayı reddeder. Mevcut PostgreSQL volume'unda parola değiştirmek
yalnızca ortam değişkenini güncelleyerek gerçekleşmez; veritabanı hesabının
parolası ayrıca değiştirilmelidir. Verileri silerek volume'u yeniden oluşturmayın.

Backend'i IDE veya Maven ile doğrudan çalıştırırken `backend/.env.example`
içindeki değişkenleri çalıştırma ortamına tanımlayın. Spring Boot `.env`
dosyasını otomatik yüklemez. PowerShell'de tanımlanan ortam değişkenleri aynı
terminalden başlatılan Maven sürecine aktarılır; IDE için Run Configuration
ortam değişkenleri kullanılmalıdır.

Render yapılandırması JWT anahtarını üretir, veritabanı parolasını bağlı
veritabanından alır. Başka hosting ortamlarında iki değer secret yönetimi
üzerinden sağlanmalıdır. Önceden kullanılan veya paylaşılan anahtar ve parolaları
değiştirin; JWT anahtarını değiştirmek mevcut token'ları geçersiz kılar.
