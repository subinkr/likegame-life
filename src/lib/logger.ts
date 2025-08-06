// 프로덕션용 로거
export const logger = {
  error: (message: string, error?: any) => {
    // 프로덕션에서는 민감한 정보를 제거하고 로그
    console.error(`[ERROR] ${message}`);
  }
}; 