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
