import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
} from "../controllers/courseController";

const router = Router();

// POST /courses - Create a new course
router.post("/", createCourse);

// GET /courses - Get all courses
router.get("/", getAllCourses);

// GET /courses/:id - Get course by ID
router.get("/:id", getCourseById);

// PUT /courses/:id - Update course
router.put("/:id", updateCourse);

export default router;

