# WebSocket에서 Supabase Realtime으로의 마이그레이션 가이드

## 📋 개요

기존 WebSocket 기반 채팅 시스템을 Supabase Realtime으로 완전히 마이그레이션했습니다.

## 🔄 주요 변경사항

### 1. 아키텍처 변경
- **이전**: 별도 WebSocket 서버 (`ws` 패키지 사용)
- **현재**: Supabase Realtime (PostgreSQL 변경사항 구독)

### 2. 제거된 파일들
- `src/lib/websocket.js` - WebSocket 서버
- `src/hooks/useWebSocket.ts` - WebSocket 클라이언트 훅
- `package.json`에서 `ws`, `@types/ws` 의존성 제거

### 3. 새로 추가된 파일들
- `src/lib/supabase.ts` - Realtime 관리자 클래스
- `src/hooks/useRealtimeChat.ts` - Realtime 채팅 훅
- `src/app/api/chat/messages/route.ts` - 메시지 전송 API
- `database-updates.sql` - 데이터베이스 스키마 업데이트

## 🛠️ 마이그레이션 단계

### 1단계: 의존성 업데이트

```bash
# 기존 WebSocket 의존성 제거
npm uninstall ws @types/ws

# Supabase Realtime은 이미 설치되어 있음
# @supabase/supabase-js
```

### 2단계: 데이터베이스 스키마 업데이트

Supabase Dashboard에서 SQL Editor를 열고 `database-updates.sql` 파일의 내용을 실행하세요:

```sql
-- 1. user_nickname 컬럼 추가
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_nickname TEXT;

-- 2. 기존 데이터 업데이트
UPDATE chat_messages 
SET user_nickname = (
  SELECT nickname FROM users WHERE users.id = chat_messages.user_id
)
WHERE user_nickname IS NULL;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
```

### 3단계: Realtime 기능 활성화

Supabase Dashboard에서:

1. **Database > Replication** 메뉴로 이동
2. `chat_messages` 테이블의 Realtime 활성화
3. `chat_rooms` 테이블의 Realtime 활성화

### 4단계: RLS 정책 설정

```sql
-- 채팅방 참가자만 메시지를 볼 수 있도록 정책 설정
CREATE POLICY "Users can view messages in their chat rooms" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_room_participants 
      WHERE chat_room_participants.chat_room_id = chat_messages.chat_room_id 
      AND chat_room_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chat rooms" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_room_participants 
      WHERE chat_room_participants.chat_room_id = chat_messages.chat_room_id 
      AND chat_room_participants.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );
```

## 🔧 코드 변경사항

### 채팅 페이지 업데이트

```typescript
// 이전: useWebSocket 사용
import { useWebSocket } from '@/hooks/useWebSocket';

// 현재: useRealtimeChat 사용
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
```

### 메시지 전송 방식 변경

```typescript
// 이전: WebSocket을 통한 직접 전송
const success = sendChatMessage(chatRoomId, messageContent);

// 현재: API를 통한 저장 (Realtime 이벤트 자동 발생)
const success = await sendMessage(chatRoomId, messageContent);
```

## 🚀 장점

### 1. 간소화된 아키텍처
- 별도 WebSocket 서버 불필요
- Supabase의 관리형 서비스 활용
- 서버 유지보수 부담 감소

### 2. 향상된 안정성
- Supabase의 자동 재연결 기능
- 네트워크 문제 시 자동 복구
- 확장성 있는 인프라

### 3. 보안 강화
- RLS를 통한 데이터 접근 제어
- 인증된 사용자만 메시지 접근 가능
- 데이터베이스 레벨 보안

### 4. 개발 편의성
- 더 적은 코드로 동일한 기능
- Supabase Dashboard를 통한 모니터링
- 자동 스케일링

## ⚠️ 주의사항

### 1. 환경변수 확인
```bash
# .env.local 파일에 다음이 설정되어 있는지 확인
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 데이터베이스 권한
- Supabase Dashboard에서 RLS 정책이 올바르게 설정되었는지 확인
- 테스트 계정으로 채팅 기능 테스트

### 3. 성능 모니터링
- Supabase Dashboard에서 Realtime 연결 상태 확인
- 메시지 전송 지연 시간 모니터링

## 🧪 테스트

### 1. 기본 기능 테스트
```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 채팅 기능 테스트
# - 메시지 전송
# - 실시간 수신
# - 연결 상태 표시
```

### 2. 네트워크 테스트
- 네트워크 연결 해제 후 재연결
- 자동 재연결 기능 확인
- 메시지 손실 없음 확인

### 3. 보안 테스트
- 다른 사용자의 채팅방 접근 시도
- 권한 없는 사용자의 메시지 전송 시도
- RLS 정책 동작 확인

## 📊 성능 비교

| 항목 | WebSocket | Supabase Realtime |
|------|-----------|-------------------|
| 서버 관리 | 별도 서버 필요 | 관리형 서비스 |
| 확장성 | 수동 스케일링 | 자동 스케일링 |
| 보안 | 수동 구현 | RLS 기반 |
| 개발 복잡도 | 높음 | 낮음 |
| 유지보수 | 높음 | 낮음 |

## 🎯 결론

Supabase Realtime으로의 마이그레이션을 통해 더 안정적이고 확장 가능한 채팅 시스템을 구축했습니다. 별도 서버 관리 없이도 실시간 기능을 제공하며, 보안과 성능이 모두 향상되었습니다. 