import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import OpenAI from "openai";
import { openaienvs } from "../config/ai";

const openai = new OpenAI({
  apiKey: openaienvs.apikey,
  organization: openaienvs.org,
});
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  create_time: Date;
}

export interface UserProfile {
  iduser_profile: number;
  iduser: number;
  age: number;
  weight: number;
  height: number;
  objective: string;
  training_days: number;
}

export class UserStore {
  async findByEmail(email: string): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );
    return rows[0] as User | undefined;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM user WHERE username = ?",
      [username]
    );
    return rows[0] as User | undefined;
  }

  async findById(id: number): Promise<User | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM user WHERE id = ?",
      [id]
    );
    return rows[0] as User | undefined;
  }

  async create(user: Omit<User, "id" | "create_time">): Promise<User> {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO user (username, email, password, is_active, profiling_form) VALUES (?, ?, ?, ?, ?)",
      [user.username, user.email, user.password, 1, 0]
    );
    const id = result.insertId;
    return { ...user, id, create_time: new Date() } as User;
  }
}

export class UserProfileStore {
  async findByIdUser(iduser: number): Promise<UserProfile | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM user_profile WHERE iduser = ?",
      [iduser]
    );
    return rows[0] as UserProfile | undefined;
  }

  async updateUserProfile(
    iduser: number,
    username: string,
    age: number,
    weight: number,
    height: number,
    objective: string,
    training_days: number,
    profiling_form: number
  ): Promise<UserProfile | undefined> {
    // First, update the username in the user table
    await pool.query<ResultSetHeader>(
      "UPDATE user SET username = ?, profiling_form = ? WHERE id = ?",
      [username, profiling_form, iduser]
    );

    // Then, update or insert the user profile
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO user_profile (iduser, age, weight, height, objective, training_days)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       age = VALUES(age),
       weight = VALUES(weight),
       height = VALUES(height),
       objective = VALUES(objective),
       training_days = VALUES(training_days)`,
      [iduser, age, weight, height, objective, training_days]
    );

    // Fetch and return the updated user profile
    const [updatedRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM user_profile WHERE iduser = ?",
      [iduser]
    );
    return updatedRows[0] as UserProfile | undefined;
  }

  async createRoutine(
    age: number,
    weight: number,
    height: number,
    objective: string,
    training_days: number
  ): Promise<string | null> {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `You can make an exercise routine for ${training_days} 
          days for a person who is ${age} years old and weighs ${weight} KG with a height of ${height}CM and 
          her goal is ${objective}.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "routine_schema",
          schema: {
            type: "object",
            properties: {
              routines: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    exercise: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          exercise: { type: "string" },
                          duration: { type: "string" },
                          calories: { type: "number" },
                          sets: { type: "number" },
                          reps: { type: "number" },
                          imgUrl: { type: "string", format: "uri" },
                          videoUrl: { type: "string", format: "uri" },
                        },
                        required: [
                          "exercise",
                          "duration",
                          "calories",
                          "sets",
                          "reps",
                          "imgUrl",
                          "videoUrl",
                        ],
                      },
                    },
                  },
                  required: ["exercise"],
                },
              },
            },
            required: ["routines"],
          },
        },
      },
    });

    return completion.choices[0].message.content;
  }

  async saveRoutine(
    userid: string,
    routines: string
  ): Promise<UserProfile | undefined> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO user_routines (iduser,routines)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
       routines = VALUES(routines)`,
      [userid, routines]
    );
    return;
  }

  async findUserRoutinesById(iduser: string): Promise<UserProfile | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM user_routines WHERE iduser = ?",
      [iduser]
    );
    return rows[0] as UserProfile | undefined;
  }
}

export const userStore = new UserStore();
export const userProfileStore = new UserProfileStore();
