import { garments, type Garment, type InsertGarment, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Garment methods
  getGarmentByCode(codigo: string): Promise<Garment | undefined>;
  createGarment(garment: InsertGarment): Promise<Garment>;
  createGarments(garments: InsertGarment[]): Promise<Garment[]>;
  getAllGarments(): Promise<Garment[]>;
  deleteAllGarments(): Promise<void>;
  updateGarmentImage(codigo: string, imageUrl: string): Promise<Garment | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { users } = await import("@shared/schema");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await import("@shared/schema").then(m => m.users);
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await import("@shared/schema").then(m => m.users);
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getGarmentByCode(codigo: string): Promise<Garment | undefined> {
    const [garment] = await db.select().from(garments).where(eq(garments.codigo, codigo));
    return garment || undefined;
  }

  async createGarment(garment: InsertGarment): Promise<Garment> {
    const [created] = await db
      .insert(garments)
      .values(garment)
      .returning();
    return created;
  }

  async createGarments(garmentList: InsertGarment[]): Promise<Garment[]> {
    if (garmentList.length === 0) return [];
    
    const created = await db
      .insert(garments)
      .values(garmentList)
      .returning();
    return created;
  }

  async getAllGarments(): Promise<Garment[]> {
    return await db.select().from(garments);
  }

  async deleteAllGarments(): Promise<void> {
    await db.delete(garments);
  }

  async updateGarmentImage(codigo: string, imageUrl: string): Promise<Garment | undefined> {
    const [updated] = await db
      .update(garments)
      .set({ imagen_url: imageUrl })
      .where(eq(garments.codigo, codigo))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
