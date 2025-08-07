// SSE 스트림을 위한 메시지 저장소
const messageStreams = new Map<string, Set<ReadableStreamDefaultController>>();

// 메시지 브로드캐스트 함수
export function broadcastMessage(roomId: string, message: any) {
  console.log(`[BROADCAST] Starting broadcast for room ${roomId}:`, message);
  
  const controllers = messageStreams.get(roomId);
  if (controllers) {
    console.log(`[BROADCAST] Found ${controllers.size} active connections for room ${roomId}`);
    
    const data = `data: ${JSON.stringify(message)}\n\n`;
    let successCount = 0;
    let errorCount = 0;
    const deadControllers: ReadableStreamDefaultController[] = [];
    
    Array.from(controllers).forEach((controller, index) => {
      try {
        console.log(`[BROADCAST] Sending to controller ${index + 1}/${controllers.size}`);
        controller.enqueue(new TextEncoder().encode(data));
        successCount++;
        console.log(`[BROADCAST] Successfully sent to controller ${index + 1}`);
      } catch (error) {
        errorCount++;
        console.error(`[BROADCAST] Error sending to controller ${index + 1}:`, error);
        deadControllers.push(controller);
      }
    });

    // 죽은 컨트롤러 정리
    deadControllers.forEach(deadController => {
      removeStreamController(roomId, deadController);
    });

    console.log(`[BROADCAST] Room ${roomId} result: ${successCount} success, ${errorCount} errors, ${deadControllers.length} dead controllers removed, total ${controllers.size} connections`);
  } else {
    console.log(`[BROADCAST] No active connections found for room ${roomId}`);
  }
}

// 스트림 컨트롤러 관리 함수들
export function addStreamController(roomId: string, controller: ReadableStreamDefaultController) {
  if (!messageStreams.has(roomId)) {
    messageStreams.set(roomId, new Set());
  }
  messageStreams.get(roomId)!.add(controller);
  console.log(`Added controller for room ${roomId}, total connections: ${messageStreams.get(roomId)!.size}`);
}

export function removeStreamController(roomId: string, controller: ReadableStreamDefaultController) {
  const controllers = messageStreams.get(roomId);
  if (controllers) {
    controllers.delete(controller);
    console.log(`Removed controller for room ${roomId}, remaining connections: ${controllers.size}`);
    if (controllers.size === 0) {
      messageStreams.delete(roomId);
      console.log(`No more connections for room ${roomId}, cleaned up`);
    }
  }
}

export function getStreamControllers(roomId: string) {
  return messageStreams.get(roomId);
}

// 연결 상태 확인 함수
export function getConnectionStats() {
  const stats: Record<string, number> = {};
  for (const [roomId, controllers] of messageStreams.entries()) {
    stats[roomId] = controllers.size;
  }
  return stats;
} 