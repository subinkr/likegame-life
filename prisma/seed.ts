import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터를 추가하고 있습니다...')

  // 기본 뱃지 데이터 (단순화)
  const badges = [
    {
      name: '첫 기부',
      description: '첫 번째 기부를 완료했습니다',
      rarity: 'common',
      icon: '💝'
    },
    {
      name: '첫 봉사',
      description: '첫 번째 봉사활동을 완료했습니다',
      rarity: 'common',
      icon: '🤝'
    },
    {
      name: '첫 여행',
      description: '첫 번째 여행을 떠났습니다',
      rarity: 'common',
      icon: '✈️'
    },
    {
      name: '첫 산책',
      description: '첫 번째 산책을 완료했습니다',
      rarity: 'common',
      icon: '🚶'
    },
    {
      name: '첫 독서',
      description: '첫 번째 책을 읽었습니다',
      rarity: 'common',
      icon: '📚'
    },
    {
      name: '첫 운동',
      description: '첫 번째 운동을 완료했습니다',
      rarity: 'common',
      icon: '💪'
    },
    {
      name: '첫 요리',
      description: '첫 번째 요리를 완성했습니다',
      rarity: 'common',
      icon: '👨‍🍳'
    },
    {
      name: '첫 그림',
      description: '첫 번째 그림을 그렸습니다',
      rarity: 'common',
      icon: '🎨'
    },
    {
      name: '첫 글쓰기',
      description: '첫 번째 글을 작성했습니다',
      rarity: 'common',
      icon: '✍️'
    },
    {
      name: '첫 월급',
      description: '첫 번째 월급을 받았습니다',
      rarity: 'common',
      icon: '💰'
    }
  ]

  // 뱃지 생성
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge
    })
  }

  // 기본 칭호 데이터 (단순화)
  const titles = [
    {
      name: '독서가',
      description: '독서와 글쓰기를 시작한',
      rarity: 'common',
      requiredBadges: ['첫 독서', '첫 글쓰기']
    },
    {
      name: '건강한',
      description: '운동과 요리를 시작한',
      rarity: 'common',
      requiredBadges: ['첫 운동', '첫 요리']
    },
    {
      name: '따뜻한',
      description: '기부와 봉사를 시작한',
      rarity: 'common',
      requiredBadges: ['첫 기부', '첫 봉사']
    },
    {
      name: '여행자',
      description: '여행과 산책을 시작한',
      rarity: 'common',
      requiredBadges: ['첫 여행', '첫 산책']
    },
    {
      name: '창작자',
      description: '그림과 글쓰기를 시작한',
      rarity: 'common',
      requiredBadges: ['첫 그림', '첫 글쓰기']
    },
    {
      name: '경제인',
      description: '월급과 기부를 시작한',
      rarity: 'common',
      requiredBadges: ['첫 월급', '첫 기부']
    }
  ]

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
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 추가 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 