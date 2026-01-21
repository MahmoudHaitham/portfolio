import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Course } from "../entities/Course";
import { Class } from "../entities/Class";
import { ClassCourse } from "../entities/ClassCourse";
import { CourseComponent, ComponentType } from "../entities/CourseComponent";

/**
 * Create a new course
 */
export const createCourse = async (req: Request, res: Response) => {
  try {
    const { code, name, is_elective, components } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: "Course code and name are required",
      });
    }

    const courseRepo = AppDataSource.getRepository(Course);

    // Check if course already exists
    const existingCourse = await courseRepo.findOne({
      where: { code },
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: "Course with this code already exists",
      });
    }

    // Process components: Always L and S, add LB if provided
    let componentTypes = "L,S";
    if (Array.isArray(components)) {
      const hasL = components.includes("L");
      const hasS = components.includes("S");
      const hasLB = components.includes("LB");
      
      // Ensure L and S are always included
      const finalComponents = [];
      if (hasL) finalComponents.push("L");
      if (hasS) finalComponents.push("S");
      if (hasLB) finalComponents.push("LB");
      
      componentTypes = finalComponents.join(",");
    }

    const course = courseRepo.create({
      code,
      name,
      is_elective: is_elective || false,
      component_types: componentTypes,
    });

    await courseRepo.save(course);

    // If this is a core course (not elective), automatically assign it to all existing classes
    // This ensures all classes have the same core courses
    let assignedClassesCount = 0;
    if (!course.is_elective) {
      console.log(`[createCourse] Auto-assigning core course ${course.code} to all existing classes`);
      const classRepo = AppDataSource.getRepository(Class);
      const allClasses = await classRepo.find({
        order: { class_code: "ASC" },
      });
      
      if (allClasses.length > 0) {
        const classCourseRepo = AppDataSource.getRepository(ClassCourse);
        const componentRepo = AppDataSource.getRepository(CourseComponent);
        
        for (const classEntity of allClasses) {
          // Check if already assigned
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
            assignedClassesCount++;
          }
        }
        console.log(`[createCourse] Assigned core course ${course.code} to ${assignedClassesCount} class(es)`);
      }
    }

    return res.status(201).json({
      success: true,
      data: course,
      message: course.is_elective 
        ? "Course created successfully" 
        : `Core course created and assigned to ${assignedClassesCount} existing class(es)`,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get all courses
 */
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courseRepo = AppDataSource.getRepository(Course);
    const courses = await courseRepo.find({
      order: { code: "ASC" },
    });

    return res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get course by ID
 */
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const courseRepo = AppDataSource.getRepository(Course);

    // Handle string | string[] type
    const idStr = Array.isArray(id) ? id[0] : id;
    const parsedId = parseInt(idStr, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await courseRepo.findOne({
      where: { id: parsedId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Update course
 */
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, is_elective } = req.body;

    // Handle string | string[] type
    const idStr = Array.isArray(id) ? id[0] : id;
    const parsedId = parseInt(idStr, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({
      where: { id: parsedId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (code) {
      // Check if new code already exists
      const existingCourse = await courseRepo.findOne({
        where: { code },
      });

      if (existingCourse && existingCourse.id !== course.id) {
        return res.status(400).json({
          success: false,
          message: "Course with this code already exists",
        });
      }

      course.code = code;
    }

    if (name) {
      course.name = name;
    }

    if (typeof is_elective === "boolean") {
      course.is_elective = is_elective;
    }

    await courseRepo.save(course);

    return res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

