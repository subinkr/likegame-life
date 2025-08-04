import Joi from 'joi';

export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '올바른 이메일 형식을 입력해주세요.',
    'any.required': '이메일은 필수입니다.'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required().messages({
    'string.min': '비밀번호는 최소 8자 이상이어야 합니다.',
    'string.pattern.base': '비밀번호는 영문 대문자, 소문자, 숫자를 모두 포함해야 합니다.',
    'any.required': '비밀번호는 필수입니다.'
  }),
  nickname: Joi.string().min(2).max(20).required().messages({
    'string.min': '닉네임은 최소 2자 이상이어야 합니다.',
    'string.max': '닉네임은 최대 20자까지 가능합니다.',
    'any.required': '닉네임은 필수입니다.'
  })
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const badgeSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).required(),
  rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary').required(),
  icon: Joi.string().min(1).max(10).required()
});

export const titleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).required(),
  rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary').required(),
  requiredBadges: Joi.array().items(Joi.string()).optional()
});

export const questSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).required(),
  location: Joi.string().max(100).required(),
  reward: Joi.number().min(0).max(10000).required()
});

export const chatMessageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  chatRoomId: Joi.string().required()
});

export const strengthRecordSchema = Joi.object({
  bench: Joi.number().min(0).max(1000).required(),
  squat: Joi.number().min(0).max(1000).required(),
  deadlift: Joi.number().min(0).max(1000).required()
});

export const wisdomNoteSchema = Joi.object({
  quote: Joi.string().min(1).max(500).required(),
  impression: Joi.string().max(1000).required(),
  bookId: Joi.string().required()
}); 