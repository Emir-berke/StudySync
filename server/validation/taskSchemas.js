
const { z } = require("zod");


const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ID format",
});


const taskStatus = z.enum(["todo", "in-progress", "done"]);


const taskPriority = z.enum(["low", "medium", "high"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  session: objectId,
  priority: taskPriority.optional().default("medium"),
  dueDate: z.coerce.date().nullable().optional(),
}).strict();


const updateTaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  priority: taskPriority.optional(),
  dueDate: z.coerce.date().nullable().optional(),
})
.strict()
.refine((updates) => Object.keys(updates).length > 0, {
  message: "Provide at least one field to update",
});


const updateTaskStatusSchema = z.object({
  status: taskStatus,
}).strict();


const assignTaskSchema = z.object({
  assignedTo: objectId.nullable(),
}).strict();

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
};
