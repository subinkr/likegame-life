# LikeGame.life

게임화된 라이프스타일 관리 플랫폼

## 🚀 시작하기

### 필수 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
# JWT 보안 키 (프로덕션에서는 반드시 강력한 키를 사용하세요)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# 환경 설정
NODE_ENV=development

# 데이터베이스 설정
DATABASE_URL="postgresql://username:password@localhost:5432/likegame_life"

# CORS 설정 (필요시)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 설치 및 실행

```bash
npm install
npm run dev
```

## 🔒 보안 설정

### 프로덕션 환경 보안 체크리스트

- [ ] JWT_SECRET 환경변수 설정 (강력한 랜덤 키 사용)
- [ ] NODE_ENV=production 설정
- [ ] 데이터베이스 연결 보안 설정
- [ ] CORS 설정 (필요한 도메인만 허용)
- [ ] 관리자 계정 생성 및 권한 설정

### 관리자 계정 생성

데이터베이스에서 직접 관리자 권한을 부여할 수 있습니다:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

## 📚 기술 스택

- Next.js 15
- Prisma (PostgreSQL)
- TypeScript
- Styled Components

## 🛠️ 개발

```bash
# 데이터베이스 마이그레이션
npx prisma migrate dev

# Prisma 클라이언트 생성
npx prisma generate

# 개발 서버 실행
npm run dev
```
