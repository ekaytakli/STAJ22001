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

### CORS izinleri

Backend, `CORS_ALLOWED_ORIGINS` değişkenindeki virgülle ayrılmış origin listesini
kullanır. Değer belirtilmezse yalnızca `http://localhost:5173` ve
`http://127.0.0.1:5173` izinlidir. Docker Compose ayrıca `http://localhost:3000`
adresini tanımlar.

Canlı ortamda değişkeni frontend'in tam origin adresine ayarlayın;
örneğin `https://todo.example.com`. Birden çok origin virgülle ayrılır.
Origin yalnızca protokol, alan adı ve varsa port içerir; yol veya sonda `/`
eklemeyin. Boşluklar temizlenir, boş liste ve wildcard (`*`) başlangıçta
reddedilir. Render'da bu değişken servis ortam ayarlarından girilmelidir.

### Todo API veri sözleşmesi

Todo oluşturma isteği yalnızca `title`, `description`, `priority` ve `category`
alanlarını kullanır. Yeni görevler tamamlanmamış olarak oluşturulur. Güncelleme
isteği bu alanlara ek olarak `completed` alanını kullanır; öncelik ve kategori
değişiklikleri de kaydedilir. `priority` ve `category` gönderilmediğinde
varsayılanları sırasıyla `MEDIUM` ve `Genel` olur.

Görev ID'si veritabanında üretilir; sahibi doğrulanmış oturumdan belirlenir.
İstek DTO'larında `id` veya `user` alanı bulunmaz. Todo yanıtları yalnızca
`id`, `title`, `description`, `completed`, `priority` ve `category` içerir;
kullanıcı nesnesi veya e-posta bilgisi içermez.

### Doğrulama ve hata yanıtları

Kayıt için kullanıcı adı ve geçerli e-posta zorunludur; parola 8–72 karakter
arasında ve BCrypt sınırı nedeniyle UTF-8 olarak en fazla 72 bayt olmalıdır.
Girişte boş kimlik bilgileri reddedilir. Kullanıcı adı ve e-posta en fazla
255 karakter olabilir.

Görev başlığı ve kategori boş olamaz, başlık/kategori/açıklama en fazla 255
karakter olabilir. Öncelik null olamaz. Güncellemede `completed` zorunludur;
oluşturmada durum sunucuda `false` olarak belirlenir.

Tek kayıt endpoint'i `POST /api/auth/register` olup başarıda 201 döndürür.
Eski `/api/users/register` kaldırılmıştır. API iş hataları `ProblemDetail`
biçimindedir: geçersiz alan veya JSON için 400, hatalı giriş için 401,
bulunamayan/kullanıcıya ait olmayan görev için 404, kayıt/veri çakışmaları
için 409 kullanılır. Validation yanıtındaki `errors` alanı, alan adlarını
mesajlara eşler; gönderilen değerleri ve parola bilgilerini içermez.

Frontend API hata mesajlarını gösterir; başarısız görev ekleme/güncellemede
form verisini korur. Beklenmeyen sunucu hatalarının izlenmesi sonraki kapsamdadır.

### JWT doğrulaması ve güvenlik hataları

İmzalı JWT tek seferde ayrıştırılır; imza ve süre kontrol edilir, `sub` ve `exp`
alanları zorunludur. Kullanıcının varlığı ve hesap durumu veritabanından yüklenen
güncel bilgilerle kontrol edilir. Token içeriği şifrelenmez; hassas bilgi eklenmemelidir.

Eksik kimlik doğrulaması veya geçersiz token için 401, kimliği doğrulanmış
kullanıcının yetkisiz işlemi için 403 kullanılır. Güvenlik filtreleri
`application/problem+json` yanıtı üretir; 401 yanıtında `WWW-Authenticate: Bearer`
başlığı bulunur. Token ve iç hata ayrıntıları yanıta eklenmez. Veritabanı
hataları geçersiz token gibi ele alınmaz. JWT filtresinin servlet seviyesinde
otomatik kaydı kapalıdır; filtre yalnızca Spring Security zincirinde çalışır.

Bu değişiklik token süresini veya imzalama anahtarını değiştirmez. Refresh token,
sunucuda token iptali ve hız sınırlama ayrı geliştirmelerdir. `JwtSecurityTests`
veritabanı olmadan token doğrulaması, filtre ve güvenlik yanıtlarını kapsar.

### Frontend oturum ve istek güvenilirliği

Bozuk, eksik veya süresi geçmiş tarayıcı oturumu güvenli şekilde sıfırlanır.
Storage erişilemediğinde oturum bellekte kullanılabilir; sayfa yenilenince
yeniden giriş gerekebilir. Token süresi arayüzde de izlenir; imza ve erişim
yetkisini her zaman backend doğrular. Aktif token ile yapılan isteğin 401
yanıtı oturumu kapatır; eski token'ın gecikmiş 401 yanıtı yeni oturumu kapatmaz.

Logout görev listesini, filtreyi ve bekleyen işlem kimliklerini temizler.
Filtre değişiminde önceki liste isteği iptal edilir; yalnızca güncel istek
yanıtı state'e uygulanır. Aynı anda tek görev yazma işlemi kabul edilir;
butonlar ve form alanları işlem boyunca kilitlenir, logout kullanılabilir kalır.
Logout öncesi başlatılan yazma işlemi sunucuda tamamlanabilir; geç gelen yanıt
yeni oturumun görev listesine uygulanmaz. Tarayıcı logout'u JWT'yi sunucuda
iptal etmez; token iptal politikası ayrı güvenlik geliştirmesidir.

### Todo tarih alanları

`dueDate` isteğe bağlı `YYYY-MM-DD` son teslim tarihidir; null gönderilerek temizlenir. Geçmiş tarihler kabul edilir. Yanıtlardaki `createdAt` ve `updatedAt` sunucuda UTC olarak üretilir. Bu alanlar istemci tarafından değiştirilemez. Mevcut `ddl-auto=update` ayarı yeni nullable sütunları ekler; eski kayıtların bilinmeyen tarihleri doldurulmaz. Eski görev güncellendiğinde yalnızca `updatedAt` atanır.

Arayüz, tamamlanmamış ve son teslim tarihi tarayıcının yerel gününden önce olan görevleri gecikmiş gösterir. Tarihsiz görevler tarih sıralamasında sona yerleştirilir. Backend ve frontend birlikte güncellenmelidir.

### Sayfalı görev listesi

Frontend `GET /api/todos/page` kullanır: `page` sıfırdan başlar, `size` 1–100 arasındadır. `status`, `search`, `category`, `priority` ve `sort` sunucuda uygulanır. Yanıt `items`, `page`, `size`, `totalElements`, `totalPages` ile filtrelerden bağımsız `total`, `completed`, `categories` alanlarını içerir. Son sayfa boşaldığında sunucu son geçerli sayfayı döndürür. Eski liste endpointleri uyumluluk için korunur.

### Otomatik testler

Frontend: `cd frontend` ardından `npm test`. Node.js test runner ve mevcut TypeScript bağımlılığı kullanılır; form kuralları, kategori normalizasyonu, Redux istek yarışları, logout ve sayfalama state'i kontrol edilir. Ek test paketi gerekmez.

Veritabanı gerektirmeyen backend testleri: `cd backend` ardından `./mvnw -Dtest=TodoServiceTests,TodoPaginationTests,TodoCategoryTests,TodoDatesTests,JwtSecurityTests test` (Windows: `mvnw.cmd`). Java 26 gereklidir. Servis sahiplik ve CRUD davranışları Mockito ile test edilir; gerçek PostgreSQL sorguları ve tarayıcı etkileşimleri bu testlerin kapsamında değildir. Tam test komutu `./mvnw test`, `contextLoads` için yapılandırılmış veritabanı ve ortam değişkenleri gerektirir.

### CI kalite kontrolleri

`.github/workflows/ci.yml`, main dalına push, pull request ve manuel tetiklemede çalışır. Frontend işi Node.js 24 ile `npm ci`, lint, tip kontrolü, test ve derleme yapar. ESLint TypeScript/TSX kaynaklarını da kapsar.

Backend işi Java 26 ve geçici PostgreSQL 17 servisiyle `sh ./mvnw --batch-mode --no-transfer-progress verify` çalıştırır; context testi de dahildir. Workflow içindeki parola ve JWT anahtarı yalnızca geçici CI ortamı içindir. Deploy veya push yapmaz.

Yapılandırma kaynakları: [setup-node](https://github.com/actions/setup-node), [setup-java](https://github.com/actions/setup-java), [TypeScript ESLint](https://typescript-eslint.io/getting-started/).
