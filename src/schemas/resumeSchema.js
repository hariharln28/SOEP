const { z } = require('zod');

const ResumeSchema = z.object({
  is_valid_document: z.boolean().describe("True if document is a candidate resume or CV; False if unrelated"),
  full_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  current_title: z.string().nullable().optional(),
  total_experience_years: z.number().nonnegative().nullable().optional(),
  skills: z.array(z.string()).default([]),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number().nullable().optional()
  })).default([]),
  work_history: z.array(z.object({
    company: z.string(),
    role: z.string(),
    duration_years: z.number().nullable().optional()
  })).default([]),
  confidence_score: z.number().min(0).max(1).default(0.95)
}).superRefine((data, ctx) => {
  if (!data.is_valid_document) {
    if (data.full_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Negative document must not have full_name populated",
        path: ["full_name"]
      });
    }
    return;
  }
  if (!data.full_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Valid candidate resume must specify full_name",
      path: ["full_name"]
    });
  }
});

module.exports = { ResumeSchema };
