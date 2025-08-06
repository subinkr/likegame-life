// SSE 스트림을 위한 메시지 저장소
const messageStreams = new Map<string, Set<ReadableStreamDefaultController>>();

// 메시지 브로드캐스트 함수
export function broadcastMessage(roomId: string, message: any) {
  const controllers = messageStreams.get(roomId);
  if (controllers) {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    controllers.forEach(controller => {
      try {
        controller.enqueue(new TextEncoder().encode(data));
      } catch (error) {
        // SSE 전송 실패 무시
      }
    });
  }
}

// 스트림 컨트롤러 관리 함수들
export function addStreamController(roomId: string, controller: ReadableStreamDefaultController) {
  if (!messageStreams.has(roomId)) {
    messageStreams.set(roomId, new Set());
  }
  messageStreams.get(roomId)!.add(controller);
}

export function removeStreamController(roomId: string, controller: ReadableStreamDefaultController) {
  const controllers = messageStreams.get(roomId);
  if (controllers) {
    controllers.delete(controller);
    if (controllers.size === 0) {
      messageStreams.delete(roomId);
    }
  }
}

export function getStreamControllers(roomId: string) {
  return messageStreams.get(roomId);
} 