import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { errorHandler } from "./middleware/errorHandler";
import "./config/db";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", userRouter);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "La aplicación está funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`El servidor está funcionando en el puerto ${PORT}`);
});
