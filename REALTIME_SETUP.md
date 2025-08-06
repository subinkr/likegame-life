# 실시간 채팅 설정 가이드

## 현재 상태
- ✅ Supabase 환경 변수 설정됨
- ❌ WebSocket 연결 실패 (CLOSED/TIMED_OUT)
- ❌ Replication 비활성화

## 해결 방법

### 1단계: Supabase Replication 활성화

**Supabase 대시보드에서:**

1. **Table Editor** → `chat_messages` 테이블 선택
2. **Replication** 탭 → **Enable** 클릭

**또는 SQL Editor에서:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### 2단계: RLS 정책 설정

**SQL Editor에서 `chat-rls-policies.sql` 실행**

### 3단계: 확인 방법

**브라우저 개발자 도구에서:**
- ✅ "📡 채팅방 구독 상태: SUBSCRIBED" 메시지
- ✅ "✅ 실시간 채팅 구독 성공!" 메시지
- ❌ "❌ 실시간 채팅 구독 타임아웃" 에러 없음

### 4단계: 테스트

1. **두 개의 브라우저 창**에서 같은 채팅방 접속
2. **한 창에서 메시지 전송**
3. **다른 창에서 즉시 메시지 수신** 확인

## 문제 해결

### WebSocket 연결 실패 시:
1. **Supabase 프로젝트 상태** 확인
2. **RLS 정책** 재설정
3. **브라우저 캐시** 삭제
4. **개발 서버 재시작**

### Replication 활성화 확인:
```sql
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

결과에 `chat_messages`가 있어야 합니다. 