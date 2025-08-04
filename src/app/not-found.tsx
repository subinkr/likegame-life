"use client";

import { Suspense } from 'react';

function NotFoundContent() {
  return (
    <div style={{ textAlign: 'center', marginTop: 80 }}>
      <h1>404 - 페이지를 찾을 수 없습니다</h1>
      <p>요청하신 페이지가 존재하지 않습니다.</p>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>404 페이지를 불러오는 중...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}