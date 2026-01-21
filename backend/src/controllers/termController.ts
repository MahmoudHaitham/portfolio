import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Term } from "../entities/Term";
import { validateTerm } from "../services/validationService";

/**
 * Create a new term
 */
export const createTerm = async (req: Request, res: Response) => {
  try {
    const { term_number } = req.body;

    if (!term_number) {
      return res.status(400).json({
        success: false,
        message: "Term number is required",
      });
    }

    const termRepo = AppDataSource.getRepository(Term);

    // Check if term already exists
    const existingTerm = await termRepo.findOne({
      where: { term_number },
    });

    if (existingTerm) {
      return res.status(400).json({
        success: false,
        message: "Term with this number already exists",
      });
    }

    const term = termRepo.create({
      term_number,
      is_published: false,
    });

    await termRepo.save(term);

    return res.status(201).json({
      success: true,
      data: term,
    });
  } catch (error) {
    console.error("Error creating term:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get all terms
 */
export const getAllTerms = async (req: Request, res: Response) => {
  try {
    const termRepo = AppDataSource.getRepository(Term);
    const terms = await termRepo.find({
      relations: ["classes", "electives"],
      order: { createdAt: "DESC" },
    });

    return res.json({
      success: true,
      data: terms,
    });
  } catch (error) {
    console.error("Error fetching terms:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get term by ID
 */
export const getTermById = async (req: Request, res: Response) => {
  try {
    console.log(`[getTermById] Request received:`, {
      params: req.params,
      query: req.query,
      url: req.url,
      path: req.path,
      method: req.method,
    });
    
    // Extract id from params - check both :id and :termId (in case of route confusion)
    const id = req.params.id || req.params.termId;
    
    console.log(`[getTermById] Extracted id:`, { id, type: typeof id, params: req.params });
    
    // Validate id exists
    if (id === undefined || id === null || (typeof id === "string" && id.trim() === "")) {
      console.error(`[getTermById] id parameter is missing or empty:`, {
        id,
        params: req.params,
        url: req.url,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid term ID: id parameter is missing or empty",
      });
    }
    
    // Parse and validate id
    const idString = typeof id === "string" ? id.trim() : String(id);
    const parsedId = parseInt(idString, 10);
    
    console.log(`[getTermById] Parsed id:`, { id, idString, parsedId, isNaN: isNaN(parsedId) });
    
    if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(parsedId)) {
      console.error(`[getTermById] Invalid parsedId:`, {
        id,
        idString,
        parsedId,
        isNaN: isNaN(parsedId),
        isPositive: parsedId > 0,
        isInteger: Number.isInteger(parsedId),
      });
      return res.status(400).json({
        success: false,
        message: `Invalid term ID: "${id}" cannot be parsed as a positive integer`,
      });
    }

    console.log(`[getTermById] Querying database for term with id:`, parsedId);
    console.log(`[getTermById] AppDataSource initialized:`, AppDataSource.isInitialized);
    
    try {
      const termRepo = AppDataSource.getRepository(Term);
      console.log(`[getTermById] Repository obtained, executing query...`);

      const term = await termRepo.findOne({
        where: { id: parsedId },
        relations: ["classes", "electives", "electives.course"],
      });

      console.log(`[getTermById] Query completed, result:`, term ? { id: term.id, term_number: term.term_number } : null);

      if (!term) {
        console.error(`[getTermById] Term not found in database:`, { parsedId });
        return res.status(404).json({
          success: false,
          message: "Term not found",
        });
      }

      console.log(`[getTermById] Successfully found term:`, { 
        id: term.id, 
        term_number: term.term_number,
        classesCount: term.classes?.length || 0,
        electivesCount: term.electives?.length || 0,
      });
      
      console.log(`[getTermById] Sending response...`);
      return res.json({
        success: true,
        data: term,
      });
    } catch (dbError: any) {
      console.error(`[getTermById] Database query error:`, {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name,
        parsedId,
      });
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Error fetching term:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Update term
 */
export const updateTerm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { term_number, is_published } = req.body;

    // Validate id - handle string | string[] type
    const idStr = Array.isArray(id) ? id[0] : (id as string);
    const parsedId = parseInt(idStr, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid term ID",
      });
    }

    const termRepo = AppDataSource.getRepository(Term);
    const term = await termRepo.findOne({
      where: { id: parsedId },
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }

    if (term_number) {
      // Check if new term_number already exists
      const existingTerm = await termRepo.findOne({
        where: { term_number },
      });

      if (existingTerm && existingTerm.id !== term.id) {
        return res.status(400).json({
          success: false,
          message: "Term with this number already exists",
        });
      }

      term.term_number = term_number;
    }

    if (typeof is_published === "boolean") {
      term.is_published = is_published;
    }

    await termRepo.save(term);

    return res.json({
      success: true,
      data: term,
    });
  } catch (error) {
    console.error("Error updating term:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Publish term (only if validation passes)
 */
export const publishTerm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate id - handle string | string[] type
    const idStr = Array.isArray(id) ? id[0] : (id as string);
    const parsedId = parseInt(idStr, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid term ID",
      });
    }

    const termRepo = AppDataSource.getRepository(Term);
    const term = await termRepo.findOne({
      where: { id: parsedId },
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }

    // Validate before publishing
    const validation = await validateTerm(term.id);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Term validation failed",
        errors: validation.errors,
      });
    }

    term.is_published = true;
    await termRepo.save(term);

    return res.json({
      success: true,
      data: term,
      message: "Term published successfully",
    });
  } catch (error) {
    console.error("Error publishing term:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Validate term
 */
export const validateTermEndpoint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate id - handle string | string[] type
    const idStr: string = Array.isArray(id) ? id[0] : id;
    const parsedId = parseInt(idStr, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid term ID",
      });
    }

    const termRepo = AppDataSource.getRepository(Term);
    const term = await termRepo.findOne({
      where: { id: parsedId },
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }

    const validation = await validateTerm(term.id);

    return res.json({
      success: true,
      isValid: validation.isValid,
      errors: validation.errors,
    });
  } catch (error) {
    console.error("Error validating term:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Delete term
 */
export const deleteTerm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate id - handle string | string[] type
    const idStr: string = Array.isArray(id) ? id[0] : id;
    const parsedId = parseInt(idStr, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid term ID",
      });
    }

    const termRepo = AppDataSource.getRepository(Term);
    const term = await termRepo.findOne({
      where: { id: parsedId },
      relations: ["classes"],
    });

    if (!term) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }

    // Check if term has classes (prevent deletion if it has associated data)
    if (term.classes && term.classes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete term: It has ${term.classes.length} class(es) associated. Please delete all classes first.`,
      });
    }

    // Delete the term
    await termRepo.remove(term);

    // Invalidate cache
    const { invalidateTermSchedulesCache, invalidatePublishedTermsCache } = require("../utils/cacheInvalidation");
    await invalidateTermSchedulesCache(parsedId);
    invalidatePublishedTermsCache();

    return res.json({
      success: true,
      message: "Term deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting term:", error);
    
    // Handle foreign key constraint errors
    if (error.code === "23503" || error.message?.includes("foreign key")) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete term: It has associated data (classes, courses, or schedules). Please remove all associated data first.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

