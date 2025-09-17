import { users, sessions, type User, type InsertUser, type Session } from "@shared/schema";
import bcrypt from "bcryptjs";

export interface ConfigData {
  rectifiers: any;
  solars: any;
  batteryGroup: any;
  acInput: any;
  dcOutput: any;
  environment: any;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSession(userId: number, sessionId: string, expiresAt: Date): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  getConfig(): Promise<ConfigData>;
  setConfig(config: ConfigData): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private currentUserId: number;
  private config: ConfigData;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.currentUserId = 1;
    
    // Create default netmon user with hashed password
    const defaultPasswordHash = bcrypt.hashSync("netmon", 10);
    this.createUser({ username: "netmon", password: defaultPasswordHash });
    this.config = {
      rectifiers: {},
      solars: {},
      batteryGroup: {},
      acInput: {},
      dcOutput: {},
      environment: {}
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createSession(userId: number, sessionId: string, expiresAt: Date): Promise<Session> {
    const session: Session = {
      id: sessionId,
      userId,
      expiresAt
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(sessionId);
    }
    return undefined;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => session.expiresAt <= now)
      .map(([sessionId, _]) => sessionId);
    
    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });
  }

  async getConfig(): Promise<ConfigData> {
    return this.config;
  }

  async setConfig(config: ConfigData): Promise<void> {
    this.config = config;
  }
}

export const storage = new MemStorage();
