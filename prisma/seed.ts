import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// .env.local 파일 로드
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터를 추가하고 있습니다...')

  // 모든 뱃지 데이터 합치기
  const allBadges = [
    { name: '아침 물 한 컵', description: '기상 직후 물 한 컵을 마셨다', rarity: 'common', icon: '💧' },
    /* 2. Quick Stretch */
    { name: '5분 스트레칭', description: '온몸 스트레칭을 5분간 했다', rarity: 'common', icon: '🤸‍♂️' },
    /* 3. Reading */
    { name: '책 10쪽 읽기', description: '책 10쪽을 읽었다', rarity: 'common', icon: '📖' },
    /* 4. Journaling */
    { name: '저널 한 줄', description: '일기를 한 줄 작성했다', rarity: 'common', icon: '📓' },
    /* 5. Gratitude */
    { name: '감사 1가지', description: '오늘 감사한 점을 하나 적었다', rarity: 'common', icon: '🙏' },
    /* 6. Language */
    { name: '단어 5개 암기', description: '새 단어 5개를 외웠다', rarity: 'common', icon: '🔤' },
    /* 7. Music */
    { name: '악기 5분 연습', description: '악기를 5분 연습했다', rarity: 'common', icon: '🎸' },
    /* 8. Sketch */
    { name: '30초 스케치', description: '빠른 스케치를 30초간 했다', rarity: 'common', icon: '✏️' },
    /* 9. Photo */
    { name: '하늘 사진', description: '오늘 하늘을 사진으로 담았다', rarity: 'common', icon: '📸' },
    /* 10. Walk */
    { name: '산책 1,000보', description: '가벼운 산책으로 1,000보를 걸었다', rarity: 'common', icon: '🚶‍♂️' },
    /* 11. Meditation */
    { name: '명상 3분', description: '조용히 3분간 호흡 명상을 했다', rarity: 'common', icon: '🧘' },
    /* 12. Hydration */
    { name: '물 1L 달성', description: '수분 섭취 1L를 달성했다', rarity: 'common', icon: '🥤' },
    /* 13. Posture */
    { name: '자세 교정', description: '작업 중 1회 자세를 교정했다', rarity: 'common', icon: '🪑' },
    /* 14. Digital Detox */
    { name: '스크린 휴식 10분', description: '전자기기 없이 10분을 보냈다', rarity: 'common', icon: '📵' },
    /* 15. Cooking */
    { name: '간단 요리', description: '집에서 한 끼를 조리했다', rarity: 'common', icon: '🍳' },
    /* 16. Plant Care */
    { name: '화분 물주기', description: '집 안 화분에 물을 줬다', rarity: 'common', icon: '🌱' },
    /* 17. Compliment */
    { name: '칭찬 한 마디', description: '누군가에게 진심 어린 칭찬을 전했다', rarity: 'common', icon: '💬' },
    /* 18. Savings */
    { name: '저축 1,000원', description: '저금통에 1,000원을 저축했다', rarity: 'common', icon: '💰' },
    /* 19. Podcast */
    { name: '팟캐스트 5분', description: '자기계발 팟캐스트를 5분 들었다', rarity: 'common', icon: '🎧' },
    /* 20. Clean Desk */
    { name: '책상 정리', description: '책상 위를 깔끔히 정리했다', rarity: 'common', icon: '🧹' },
    /* 21. Floss */
    { name: '치실 사용', description: '양치 후 치실을 사용했다', rarity: 'common', icon: '🦷' },
    /* 22. Smile */
    { name: '웃음 10초', description: '의식적으로 10초간 웃어보았다', rarity: 'common', icon: '😄' },
    /* 23. Sunlight */
    { name: '햇빛 5분', description: '바깥 햇빛을 5분 쬐었다', rarity: 'common', icon: '☀️' },
    /* 24. Step Count */
    { name: '5,000보 달성', description: '하루 걸음 5,000보를 달성했다', rarity: 'common', icon: '👣' },
    /* 25. Water Plants */
    { name: '물갈이', description: '수경식물 물을 갈아주었다', rarity: 'common', icon: '🌿' },
    /* 26. Email Zero */
    { name: '받은편지함 비우기', description: '메일함을 0으로 비웠다', rarity: 'common', icon: '📨' },
    /* 27. Learn Code */
    { name: '코딩 문제 1개', description: '코딩 문제를 하나 풀었다', rarity: 'common', icon: '💻' },
    /* 28. Yoga */
    { name: '요가 10분', description: '간단한 요가를 10분 수행했다', rarity: 'common', icon: '🧘‍♀️' },
    /* 29. Doodle */
    { name: '낙서 1장', description: '낙서 한 장을 완성했다', rarity: 'common', icon: '🖍️' },
    /* 30. Call Family */
    { name: '안부 전화', description: '가족에게 안부 전화를 했다', rarity: 'common', icon: '📞' },
    /* 31. Music Listen */
    { name: '신곡 감상', description: '새 노래를 처음부터 끝까지 들었다', rarity: 'common', icon: '🎵' },
    /* 32. Affirmation */
    { name: '긍정 확언', description: '긍정 문장을 크게 읽었다', rarity: 'common', icon: '📢' },
    /* 33. Learn Fact */
    { name: '새 사실 1개', description: '새로운 지식을 한 가지 배웠다', rarity: 'common', icon: '📚' },
    /* 34. Push-ups */
    { name: '푸시업 10회', description: '푸시업을 10회 수행했다', rarity: 'common', icon: '💪' },
    /* 35. Water Reminder */
    { name: '물 3회 알림', description: '물 마시기 알림을 3회 지켰다', rarity: 'common', icon: '⏰' },
    /* 36. Habit Track */
    { name: '습관 앱 체크', description: '습관 추적 앱에 오늘 기록을 남겼다', rarity: 'common', icon: '📱' },
    /* 37. Clean Email */
    { name: '구독 해지 1개', description: '불필요한 메일 구독을 1개 해지했다', rarity: 'common', icon: '🗑️' },
    /* 38. Map Route */
    { name: '새 산책로 탐험', description: '처음 가보는 길로 산책했다', rarity: 'common', icon: '🗺️' },
    /* 39. Budget */
    { name: '지출 기록', description: '오늘 지출을 앱에 기록했다', rarity: 'common', icon: '📊' },
    /* 40. Breathwork */
    { name: '심호흡 10회', description: '깊은 숨을 10회 의식적으로 들이쉬었다', rarity: 'common', icon: '🌬️' },
    /* 41. Green Tea */
    { name: '녹차 한 잔', description: '카페인 적은 녹차를 마셨다', rarity: 'common', icon: '🍵' },
    /* 42. Smile Mirror */
    { name: '거울 미소', description: '거울 앞에서 미소를 지었다', rarity: 'common', icon: '🪞' },
    /* 43. Stand Break */
    { name: '한 시간 서기', description: '업무 중 1시간 서서 일했다', rarity: 'common', icon: '🖥️' },
    /* 44. Lunges */
    { name: '런지 20회', description: '런지를 20회 수행했다', rarity: 'common', icon: '🏋️‍♂️' },
    /* 45. Sudoku */
    { name: '스도쿠 1판', description: '스도쿠 한 판을 완성했다', rarity: 'common', icon: '🧩' },
    /* 46. Charity */
    { name: '기부 1000원', description: '좋은 곳에 1,000원을 기부했다', rarity: 'common', icon: '🎁' },
    /* 47. Aromatherapy */
    { name: '향초 켜기', description: '향초를 켜고 휴식을 취했다', rarity: 'common', icon: '🕯️' },
    /* 48. Declutter */
    { name: '물건 1개 버리기', description: '불필요한 물건을 하나 정리했다', rarity: 'common', icon: '🚮' },
    /* 49. Learn Phrase */
    { name: '회화 표현 1개', description: '새 외국어 표현을 배웠다', rarity: 'common', icon: '💬' },
    /* 50. Handstand Wall */
    { name: '벽서기 10초', description: '벽을 짚고 10초간 거꾸로 섰다', rarity: 'common', icon: '🤸‍♀️' },
    /* 51. Guitar Chord */
    { name: '새 코드 1개', description: '기타 새 코드를 익혔다', rarity: 'common', icon: '🎸' },
    /* 52. Water Color */
    { name: '수채화 그라데이션', description: '수채화로 색을 자연스럽게 번지게 했다', rarity: 'common', icon: '🎨' },
    /* 53. Baking */
    { name: '쿠키 3개', description: '간단한 쿠키를 3개 구웠다', rarity: 'common', icon: '🍪' },
    /* 54. Learn Sign */
    { name: '수어 단어 1개', description: '한국수화 단어 한 개를 배웠다', rarity: 'common', icon: '🤟' },
    /* 55. Speed Typing */
    { name: '타자 80WPM', description: '타자 속도 80WPM을 기록했다', rarity: 'common', icon: '⌨️' },
    /* 56. Origami */
    { name: '종이학 접기', description: '종이학 한 마리를 접었다', rarity: 'common', icon: '🕊️' },
    /* 57. Clean Inbox */
    { name: '메신저 0', description: '메신저 알림을 모두 처리했다', rarity: 'common', icon: '📲' },
    /* 58. Podcast Note */
    { name: '팟캐스트 메모', description: '팟캐스트에서 배운 점을 메모했다', rarity: 'common', icon: '📝' },
    /* 59. Step Goal */
    { name: '계단 오르기 5층', description: '엘리베이터 대신 계단 5층을 올랐다', rarity: 'common', icon: '🏃‍♂️' },
    /* 60. Flashcards */
    { name: '플래시카드 1세트', description: '플래시카드를 한 세트 복습했다', rarity: 'common', icon: '🃏' },
    /* 61. Digital Clean */
    { name: '사진 10장 정리', description: '휴대폰 사진 10장을 정리했다', rarity: 'common', icon: '🗂️' },
    /* 62. Hug */
    { name: '포옹 1회', description: '가까운 사람과 포옹했다', rarity: 'common', icon: '🤗' },
    /* 63. Mind Map */
    { name: '마인드맵 1개', description: '아이디어를 마인드맵으로 정리했다', rarity: 'common', icon: '🧠' },
    /* 64. Scale Practice */
    { name: '음계 1세트', description: '악기 음계 연습 1세트를 완료했다', rarity: 'common', icon: '🎹' },
    /* 65. Drink Tea */
    { name: '허브티 한 잔', description: '카페인 없는 허브티를 마셨다', rarity: 'common', icon: '🫖' },
    /* 66. Smile to Stranger */
    { name: '낯선 이에게 미소', description: '길에서 낯선 사람에게 미소를 건넸다', rarity: 'common', icon: '🙂' },
    /* 67. Penmanship */
    { name: '손글씨 연습', description: '1페이지 손글씨를 연습했다', rarity: 'common', icon: '✒️' },
    /* 68. Vocabulary App */
    { name: '어휘 앱 1레벨', description: '어휘 앱 레벨을 하나 완료했다', rarity: 'common', icon: '📚' },
    /* 69. Chess Puzzle */
    { name: '체스 퍼즐', description: '체스 퍼즐 하나를 풀었다', rarity: 'common', icon: '♟️' },
    /* 70. Drink Fruit */
    { name: '과일 1회 섭취', description: '과일 한 접시를 먹었다', rarity: 'common', icon: '🍎' },
    /* 71. Story Writing */
    { name: '짧은 이야기', description: '100자 짧은 이야기를 썼다', rarity: 'common', icon: '📖' },
    /* 72. Clean Car */
    { name: '차량 내부 청소', description: '차량 내부를 간단히 청소했다', rarity: 'common', icon: '🚗' },
    /* 73. Skill Video */
    { name: '튜토리얼 시청', description: '새 기술 튜토리얼을 5분 시청했다', rarity: 'common', icon: '🎥' },
    /* 74. Game Level */
    { name: '게임 스테이지 클리어', description: '퍼즐 게임 한 스테이지를 클리어했다', rarity: 'common', icon: '🕹️' },
    /* 75. Laundry */
    { name: '세탁 완료', description: '빨래를 세탁기에 돌렸다', rarity: 'common', icon: '🧺' },
    /* 76. Stretch Goal */
    { name: '허리 숙이기', description: '손이 발끝에 닿도록 스트레칭', rarity: 'common', icon: '🤸' },
    /* 77. Write Quote */
    { name: '명언 필사', description: '좋아하는 명언을 필사했다', rarity: 'common', icon: '📜' },
    /* 78. Budget Check */
    { name: '잔고 확인', description: '오늘 계좌 잔고를 확인했다', rarity: 'common', icon: '🏦' },
    /* 79. Drink Less Sugar */
    { name: '무가당 음료', description: '설탕 없는 음료를 선택했다', rarity: 'common', icon: '🥤' },
    /* 80. Cold Shower */
    { name: '30초 냉수샤워', description: '냉수로 30초 샤워했다', rarity: 'common', icon: '❄️' },
    /* 81. Bike */
    { name: '자전거 2km', description: '자전거로 2km 이동했다', rarity: 'common', icon: '🚴' },
    /* 82. Learn Emoji */
    { name: '새 이모지', description: '새로운 이모지 의미를 알게 되었다', rarity: 'common', icon: '😀' },
    /* 83. Facial Massage */
    { name: '얼굴 마사지', description: '1분간 얼굴 마사지를 했다', rarity: 'common', icon: '💆' },
    /* 84. Calligraphy */
    { name: '캘리그라피 1문장', description: '손글씨로 멋진 문장을 썼다', rarity: 'common', icon: '🖌️' },
    /* 85. Learn Keyboard Shortcuts */
    { name: '단축키 학습', description: '새로운 단축키 1개를 익혔다', rarity: 'common', icon: '⌨️' },
    /* 86. Play Puzzle */
    { name: '직소 10조각', description: '직소 퍼즐 10조각을 맞췄다', rarity: 'common', icon: '🧩' },
    /* 87. Hydrate Skin */
    { name: '기초 스킨케어', description: '세안 후 기초 스킨케어를 했다', rarity: 'common', icon: '🧴' },
    /* 88. Learn Knot */
    { name: '매듭법 1개', description: '실생활 매듭법을 하나 익혔다', rarity: 'common', icon: '🪢' },
    /* 89. Pet Care */
    { name: '반려동물 산책', description: '반려동물을 10분 산책시켰다', rarity: 'common', icon: '🐕' },
    /* 90. Plan Tomorrow */
    { name: '내일 계획', description: '내일 해야 할 일 3가지를 적었다', rarity: 'common', icon: '🗒️' },
    /* 91. Listen Classical */
    { name: '클래식 1곡', description: '클래식 음악 한 곡을 감상했다', rarity: 'common', icon: '🎻' },
    /* 92. Clean Dishes */
    { name: '설거지 마무리', description: '식기류 설거지를 바로 마쳤다', rarity: 'common', icon: '🍽️' },
    /* 93. Step Outside */
    { name: '신선한 공기', description: '창문을 열고 깊게 숨 쉬었다', rarity: 'common', icon: '🌳' },
    /* 94. Handwriting */
    { name: '엽서 쓰기', description: '친구에게 엽서를 썼다', rarity: 'common', icon: '📮' },
    /* 95. Memory Test */
    { name: '숫자 암기 5자리', description: '무작위 숫자 5자리를 외웠다', rarity: 'common', icon: '🔢' },
    /* 96. Drink Veggie */
    { name: '채소 스낵', description: '생채소를 간식으로 먹었다', rarity: 'common', icon: '🥕' },
    /* 97. Mindful Bite */
    { name: '천천히 씹기', description: '한 입 20번 이상 천천히 씹었다', rarity: 'common', icon: '🍽️' },
    /* 98. Learn Flag */
    { name: '국기 지식', description: '새로운 나라 국기와 수도를 외웠다', rarity: 'common', icon: '🏳️' },
    /* 99. Tidy Bed */
    { name: '침구 정돈', description: '아침에 침대를 정리했다', rarity: 'common', icon: '🛏️' },
    /* 100. Smile Log */
    { name: '웃음 기록', description: '오늘 웃었던 순간을 기록했다', rarity: 'common', icon: '😁' },
    /* 1. Early Rise */
    { name: '새벽 기상', description: '새벽 5시에 일어났다', rarity: 'uncommon', icon: '🌅' },
    /* 2. Deep Work */
    { name: '심층 작업 1시간', description: '잡음 없이 1시간 집중 작업했다', rarity: 'uncommon', icon: '🧠' },
    /* 3. Research Paper */
    { name: '연구 논문 읽기', description: '전문 논문 한 편을 읽었다', rarity: 'uncommon', icon: '📄' },
    /* 4. Writing */
    { name: '글쓰기 500자', description: '500자를 타이핑했다', rarity: 'uncommon', icon: '✍️' },
    /* 5. Blog Post */
    { name: '블로그 게시', description: '새 글을 블로그에 게시했다', rarity: 'uncommon', icon: '📰' },
    /* 6. Algorithm Study */
    { name: '알고리즘 학습', description: '알고리즘 개념 하나를 이해했다', rarity: 'uncommon', icon: '🧩' },
    /* 7. Data Viz */
    { name: '데이터 시각화', description: '데이터 그래프를 그렸다', rarity: 'uncommon', icon: '📈' },
    /* 8. Code Refactor */
    { name: '코드 리팩터링', description: '기존 코드를 개선했다', rarity: 'uncommon', icon: '🔧' },
    /* 9. Home DIY */
    { name: 'DIY 수리', description: '집안 고장을 수리했다', rarity: 'uncommon', icon: '🔨' },
    /*10. Plant Propagation */
    { name: '식물 번식', description: '식물을 꺾꽂이했다', rarity: 'uncommon', icon: '🌿' },
    /*11. Fermentation */
    { name: '발효 김치', description: '김치를 버무렸다', rarity: 'uncommon', icon: '🥬' },
    /*12. Hand Drip */
    { name: '핸드드립 커피', description: '커피를 핸드드립했다', rarity: 'uncommon', icon: '☕' },
    /*13. Classical Piece */
    { name: '클래식 곡 완주', description: '악보 한 곡을 끝까지 연주했다', rarity: 'uncommon', icon: '🎼' },
    /*14. Ukulele Practice */
    { name: '우쿨렐레 곡', description: '우쿨렐레 곡 하나를 연습했다', rarity: 'uncommon', icon: '🎶' },
    /*15. Martial Art */
    { name: '합기도 품새', description: '합기도 품새를 수련했다', rarity: 'uncommon', icon: '🥋' },
    /*16. HIIT */
    { name: 'HIIT 15분', description: '고강도 운동을 15분간 수행했다', rarity: 'uncommon', icon: '🏃‍♂️' },
    /*17. Distance Run */
    { name: '장거리 러닝', description: '5km를 달렸다', rarity: 'uncommon', icon: '🏃' },
    /*18. Cycling */
    { name: '자전거 20km', description: '20km를 자전거로 달렸다', rarity: 'uncommon', icon: '🚴' },
    /*19. Hiking */
    { name: '등산 5km', description: '5km 산길을 걸었다', rarity: 'uncommon', icon: '🥾' },
    /*20. Climbing */
    { name: '암벽등반 10m', description: '실내 암벽 10m를 올랐다', rarity: 'uncommon', icon: '🧗' },
    /*21. Yoga Flow */
    { name: '요가 30분', description: '요가 플로우를 30분 이어갔다', rarity: 'uncommon', icon: '🧘‍♂️' },
    /*22. Meditation */
    { name: '명상 15분', description: '조용히 15분간 명상했다', rarity: 'uncommon', icon: '🕯️' },
    /*23. Push-ups */
    { name: '푸시업 50회', description: '푸시업 50회를 완수했다', rarity: 'uncommon', icon: '💪' },
    /*24. Plank */
    { name: '플랭크 2분', description: '플랭크 2분을 버텼다', rarity: 'uncommon', icon: '🔒' },
    /*25. Chess Match */
    { name: '체스 대국', description: '체스 대국을 치렀다', rarity: 'uncommon', icon: '♟️' },
    /*26. Chess Tactics */
    { name: '체스 전술 5개', description: '전술 퍼즐 5개를 풀었다', rarity: 'uncommon', icon: '♜' },
    /*27. Hard Sudoku */
    { name: '난이도 높은 스도쿠', description: '어려운 스도쿠를 완성했다', rarity: 'uncommon', icon: '🔢' },
    /*28. Puzzle 500 */
    { name: '퍼즐 500피스', description: '500피스 퍼즐을 맞췄다', rarity: 'uncommon', icon: '🧩' },
    /*29. Game Prototype */
    { name: '게임 프로토타입', description: '게임 아이디어를 구현했다', rarity: 'uncommon', icon: '🎮' },
    /*30. App Dev */
    { name: '앱 프로토타입', description: '앱 프로토타입을 만들었다', rarity: 'uncommon', icon: '📱' },
    /*31. Video Edit */
    { name: '영상 편집 10분', description: '촬영 영상을 10분 편집했다', rarity: 'uncommon', icon: '🎞️' },
    /*32. Photo RAW */
    { name: '사진 RAW 편집', description: 'RAW 파일을 보정했다', rarity: 'uncommon', icon: '📷' },
    /*33. Drone Flight */
    { name: '드론 촬영', description: '드론으로 촬영했다', rarity: 'uncommon', icon: '🛸' },
    /*34. Star Gazing */
    { name: '별 관측', description: '밤하늘을 관측했다', rarity: 'uncommon', icon: '⭐' },
    /*35. Astrophoto */
    { name: '천체사진', description: '천체사진을 촬영했다', rarity: 'uncommon', icon: '🌌' },
    /*36. Bird Watching */
    { name: '조류 관찰', description: '새 1종을 기록했다', rarity: 'uncommon', icon: '🐦' },
    /*37. Surfing */
    { name: '서핑 30분', description: '파도를 30분 탔다', rarity: 'uncommon', icon: '🏄‍♂️' },
    /*38. Swimming */
    { name: '수영 1km', description: '1km를 수영했다', rarity: 'uncommon', icon: '🏊' },
    /*39. Composition */
    { name: '작곡 1분', description: '1분 분량 음악을 작곡했다', rarity: 'uncommon', icon: '🎹' },
    /*40. Vocal Practice */
    { name: '보컬 연습', description: '노래를 15분 연습했다', rarity: 'uncommon', icon: '🎤' },
    /*41. Calligraphy */
    { name: '캘리그라피', description: '캘리그라피 한 페이지를 썼다', rarity: 'uncommon', icon: '🖌️' },
    /*42. Penmanship */
    { name: '손글씨 교정', description: '손글씨를 1페이지 연습했다', rarity: 'uncommon', icon: '📝' },
    /*43. Pottery */
    { name: '도자기 만들기', description: '도자기 그릇을 빚었다', rarity: 'uncommon', icon: '🏺' },
    /*44. Woodcraft */
    { name: '목공 소품', description: '목재 소품을 제작했다', rarity: 'uncommon', icon: '🪵' },
    /*45. Leathercraft */
    { name: '가죽 지갑', description: '가죽 지갑을 바느질했다', rarity: 'uncommon', icon: '👝' },
    /*46. Soap Making */
    { name: '비누 만들기', description: '천연 비누를 만들었다', rarity: 'uncommon', icon: '🧼' },
    /*47. Candle Craft */
    { name: '향초 만들기', description: '향초를 부었다', rarity: 'uncommon', icon: '🕯️' },
    /*48. 3D Modeling */
    { name: '3D 모델링', description: '3D 모델을 설계했다', rarity: 'uncommon', icon: '📐' },
    /*49. 3D Printing */
    { name: '3D 프린트', description: '3D 모델을 출력했다', rarity: 'uncommon', icon: '🖨️' },
    /*50. Animation */
    { name: '애니메이션 3초', description: '3초 애니메이션을 제작했다', rarity: 'uncommon', icon: '🎬' },
    /*51. Comic Strip */
    { name: '만화 1컷', description: '만화 한 컷을 그렸다', rarity: 'uncommon', icon: '📚' },
    /*52. Watercolor */
    { name: '수채화 풍경', description: '풍경 수채화를 완성했다', rarity: 'uncommon', icon: '🎨' },
    /*53. Oil Portrait */
    { name: '유화 초상', description: '유화 초상을 그렸다', rarity: 'uncommon', icon: '🖼️' },
    /*54. Acrylic Abstract */
    { name: '아크릴 추상화', description: '추상화를 아크릴로 그렸다', rarity: 'uncommon', icon: '🖌️' },
    /*55. Sketchbook */
    { name: '스케치북 완성', description: '스케치북 한 장을 채웠다', rarity: 'uncommon', icon: '✏️' },
    /*56. Complex Origami */
    { name: '고급 종이접기', description: '복잡한 종이접기를 완성했다', rarity: 'uncommon', icon: '🕊️' },
    /*57. Knitting */
    { name: '뜨개질 10줄', description: '실 10줄을 떴다', rarity: 'uncommon', icon: '🧶' },
    /*58. Crochet Flower */
    { name: '코바늘 꽃', description: '코바늘로 꽃을 만들었다', rarity: 'uncommon', icon: '🌸' },
    /*59. Embroidery */
    { name: '자수 패치', description: '자수 패치를 완성했다', rarity: 'uncommon', icon: '🪡' },
    /*60. Quilt Block */
    { name: '퀼트 블록', description: '퀼트 블록을 봉제했다', rarity: 'uncommon', icon: '🧵' },
    /*61. Audio Mixing */
    { name: '음악 믹싱', description: '트랙을 믹싱했다', rarity: 'uncommon', icon: '🎚️' },
    /*62. Podcast Recording */
    { name: '팟캐스트 녹음', description: '팟캐스트를 녹음했다', rarity: 'uncommon', icon: '🎙️' },
    /*63. Public Speaking */
    { name: '발표 연습', description: '발표 스크립트를 연습했다', rarity: 'uncommon', icon: '📣' },
    /*64. Language Exchange */
    { name: '언어 교환', description: '외국인과 10분 대화했다', rarity: 'uncommon', icon: '🌐' },
    /*65. Spanish Sentence */
    { name: '스페인어 문장', description: '스페인어 문장 하나를 구사했다', rarity: 'uncommon', icon: '🗣️' },
    /*66. Japanese Kana */
    { name: '히라가나 쓰기', description: '히라가나 5자를 썼다', rarity: 'uncommon', icon: '🈚' },
    /*67. ASL Phrase */
    { name: '수어 구절', description: 'ASL 구절 하나를 표현했다', rarity: 'uncommon', icon: '🤟' },
    /*68. Morse Code */
    { name: '모스 부호', description: '모스 부호 신호를 송신했다', rarity: 'uncommon', icon: '⚡' },
    /*69. Speed Reading */
    { name: '속독 30쪽', description: '책 30쪽을 속독했다', rarity: 'uncommon', icon: '📘' },
    /*70. Memory Palace */
    { name: '기억법 연습', description: '기억궁전을 만들었다', rarity: 'uncommon', icon: '🏰' },
    /*71. Number Recall */
    { name: '숫자 20자리', description: '무작위 숫자 20자리를 암기했다', rarity: 'uncommon', icon: '🔢' },
    /*72. Project Mind Map */
    { name: '프로젝트 마인드맵', description: '프로젝트를 마인드맵했다', rarity: 'uncommon', icon: '🗺️' },
    /*73. Weekly Plan */
    { name: '주간 계획', description: '일주일 계획을 작성했다', rarity: 'uncommon', icon: '📅' },
    /*74. Finance Analysis */
    { name: '재무 분석', description: '재무 지표를 분석했다', rarity: 'uncommon', icon: '💹' },
    /*75. Stock Report */
    { name: '주식 보고서', description: '주식 보고서를 읽었다', rarity: 'uncommon', icon: '📊' },
    /*76. Budget Monthly */
    { name: '월별 예산', description: '월 예산을 작성했다', rarity: 'uncommon', icon: '🗓️' },
    /*77. Donation */
    { name: '기부 1만원', description: '1만원을 기부했다', rarity: 'uncommon', icon: '🎁' },
    /*78. Eco Day */
    { name: '친환경 하루', description: '일회용품 없이 하루를 보냈다', rarity: 'uncommon', icon: '♻️' },
    /*79. Volunteering */
    { name: '봉사 1시간', description: '봉사활동을 1시간 했다', rarity: 'uncommon', icon: '🤝' },
    /*80. Networking Email */
    { name: '네트워킹 이메일', description: '새 연락처에 이메일을 보냈다', rarity: 'uncommon', icon: '✉️' },
    /* 1. Dawn Photo */
    { name: '새벽 해돋이', description: '해돋이를 사진으로 기록했다', rarity: 'rare', icon: '🌅' },
    /* 2. Book Completion */
    { name: '책 완독', description: '책 한 권을 완독했다', rarity: 'rare', icon: '📚' },
    /* 3. Short Story */
    { name: '단편소설 집필', description: '단편소설을 한 편 작성했다', rarity: 'rare', icon: '✍️' },
    /* 4. Half-Marathon */
    { name: '하프마라톤', description: '하프마라톤을 완주했다', rarity: 'rare', icon: '🏅' },
    /* 5. Jazz Improvisation */
    { name: '재즈 즉흥', description: '재즈 즉흥곡을 연주했다', rarity: 'rare', icon: '🎷' },
    /* 6. Sourdough Bread */
    { name: '천연 효모 빵', description: '천연 효모로 빵을 구웠다', rarity: 'rare', icon: '🥖' },
    /* 7. Clay Sculpture */
    { name: '점토 조각상', description: '점토 조각상을 완성했다', rarity: 'rare', icon: '🗿' },
    /* 8. Foreign Speech */
    { name: '외국어 스피치', description: '외국어로 5분 스피치했다', rarity: 'rare', icon: '🗣️' },
    /* 9. Research Talk */
    { name: '연구 발표', description: '연구 결과를 발표했다', rarity: 'rare', icon: '📢' },
    /* 10. Hackathon Build */
    { name: '해커톤 프로젝트', description: '해커톤 프로젝트를 완성했다', rarity: 'rare', icon: '💻' },
    /* 11. Comic Creation */
    { name: '만화책 제작', description: '만화책 한 권을 제작했다', rarity: 'rare', icon: '📘' },
    /* 12. Indie Game */
    { name: '인디 게임 출시', description: '인디 게임을 출시했다', rarity: 'rare', icon: '🎮' },
    /* 13. Podcast Launch */
    { name: '팟캐스트 개설', description: '팟캐스트 채널을 개설했다', rarity: 'rare', icon: '🎙️' },
    /* 14. Mini Album */
    { name: '미니앨범 발매', description: '미니앨범을 발매했다', rarity: 'rare', icon: '🎵' },
    /* 15. Photo Exhibition */
    { name: '사진 전시회', description: '사진 전시회를 열었다', rarity: 'rare', icon: '🖼️' },
    /* 16. Veggie Harvest */
    { name: '채소 재배', description: '채소를 씨뿌려 수확했다', rarity: 'rare', icon: '🥬' },
    /* 17. Artisan Cheese */
    { name: '치즈 숙성', description: '치즈를 직접 숙성했다', rarity: 'rare', icon: '🧀' },
    /* 18. Language Cert */
    { name: '언어 자격증', description: '언어 자격증을 취득했다', rarity: 'rare', icon: '🎓' },
    /* 19. Scuba License */
    { name: '스쿠버 자격', description: '스쿠버다이빙 자격을 취득했다', rarity: 'rare', icon: '🤿' },
    /* 20. Solo Sailing */
    { name: '요트 단독 항해', description: '요트로 단독 항해했다', rarity: 'rare', icon: '🛥️' },
    /* 21. Pilot Flight */
    { name: '경비행기 조종', description: '경비행기를 조종했다', rarity: 'rare', icon: '🛩️' },
    /* 22. Asteroid Watch */
    { name: '소행성 관측', description: '소행성을 관측했다', rarity: 'rare', icon: '🌠' },
    /* 23. VR App */
    { name: 'VR 앱 개발', description: 'VR 앱을 개발했다', rarity: 'rare', icon: '🕶️' },
    /* 24. Robotics */
    { name: '로봇 제작', description: '로봇을 제작했다', rarity: 'rare', icon: '🤖' },
    /* 25. Wood Furniture */
    { name: '가구 제작', description: '목재 가구를 제작했다', rarity: 'rare', icon: '🪑' },
    /* 26. Metalwork */
    { name: '금속 단조', description: '금속으로 소품을 단조했다', rarity: 'rare', icon: '⚒️' },
    /* 27. Leather Jacket */
    { name: '가죽 재킷', description: '가죽 재킷을 만들었다', rarity: 'rare', icon: '🧥' },
    /* 28. Custom Candle */
    { name: '맞춤 향초', description: '개인 향초를 제조했다', rarity: 'rare', icon: '🕯️' },
    /* 29. Hand-made Perfume */
    { name: '수제 향수', description: '수제 향수를 조향했다', rarity: 'rare', icon: '🌸' },
    /* 30. SFX Makeup */
    { name: '특수 분장', description: '특수 분장을 완성했다', rarity: 'rare', icon: '💄' },
    /* 31. Short Film */
    { name: '단편 영화 연출', description: '단편 영화를 연출했다', rarity: 'rare', icon: '🎬' },
    /* 32. Animation Short */
    { name: '애니메이션 제작', description: '애니메이션을 제작했다', rarity: 'rare', icon: '🎞️' },
    /* 33. Viral TikTok */
    { name: '틱톡 백만뷰', description: '틱톡 영상이 백만뷰를 달성했다', rarity: 'rare', icon: '📱' },
    /* 34. Drone Mapping */
    { name: '드론 지도 제작', description: '드론으로 지형을 매핑했다', rarity: 'rare', icon: '🛸' },
    /* 35. Fundraising */
    { name: '모금 캠페인', description: '모금 캠페인을 성공했다', rarity: 'rare', icon: '💖' },
    /* 36. Cookbook */
    { name: '요리책 출간', description: '요리책을 출간했다', rarity: 'rare', icon: '📖' },
    /* 37. Speech Champion */
    { name: '연설 대회 우승', description: '연설 대회에서 우승했다', rarity: 'rare', icon: '🏆' },
    /* 38. Chess Master */
    { name: '체스 마스터', description: '체스 마스터 규정을 달성했다', rarity: 'rare', icon: '♛' },
    /* 39. Speedcube Record */
    { name: '큐브 기록 경신', description: '스피드큐브 기록을 경신했다', rarity: 'rare', icon: '🧊' },
    /* 40. Memory Contest */
    { name: '기억력 대회', description: '기억력 대회에 입상했다', rarity: 'rare', icon: '🧠' },
    /* 41. Origami Exhibition */
    { name: '종이접기 전시', description: '복잡한 종이접기를 전시했다', rarity: 'rare', icon: '🕊️' },
    /* 42. Queen-Size Quilt */
    { name: '퀼트 퀸사이즈', description: '퀼트 퀸사이즈를 완성했다', rarity: 'rare', icon: '🧵' },
    /* 43. Garden Design */
    { name: '정원 조성', description: '정원을 설계해 조성했다', rarity: 'rare', icon: '🏡' },
    /* 44. Bonsai Art */
    { name: '분재 작품', description: '분재 작품을 가꿨다', rarity: 'rare', icon: '🌳' },
    /* 45. Wine Making */
    { name: '와인 양조', description: '와인을 양조해 숙성했다', rarity: 'rare', icon: '🍷' },
    /* 46. Craft Beer */
    { name: '수제 맥주', description: '수제 맥주를 양조했다', rarity: 'rare', icon: '🍺' },
    /* 47. Novel Publish */
    { name: '장편 소설 출간', description: '장편 소설을 출간했다', rarity: 'rare', icon: '📜' },
    /* 48. AI Model */
    { name: 'AI 모델 학습', description: 'AI 모델을 학습시켰다', rarity: 'rare', icon: '🤖' },
    /* 49. Hackathon Win */
    { name: '해커톤 우승', description: '해커톤에서 우승했다', rarity: 'rare', icon: '🥇' },
    /* 50. Startup Launch */
    { name: '스타트업 설립', description: '스타트업을 설립했다', rarity: 'rare', icon: '🚀' },
    /* 51. Patent */
    { name: '특허 등록', description: '특허를 등록했다', rarity: 'rare', icon: '📄' },
    /* 52. Museum Exhibit */
    { name: '미술관 전시', description: '작품을 미술관에 전시했다', rarity: 'rare', icon: '🏛️' },
    /* 53. Cooking Champ */
    { name: '요리 대회 우승', description: '요리 대회에서 우승했다', rarity: 'rare', icon: '🍳' },
    /* 54. Summit Climb */
    { name: '산 정상 등정', description: '산 정상에 등정했다', rarity: 'rare', icon: '⛰️' },
    /* 55. Freedive 30m */
    { name: '프리다이빙 30m', description: '프리다이빙 30m를 달성했다', rarity: 'rare', icon: '🤿' },
    /* 56. 100km Trek */
    { name: '100km 도보', description: '100km 도보 순례를 완주했다', rarity: 'rare', icon: '🥾' },
    /* 57. Triathlon */
    { name: '트라이애슬론', description: '트라이애슬론을 완주했다', rarity: 'rare', icon: '🏊‍♂️' },
    /* 58. Space Camp */
    { name: '우주 캠프 참가', description: '우주 캠프에 참가했다', rarity: 'rare', icon: '🛰️' },
    /* 59. Sailing Regatta */
    { name: '요트 경기 우승', description: '요트 경기에서 우승했다', rarity: 'rare', icon: '⛵' },
    /* 60. Deep-Sea Photo */
    { name: '심해 생물 촬영', description: '심해 생물을 촬영했다', rarity: 'rare', icon: '🐙' },
    /* 1. Meditation Streak */
    { name: '명상 100일', description: '100일 연속 명상을 달성했다', rarity: 'epic', icon: '🧘‍♂️' },
    /* 2. Year-Long Coding */
    { name: '코딩 1년', description: '365일 연속 코딩을 완료했다', rarity: 'epic', icon: '💻' },
    /* 3. 52-Book Goal */
    { name: '연간 52권', description: '1년에 책 52권을 완독했다', rarity: 'epic', icon: '📚' },
    /* 4. Marathon Finish */
    { name: '풀마라톤', description: '풀마라톤을 완주했다', rarity: 'epic', icon: '🏃‍♂️' },
    /* 5. Ironman Triathlon */
    { name: '아이언맨', description: '아이언맨 대회를 완주했다', rarity: 'epic', icon: '🏊‍♂️' },
    /* 6. Piano Sonata */
    { name: '피아노 소나타', description: '피아노 소나타를 연주했다', rarity: 'epic', icon: '🎹' },
    /* 7. Solo Album */
    { name: '정규 앨범', description: '정규 앨범을 발표했다', rarity: 'epic', icon: '🎵' },
    /* 8. 50k-Word Novel */
    { name: '장편 소설', description: '장편 소설 5만 자를 집필했다', rarity: 'epic', icon: '📖' },
    /* 9. PhD Degree */
    { name: '박사 학위', description: '박사 학위를 취득했다', rarity: 'epic', icon: '🎓' },
    /* 10. Patent Grant */
    { name: '특허 취득', description: '특허를 취득했다', rarity: 'epic', icon: '📄' },
    /* 11. Startup Exit */
    { name: '스타트업 엑싯', description: '스타트업을 엑싯했다', rarity: 'epic', icon: '🚀' },
    /* 12. Major Donation */
    { name: '1억 기부', description: '1억원을 기부했다', rarity: 'epic', icon: '💖' },
    /* 13. World Trip */
    { name: '세계 일주', description: '세계 일주를 완료했다', rarity: 'epic', icon: '🌍' },
    /* 14. 100 km Swim */
    { name: '수영 100km', description: '누적 100km를 수영했다', rarity: 'epic', icon: '🏊' },
    /* 15. Everest Summit */
    { name: '에베레스트 등정', description: '에베레스트를 등정했다', rarity: 'epic', icon: '🗻' },
    /* 16. Polyglot */
    { name: '5개 국어', description: '5개 국어로 대화했다', rarity: 'epic', icon: '🌐' },
    /* 17. Global Conference */
    { name: '국제 학회 발표', description: '국제 학회에서 발표했다', rarity: 'epic', icon: '📢' },
    /* 18. OSS Maintainer */
    { name: '오픈소스 메인터너', description: '오픈소스 프로젝트를 유지했다', rarity: 'epic', icon: '🛠️' },
    /* 19. Film Festival */
    { name: '영화제 상영', description: '단편 영화를 영화제에 상영했다', rarity: 'epic', icon: '🎬' },
    /* 20. Art Auction */
    { name: '작품 경매', description: '작품을 경매에 출품했다', rarity: 'epic', icon: '🖼️' },
    /* 21. Cookbook Bestseller */
    { name: '베스트셀러 요리책', description: '요리책으로 베스트셀러를 달성했다', rarity: 'epic', icon: '🍳' },
    /* 22. Michelin-Level Dish */
    { name: '미쉐린 요리', description: '미쉐린 스타 요리를 완성했다', rarity: 'epic', icon: '🍽️' },
    /* 23. National Record */
    { name: '국가 기록', description: '종목에서 국가 기록을 경신했다', rarity: 'epic', icon: '🏅' },
    /* 24. Orchestra Soloist */
    { name: '오케스트라 협연', description: '오케스트라와 협연했다', rarity: 'epic', icon: '🎻' },
    /* 25. Chess GM */
    { name: '체스 그랜드마스터', description: '체스 그랜드마스터를 달성했다', rarity: 'epic', icon: '♚' },
    /* 26. Memory Champion */
    { name: '기억력 세계챔프', description: '기억력 세계 대회에서 우승했다', rarity: 'epic', icon: '🧠' },
    /* 27. Sub-10 Cube */
    { name: '큐브 10초', description: '스피드큐브를 10초 이내에 해결했다', rarity: 'epic', icon: '🧊' },
    /* 28. 48-h Product Launch */
    { name: '48시간 빌드', description: '48시간 만에 제품을 출시했다', rarity: 'epic', icon: '⚡' },
    /* 29. VR World Builder */
    { name: 'VR 월드', description: 'VR 월드를 설계했다', rarity: 'epic', icon: '🕶️' },
    /* 30. 3D-Printed House */
    { name: '3D프린트 주택', description: '3D프린트 주택을 완성했다', rarity: 'epic', icon: '🏠' },
    /* 31. Space Photography */
    { name: '우주 사진', description: '우주에서 사진을 촬영했다', rarity: 'epic', icon: '🌌' },
    /* 32. TED Speaker */
    { name: 'TED 강연', description: 'TED에서 강연했다', rarity: 'epic', icon: '🎤' },
    /* 33. Luxury Perfumer */
    { name: '럭셔리 향수', description: '럭셔리 향수를 조향했다', rarity: 'epic', icon: '🌺' },
    /* 34. Master Sommelier */
    { name: '마스터 소믈리에', description: '마스터 소믈리에 자격을 취득했다', rarity: 'epic', icon: '🍷' },
    /* 35. 100 m Freedive */
    { name: '프리다이빙 100m', description: '프리다이빙 100m를 달성했다', rarity: 'epic', icon: '🤿' },
    /* 36. Polar Marathon */
    { name: '극지 마라톤', description: '극지 마라톤을 완주했다', rarity: 'epic', icon: '❄️' },
    /* 37. Solo Global Sail */
    { name: '지구 단독 항해', description: '요트로 세계를 단독 항해했다', rarity: 'epic', icon: '⛵' },
    /* 38. Community Library */
    { name: '작은 도서관', description: '지역에 작은 도서관을 설립했다', rarity: 'epic', icon: '🏫' },
    /* 39. Eco Village Builder */
    { name: '에코빌리지', description: '에코빌리지를 구축했다', rarity: 'epic', icon: '🌱' },
    /* 40. Zero-Waste Year */
    { name: '제로웨이스트 1년', description: '1년간 쓰레기를 1리터로 제한했다', rarity: 'epic', icon: '♻️' },
    /* 1. Nobel Prize */
    { name: '노벨상 수상', description: '노벨상을 수상했다', rarity: 'legendary', icon: '🏆' },
    /* 2. Olympic Gold */
    { name: '올림픽 금메달', description: '올림픽 금메달을 획득했다', rarity: 'legendary', icon: '🥇' },
    /* 3. Grammy Award */
    { name: '그래미 수상', description: '그래미상을 수상했다', rarity: 'legendary', icon: '🎵' },
    /* 4. Michelin 3 Star */
    { name: '미쉐린 3스타', description: '미쉐린 3스타를 달성했다', rarity: 'legendary', icon: '🍽️' },
    /* 5. Grand Slam Tennis */
    { name: '그랜드슬램 달성', description: '테니스 그랜드슬램을 달성했다', rarity: 'legendary', icon: '🎾' },
    /* 6. Chess World Champion */
    { name: '체스 세계챔프', description: '체스 세계 챔피언을 달성했다', rarity: 'legendary', icon: '♚' },
    /* 7. Academy Award */
    { name: '아카데미 수상', description: '아카데미 작품상을 수상했다', rarity: 'legendary', icon: '🎬' },
    /* 8. Seven Summits */
    { name: '7대륙 정상', description: '7대륙 최고봉을 등정했다', rarity: 'legendary', icon: '🗻' },
    /* 9. Polyglot 100 */
    { name: '10개 국어', description: '10개 국어로 대화했다', rarity: 'legendary', icon: '🌐' },
    /* 10. ISS Spacewalk */
    { name: '우주 유영', description: '국제우주정거장에서 우주 유영했다', rarity: 'legendary', icon: '🚀' },
    /* 11. Non-stop Circumnavigation */
    { name: '무기항 세계일주', description: '요트로 무기항 세계일주를 완주했다', rarity: 'legendary', icon: '⛵' },
    /* 12. World Marathon Majors */
    { name: '6대 마라톤', description: '세계 6대 마라톤을 완주했다', rarity: 'legendary', icon: '🏃‍♂️' },
    /* 13. Pulitzer Prize */
    { name: '퓰리처상 수상', description: '퓰리처상을 수상했다', rarity: 'legendary', icon: '📰' },
    /* 14. Guinness Record */
    { name: '기네스 기록', description: '기네스 세계 기록을 경신했다', rarity: 'legendary', icon: '📜' },
    /* 15. Polar Expedition */
    { name: '극지 탐험', description: '북극과 남극을 횡단했다', rarity: 'legendary', icon: '❄️' },
    /* 16. Everest-Lhotse Traverse */
    { name: '에베레스트-롯체', description: '에베레스트와 롯체를 연속 등정했다', rarity: 'legendary', icon: '🏔️' },
    /* 17. Mariana Trench Dive */
    { name: '마리아나 해구', description: '마리아나 해구 바닥까지 잠수했다', rarity: 'legendary', icon: '🌊' },
    /* 18. Opera House Solo */
    { name: '오페라 솔로', description: '세계 오페라 무대에서 솔로로 노래했다', rarity: 'legendary', icon: '🎭' },
    /* 19. 1B-View Video */
    { name: '10억뷰 영상', description: '영상 조회수 10억을 달성했다', rarity: 'legendary', icon: '📺' },
    /* 20. Zero-Waste Decade */
    { name: '제로웨이스트 10년', description: '10년간 쓰레기를 10리터로 제한했다', rarity: 'legendary', icon: '♻️' }
  ]

  // 뱃지 생성
  console.log(`총 ${allBadges.length}개의 뱃지를 생성합니다...`)
  for (const badge of allBadges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge
    })
    console.log(`뱃지 생성: ${badge.name} (${badge.rarity})`)
  }

  // 기본 칭호 데이터 (단순화)
  const titles = [
    {
      name: '상쾌한',
      description: '아침을 힘차게 여는',
      rarity: 'common',
      requiredBadges: ['아침 물 한 컵', '5분 스트레칭']
    },
    {
      name: '호기심 많은',
      description: '호기심으로 지식을 쌓아가는',
      rarity: 'common',
      requiredBadges: ['책 10쪽 읽기', '새 사실 1개']
    },
    {
      name: '긍정적인',
      description: '한 줄 기록으로 스스로를 북돋우는',
      rarity: 'common',
      requiredBadges: ['저널 한 줄', '긍정 확언']
    },
    {
      name: '다정한',
      description: '감사와 안부로 온기를 전하는',
      rarity: 'common',
      requiredBadges: ['감사 1가지', '안부 전화']
    },
    {
      name: '언어재주있는',
      description: '새로운 표현을 기꺼이 익히는',
      rarity: 'common',
      requiredBadges: ['단어 5개 암기', '어휘 앱 1레벨']
    },
    {
      name: '음악애호가다운',
      description: '선율로 하루를 물들이는',
      rarity: 'common',
      requiredBadges: ['악기 5분 연습', '신곡 감상']
    },
    {
      name: '서정적인',
      description: '색과 선으로 상상력을 그려내는',
      rarity: 'common',
      requiredBadges: ['30초 스케치', '수채화 그라데이션']
    },
    {
      name: '청명한',
      description: '맑은 하늘과 공기를 사랑하는',
      rarity: 'common',
      requiredBadges: ['하늘 사진', '신선한 공기']
    },
    {
      name: '발랄한',
      description: '햇살 아래 가벼운 걸음을 내딛는',
      rarity: 'common',
      requiredBadges: ['산책 1,000보', '햇빛 5분']
    },
    {
      name: '고요한',
      description: '호흡과 명상으로 마음을 고요히 하는',
      rarity: 'common',
      requiredBadges: ['명상 3분', '심호흡 10회']
    },
    {
      name: '촉촉한',
      description: '수분 관리로 몸을 보살피는',
      rarity: 'common',
      requiredBadges: ['물 1L 달성', '물 3회 알림']
    },
    {
      name: '바른',
      description: '자세와 습관을 곧게 세우는',
      rarity: 'common',
      requiredBadges: ['자세 교정', '한 시간 서기']
    },
    {
      name: '절제된',
      description: '디지털 노이즈를 줄이는',
      rarity: 'common',
      requiredBadges: ['스크린 휴식 10분', '구독 해지 1개']
    },
    {
      name: '맛깔스러운',
      description: '손수 만든 음식으로 기쁨을 나누는',
      rarity: 'common',
      requiredBadges: ['간단 요리', '쿠키 3개']
    },
    {
      name: '푸릇한',
      description: '식물에게도 생기를 불어넣는',
      rarity: 'common',
      requiredBadges: ['화분 물주기', '물갈이']
    },
    {
      name: '상냥한',
      description: '따뜻한 말과 포옹을 건네는',
      rarity: 'common',
      requiredBadges: ['칭찬 한 마디', '포옹 1회']
    },
    {
      name: '알뜰한',
      description: '작은 돈도 꼼꼼히 살피는',
      rarity: 'common',
      requiredBadges: ['저축 1,000원', '잔고 확인']
    },
    {
      name: '실천적인',
      description: '듣고 기록하며 배움을 이어가는',
      rarity: 'common',
      requiredBadges: ['팟캐스트 5분', '팟캐스트 메모']
    },
    {
      name: '정돈된',
      description: '주변을 비우고 정리하는',
      rarity: 'common',
      requiredBadges: ['책상 정리', '물건 1개 버리기']
    },
    {
      name: '청결한',
      description: '치아와 피부까지 깔끔히 관리하는',
      rarity: 'common',
      requiredBadges: ['치실 사용', '기초 스킨케어']
    },
    {
      name: '즐거운',
      description: '웃음으로 분위기를 밝히는',
      rarity: 'common',
      requiredBadges: ['웃음 10초', '웃음 기록']
    },
    {
      name: '각성된',
      description: '계단과 걸음으로 몸을 깨우는',
      rarity: 'common',
      requiredBadges: ['5,000보 달성', '계단 오르기 5층']
    },
    {
      name: '비워내는',
      description: '받은편지함도 메신저도 가볍게 하는',
      rarity: 'common',
      requiredBadges: ['받은편지함 비우기', '메신저 0']
    },
    {
      name: '코딩하는',
      description: '문제를 해결하며 새 코드를 짜는',
      rarity: 'common',
      requiredBadges: ['코딩 문제 1개', '새 코드 1개']
    },
    {
      name: '유연한',
      description: '스트레칭으로 몸을 부드럽게 하는',
      rarity: 'common',
      requiredBadges: ['요가 10분', '허리 숙이기']
    },
    {
      name: '장난스러운',
      description: '종이와 낙서로 손끝을 즐겁게 하는',
      rarity: 'common',
      requiredBadges: ['낙서 1장', '종이학 접기']
    },
    {
      name: '탄탄한',
      description: '근력을 균형 있게 다지는',
      rarity: 'common',
      requiredBadges: ['푸시업 10회', '런지 20회']
    },
    {
      name: '꾸준한',
      description: '습관과 학습을 이어가는',
      rarity: 'common',
      requiredBadges: ['습관 앱 체크', '플래시카드 1세트']
    },
    {
      name: '모험심 강한',
      description: '새 길과 세계를 호기심으로 걷는',
      rarity: 'common',
      requiredBadges: ['새 산책로 탐험', '국기 지식']
    },
    {
      name: '계획적인',
      description: '기록과 계획으로 하루를 설계하는',
      rarity: 'common',
      requiredBadges: ['지출 기록', '내일 계획']
    },
    {
      name: '향긋한',
      description: '차와 향으로 공간을 채우는',
      rarity: 'common',
      requiredBadges: ['녹차 한 잔', '향초 켜기']
    },
    {
      name: '미소가득한',
      description: '거울 앞에서도, 거리에서도 웃는',
      rarity: 'common',
      requiredBadges: ['거울 미소', '낯선 이에게 미소']
    },
    {
      name: '똑똑한',
      description: '퍼즐로 사고를 단련하는',
      rarity: 'common',
      requiredBadges: ['스도쿠 1판', '체스 퍼즐']
    },
    {
      name: '세심한',
      description: '나눔의 마음을 글로 전하는',
      rarity: 'common',
      requiredBadges: ['기부 1000원', '엽서 쓰기']
    },
    {
      name: '다국어능한',
      description: '여러 언어로 소통하는',
      rarity: 'common',
      requiredBadges: ['회화 표현 1개', '수어 단어 1개']
    },
    {
      name: '용감한',
      description: '차가움과 높이를 두려워하지 않는',
      rarity: 'common',
      requiredBadges: ['벽서기 10초', '30초 냉수샤워']
    },
    {
      name: '신속한',
      description: '빠른 손놀림과 단축키로 효율을 높이는',
      rarity: 'common',
      requiredBadges: ['타자 80WPM', '단축키 학습']
    },
    {
      name: '디지털정리된',
      description: '사진과 이모지를 깔끔히 관리하는',
      rarity: 'common',
      requiredBadges: ['사진 10장 정리', '새 이모지']
    },
    {
      name: '음악적인',
      description: '음계를 연습하고 클래식을 즐기는',
      rarity: 'common',
      requiredBadges: ['음계 1세트', '클래식 1곡']
    },
    {
      name: '평온한',
      description: '찻잔과 마사지를 곁에 두는',
      rarity: 'common',
      requiredBadges: ['허브티 한 잔', '얼굴 마사지']
    },
    {
      name: '필체아름다운',
      description: '손글씨로 감성을 전하는',
      rarity: 'common',
      requiredBadges: ['손글씨 연습', '캘리그라피 1문장']
    },
    {
      name: '건강한',
      description: '과일과 채소로 영양을 채우는',
      rarity: 'common',
      requiredBadges: ['과일 1회 섭취', '채소 스낵']
    },
    {
      name: '문학적인',
      description: '짧은 글과 명언으로 감성을 기록하는',
      rarity: 'common',
      requiredBadges: ['짧은 이야기', '명언 필사']
    },
    {
      name: '주도면밀한',
      description: '집도 옷도 깨끗하게 가꾸는',
      rarity: 'common',
      requiredBadges: ['차량 내부 청소', '세탁 완료']
    },
    {
      name: '개척적인',
      description: '배움과 게임으로 실력을 키우는',
      rarity: 'common',
      requiredBadges: ['튜토리얼 시청', '게임 스테이지 클리어']
    },
    {
      name: '절제있는',
      description: '천천히 음료를 고르고 씹는',
      rarity: 'common',
      requiredBadges: ['무가당 음료', '천천히 씹기']
    },
    {
      name: '바람가르는',
      description: '바퀴와 발로 자연을 달리는',
      rarity: 'common',
      requiredBadges: ['자전거 2km', '반려동물 산책']
    },
    {
      name: '솜씨좋은',
      description: '퍼즐과 매듭으로 손재주를 뽐내는',
      rarity: 'common',
      requiredBadges: ['직소 10조각', '매듭법 1개']
    },
    {
      name: '깨끗한',
      description: '주방과 침실까지 정갈히 하는',
      rarity: 'common',
      requiredBadges: ['설거지 마무리', '침구 정돈']
    },
    {
      name: '기억력좋은',
      description: '아이디어와 숫자를 또렷이 기억하는',
      rarity: 'common',
      requiredBadges: ['마인드맵 1개', '숫자 암기 5자리']
    },
      {
        name: '부지런한',
        description: '새벽을 누구보다 먼저 깨우는',
        rarity: 'uncommon',
        requiredBadges: ['새벽 기상', '핸드드립 커피']
      },
      {
        name: '집요한',
        description: '논문과 데이터를 끝까지 파헤치는',
        rarity: 'uncommon',
        requiredBadges: ['연구 논문 읽기', '데이터 시각화']
      },
      {
        name: '창의적인',
        description: '아이디어를 현실로 스케치하는',
        rarity: 'uncommon',
        requiredBadges: ['스케치북 완성', '게임 프로토타입']
      },
      {
        name: '분석적인',
        description: '새 언어와 세계를 관찰하며 배우는',
        rarity: 'uncommon',
        requiredBadges: ['언어 교환', '조류 관찰']
      },
      {
        name: '성실한',
        description: '매일 글을 기록하며 성장을 담아내는',
        rarity: 'uncommon',
        requiredBadges: ['글쓰기 500자', '주간 계획']
      },
      {
        name: '활동적인',
        description: '땀방울로 하루를 생기 있게 만드는',
        rarity: 'uncommon',
        requiredBadges: ['HIIT 15분', '장거리 러닝']
      },
      {
        name: '배려깊은',
        description: '나눔과 봉사를 일상으로 실천하는',
        rarity: 'uncommon',
        requiredBadges: ['기부 1만원', '봉사 1시간']
      },
      {
        name: '단단한',
        description: '근육과 의지를 함께 단련하는',
        rarity: 'uncommon',
        requiredBadges: ['푸시업 50회', '플랭크 2분']
      },
      {
        name: '여유로운',
        description: '느린 호흡과 부드러운 요가로 마음을 풀어내는',
        rarity: 'uncommon',
        requiredBadges: ['요가 30분', '명상 15분']
      },
      {
        name: '차분한',
        description: '세심한 필체로 마음을 가다듬는',
        rarity: 'uncommon',
        requiredBadges: ['손글씨 교정', '캘리그라피']
      },
      {
        name: '열정적인',
        description: '뜨거운 목소리와 박자로 공간을 채우는',
        rarity: 'uncommon',
        requiredBadges: ['보컬 연습', '작곡 1분']
      },
      {
        name: '감각적인',
        description: '붓끝에 감정을 섬세히 담아내는',
        rarity: 'uncommon',
        requiredBadges: ['유화 초상', '수채화 풍경']
      },
      {
        name: '효율적인',
        description: '코드를 다듬어 새로운 가치를 창조하는',
        rarity: 'uncommon',
        requiredBadges: ['코드 리팩터링', '앱 프로토타입']
      },
      {
        name: '끈기있는',
        description: '퍼즐 조각도 끝까지 맞추는 집중력의',
        rarity: 'uncommon',
        requiredBadges: ['퍼즐 500피스', '난이도 높은 스도쿠']
      },
      {
        name: '튼튼한',
        description: '바다와 파도에서 체력을 기르는',
        rarity: 'uncommon',
        requiredBadges: ['수영 1km', '서핑 30분']
      },
      {
        name: '기록하는',
        description: '마인드맵으로 생각을 체계화하는',
        rarity: 'uncommon',
        requiredBadges: ['프로젝트 마인드맵', '블로그 게시']
      },
      {
        name: '철저한',
        description: '에너지 넘치는 플로우로 몸을 이끄는',
        rarity: 'uncommon',
        requiredBadges: ['요가 30분', 'HIIT 15분']
      },
      {
        name: '깊이있는',
        description: '큰 그림을 분석하며 통찰을 얻는',
        rarity: 'uncommon',
        requiredBadges: ['재무 분석', '주식 보고서']
      },
      {
        name: '질주하는',
        description: '산길과 페달로 공기를 갈아주는',
        rarity: 'uncommon',
        requiredBadges: ['자전거 20km', '등산 5km']
      },
      {
        name: '집중력있는',
        description: '소음 없는 한 시간에 몰입하는',
        rarity: 'uncommon',
        requiredBadges: ['심층 작업 1시간', '암벽등반 10m']
      },
      {
        name: '풍성한',
        description: '향기와 맛으로 감각을 가득 채우는',
        rarity: 'uncommon',
        requiredBadges: ['향초 만들기', '발효 김치']
      },
      {
        name: '지속가능한',
        description: '지속가능한 선택으로 지구를 사랑하는',
        rarity: 'uncommon',
        requiredBadges: ['친환경 하루', 'DIY 수리']
      },
      {
        name: '실용적인',
        description: '목수의 손길로 생활을 개선하는',
        rarity: 'uncommon',
        requiredBadges: ['목공 소품', '가죽 지갑']
      },
      {
        name: '사려깊은',
        description: '작은 기부와 따뜻한 편지로 마음을 돌보는',
        rarity: 'uncommon',
        requiredBadges: ['기부 1만원', '네트워킹 이메일']
      },
      {
        name: '도전적인',
        description: '새로운 벽과 물살에 과감히 도전하는',
        rarity: 'uncommon',
        requiredBadges: ['암벽등반 10m', '서핑 30분']
      },
      {
        name: '모험적인',
        description: '드론과 별빛으로 지평을 넓히는',
        rarity: 'uncommon',
        requiredBadges: ['드론 촬영', '별 관측']
      },
      {
        name: '탐구적인',
        description: '밤하늘과 숲속 생명을 탐사하는',
        rarity: 'uncommon',
        requiredBadges: ['천체사진', '조류 관찰']
      },
      {
        name: '연결하는',
        description: '목소리와 글로 사람들을 이어주는',
        rarity: 'uncommon',
        requiredBadges: ['팟캐스트 녹음', '네트워킹 이메일']
      },
      {
        name: '평화로운',
        description: '호흡과 선율로 마음을 고요히 가라앉히는',
        rarity: 'uncommon',
        requiredBadges: ['명상 15분', '클래식 곡 완주']
      },
      {
        name: '성장하는',
        description: '메모리 훈련으로 두뇌를 확장하는',
        rarity: 'uncommon',
        requiredBadges: ['기억법 연습', '숫자 20자리']
      },
      {
        name: '자기계발하는',
        description: '새 알고리즘과 지식을 배우는',
        rarity: 'uncommon',
        requiredBadges: ['알고리즘 학습', '데이터 시각화']
      },
      {
        name: '사색하는',
        description: '만화 한 컷과 블로그로 사유를 나누는',
        rarity: 'uncommon',
        requiredBadges: ['만화 1컷', '블로그 게시']
      },
      {
        name: '장인적인',
        description: '흙과 물감으로 작품을 빚어내는',
        rarity: 'uncommon',
        requiredBadges: ['도자기 만들기', '유화 초상']
      },
      {
        name: '학구적인',
        description: '속독과 외국어 문장으로 지식을 확장하는',
        rarity: 'uncommon',
        requiredBadges: ['속독 30쪽', '스페인어 문장']
      },
      {
        name: '예술적인',
        description: '믹싱과 보컬로 음색을 빚어내는',
        rarity: 'uncommon',
        requiredBadges: ['음악 믹싱', '보컬 연습']
      },
      {
        name: '공감하는',
        description: '목소리로 이야기를 전하며 마음을 잇는',
        rarity: 'uncommon',
        requiredBadges: ['팟캐스트 녹음', '발표 연습']
      },
      {
        name: '균형잡힌',
        description: '근력과 명상으로 몸과 마음을 다잡는',
        rarity: 'uncommon',
        requiredBadges: ['푸시업 50회', '명상 15분']
      },
      {
        name: '활력있는',
        description: '달림과 고강도 운동으로 에너지를 충전하는',
        rarity: 'uncommon',
        requiredBadges: ['장거리 러닝', 'HIIT 15분']
      },
      {
        name: '전파하는',
        description: '신호와 발표로 희망을 전파하는',
        rarity: 'uncommon',
        requiredBadges: ['모스 부호', '발표 연습']
      },
      {
        name: '느긋한',
        description: '향긋한 커피와 글로 시간을 음미하는',
        rarity: 'uncommon',
        requiredBadges: ['핸드드립 커피', '글쓰기 500자']
      },
      {
        name: '역동적인',
        description: '끊임없이 달리고 헤엄치는',
        rarity: 'rare',
        requiredBadges: ['하프마라톤', '트라이애슬론']
      },
      {
        name: '독창적인',
        description: '상상력을 종이에 그리고 움직이는',
        rarity: 'rare',
        requiredBadges: ['만화책 제작', '애니메이션 제작']
      },
      {
        name: '열렬한',
        description: '무대 위에서 불타오르는',
        rarity: 'rare',
        requiredBadges: ['미니앨범 발매', '재즈 즉흥']
      },
      {
        name: '담대한',
        description: '거친 바다와 험준한 봉우리를 모두 정복하는',
        rarity: 'rare',
        requiredBadges: ['요트 단독 항해', '산 정상 등정']
      },
      {
        name: '정숙한',
        description: '새벽의 빛과 작은 숲을 벗 삼아 마음을 닦는',
        rarity: 'rare',
        requiredBadges: ['새벽 해돋이', '분재 작품']
      },
      {
        name: '융합적인',
        description: '가상과 현실을 넘나들며 새 길을 여는',
        rarity: 'rare',
        requiredBadges: ['VR 앱 개발', 'AI 모델 학습']
      },
      {
        name: '굳건한',
        description: '지치지 않는 의지로 먼 길을 완주하는',
        rarity: 'rare',
        requiredBadges: ['100km 도보', '하프마라톤']
      },
      {
        name: '섬세한',
        description: '시간과 향기로 완벽을 빚어내는',
        rarity: 'rare',
        requiredBadges: ['치즈 숙성', '맞춤 향초']
      },
      {
        name: '천재적인',
        description: '머릿속 전장을 지배하는',
        rarity: 'rare',
        requiredBadges: ['체스 마스터', '큐브 기록 경신']
      },
      {
        name: '우아한',
        description: '언어와 수사로 청중을 사로잡는',
        rarity: 'rare',
        requiredBadges: ['외국어 스피치', '연설 대회 우승']
      },
      {
        name: '불굴의',
        description: '깊은 바다에서도 흔들리지 않는',
        rarity: 'rare',
        requiredBadges: ['프리다이빙 30m', '스쿠버 자격']
      },
      {
        name: '산뜻한',
        description: '자연이 주는 싱그러움으로 식탁을 물들이는',
        rarity: 'rare',
        requiredBadges: ['채소 재배', '천연 효모 빵']
      },
      {
        name: '탐험적인',
        description: '별과 심해를 헤집으며 세상의 비밀을 캐내는',
        rarity: 'rare',
        requiredBadges: ['소행성 관측', '심해 생물 촬영']
      },
      {
        name: '빛나는',
        description: '빛과 시선을 포착해 하늘까지 확장하는',
        rarity: 'rare',
        requiredBadges: ['사진 전시회', '드론 지도 제작']
      },
      {
        name: '자유로운',
        description: '바람을 품고 하늘과 바다를 누비는',
        rarity: 'rare',
        requiredBadges: ['요트 경기 우승', '경비행기 조종']
      },
      {
        name: '탁월한',
        description: '아이디어를 현실로 증명해내는',
        rarity: 'rare',
        requiredBadges: ['특허 등록', '해커톤 우승']
      },
      {
        name: '유쾌한',
        description: '즐거움을 전파하며 사람들의 하루를 바꾸는',
        rarity: 'rare',
        requiredBadges: ['팟캐스트 개설', '틱톡 백만뷰']
      },
      {
        name: '근면한',
        description: '새로운 가치를 일구고 공동체를 움직이는',
        rarity: 'rare',
        requiredBadges: ['스타트업 설립', '모금 캠페인']
      },
      {
        name: '진취적인',
        description: '숨이 가쁜 순간에도 한 걸음 더 나아가는',
        rarity: 'rare',
        requiredBadges: ['트라이애슬론', '산 정상 등정']
      },
      {
        name: '조화로운',
        description: '수많은 조각을 이어 깊은 평온을 완성하는',
        rarity: 'rare',
        requiredBadges: ['퀼트 퀸사이즈', '종이접기 전시']
      },
      {
        name: '낭만적인',
        description: '이야기와 풍경으로 일상을 시처럼 물들이는',
        rarity: 'rare',
        requiredBadges: ['단편소설 집필', '사진 전시회']
      },
      {
        name: '풍요로운',
        description: '감각과 기술로 생활을 한층 풍성하게 채우는',
        rarity: 'rare',
        requiredBadges: ['와인 양조', '가구 제작']
      },
      {
        name: '활기찬',
        description: '메탈과 가죽 사이에서 생동하는 열정을 품는',
        rarity: 'rare',
        requiredBadges: ['로봇 제작', '가죽 재킷']
      },
      {
        name: '의욕적인',
        description: '매일 씨앗과 글자를 보살피며 성장을 이어가는',
        rarity: 'rare',
        requiredBadges: ['채소 재배', '책 완독']
      },
      {
        name: '정열적인',
        description: '음표와 픽셀에 불을 지피는',
        rarity: 'rare',
        requiredBadges: ['재즈 즉흥', '인디 게임 출시']
      },
      {
        name: '견고한',
        description: '강철과 목재로 영원을 빚어내는',
        rarity: 'rare',
        requiredBadges: ['금속 단조', '가구 제작']
      },
      {
        name: '환상적인',
        description: '향과 색으로 공간을 변신시키는',
        rarity: 'rare',
        requiredBadges: ['수제 향수', '특수 분장']
      },
      {
        name: '믿음직한',
        description: '근거와 증명으로 신뢰를 쌓아올리는',
        rarity: 'rare',
        requiredBadges: ['특허 등록', '연구 발표']
      },
      {
        name: '재기발랄한',
        description: '재치 넘치는 이야기로 세상을 놀라게 하는',
        rarity: 'rare',
        requiredBadges: ['인디 게임 출시', '만화책 제작']
      },
      {
        name: '기품있는',
        description: '절제된 아름다움으로 품격을 드러내는',
        rarity: 'rare',
        requiredBadges: ['사진 전시회', '분재 작품']
      },
    {
      name: '강인한',
      description: '혹독한 거리와 혹한의 레이스도 꺾지 못하는 강인함을 보여주는',
      rarity: 'epic',
      requiredBadges: ['풀마라톤', '아이언맨', '극지 마라톤']
    },
    {
      name: '불타는',
      description: '코드를 불꽃 삼아 밤낮없이 창조를 이어가는',
      rarity: 'epic',
      requiredBadges: ['코딩 1년', '오픈소스 메인터너', '48시간 빌드']
    },
    {
      name: '창조적인',
      description: '가상과 현실의 경계를 허무는 대담한 창작 정신을 지닌',
      rarity: 'epic',
      requiredBadges: ['VR 월드', '3D프린트 주택', 'AI 모델 학습']
    },
    {
      name: '지혜로운',
      description: '끊임없는 독서와 깊은 연구로 지혜를 축적하는',
      rarity: 'epic',
      requiredBadges: ['연간 52권', '박사 학위', 'TED 강연']
    },
    {
      name: '대담한',
      description: '최고봉과 망망대해를 차례로 정복하는 무한한 용기를 지닌',
      rarity: 'epic',
      requiredBadges: ['에베레스트 등정', '지구 단독 항해']
    },
    {
      name: '관대한',
      description: '나눔을 삶의 기쁨으로 삼는 따뜻한 후원을 실천하는',
      rarity: 'epic',
      requiredBadges: ['1억 기부', '모금 캠페인', '기부 1만원']
    },
    {
      name: '고귀한',
      description: '무대 위 선율과 화려한 협연으로 우아함을 뽐내는',
      rarity: 'epic',
      requiredBadges: ['오케스트라 협연', '피아노 소나타']
    },
    {
      name: '혁신적인',
      description: '특허와 스타트업으로 세상을 혁신하는',
      rarity: 'epic',
      requiredBadges: ['특허 취득', '스타트업 엑싯', 'VR 앱 개발']
    },
    {
      name: '다문화적인',
      description: '전 세계를 누비며 언어와 문화를 탐험하는',
      rarity: 'epic',
      requiredBadges: ['세계 일주', '5개 국어', '언어 교환']
    },
    {
      name: '끈질긴',
      description: '끝없는 수련으로 한계를 돌파하는 집념을 보여주는',
      rarity: 'epic',
      requiredBadges: ['명상 100일', '프리다이빙 100m', '국가 기록']
    },
    {
      name: '창작적인',
      description: '음악·영상·문장 속에 낭만을 담아내는',
      rarity: 'epic',
      requiredBadges: ['정규 앨범', '장편 소설', '영화제 상영']
    },
    {
      name: '갈고닦는',
      description: '반복 연마로 기술을 갈고닦는 성실함을 지닌',
      rarity: 'epic',
      requiredBadges: ['코딩 1년', '코드 리팩터링', '습관 앱 체크']
    },
    {
      name: '광활한',
      description: '밤하늘을 기록하며 우주에 대한 꿈을 펼치는',
      rarity: 'epic',
      requiredBadges: ['우주 사진', '천체사진', '별 관측']
    },
    {
      name: '정밀한',
      description: '향·선·맛을 조화롭게 빚어내는 섬세한 감각을 지닌',
      rarity: 'epic',
      requiredBadges: ['럭셔리 향수', '캘리그라피', '베스트셀러 요리책']
    },
    {
      name: '친환경적인',
      description: '제로웨이스트와 생태 공동체로 지구를 지키는',
      rarity: 'epic',
      requiredBadges: ['제로웨이스트 1년', '에코빌리지', '친환경 하루']
    },
    {
      name: '예리한',
      description: '한 수 앞선 전략으로 승부를 지배하는',
      rarity: 'epic',
      requiredBadges: ['체스 그랜드마스터', '체스 퍼즐', '체스 전술 5개']
    },
    {
      name: '현명한',
      description: '지식과 문화를 나누며 공동체를 풍요롭게 만드는',
      rarity: 'epic',
      requiredBadges: ['작은 도서관', '책 완독', '마인드맵 1개']
    },
    {
      name: '단호한',
      description: '체력과 정신력을 단련해 결단력을 증명하는',
      rarity: 'epic',
      requiredBadges: ['수영 100km', '트라이애슬론', '장거리 러닝']
    },
    {
      name: '우주적인',
      description: '우주의 경이로움을 삶에 녹여내는',
      rarity: 'epic',
      requiredBadges: ['우주 사진', '소행성 관측', '별 관측']
    },
    {
      name: '풍미로운',
      description: '미식과 음료의 정수를 탐구하며 풍미를 완성하는',
      rarity: 'epic',
      requiredBadges: ['미쉐린 요리', '마스터 소믈리에', '베스트셀러 요리책']
    },
    {
      name: '찬란한',
      description: '과학과 예술의 정점을 동시에 찍어 인류의 사고와 감성을 모두 뒤흔드는',
      rarity: 'legendary',
      requiredBadges: ['노벨상 수상', '그래미 수상']
    },
    {
      name: '무쌍의',
      description: '코트·트랙·로드를 가리지 않고 정상만을 밟아 온 스포츠계가 인정한 단 하나의 챔피언이 되는',
      rarity: 'legendary',
      requiredBadges: ['그랜드슬램 달성', '올림픽 금메달', '6대 마라톤']
    },
    {
      name: '불멸의',
      description: '전략과 기록 모두가 깨지지 않는 전설로 남아 시간을 넘어서는',
      rarity: 'legendary',
      requiredBadges: ['체스 세계챔프', '기네스 기록']
    },
    {
      name: '초월적인',
      description: '지구 최저점과 우주의 무중력을 모두 경험하며 인간 활동의 경계를 초월하는',
      rarity: 'legendary',
      requiredBadges: ['우주 유영', '마리아나 해구']
    },
    {
      name: '정복한',
      description: '산들이 내준 침묵의 왕좌를 차지하고 정상에서 다시 내려오는',
      rarity: 'legendary',
      requiredBadges: ['7대륙 정상', '에베레스트-롯체']
    },
    {
      name: '대서사적인',
      description: '끝없는 바다와 얼음 대륙을 하나의 항로로 묶어 현대 모험의 서사시를 완성하는',
      rarity: 'legendary',
      requiredBadges: ['무기항 세계일주', '극지 탐험']
    },
    {
      name: '매료시키는',
      description: '미각과 청각 두 무대에서 모두 별이 되어 인간의 오감을 완전히 사로잡는',
      rarity: 'legendary',
      requiredBadges: ['미쉐린 3스타', '오페라 솔로']
    },
    {
      name: '감동적인',
      description: '스크린과 지면을 넘나들며 전 세계를 울리는 이야기꾼이 되는',
      rarity: 'legendary',
      requiredBadges: ['아카데미 수상', '퓰리처상 수상']
    },
    {
      name: '혁명적인',
      description: '행동으로 지속 가능성을 입증하고 전 세계의 시선을 새로운 방식으로 모으는',
      rarity: 'legendary',
      requiredBadges: ['제로웨이스트 10년', '10억뷰 영상']
    },
    {
      name: '무한한',
      description: '언어의 벽을 허물고 지구를 한 바퀴 돌아도 만족하지 않는 호기심을 지닌',
      rarity: 'legendary',
      requiredBadges: ['10개 국어', '무기항 세계일주']
    }
  ];

  // 칭호 생성
  console.log(`총 ${titles.length}개의 칭호를 생성합니다...`)
  for (const title of titles) {
    const result = await prisma.title.upsert({
      where: { name: title.name },
      update: title,
      create: title
    })
    console.log(`칭호 생성: ${result.name}`)
  }

  console.log('✅ 시드 데이터 추가 완료!')
  
  // 데이터 확인
  const badgeCount = await prisma.badge.count()
  const titleCount = await prisma.title.count()
  console.log(`📊 데이터베이스 상태: 뱃지 ${badgeCount}개, 칭호 ${titleCount}개`)
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 추가 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 