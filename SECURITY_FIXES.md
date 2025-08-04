# 🔒 LikeGame.life 보안 수정 지시문서

> **목적**: 발견된 보안 취약점들을 우선순위에 따라 체계적으로 수정하기 위한 실무 지침서

---

## 📋 수정 우선순위 매트릭스

| 우선순위 | 심각도 | 수정 항목 | 예상 소요시간 |
|---------|--------|-----------|--------------|
| **P1** | 🔴 **매우 높음** | 관리자 권한 검증 | 2-3시간 |
| **P1** | 🔴 **매우 높음** | JWT Secret 환경변수화 | 30분 |
| **P1** | 🔴 **매우 높음** | API 권한 검증 강화 | 3-4시간 |
| **P2** | 🟡 **중간** | 입력 검증 및 Sanitization | 4-5시간 |
| **P2** | 🟡 **중간** | CORS 설정 | 1시간 |
| **P3** | 🟢 **낮음** | Rate Limiting | 2시간 |
| **P3** | 🟢 **낮음** | 보안 헤더 설정 | 1시간 |

---

## 🚨 P1 - 즉시 수정 필요 (심각한 취약점)

### 1. 관리자 권한 검증 시스템 구현

#### 1.1 데이터베이스 스키마 수정
```sql
-- prisma/schema.prisma에 추가
enum UserRole {
  USER
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  nickname  String?
  role      UserRole @default(USER)  // 추가
  // ... 기존 필드들
}
```

#### 1.2 관리자 권한 검증 미들웨어 생성
```typescript
// src/lib/admin-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './server-auth';

export async function requireAdmin(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }
  
  return null; // 권한 있음
}
```

#### 1.3 관리자 페이지 보호
```typescript
// src/app/admin/page.tsx 수정
export default function AdminPage() {
  const { user } = useAuth();
  
  // 관리자 권한 검증
  if (!user || user.role !== 'ADMIN') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 130px)',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        color: '#ff4444',
        fontSize: '1.2rem',
        fontFamily: 'Press Start 2P, cursive'
      }}>
        ⚠️ 접근 권한이 없습니다.
      </div>
    );
  }
  
  // 기존 코드...
}
```

#### 1.4 관리자 API 보호
```typescript
// src/app/api/admin/badges/route.ts 수정
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  
  // 기존 코드...
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  
  // 기존 코드...
}
```

### 2. JWT Secret 환경변수 필수화

#### 2.1 환경변수 검증 강화
```typescript
// src/lib/auth.ts 수정
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. 프로덕션 환경에서 반드시 설정해야 합니다.');
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '7d',
    issuer: 'likegame-life',
    audience: 'likegame-users'
  });
}
```

#### 2.2 환경변수 설정 가이드
```bash
# .env.local 파일에 추가
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=development

# .env.production 파일에 추가
JWT_SECRET=your-production-jwt-secret-key-here
NODE_ENV=production
```

### 3. API 권한 검증 강화

#### 3.1 사용자별 리소스 접근 제어
```typescript
// src/lib/resource-auth.ts
export async function requireResourceOwner(request: NextRequest, resourceUserId: string) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  
  if (user.id !== resourceUserId && user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  return null;
}
```

#### 3.2 API 엔드포인트 보호 예시
```typescript
// src/app/api/stats/strength/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 리소스 소유자 확인
    const record = await prisma.strengthRecord.findUnique({
      where: { id: params.id },
      include: { user: true }
    });
    
    if (!record) {
      return NextResponse.json({ error: '기록을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    const authError = await requireResourceOwner(request, record.userId);
    if (authError) return authError;
    
    // 삭제 로직...
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
```

---

## 🟡 P2 - 중간 우선순위 (중간 수준 취약점)

### 4. 입력 검증 및 Sanitization

#### 4.1 입력 검증 라이브러리 설치
```bash
npm install joi
npm install --save-dev @types/joi
```

#### 4.2 검증 스키마 정의
```typescript
// src/lib/validation.ts
import Joi from 'joi';

export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required(),
  nickname: Joi.string().min(2).max(20).optional()
});

export const questSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).required(),
  location: Joi.string().max(100).required(),
  reward: Joi.number().min(0).max(10000).required()
});

export const chatMessageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  chatRoomId: Joi.string().required()
});
```

#### 4.3 API 엔드포인트에 검증 적용
```typescript
// src/app/api/auth/register/route.ts 수정
import { userRegistrationSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 입력 검증
    const { error, value } = userRegistrationSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }
    
    // 기존 로직...
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

### 5. CORS 설정

#### 5.1 CORS 미들웨어 생성
```typescript
// src/lib/cors.ts
import { NextRequest, NextResponse } from 'next/server';

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  const response = NextResponse.next();
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}
```

#### 5.2 API 라우트에 CORS 적용
```typescript
// src/app/api/auth/login/route.ts 수정
import { corsMiddleware } from '@/lib/cors';

export async function POST(request: NextRequest) {
  // CORS 처리
  if (request.method === 'OPTIONS') {
    return corsMiddleware(request);
  }
  
  const response = await handleLogin(request);
  return corsMiddleware(request);
}
```

---

## 🟢 P3 - 낮은 우선순위 (경미한 취약점)

### 6. Rate Limiting 구현

#### 6.1 Rate Limiting 라이브러리 설치
```bash
npm install express-rate-limit
```

#### 6.2 Rate Limiting 미들웨어
```typescript
// src/lib/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: { error: '너무 많은 로그인 시도가 있었습니다. 15분 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: { error: '너무 많은 요청이 있었습니다.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 7. 보안 헤더 설정

#### 7.1 Helmet.js 설치
```bash
npm install helmet
```

#### 7.2 보안 헤더 미들웨어
```typescript
// src/lib/security-headers.ts
import { NextRequest, NextResponse } from 'next/server';

export function securityHeaders(request: NextRequest) {
  const response = NextResponse.next();
  
  // 보안 헤더 설정
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}
```

---

## 🔧 수정 체크리스트

### Phase 1: 긴급 수정 (1-2일)
- [ ] 1.1 데이터베이스 스키마에 UserRole 추가
- [ ] 1.2 관리자 권한 검증 미들웨어 생성
- [ ] 1.3 관리자 페이지 접근 제어 구현
- [ ] 1.4 관리자 API 엔드포인트 보호
- [ ] 2.1 JWT_SECRET 환경변수 필수화
- [ ] 2.2 환경변수 설정 가이드 작성

### Phase 2: 중간 수정 (3-5일)
- [ ] 3.1 리소스 소유자 검증 시스템 구현
- [ ] 3.2 API 엔드포인트별 권한 검증 적용
- [ ] 4.1 입력 검증 라이브러리 설치
- [ ] 4.2 검증 스키마 정의
- [ ] 4.3 API 엔드포인트에 검증 적용
- [ ] 5.1 CORS 미들웨어 생성
- [ ] 5.2 API 라우트에 CORS 적용

### Phase 3: 보완 수정 (1주일)
- [ ] 6.1 Rate Limiting 구현
- [ ] 6.2 API별 요청 제한 설정
- [ ] 7.1 보안 헤더 설정
- [ ] 7.2 Helmet.js 적용

---

## 🧪 테스트 가이드

### 보안 테스트 시나리오
1. **관리자 권한 테스트**
   - 일반 사용자로 관리자 페이지 접근 시도
   - 관리자 API 호출 시도

2. **JWT 보안 테스트**
   - 만료된 토큰으로 API 호출
   - 잘못된 서명의 토큰 사용

3. **입력 검증 테스트**
   - SQL Injection 시도
   - XSS 공격 시도
   - 잘못된 형식의 데이터 전송

4. **Rate Limiting 테스트**
   - 짧은 시간 내 다수 요청 전송
   - 로그인 시도 제한 확인

---

## 📚 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

---

> **주의사항**: 이 문서의 수정사항들은 프로덕션 환경에 적용하기 전에 충분한 테스트를 거쳐야 합니다. 