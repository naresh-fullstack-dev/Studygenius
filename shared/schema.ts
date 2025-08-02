import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pdfs = pgTable("pdfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  textContent: text("text_content"),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pdfId: varchar("pdf_id").references(() => pdfs.id).notNull(),
  type: text("type").notNull(), // 'mcq', 'short', 'long', 'true_false', 'fill_blank'
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  question: text("question").notNull(),
  options: json("options"), // For MCQ questions
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  pdfId: varchar("pdf_id").references(() => pdfs.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studyNotes = pgTable("study_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pdfId: varchar("pdf_id").references(() => pdfs.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  style: text("style").notNull(), // 'summary', 'detailed', 'outline'
  chapter: text("chapter"),
  includeKeyTerms: boolean("include_key_terms").default(false),
  includeExamples: boolean("include_examples").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPdfSchema = createInsertSchema(pdfs).omit({
  id: true,
  uploadedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertStudyNotesSchema = createInsertSchema(studyNotes).omit({
  id: true,
  createdAt: true,
});

export type Pdf = typeof pdfs.$inferSelect;
export type InsertPdf = z.infer<typeof insertPdfSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type StudyNotes = typeof studyNotes.$inferSelect;
export type InsertStudyNotes = z.infer<typeof insertStudyNotesSchema>;

// Additional types for API requests
export const generateQuestionsSchema = z.object({
  pdfId: z.string(),
  count: z.number().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  types: z.array(z.enum(['mcq', 'short', 'long', 'true_false', 'fill_blank'])).min(1),
});

export const generateNotesSchema = z.object({
  pdfId: z.string(),
  style: z.enum(['summary', 'detailed', 'outline']),
  chapter: z.string().optional(),
  includeKeyTerms: z.boolean().default(false),
  includeExamples: z.boolean().default(false),
});

export type GenerateQuestionsRequest = z.infer<typeof generateQuestionsSchema>;
export type GenerateNotesRequest = z.infer<typeof generateNotesSchema>;
