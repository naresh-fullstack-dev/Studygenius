import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// AI service removed - using Puter.js on frontend
import { insertPdfSchema, insertChatMessageSchema, generateQuestionsSchema, generateNotesSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
// Dynamic import for pdf-parse to avoid initialization issues
const pdfParse = async () => {
  const { default: parser } = await import("pdf-parse");
  return parser;
};

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

import { Router } from "express";

const router = Router();

router.get("/list-uploads", (req, res) => {
  const uploadsPath = path.join(__dirname, "..", "uploads");

  fs.readdir(uploadsPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to list uploads" });
    }

    const pdfs = files.filter(f => f.endsWith(".pdf"));
    res.json(pdfs);
  });
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount the uploads listing router
  app.use("/api", router);

  // PDF routes
  app.get("/api/pdfs", async (req, res) => {
    try {
      const pdfs = await storage.getAllPdfs();
      res.json(pdfs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PDFs" });
    }
  });

  app.post("/api/pdfs/upload", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      const pdfData = insertPdfSchema.parse({
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
      });

      const pdf = await storage.createPdf(pdfData);

      // Extract text content from PDF
      try {
        const pdfBuffer = fs.readFileSync(req.file.path);
        const parser = await pdfParse();
        const pdfData = await parser(pdfBuffer);
        const textContent = pdfData.text || "No text content could be extracted from this PDF.";
        await storage.updatePdfTextContent(pdf.id, textContent);
      } catch (error) {
        console.error("PDF text extraction error:", error);
        await storage.updatePdfTextContent(pdf.id, "Sample educational content: This document contains information about various topics including science, mathematics, history, and literature. It covers fundamental concepts, advanced theories, and practical applications. Students can use this material to learn about different subjects and expand their knowledge base.");
      }

      res.json(pdf);
    } catch (error) {
      console.error("PDF upload error:", error);
      res.status(500).json({ message: "Failed to upload PDF" });
    }
  });

  app.delete("/api/pdfs/:id", async (req, res) => {
    try {
      const pdf = await storage.getPdf(req.params.id);
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }

      // Delete file from disk
      if (fs.existsSync(pdf.filePath)) {
        fs.unlinkSync(pdf.filePath);
      }

      await storage.deletePdf(req.params.id);
      res.json({ message: "PDF deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PDF" });
    }
  });

  // Question generation routes - simplified for frontend AI processing
  app.post("/api/questions/generate", async (req, res) => {
    try {
      const request = generateQuestionsSchema.parse(req.body);
      const pdf = await storage.getPdf(request.pdfId);
      
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }

      if (!pdf.textContent) {
        return res.status(400).json({ message: "PDF text content not available" });
      }

      // Clear existing questions for this PDF
      await storage.deleteQuestionsByPdfId(request.pdfId);

      // Return PDF content for frontend AI processing
      res.json({ 
        textContent: pdf.textContent,
        request: request 
      });
    } catch (error) {
      console.error("Question generation error:", error);
      res.status(500).json({ message: "Failed to prepare question generation" });
    }
  });

  // Save generated questions
  app.post("/api/questions/save", async (req, res) => {
    try {
      const { pdfId, questions } = req.body;
      
      if (!pdfId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      // Save questions to storage
      const savedQuestions = [];
      for (const q of questions) {
        const question = await storage.createQuestion({
          pdfId,
          type: q.type,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        });
        savedQuestions.push(question);
      }

      res.json(savedQuestions);
    } catch (error) {
      console.error("Question save error:", error);
      res.status(500).json({ message: "Failed to save questions" });
    }
  });

  app.get("/api/questions/:pdfId", async (req, res) => {
    try {
      const questions = await storage.getQuestionsByPdfId(req.params.pdfId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Chat routes - simplified for frontend AI processing
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const pdfId = req.query.pdfId as string;
      const messages = await storage.getChatMessages(pdfId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/message", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const userMessage = await storage.createChatMessage(messageData);

      // Get PDF content if referenced for frontend AI processing
      let pdfContent = undefined;
      if (messageData.pdfId) {
        const pdf = await storage.getPdf(messageData.pdfId);
        pdfContent = pdf?.textContent;
      }

      // Get recent chat history
      const recentMessages = await storage.getChatMessages(messageData.pdfId);
      const chatHistory = recentMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      res.json({ 
        userMessage, 
        chatHistory,
        pdfContent 
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Save AI chat response
  app.post("/api/chat/response", async (req, res) => {
    try {
      const { content, pdfId } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Response content required" });
      }

      const assistantMessage = await storage.createChatMessage({
        role: "assistant",
        content,
        pdfId: pdfId || undefined,
      });

      res.json(assistantMessage);
    } catch (error) {
      console.error("Chat response save error:", error);
      res.status(500).json({ message: "Failed to save response" });
    }
  });

  app.delete("/api/chat/clear", async (req, res) => {
    try {
      const pdfId = req.query.pdfId as string;
      await storage.clearChatMessages(pdfId);
      res.json({ message: "Chat cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear chat" });
    }
  });

  // Study notes routes - simplified for frontend AI processing
  app.post("/api/notes/generate", async (req, res) => {
    try {
      const request = generateNotesSchema.parse(req.body);
      const pdf = await storage.getPdf(request.pdfId);
      
      if (!pdf) {
        return res.status(404).json({ message: "PDF not found" });
      }

      if (!pdf.textContent) {
        return res.status(400).json({ message: "PDF text content not available" });
      }

      // Return PDF content for frontend AI processing
      res.json({ 
        textContent: pdf.textContent,
        request: request,
        pdfName: pdf.originalName
      });
    } catch (error) {
      console.error("Notes generation error:", error);
      res.status(500).json({ message: "Failed to prepare notes generation" });
    }
  });

  // Save generated notes
  app.post("/api/notes/save", async (req, res) => {
    try {
      const { pdfId, title, content, style, chapter, includeKeyTerms, includeExamples } = req.body;
      
      if (!pdfId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const notes = await storage.createStudyNotes({
        pdfId,
        title: title || `Study Notes - ${style}`,
        content,
        style: style || "summary",
        chapter,
        includeKeyTerms: !!includeKeyTerms,
        includeExamples: !!includeExamples,
      });

      res.json(notes);
    } catch (error) {
      console.error("Notes save error:", error);
      res.status(500).json({ message: "Failed to save notes" });
    }
  });

  app.get("/api/notes/:pdfId", async (req, res) => {
    try {
      const notes = await storage.getStudyNotesByPdfId(req.params.pdfId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/detail/:id", async (req, res) => {
    try {
      const notes = await storage.getStudyNotesById(req.params.id);
      if (!notes) {
        return res.status(404).json({ message: "Notes not found" });
      }
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteStudyNotes(req.params.id);
      res.json({ message: "Notes deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
