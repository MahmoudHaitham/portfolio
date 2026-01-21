import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Session, Day } from "../entities/Session";
import { CourseComponent } from "../entities/CourseComponent";
import { ClassCourse } from "../entities/ClassCourse";
import {
  checkSessionCollision,
  checkDayLimit,
} from "../services/validationService";

/**
 * Create a session for a component
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    console.log(`[createSession] Request received:`, {
      params: req.params,
      query: req.query,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl,
      body: req.body,
      method: req.method,
    });
    
    const { componentId } = req.params;
    console.log(`[createSession] Extracted componentId:`, { componentId, type: typeof componentId, params: req.params });
    
    const { day, slot, room, instructor } = req.body;

    // Validate componentId exists
    if (!componentId || (typeof componentId === "string" && componentId.trim() === "")) {
      console.error(`[createSession] componentId parameter is missing or empty:`, {
        componentId,
        params: req.params,
        url: req.url,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid component ID: componentId parameter is missing or empty",
      });
    }

    // Parse and validate componentId
    const parsedComponentId = typeof componentId === "string" ? parseInt(componentId.trim(), 10) : parseInt(String(componentId), 10);
    console.log(`[createSession] Parsed componentId:`, { componentId, parsedComponentId, isNaN: isNaN(parsedComponentId) });
    
    if (isNaN(parsedComponentId) || parsedComponentId <= 0 || !Number.isInteger(parsedComponentId)) {
      console.error(`[createSession] Invalid parsedComponentId:`, {
        componentId,
        parsedComponentId,
        isNaN: isNaN(parsedComponentId),
        isPositive: parsedComponentId > 0,
        isInteger: Number.isInteger(parsedComponentId),
      });
      return res.status(400).json({
        success: false,
        message: `Invalid component ID: "${componentId}" cannot be parsed as a positive integer`,
      });
    }

    // Validation
    if (!day || !slot) {
      return res.status(400).json({
        success: false,
        message: "Day and slot are required",
      });
    }

    // Validate slot range (1-4 instead of 1-8)
    if (slot < 1 || slot > 4) {
      return res.status(400).json({
        success: false,
        message: "Slot must be between 1 and 4",
      });
    }

    // Validate day
    const validDays = Object.values(Day);
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: `Invalid day. Must be one of: ${validDays.join(", ")}`,
      });
    }

    // Verify component exists and get class_id
    console.log(`[createSession] Verifying component exists with id:`, parsedComponentId);
    const componentRepo = AppDataSource.getRepository(CourseComponent);
    const component = await componentRepo.findOne({
      where: { id: parsedComponentId },
      relations: ["classCourse", "classCourse.class"],
    });

    if (!component) {
      console.error(`[createSession] Component not found:`, { parsedComponentId });
      return res.status(404).json({
        success: false,
        message: "Component not found",
      });
    }
    
    console.log(`[createSession] Component found:`, { id: component.id, component_type: component.component_type });

    const classId = component.classCourse.class_id;
    console.log(`[createSession] Checking collisions and day limits for classId:`, classId, `day:`, day, `slot:`, slot);

    // Check if this component already has a session (each component can only have one session per class)
    const sessionRepo = AppDataSource.getRepository(Session);
    const existingSessionForComponent = await sessionRepo.findOne({
      where: { component_id: parsedComponentId },
    });

    if (existingSessionForComponent) {
      console.error(`[createSession] Component already has a session:`, {
        componentId: parsedComponentId,
        componentType: component.component_type,
        existingSession: existingSessionForComponent,
      });
      const componentName = component.component_type === "L" ? "Lecture" : component.component_type === "S" ? "Section" : "Lab";
      return res.status(400).json({
        success: false,
        message: `This component already has a ${componentName} session scheduled. Each component can only have one session per class.`,
        details: {
          existingSession: existingSessionForComponent,
        },
      });
    }

    // Check for collisions
    const collisionCheck = await checkSessionCollision(classId, day, slot);
    console.log(`[createSession] Collision check result:`, collisionCheck);
    if (collisionCheck.hasCollision) {
      console.error(`[createSession] Collision detected:`, {
        classId,
        day,
        slot,
        conflictingSession: collisionCheck.conflictingSession,
      });
      return res.status(400).json({
        success: false,
        message: `Collision detected: Another session already exists for ${day} at slot ${slot}`,
        details: {
          conflictingSession: collisionCheck.conflictingSession,
        },
      });
    }

    // Check day limit (max 4 sessions per day per class)
    const dayLimitCheck = await checkDayLimit(classId, day);
    console.log(`[createSession] Day limit check result:`, dayLimitCheck);
    if (!dayLimitCheck.canAdd) {
      console.error(`[createSession] Day limit reached:`, {
        classId,
        day,
        currentCount: dayLimitCheck.currentCount,
      });
      return res.status(400).json({
        success: false,
        message: `Day limit reached: Class already has 4 sessions on ${day}`,
        details: {
          currentCount: dayLimitCheck.currentCount,
        },
      });
    }
    
    console.log(`[createSession] All checks passed, proceeding to create session`);

    // Create session
    console.log(`[createSession] Creating session with:`, { parsedComponentId, day, slot, room, instructor });
    const session = sessionRepo.create({
      component_id: parsedComponentId,
      day: day as Day,
      slot,
      room: room || null,
      instructor: instructor || null,
    });

    await sessionRepo.save(session);
    console.log(`[createSession] Successfully created session:`, { id: session.id });

    return res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error(`[createSession] Exception caught:`, {
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
 * Get all sessions for a component
 */
export const getSessionsByComponent = async (req: Request, res: Response) => {
  try {
    console.log(`[getSessionsByComponent] Request received:`, {
      params: req.params,
      query: req.query,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl,
      method: req.method,
    });
    
    const { componentId } = req.params;
    console.log(`[getSessionsByComponent] Extracted componentId:`, { componentId, type: typeof componentId, params: req.params });

    // Validate componentId exists
    if (!componentId || (typeof componentId === "string" && componentId.trim() === "")) {
      console.error(`[getSessionsByComponent] componentId parameter is missing or empty:`, {
        componentId,
        params: req.params,
        url: req.url,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid component ID: componentId parameter is missing or empty",
      });
    }

    // Parse and validate componentId
    const parsedComponentId = typeof componentId === "string" ? parseInt(componentId.trim(), 10) : parseInt(String(componentId), 10);
    console.log(`[getSessionsByComponent] Parsed componentId:`, { componentId, parsedComponentId, isNaN: isNaN(parsedComponentId) });
    
    if (isNaN(parsedComponentId) || parsedComponentId <= 0 || !Number.isInteger(parsedComponentId)) {
      console.error(`[getSessionsByComponent] Invalid parsedComponentId:`, {
        componentId,
        parsedComponentId,
        isNaN: isNaN(parsedComponentId),
        isPositive: parsedComponentId > 0,
        isInteger: Number.isInteger(parsedComponentId),
      });
      return res.status(400).json({
        success: false,
        message: `Invalid component ID: "${componentId}" cannot be parsed as a positive integer`,
      });
    }

    console.log(`[getSessionsByComponent] Querying database for sessions with component_id:`, parsedComponentId);
    const sessionRepo = AppDataSource.getRepository(Session);
    const sessions = await sessionRepo.find({
      where: { component_id: parsedComponentId },
      order: { day: "ASC", slot: "ASC" },
    });

    console.log(`[getSessionsByComponent] Query completed, found ${sessions.length} sessions`);
    console.log(`[getSessionsByComponent] Sending response...`);

    return res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error(`[getSessionsByComponent] Exception caught:`, {
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
 * Update a session
 */
export const updateSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { day, slot, room, instructor } = req.body;

    // Handle string | string[] type
    const idStr = Array.isArray(id) ? id[0] : (id as string);
    const parsedId = parseInt(idStr, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({
      where: { id: parsedId },
      relations: ["component", "component.classCourse", "component.classCourse.class"],
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // If day or slot is being changed, check for collisions
    if (day || slot) {
      const newDay = day || session.day;
      const newSlot = slot || session.slot;

      // Validate slot range (1-4 instead of 1-8)
      if (newSlot < 1 || newSlot > 4) {
        return res.status(400).json({
          success: false,
          message: "Slot must be between 1 and 4",
        });
      }

      // Check for collisions (excluding current session)
      const classId = session.component.classCourse.class_id;
      const collisionCheck = await checkSessionCollision(classId, newDay, newSlot);
      
      if (collisionCheck.hasCollision && collisionCheck.conflictingSession?.id !== session.id) {
        return res.status(400).json({
          success: false,
          message: `Collision detected: Another session already exists for ${newDay} at slot ${newSlot}`,
        });
      }

      // Check day limit if day changed
      if (day && day !== session.day) {
        const dayLimitCheck = await checkDayLimit(classId, newDay);
        if (!dayLimitCheck.canAdd) {
          return res.status(400).json({
            success: false,
            message: `Day limit reached: Class already has 4 sessions on ${newDay}`,
          });
        }
      }
    }

    // Update fields
    if (day) session.day = day as Day;
    if (slot) session.slot = slot;
    if (room !== undefined) session.room = room;
    if (instructor !== undefined) session.instructor = instructor;

    await sessionRepo.save(session);

    return res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Delete a session
 */
export const deleteSession = async (req: Request, res: Response) => {
  try {
    console.log(`[deleteSession] Request received:`, {
      params: req.params,
      query: req.query,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl,
      method: req.method,
    });
    
    const { id } = req.params;
    console.log(`[deleteSession] Extracted id:`, { id, type: typeof id, params: req.params });

    // Validate id exists
    if (!id || (typeof id === "string" && id.trim() === "")) {
      console.error(`[deleteSession] id parameter is missing or empty:`, {
        id,
        params: req.params,
        url: req.url,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid session ID: id parameter is missing or empty",
      });
    }

    // Parse and validate id
    const parsedId = typeof id === "string" ? parseInt(id.trim(), 10) : parseInt(String(id), 10);
    console.log(`[deleteSession] Parsed id:`, { id, parsedId, isNaN: isNaN(parsedId) });
    
    if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(parsedId)) {
      console.error(`[deleteSession] Invalid parsedId:`, {
        id,
        parsedId,
        isNaN: isNaN(parsedId),
        isPositive: parsedId > 0,
        isInteger: Number.isInteger(parsedId),
      });
      return res.status(400).json({
        success: false,
        message: `Invalid session ID: "${id}" cannot be parsed as a positive integer`,
      });
    }

    console.log(`[deleteSession] Querying database for session with id:`, parsedId);
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({
      where: { id: parsedId },
    });

    if (!session) {
      console.error(`[deleteSession] Session not found:`, { parsedId });
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    console.log(`[deleteSession] Session found, deleting:`, { id: session.id, component_id: session.component_id, day: session.day, slot: session.slot });
    await sessionRepo.remove(session);
    console.log(`[deleteSession] Successfully deleted session:`, { id: parsedId });

    return res.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error: any) {
    console.error(`[deleteSession] Exception caught:`, {
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

