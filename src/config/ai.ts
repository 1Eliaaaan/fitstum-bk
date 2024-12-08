import dotenv from "dotenv";
dotenv.config();

export const openaienvs = {
  apikey: process.env.OPENAI,
  org: process.env.ORGANIZATION,
};
