import express from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { userStore, userProfileStore } from "../models/user";
import { body, validationResult } from "express-validator";

const router = express.Router();

const updateProfileValidation = [
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("age").isNumeric().withMessage("Age must be at Number"),
  body("age").notEmpty().withMessage("Age is required"),
  body("weight").isNumeric().withMessage("weight must be at Number"),
  body("weight").notEmpty().withMessage("weight is required"),
  body("height").isNumeric().withMessage("height must be at Number"),
  body("height").notEmpty().withMessage("height is required"),
  body("objective").notEmpty().withMessage("Objective is required"),
  body("objective").isString().withMessage("Objective must be at string"),
  body("training_days").notEmpty().withMessage("training_days is required"),
  body("training_days")
    .isNumeric()
    .withMessage("training_days must be at Number"),
  body("profiling_form").notEmpty().withMessage("profiling_form is required"),
  body("profiling_form")
    .isNumeric()
    .withMessage("profiling_form must be at Number"),
];

router.post(
  "/userProfile/:id",
  authenticateToken,
  updateProfileValidation,
  async (req: AuthRequest, res: any) => {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (userId != req.userId) {
        res.status(401).json({ message: "User not allowed" });
      }
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        username,
        age,
        weight,
        height,
        objective,
        training_days,
        profiling_form,
      } = req.body;

      const userProfile = await userProfileStore.updateUserProfile(
        Number(userId),
        username,
        age,
        weight,
        height,
        objective,
        training_days,
        profiling_form
      );
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }

      const routines = await userProfileStore.createRoutine(
        age,
        weight,
        height,
        objective,
        training_days
      );
      if (!routines) {
        return res.status(404).json({ message: "Routines not found" });
      }
      await userProfileStore.saveRoutine(userId, routines);
      res.json({
        message: "User profile update successfully",
        profile: userProfile,
      });
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
router.get(
  "/userProfile/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      console.log("userid", req.userId);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (userId != req.userId) {
        res.status(401).json({ message: "User not allowed" });
      }

      const user = await userProfileStore.findByIdUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userProfile = await userProfileStore.findByIdUser(Number(userId));
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User profile retrieved successfully",
        profile: userProfile,
      });
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get(
  "/userRoutines/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      console.log("userid", req.userId);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (userId != req.userId) {
        res.status(401).json({ message: "User not allowed" });
      }

      const user = await userProfileStore.findByIdUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userRoutines = await userProfileStore.findUserRoutinesById(userId);
      if (!userRoutines) {
        return res.status(404).json({ message: "User routines not found" });
      }

      res.json({
        message: "User profile retrieved successfully",
        profile: userRoutines,
      });
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export const userRouter = router;
