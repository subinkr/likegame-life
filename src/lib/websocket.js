const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ChatServer {
  constructor() {
    this.wss = null;
    this.server = null;
    this.clients = new Map();
  }

  initialize(port) {
    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws) => {
      console.log('🖥️ 서버 - 새 클라이언트 연결됨');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('🖥️ 서버 - 메시지 수신:', {
            type: message.type,
            userId: message.userId,
            chatRoomId: message.chatRoomId,
            content: message.content
          });
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('🖥️ 서버 - 메시지 파싱 실패:', error);
        }
      });

      ws.on('close', () => {
        console.log('🖥️ 서버 - 클라이언트 연결 해제');
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('🖥️ 서버 - 웹소켓 에러:', error);
        this.removeClient(ws);
      });
    });

    this.server.listen(port, () => {
      console.log(`🖥️ 서버 - 채팅 서버 시작: ws://localhost:${port}`);
    });
  }

  async handleMessage(ws, message) {
    console.log('🖥️ 서버 - 메시지 처리 시작:', message.type);
    
    switch (message.type) {
      case 'auth':
        this.handleAuth(ws, message);
        break;
      case 'join_room':
        this.handleJoinRoom(ws, message);
        break;
      case 'leave_room':
        this.handleLeaveRoom(ws, message);
        break;
      case 'chat_message':
        await this.handleChatMessage(ws, message);
        break;
      default:
        console.log('🖥️ 서버 - 알 수 없는 메시지 타입:', message.type);
    }
  }

  handleAuth(ws, message) {
    const { userId } = message;
    console.log('🖥️ 서버 - 인증 요청:', userId);
    
    // 기존 연결 제거
    const existingClient = this.clients.get(userId);
    if (existingClient) {
      console.log('🖥️ 서버 - 기존 연결 제거:', userId);
      existingClient.ws.close(1000, '새 연결로 교체');
      this.clients.delete(userId);
    }

    // 새 클라이언트 등록
    this.clients.set(userId, {
      ws,
      userId,
      rooms: new Set()
    });
    
    console.log('🖥️ 서버 - 인증 성공:', userId);
    console.log('🖥️ 서버 - 현재 연결된 클라이언트:', Array.from(this.clients.keys()));
    ws.send(JSON.stringify({ type: 'auth_success', userId }));
  }

  handleJoinRoom(ws, message) {
    const { userId, chatRoomId } = message;
    console.log('🖥️ 서버 - 채팅방 참가 요청:', userId, '->', chatRoomId);
    
    const client = this.clients.get(userId);
    if (client) {
      // 이미 해당 채팅방에 참가 중인지 확인
      if (client.rooms.has(chatRoomId)) {
        console.log('🖥️ 서버 - 이미 참가 중인 채팅방:', userId, '->', chatRoomId);
        ws.send(JSON.stringify({ type: 'join_room_success', chatRoomId }));
        return;
      }
      
      client.rooms.add(chatRoomId);
      ws.send(JSON.stringify({ type: 'join_room_success', chatRoomId }));
      
      // 웹소켓에서는 시스템 메시지를 생성하지 않음
      // 시스템 메시지는 API에서만 생성됨
    }
  }

  handleLeaveRoom(ws, message) {
    const { userId, chatRoomId } = message;
    console.log('🖥️ 서버 - 채팅방 나가기:', userId, '->', chatRoomId);
    
    const client = this.clients.get(userId);
    if (client) {
      // 실제로 해당 채팅방에 참가 중인지 확인
      if (!client.rooms.has(chatRoomId)) {
        console.log('🖥️ 서버 - 참가하지 않은 채팅방에서 나가기 시도:', userId, '->', chatRoomId);
        ws.send(JSON.stringify({ type: 'leave_room_success', chatRoomId }));
        return;
      }
      
      client.rooms.delete(chatRoomId);
      ws.send(JSON.stringify({ type: 'leave_room_success', chatRoomId }));
      
      // 웹소켓에서는 시스템 메시지를 생성하지 않음
      // 시스템 메시지는 API에서만 생성됨
    }
  }

  async handleChatMessage(ws, message) {
    const { chatRoomId, userId, content, user } = message;
    console.log('🖥️ 서버 - 채팅 메시지 처리:', {
      userId,
      chatRoomId,
      content,
      userNickname: user?.nickname
    });
    
    try {
      // 데이터베이스에 메시지 저장
      const savedMessage = await prisma.chatMessage.create({
        data: {
          chatRoomId,
          userId,
          content: content.trim(),
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      });

      // 채팅방 업데이트 시간 갱신
      await prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: { updatedAt: new Date() },
      });

      console.log('🖥️ 서버 - 메시지 저장 성공:', savedMessage);

      // 브로드캐스트할 메시지 생성
      const messageToSend = {
        type: 'chat_message',
        id: savedMessage.id,
        chatRoomId,
        userId,
        content: content.trim(),
        user: savedMessage.user,
        timestamp: savedMessage.createdAt.toISOString()
      };

      console.log('🖥️ 서버 - 브로드캐스트할 메시지:', messageToSend);
      
      // 전송자에게 성공 응답 보내기
      const sender = this.clients.get(userId);
      if (sender) {
        try {
          sender.ws.send(JSON.stringify({
            type: 'chat_message_sent',
            messageId: savedMessage.id,
            chatRoomId,
            content: content.trim(),
            timestamp: savedMessage.createdAt.toISOString()
          }));
          console.log('🖥️ 서버 - 전송자에게 성공 응답 전송:', userId);
        } catch (error) {
          console.error('🖥️ 서버 - 전송자에게 응답 전송 실패:', error);
        }
      }
      
      // 다른 참가자들에게 브로드캐스트
      this.broadcastToRoom(chatRoomId, messageToSend);
    } catch (error) {
      console.error('🖥️ 서버 - 메시지 저장 실패:', error);
      
      // 전송자에게 실패 응답 보내기
      const sender = this.clients.get(userId);
      if (sender) {
        try {
          sender.ws.send(JSON.stringify({
            type: 'chat_message_error',
            error: '메시지 저장에 실패했습니다.'
          }));
        } catch (sendError) {
          console.error('🖥️ 서버 - 에러 응답 전송 실패:', sendError);
        }
      }
    }
  }

  broadcastToRoom(chatRoomId, message) {
    console.log(`🖥️ 서버 - 채팅방 ${chatRoomId}에 브로드캐스트 시작:`, message.content);
    console.log('🖥️ 서버 - 현재 연결된 클라이언트:', Array.from(this.clients.keys()));
    
    let sentCount = 0;
    const recipients = [];
    
    for (const [userId, client] of this.clients.entries()) {
      console.log(`🖥️ 서버 - 클라이언트 ${userId} 확인:`, {
        hasRoom: client.rooms.has(chatRoomId),
        rooms: Array.from(client.rooms)
      });
      
      if (client.rooms.has(chatRoomId)) {
        try {
          client.ws.send(JSON.stringify(message));
          sentCount++;
          recipients.push(userId);
          console.log(`🖥️ 서버 - 메시지 전송 성공: ${userId}`);
        } catch (error) {
          console.error(`🖥️ 서버 - 메시지 전송 실패: ${userId}`, error);
        }
      }
    }
    
    console.log(`🖥️ 서버 - 브로드캐스트 완료: ${sentCount}명에게 전송됨 (${recipients.join(', ')})`);
  }

  removeClient(ws) {
    for (const [userId, client] of this.clients.entries()) {
      if (client.ws === ws) {
        console.log('🖥️ 서버 - 클라이언트 연결 해제:', userId);
        this.clients.delete(userId);
        break;
      }
    }
  }

  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  getRoomParticipants(chatRoomId) {
    const participants = [];
    for (const [userId, client] of this.clients.entries()) {
      if (client.rooms.has(chatRoomId)) {
        participants.push(userId);
      }
    }
    return participants;
  }

  async getUserInfo(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
        },
      });
      return user;
    } catch (error) {
      console.error('🖥️ 서버 - 사용자 정보 조회 실패:', error);
      return null;
    }
  }
}

const chatServer = new ChatServer();
module.exports = { chatServer }; 