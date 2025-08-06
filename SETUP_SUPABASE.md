# Supabase 환경 변수 설정 가이드

## 1. Supabase 프로젝트 설정

1. [Supabase 대시보드](https://supabase.com/dashboard)에 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. Settings → API에서 다음 정보를 복사:
   - **Project URL** (예: `https://your-project.supabase.co`)
   - **anon public** key
   - **service_role** key (서버 사이드용)

## 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ 중요**: 환경 변수를 설정하지 않으면 실시간 채팅 기능이 작동하지 않습니다.

## 3. 실시간 채팅 설정

### 3.1 Replication 활성화

Supabase 대시보드에서:
1. Table Editor → `chat_messages` 테이블 선택
2. Replication 탭 → Enable 클릭

또는 SQL Editor에서:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### 3.2 RLS 정책 설정

SQL Editor에서 `chat-rls-policies.sql` 실행

## 4. 개발 서버 재시작

환경 변수 설정 후 개발 서버를 재시작:

```bash
npm run dev
```

## 5. 확인 방법

브라우저 개발자 도구 콘솔에서:

**환경 변수가 설정된 경우:**
- ✅ "📡 Realtime 채널 상태: SUBSCRIBED" 메시지 확인
- ✅ "💬 Realtime 메시지 수신:" 메시지 확인

**환경 변수가 설정되지 않은 경우:**
- ⚠️ "⚠️ Supabase 환경 변수가 설정되지 않았습니다." 경고 메시지
- ⚠️ "⚠️ 환경 변수가 설정되지 않아 실시간 기능이 비활성화되었습니다." 경고 메시지

실시간 채팅을 사용하려면 반드시 환경 변수를 설정해야 합니다. 