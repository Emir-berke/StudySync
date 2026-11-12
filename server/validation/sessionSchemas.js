const { z } = require('zod');

const sessionFields = {
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().default(''),
  scheduledAt: z.coerce.date(),
  status: z.enum(['upcoming', 'active', 'completed']).optional(),
};

const createSessionSchema = z.object(sessionFields).strict();

const updateSessionSchema = z
  .object({
    title: sessionFields.title.optional(),
    description: z.string().trim().max(2000).optional(),
    scheduledAt: sessionFields.scheduledAt.optional(),
    status: sessionFields.status,
  })
  .strict()
  .refine((updates) => Object.keys(updates).length > 0, {
    message: 'Provide at least one field to update',
  });

module.exports = {
  createSessionSchema,
  updateSessionSchema,
};
