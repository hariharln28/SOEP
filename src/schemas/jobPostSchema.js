const { z } = require('zod');

const JobPostSchema = z.object({
  is_valid_document: z.boolean().describe("True if document is a job vacancy or job posting; False if unrelated"),
  job_title: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  workplace_type: z.enum(["remote", "hybrid", "on-site", "unknown"]).default("unknown"),
  employment_type: z.enum(["full-time", "part-time", "contract", "internship", "unknown"]).default("unknown"),
  salary_min: z.number().nonnegative().nullable().optional(),
  salary_max: z.number().nonnegative().nullable().optional(),
  currency: z.string().default("USD"),
  required_skills: z.array(z.string()).default([]),
  experience_years: z.number().nonnegative().nullable().optional(),
  contact_email: z.string().email().nullable().optional().or(z.literal("")),
  confidence_score: z.number().min(0).max(1).default(0.95)
}).superRefine((data, ctx) => {
  if (!data.is_valid_document) {
    if (data.job_title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Negative document must not have job_title populated",
        path: ["job_title"]
      });
    }
    return;
  }
  if (!data.job_title && !data.company_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Job posting must contain job_title or company_name",
      path: ["job_title"]
    });
  }
  if (data.salary_min && data.salary_max && data.salary_min > data.salary_max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "salary_min cannot be greater than salary_max",
      path: ["salary_min"]
    });
  }
});

module.exports = { JobPostSchema };
