import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z
    .string()
    .min(10)
    .max(200)
    .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), {
      message: 'Password must contain at least one letter and one digit',
    }),
  displayName: z.string().min(1).max(100).optional(),
  inviteCode: z.string().max(200).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const studentInputSchema = z.object({
  name: z.string().min(1).max(200),
  klasse: z.string().max(50).optional().nullable(),
  stufe: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const gradingConfigJsonSchema = z.object({
  maxPossiblePoints: z.number().positive(),
  pointsFor6: z.number().min(0),
  pointsFor4: z.number().min(0),
  pointsFor1: z.number().min(0),
  gradeMin: z.number(),
  gradeMax: z.number(),
  roundingStep: z.union([z.literal(0.1), z.literal(0.25), z.literal(0.5), z.literal(1)]),
  algorithm: z.enum(['LINEAR', 'NICE', 'HARD']),
});

export const examInputSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().max(100).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  config: gradingConfigJsonSchema,
  students: z
    .array(
      z.object({
        studentId: z.string().min(1),
        points: z.number().min(0),
      }),
    )
    .default([]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StudentInput = z.infer<typeof studentInputSchema>;
export type ExamInput = z.infer<typeof examInputSchema>;
