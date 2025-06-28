import {
  users,
  projects,
  documents,
  aiLogs,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Document,
  type InsertDocument,
  type AiLog,
  type InsertAiLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  // Project operations
  getProjects(userId: string, limit?: number, offset?: number): Promise<Project[]>;
  getProject(id: string, userId: string): Promise<Project | undefined>;
  createProject(userId: string, project: InsertProject): Promise<Project>;
  updateProject(id: string, userId: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string, userId: string): Promise<boolean>;
  getProjectsCount(userId: string): Promise<number>;

  // Document operations
  getDocuments(projectId: string, userId: string, limit?: number, offset?: number): Promise<Document[]>;
  getDocument(id: string, userId: string): Promise<Document | undefined>;
  createDocument(projectId: string, document: InsertDocument): Promise<Document>;
  updateDocument(id: string, userId: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string, userId: string): Promise<boolean>;
  getDocumentsCount(projectId?: string): Promise<number>;

  // AI Log operations
  createAiLog(log: InsertAiLog): Promise<AiLog>;
  getAiUsage(userId: string, startDate?: Date, endDate?: Date): Promise<{ tokensUsed: number; requestCount: number }>;
  getAiLogs(userId: string, limit?: number, offset?: number): Promise<AiLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Project operations
  async getProjects(userId: string, limit = 20, offset = 0): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async getProject(id: string, userId: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project;
  }

  async createProject(userId: string, projectData: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...projectData,
        userId,
        updatedAt: new Date(),
      })
      .returning();
    return project;
  }

  async updateProject(id: string, userId: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return project;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return result.rowCount > 0;
  }

  async getProjectsCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId));
    return result.count;
  }

  // Document operations
  async getDocuments(projectId: string, userId: string, limit = 20, offset = 0): Promise<Document[]> {
    return await db
      .select({
        id: documents.id,
        projectId: documents.projectId,
        title: documents.title,
        content: documents.content,
        type: documents.type,
        status: documents.status,
        wordCount: documents.wordCount,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .innerJoin(projects, eq(documents.projectId, projects.id))
      .where(and(eq(documents.projectId, projectId), eq(projects.userId, userId)))
      .orderBy(desc(documents.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async getDocument(id: string, userId: string): Promise<Document | undefined> {
    const [document] = await db
      .select({
        id: documents.id,
        projectId: documents.projectId,
        title: documents.title,
        content: documents.content,
        type: documents.type,
        status: documents.status,
        wordCount: documents.wordCount,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .innerJoin(projects, eq(documents.projectId, projects.id))
      .where(and(eq(documents.id, id), eq(projects.userId, userId)));
    return document;
  }

  async createDocument(projectId: string, documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        ...documentData,
        projectId,
        updatedAt: new Date(),
      })
      .returning();
    return document;
  }

  async updateDocument(id: string, userId: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .from(projects)
      .where(and(
        eq(documents.id, id),
        eq(documents.projectId, projects.id),
        eq(projects.userId, userId)
      ))
      .returning({
        id: documents.id,
        projectId: documents.projectId,
        title: documents.title,
        content: documents.content,
        type: documents.type,
        status: documents.status,
        wordCount: documents.wordCount,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      });
    return document;
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(
        and(
          eq(documents.id, id),
          sql`${documents.projectId} IN (SELECT id FROM ${projects} WHERE ${projects.userId} = ${userId})`
        )
      );
    return result.rowCount > 0;
  }

  async getDocumentsCount(projectId?: string): Promise<number> {
    const query = db.select({ count: sql<number>`count(*)` }).from(documents);
    
    if (projectId) {
      query.where(eq(documents.projectId, projectId));
    }
    
    const [result] = await query;
    return result.count;
  }

  // AI Log operations
  async createAiLog(logData: InsertAiLog): Promise<AiLog> {
    const [log] = await db
      .insert(aiLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getAiUsage(userId: string, startDate?: Date, endDate?: Date): Promise<{ tokensUsed: number; requestCount: number }> {
    let query = db
      .select({
        tokensUsed: sql<number>`COALESCE(SUM(${aiLogs.tokensUsed}), 0)`,
        requestCount: sql<number>`COUNT(*)`,
      })
      .from(aiLogs)
      .where(eq(aiLogs.userId, userId));

    if (startDate) {
      query = query.where(sql`${aiLogs.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      query = query.where(sql`${aiLogs.createdAt} <= ${endDate}`);
    }

    const [result] = await query;
    return {
      tokensUsed: result.tokensUsed || 0,
      requestCount: result.requestCount || 0,
    };
  }

  async getAiLogs(userId: string, limit = 20, offset = 0): Promise<AiLog[]> {
    return await db
      .select()
      .from(aiLogs)
      .where(eq(aiLogs.userId, userId))
      .orderBy(desc(aiLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}

export const storage = new DatabaseStorage();
