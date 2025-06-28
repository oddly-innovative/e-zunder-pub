import { pgTable, text, serial, uuid, timestamp, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'active', 'completed', 'archived']);
export const documentTypeEnum = pgEnum('document_type', ['article', 'book', 'report', 'summary', 'email', 'blog_post', 'social_post']);
export const documentStatusEnum = pgEnum('document_status', ['draft', 'review', 'published', 'archived']);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").default('user').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").default('draft').notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents table
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  content: text("content").default(''),
  type: documentTypeEnum("type").default('article').notNull(),
  status: documentStatusEnum("status").default('draft').notNull(),
  wordCount: integer("word_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Logs table
export const aiLogs = pgTable("ai_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  requestType: text("request_type").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  tokensUsed: integer("tokens_used").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  aiLogs: many(aiLogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
}));

export const aiLogsRelations = relations(aiLogs, ({ one }) => ({
  user: one(users, {
    fields: [aiLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiLogSchema = createInsertSchema(aiLogs).omit({
  id: true,
  createdAt: true,
});

// Select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectProjectSchema = createSelectSchema(projects);
export const selectDocumentSchema = createSelectSchema(documents);
export const selectAiLogSchema = createSelectSchema(aiLogs);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AiLog = typeof aiLogs.$inferSelect;
export type InsertAiLog = z.infer<typeof insertAiLogSchema>;

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
