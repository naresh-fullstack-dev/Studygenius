import { type Pdf, type InsertPdf, type Question, type InsertQuestion, type ChatMessage, type InsertChatMessage, type StudyNotes, type InsertStudyNotes } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // PDF operations
  getPdf(id: string): Promise<Pdf | undefined>;
  getAllPdfs(): Promise<Pdf[]>;
  createPdf(pdf: InsertPdf): Promise<Pdf>;
  deletePdf(id: string): Promise<void>;
  updatePdfTextContent(id: string, textContent: string): Promise<void>;

  // Question operations
  getQuestionsByPdfId(pdfId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  deleteQuestionsByPdfId(pdfId: string): Promise<void>;

  // Chat message operations
  getChatMessages(pdfId?: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(pdfId?: string): Promise<void>;

  // Study notes operations
  getStudyNotesByPdfId(pdfId: string): Promise<StudyNotes[]>;
  getStudyNotesById(id: string): Promise<StudyNotes | undefined>;
  createStudyNotes(notes: InsertStudyNotes): Promise<StudyNotes>;
  deleteStudyNotes(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private pdfs: Map<string, Pdf>;
  private questions: Map<string, Question>;
  private chatMessages: Map<string, ChatMessage>;
  private studyNotes: Map<string, StudyNotes>;

  constructor() {
    this.pdfs = new Map();
    this.questions = new Map();
    this.chatMessages = new Map();
    this.studyNotes = new Map();
  }

  // PDF operations
  async getPdf(id: string): Promise<Pdf | undefined> {
    return this.pdfs.get(id);
  }

  async getAllPdfs(): Promise<Pdf[]> {
    return Array.from(this.pdfs.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async createPdf(insertPdf: InsertPdf): Promise<Pdf> {
    const id = randomUUID();
    const pdf: Pdf = {
      ...insertPdf,
      id,
      uploadedAt: new Date(),
    };
    this.pdfs.set(id, pdf);
    return pdf;
  }

  async deletePdf(id: string): Promise<void> {
    this.pdfs.delete(id);
    // Also delete related questions, chat messages, and notes
    await this.deleteQuestionsByPdfId(id);
    await this.clearChatMessages(id);
    Array.from(this.studyNotes.values())
      .filter(note => note.pdfId === id)
      .forEach(note => this.studyNotes.delete(note.id));
  }

  async updatePdfTextContent(id: string, textContent: string): Promise<void> {
    const pdf = this.pdfs.get(id);
    if (pdf) {
      pdf.textContent = textContent;
      this.pdfs.set(id, pdf);
    }
  }

  // Question operations
  async getQuestionsByPdfId(pdfId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.pdfId === pdfId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: new Date(),
    };
    this.questions.set(id, question);
    return question;
  }

  async deleteQuestionsByPdfId(pdfId: string): Promise<void> {
    Array.from(this.questions.entries())
      .filter(([, question]) => question.pdfId === pdfId)
      .forEach(([id]) => this.questions.delete(id));
  }

  // Chat message operations
  async getChatMessages(pdfId?: string): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values());
    const filtered = pdfId 
      ? messages.filter(m => m.pdfId === pdfId)
      : messages.filter(m => !m.pdfId);
    
    return filtered.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async clearChatMessages(pdfId?: string): Promise<void> {
    Array.from(this.chatMessages.entries())
      .filter(([, message]) => pdfId ? message.pdfId === pdfId : !message.pdfId)
      .forEach(([id]) => this.chatMessages.delete(id));
  }

  // Study notes operations
  async getStudyNotesByPdfId(pdfId: string): Promise<StudyNotes[]> {
    return Array.from(this.studyNotes.values())
      .filter(note => note.pdfId === pdfId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getStudyNotesById(id: string): Promise<StudyNotes | undefined> {
    return this.studyNotes.get(id);
  }

  async createStudyNotes(insertNotes: InsertStudyNotes): Promise<StudyNotes> {
    const id = randomUUID();
    const notes: StudyNotes = {
      ...insertNotes,
      id,
      createdAt: new Date(),
    };
    this.studyNotes.set(id, notes);
    return notes;
  }

  async deleteStudyNotes(id: string): Promise<void> {
    this.studyNotes.delete(id);
  }
}

export const storage = new MemStorage();
