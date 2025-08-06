# LikeGame.life

게임화된 라이프스타일 관리 플랫폼

## 🚀 시작하기

### 1. 데이터베이스 설정

Supabase Dashboard에서 다음 단계를 수행하세요:

#### **옵션 A: 완전 초기화 (권장)**
기존 데이터를 모두 지우고 새로 시작하려면:

1. **SQL Editor에서 완전 초기화 실행:**
   ```sql
   -- database-reset.sql 파일의 내용을 복사하여 실행
   ```

#### **옵션 B: 기존 데이터 유지**
기존 데이터를 유지하면서 스키마만 업데이트하려면:

1. **SQL Editor에서 스키마 업데이트:**
   ```sql
   -- database-schema.sql 파일의 내용을 복사하여 실행
   ```

2. **기존 사용자 동기화:**
   ```sql
   SELECT sync_existing_users();
   ```

#### **Realtime 기능 활성화:**
- Database > Replication > Enable realtime for `chat_messages` table
- Database > Replication > Enable realtime for `chat_rooms` table

#### **RLS (Row Level Security) 확인:**
- 모든 테이블에 RLS가 활성화되어 있는지 확인
- 정책들이 올바르게 설정되어 있는지 확인

### 2. 필수 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 환경 설정
NODE_ENV=development

# CORS 설정 (필요시)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 3. 설치 및 실행

```bash
npm install
npm run dev
```

## 🔒 보안 설정

### 프로덕션 환경 보안 체크리스트

- [ ] 강력한 환경변수 설정
- [ ] Supabase RLS (Row Level Security) 정책 활성화
- [ ] CORS 설정 확인
- [ ] 환경변수 보안 확인

## 💬 채팅 시스템

### Supabase Realtime 기반 채팅

이 프로젝트는 Supabase Realtime을 사용하여 실시간 채팅 기능을 제공합니다.

#### 주요 특징:
- **실시간 메시지**: Supabase Realtime을 통한 즉시 메시지 전송
- **Presence 기능**: 사용자 온라인 상태 표시
- **자동 재연결**: 네트워크 문제 시 자동 재연결
- **보안**: RLS를 통한 데이터 접근 제어

#### 데이터베이스 설정:

1. Supabase Dashboard에서 Realtime 기능 활성화:
   - Database > Replication > Enable realtime for `chat_messages` table
   - Database > Replication > Enable realtime for `chat_rooms` table

2. 데이터베이스 스키마 업데이트:
   ```bash
   # database-schema.sql 파일의 내용을 Supabase SQL Editor에서 실행
   ```

#### 채팅 관련 API 엔드포인트:

- `POST /api/chat/messages` - 메시지 전송
- `GET /api/chat/rooms` - 채팅방 목록 조회
- `GET /api/chat/rooms/[id]` - 채팅방 정보 조회
- `GET /api/chat/rooms/[id]/messages` - 메시지 목록 조회
- `POST /api/chat/rooms/[id]/leave` - 채팅방 나가기

## 🎮 게임화 기능

### 스탯 시스템
- **힘**: 3대 운동 최고 무게 합
- **민첩**: 도보 이동거리
- **지혜**: 초서(抄書) 수

### 랭크 시스템
- F, E, D, C, B, A, S 랭크로 구성
- 각 스탯별 기준점 설정

### 퀘스트 시스템
- 사용자 생성 퀘스트
- 파티 시스템을 통한 협업
- 실시간 채팅으로 소통

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Authentication**: Supabase Auth
- **Styling**: Styled Components

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 엔드포인트
│   ├── chat/              # 채팅 관련 페이지
│   └── components/        # 공통 컴포넌트
├── contexts/              # React Context
├── hooks/                 # Custom Hooks
└── lib/                   # 유틸리티 함수
```

## 🔧 개발 가이드

### 새로운 기능 추가

1. API 엔드포인트 생성: `src/app/api/`
2. 페이지 컴포넌트 생성: `src/app/`
3. 커스텀 훅 생성: `src/hooks/`
4. 컨텍스트 업데이트: `src/contexts/`

### 데이터베이스 변경

1. Supabase Dashboard에서 스키마 변경
2. `database-schema.sql` 파일 업데이트
3. 관련 API 엔드포인트 수정

## 🚀 배포

### Vercel 배포

1. GitHub 저장소 연결
2. 환경변수 설정
3. 자동 배포 활성화

### 수동 배포

```bash
npm run build
npm start
```

## 📄 라이센스

MIT License