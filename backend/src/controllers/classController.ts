import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { In } from "typeorm";
import { Class } from "../entities/Class";
import { Term } from "../entities/Term";
import { Course } from "../entities/Course";
import { ClassCourse } from "../entities/ClassCourse";
import { CourseComponent, ComponentType } from "../entities/CourseComponent";

/**
 * Create a new class for a term
 */
export const createClass = async (req: Request, res: Response) => {
  try {
    const { termId } = req.params;
    const { class_code } = req.body;

    // Validate termId - handle string | string[] type
    const termIdStr = Array.isArray(termId) ? termId[0] : (termId as string);
    const parsedTermId = parseInt(termIdStr, 10);
    if (isNaN(parsedTermId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid term ID",
      });
    }

    if (!class_code) {
      return res.status(400).json({
        success: false,
        message: "Class code is required",
      });
    }

    // Verify term exists
    const termRepo = AppDataSource.getRepository(Term);
    const term = await termRepo.findOne({
      where: { id: parsedTermId },
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }

    const classRepo = AppDataSource.getRepository(Class);

    // Check if class code already exists in this term
    const existingClass = await classRepo.findOne({
      where: {
        term_id: term.id,
        class_code,
      },
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: "Class with this code already exists in this term",
      });
    }

    const classEntity = classRepo.create({
      term_id: term.id,
      class_code,
    });

    await classRepo.save(classEntity);

    // Automatically assign courses that are already assigned to other classes in the same term
    console.log(`[createClass] Auto-assigning courses from other classes in the same term to new class ${classEntity.id}`);
    
    const classCourseRepo = AppDataSource.getRepository(ClassCourse);
    const componentRepo = AppDataSource.getRepository(CourseComponent);
    
    // Find all other classes in the same term (excluding the new class)
    const allClassesInTerm = await classRepo.find({
      where: { term_id: term.id },
    });
    
    const otherClassesInTerm = allClassesInTerm.filter(c => c.id !== classEntity.id);
    let assignedCount = 0;
    
    if (otherClassesInTerm.length > 0) {
      // Get all courses assigned to other classes in this term
      const otherClassIds = otherClassesInTerm.map(c => c.id);
      
      const existingClassCourses = await classCourseRepo.find({
        where: { class_id: In(otherClassIds) },
        relations: ["course"],
      });
      
      // Get unique course IDs (avoid duplicates)
      const uniqueCourseIds = [...new Set(existingClassCourses.map(cc => cc.course_id))];
      
      if (uniqueCourseIds.length > 0) {
        // Get the course details
        const courseRepo = AppDataSource.getRepository(Course);
        const coursesToAssign = await courseRepo.find({
          where: { id: In(uniqueCourseIds) },
        });
        
        console.log(`[createClass] Found ${coursesToAssign.length} course(s) assigned to other classes in term ${term.id}`);
        
        // Assign these courses to the new class
        for (const course of coursesToAssign) {
          // Check if already assigned (shouldn't happen for new class, but safety check)
          const existing = await classCourseRepo.findOne({
            where: {
              class_id: classEntity.id,
              course_id: course.id,
            },
          });

          if (!existing) {
            // Create class-course relationship
            const classCourse = classCourseRepo.create({
              class_id: classEntity.id,
              course_id: course.id,
            });
            await classCourseRepo.save(classCourse);

            // Automatically create components based on course's component_types
            if (course.component_types) {
              const componentTypes = course.component_types.split(",").map((t) => t.trim() as ComponentType);
              
              for (const componentType of componentTypes) {
                const component = componentRepo.create({
                  class_course_id: classCourse.id,
                  component_type: componentType,
                });
                await componentRepo.save(component);
              }
            }
            
            assignedCount++;
          }
        }
        console.log(`[createClass] Assigned ${assignedCount} course(s) to class ${classEntity.id}`);
      } else {
        console.log(`[createClass] No courses found in other classes of term ${term.id}, skipping auto-assignment`);
      }
    } else {
      console.log(`[createClass] No other classes found in term ${term.id}, skipping auto-assignment`);
    }

    return res.status(201).json({
      success: true,
      data: classEntity,
      message: assignedCount > 0 
        ? `Class created and ${assignedCount} course(s) assigned automatically from other classes in the same term`
        : "Class created successfully",
    });
  } catch (error) {
    console.error("Error creating class:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get all classes for a term
 */
export const getClassesByTerm = async (req: Request, res: Response) => {
  try {
    // When mounting router with app.use("/api/terms/:termId/classes", router),
    // Express merges params, but we need to check both the mounted route params
    // and any params from parent routes. The termId should be in req.params.
    console.log(`[getClassesByTerm] Request received:`, {
      params: req.params,
      query: req.query,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      method: req.method,
    });
    
    // Try to get termId from params - it should be there from the parent route
    const termId = req.params.termId;
    console.log(`[getClassesByTerm] Extracted termId:`, { termId, type: typeof termId, params: req.params });
    
    // If termId is not in params, try to extract from originalUrl
    let finalTermId = termId;
    if (!finalTermId && req.originalUrl) {
      const match = req.originalUrl.match(/\/terms\/(\d+)\/classes/);
      if (match) {
        finalTermId = match[1];
        console.log(`[getClassesByTerm] Extracted termId from originalUrl:`, finalTermId);
      }
    }

    // Use finalTermId (either from params or extracted from URL)
    const termIdToUse = finalTermId;
    
    // Validate termId exists
    if (!termIdToUse || (typeof termIdToUse === "string" && termIdToUse.trim() === "")) {
      console.error(`[getClassesByTerm] termId parameter is missing or empty:`, {
        termId: termIdToUse,
        params: req.params,
        originalUrl: req.originalUrl,
        url: req.url,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid term ID: termId parameter is missing or empty",
      });
    }

    // Parse and validate termId
    const parsedTermId = typeof termIdToUse === "string" ? parseInt(termIdToUse.trim(), 10) : parseInt(String(termIdToUse), 10);
    console.log(`[getClassesByTerm] Parsed termId:`, { termId, parsedTermId, isNaN: isNaN(parsedTermId) });
    
    if (isNaN(parsedTermId) || parsedTermId <= 0 || !Number.isInteger(parsedTermId)) {
      console.error(`[getClassesByTerm] Invalid parsedTermId:`, {
        termId,
        parsedTermId,
        isNaN: isNaN(parsedTermId),
        isPositive: parsedTermId > 0,
        isInteger: Number.isInteger(parsedTermId),
      });
      return res.status(400).json({
        success: false,
        message: `Invalid term ID: "${termId}" cannot be parsed as a positive integer`,
      });
    }

    // Verify term exists
    console.log(`[getClassesByTerm] Verifying term exists with id:`, parsedTermId);
    const termRepo = AppDataSource.getRepository(Term);
    const term = await termRepo.findOne({
      where: { id: parsedTermId },
    });

    if (!term) {
      console.error(`[getClassesByTerm] Term not found:`, { parsedTermId });
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }

    console.log(`[getClassesByTerm] Querying database for classes with termId:`, parsedTermId);
    console.log(`[getClassesByTerm] AppDataSource initialized:`, AppDataSource.isInitialized);
    
    const classRepo = AppDataSource.getRepository(Class);
    console.log(`[getClassesByTerm] Repository obtained, executing query...`);

    const classes = await classRepo.find({
      where: { term_id: term.id },
      order: { class_code: "ASC" },
    });

    console.log(`[getClassesByTerm] Query completed, found ${classes.length} classes`);
    console.log(`[getClassesByTerm] Sending response...`);

    return res.json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    console.error(`[getClassesByTerm] Exception caught:`, {
      message: error.message,
      stack: error.stack,
      error,
      params: req.params,
      url: req.url,
    });
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate id - handle string | string[] type
    const idStr = Array.isArray(id) ? id[0] : (id as string);
    const parsedId = parseInt(idStr, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const classRepo = AppDataSource.getRepository(Class);
    const classEntity = await classRepo.findOne({
      where: { id: parsedId },
      relations: ["classCourses"],
    });

    if (!classEntity) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check if class has courses assigned (prevent deletion if it has associated data)
    if (classEntity.classCourses && classEntity.classCourses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class: It has ${classEntity.classCourses.length} course(s) assigned. Please remove all courses first.`,
      });
    }

    const termId = classEntity.term_id;

    // Delete the class
    await classRepo.remove(classEntity);

    // Invalidate cache for the term
    const { invalidateTermCache } = require("../utils/cacheInvalidation");
    invalidateTermCache(termId);

    return res.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting class:", error);
    
    // Handle foreign key constraint errors
    if (error.code === "23503" || error.message?.includes("foreign key")) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete class: It has associated data (courses, components, or sessions). Please remove all associated data first.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

