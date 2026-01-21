"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  termsAPI,
  classesAPI,
  classCoursesAPI,
  electivesAPI,
  coursesAPI,
} from "@/lib/api/timetable";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, BookOpen, Users, FileCheck, Trash2 } from "lucide-react";

interface Term {
  id: number;
  term_number: string;
  is_published: boolean;
}

interface Class {
  id: number;
  class_code: string;
  term_id: number;
}

interface Course {
  id: number;
  code: string;
  name: string;
  is_elective: boolean;
}

export default function TermDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const termIdParam = params.id as string;
  const termId = termIdParam ? parseInt(termIdParam) : NaN;

  const [term, setTerm] = useState<Term | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"classes" | "electives" | "validation">("classes");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassNumber, setNewClassNumber] = useState("");
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [hasLab, setHasLab] = useState(false);
  const [isElective, setIsElective] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Validate termIdParam exists
    if (!termIdParam || termIdParam.trim() === "") {
      setError("Term ID is required");
      setLoading(false);
      return;
    }
    
    // Parse and validate termId - strict validation
    const parsedId = parseInt(termIdParam.trim(), 10);
    if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(parsedId)) {
      setError(`Invalid term ID: "${termIdParam}"`);
      setLoading(false);
      return;
    }
    
    // Load data with valid termId
    loadTermData(parsedId);
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termIdParam]); // Removed router from dependencies to prevent multiple calls

  const loadTermData = async (idToLoad: number) => {
    console.log(`[loadTermData] Called with idToLoad:`, idToLoad, `type:`, typeof idToLoad);
    
    // Validate ID before making API calls
    if (!idToLoad || isNaN(idToLoad) || idToLoad <= 0 || !Number.isInteger(idToLoad)) {
      console.error(`[loadTermData] Invalid idToLoad:`, {
        idToLoad,
        type: typeof idToLoad,
        isNaN: isNaN(idToLoad),
        isPositive: idToLoad > 0,
        isInteger: Number.isInteger(idToLoad),
        stack: new Error().stack,
      });
      setError(`Invalid term ID: ${idToLoad}`);
      setLoading(false);
      return;
    }

    console.log(`[loadTermData] ID validated successfully:`, idToLoad);

    try {
      setLoading(true);
      setError(null);
      
      // Try to load term first
      let termRes;
      try {
        console.log(`[loadTermData] Calling termsAPI.getById with:`, idToLoad);
        termRes = await termsAPI.getById(idToLoad);
        console.log(`[loadTermData] Successfully loaded term:`, termRes);
      } catch (termErr: any) {
        console.error(`[loadTermData] Error loading term:`, {
          message: termErr.message,
          stack: termErr.stack,
          idToLoad,
          error: termErr,
        });
        
        if (termErr.message?.includes("401") || termErr.message?.includes("Authentication") || termErr.message?.includes("Admin access required")) {
          console.error(`[loadTermData] Authentication error, redirecting to login`);
          router.push("/login");
          return;
        }
        // Term not found or other error
        console.error(`[loadTermData] Setting error state:`, termErr.message);
        setError(termErr.message || "Term not found");
        setTerm(null);
        setLoading(false);
        return;
      }
      
      // Try to load classes
      let classesRes;
      try {
        console.log(`[loadTermData] Calling classesAPI.getByTerm with:`, idToLoad);
        classesRes = await classesAPI.getByTerm(idToLoad);
        console.log(`[loadTermData] Successfully loaded classes:`, classesRes);
      } catch (classErr: any) {
        // If classes fail to load, still show term but log error
        console.error(`[loadTermData] Failed to load classes:`, {
          message: classErr.message,
          stack: classErr.stack,
          idToLoad,
          error: classErr,
        });
        classesRes = { data: [] };
      }
      
      // Set the data
      if (termRes && termRes.data) {
        console.log(`[loadTermData] Setting term and classes data`);
        setTerm(termRes.data);
        setClasses(classesRes.data || []);
      } else {
        console.error(`[loadTermData] Term data is invalid:`, { termRes });
        setError("Term data is invalid");
        setTerm(null);
      }
    } catch (err: any) {
      console.error(`[loadTermData] Unexpected error:`, {
        message: err.message,
        stack: err.stack,
        idToLoad,
        error: err,
      });
      
      if (err.message?.includes("401") || err.message?.includes("Authentication") || err.message?.includes("Admin access required")) {
        console.error(`[loadTermData] Authentication error in catch block, redirecting to login`);
        router.push("/login");
        return;
      }
      setError(err.message || "Failed to load term data");
      setTerm(null);
    } finally {
      console.log(`[loadTermData] Finally block - setting loading to false`);
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      setCourses(response.data || []);
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current termId from params - strict validation
    if (!termIdParam || termIdParam.trim() === "") {
      setError("Term ID is required");
      return;
    }
    const currentTermId = parseInt(termIdParam.trim(), 10);
    if (isNaN(currentTermId) || currentTermId <= 0 || !Number.isInteger(currentTermId)) {
      setError("Invalid term ID");
      return;
    }

    if (!term) {
      setError("Term not loaded");
      return;
    }

    try {
      // Auto-generate class code: TermNumber_ClassNumber (e.g., "4_1")
      const classCode = `${term.term_number}_${newClassNumber}`;
      await classesAPI.create(currentTermId, { class_code: classCode });
      setNewClassNumber("");
      setShowCreateClassModal(false);
      loadTermData(currentTermId);
    } catch (err: any) {
      setError(err.message || "Failed to create class");
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create course with components: L (always), S (always), LB (optional)
      await coursesAPI.create({
        code: newCourseCode,
        name: newCourseName,
        is_elective: isElective,
        components: ["L", "S", ...(hasLab ? ["LB"] : [])], // Always L and S, LB if checked
      });
      setNewCourseCode("");
      setNewCourseName("");
      setHasLab(false);
      setIsElective(false);
      setShowAddCourseModal(false);
      loadCourses();
    } catch (err: any) {
      setError(err.message || "Failed to add course");
    }
  };

  const handleValidate = async () => {
    // Get current termId from params - strict validation
    if (!termIdParam || termIdParam.trim() === "") {
      setError("Term ID is required");
      return;
    }
    const currentTermId = parseInt(termIdParam.trim(), 10);
    if (isNaN(currentTermId) || currentTermId <= 0 || !Number.isInteger(currentTermId)) {
      setError("Invalid term ID");
      return;
    }

    try {
      const response = await termsAPI.validate(currentTermId);
      setValidationResult(response);
      setActiveTab("validation");
    } catch (err: any) {
      setError(err.message || "Failed to validate term");
    }
  };

  const handlePublish = async () => {
    // Get current termId from params - strict validation
    if (!termIdParam || termIdParam.trim() === "") {
      setError("Term ID is required");
      return;
    }
    const currentTermId = parseInt(termIdParam.trim(), 10);
    if (isNaN(currentTermId) || currentTermId <= 0 || !Number.isInteger(currentTermId)) {
      setError("Invalid term ID");
      return;
    }

    if (!window.confirm("Are you sure you want to publish this term? This action cannot be undone.")) {
      return;
    }
    try {
      await termsAPI.publish(currentTermId);
      loadTermData(currentTermId);
    } catch (err: any) {
      setError(err.message || "Failed to publish term");
    }
  };

  const handleDeleteClass = async (classId: number) => {
    // Get current termId from params - strict validation
    if (!termIdParam || termIdParam.trim() === "") {
      setError("Term ID is required");
      return;
    }
    const currentTermId = parseInt(termIdParam.trim(), 10);
    if (isNaN(currentTermId) || currentTermId <= 0 || !Number.isInteger(currentTermId)) {
      setError("Invalid term ID");
      return;
    }

    try {
      setDeletingClassId(classId);
      setError(null);
      await classesAPI.delete(classId);
      setShowDeleteConfirm(null);
      // Reload term data to refresh classes list
      loadTermData(currentTermId);
    } catch (err: any) {
      setError(err.message || "Failed to delete class");
    } finally {
      setDeletingClassId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!term && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass backdrop-blur-xl border border-red-500/50 rounded-2xl p-8 max-w-md"
          >
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Term Not Found</h2>
            {error && (
              <p className="text-red-200 mb-4">{error}</p>
            )}
            <p className="text-gray-400 mb-6">
              The term with ID <span className="font-semibold text-white">{termIdParam}</span> does not exist or you don't have access to it.
            </p>
            <button
              onClick={() => router.push("/admin/timetable")}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl transition-all"
            >
              Back to Terms
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/admin/timetable")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Terms</span>
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold mb-2">
                <span className="text-gradient">{term.term_number}</span>
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                Status:{" "}
                <span
                  className={`font-semibold flex items-center gap-2 ${
                    term.is_published ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {term.is_published ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Published
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Draft
                    </>
                  )}
                </span>
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleValidate}
                className="px-6 py-3 glass border border-white/10 rounded-lg hover:border-blue-500/50 transition-all flex items-center gap-2 group"
              >
                <FileCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-white">Validate</span>
              </button>
              {!term.is_published && (
                <button
                  onClick={handlePublish}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold shadow-lg shadow-green-500/50 hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Publish
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200"
          >
            {error}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          {[
            { id: "classes", label: "Classes", icon: Users },
            { id: "electives", label: "Electives", icon: BookOpen },
            { id: "validation", label: "Validation", icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Classes</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddCourseModal(true)}
                  className="px-6 py-3 glass border border-white/10 rounded-lg hover:border-purple-500/50 transition-all flex items-center gap-2 group"
                >
                  <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-white">Add Course</span>
                </button>
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Create Class
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem, index) => (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <div
                    onClick={() => router.push(`/admin/timetable/classes/${classItem.id}`)}
                    className="p-6 glass border border-white/10 rounded-xl hover:border-cyan-500/50 transition-all hover:scale-105 cursor-pointer pr-12"
                  >
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-colors">
                      {classItem.class_code}
                    </h3>
                    <p className="text-gray-400 text-sm">Click to manage timetable</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteConfirm(classItem.id);
                    }}
                    disabled={deletingClassId === classItem.id}
                    className="absolute top-4 right-4 p-2 glass border border-red-500/30 rounded-lg hover:border-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10 group/delete"
                    title="Delete class"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 group-hover/delete:text-red-300 transition-colors" />
                  </button>
                </motion.div>
              ))}
            </div>

            {classes.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No classes found. Create your first class to get started.
              </div>
            )}
          </motion.div>
        )}

        {/* Electives Tab */}
        {activeTab === "electives" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Allowed Electives</h2>
            <p className="text-gray-400 mb-4">
              Select which elective courses are available for this term.
            </p>
            {(() => {
              // Parse and validate termId before rendering ElectivesManager
              if (!termIdParam) {
                return <div className="text-red-400">Term ID is required</div>;
              }
              const parsedTermId = parseInt(termIdParam.trim(), 10);
              if (isNaN(parsedTermId) || parsedTermId <= 0 || !Number.isInteger(parsedTermId)) {
                return <div className="text-red-400">Invalid term ID: {termIdParam}</div>;
              }
              return <ElectivesManager termId={parsedTermId} courses={courses} />;
            })()}
          </motion.div>
        )}

        {/* Validation Tab */}
        {activeTab === "validation" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Validation Results</h2>
            {validationResult ? (
              <div>
                {validationResult.isValid ? (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-6 bg-green-500/20 border border-green-500 rounded-lg text-green-200 flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <div>
                      <div className="font-semibold text-lg">All validations passed!</div>
                      <div className="text-sm">The term is ready to publish.</div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 flex items-center gap-3"
                    >
                      <XCircle className="w-6 h-6" />
                      <div>
                        <div className="font-semibold">
                          Validation failed with {validationResult.errors?.length || 0} error(s)
                        </div>
                      </div>
                    </motion.div>
                    <div className="space-y-2">
                      {validationResult.errors?.map((err: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 glass border border-white/10 rounded-lg"
                        >
                          <div className="font-semibold text-white flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            {err.type}
                          </div>
                          <div className="text-gray-300 mt-1">{err.message}</div>
                          {err.details && (
                            <div className="text-gray-400 text-sm mt-2 font-mono bg-black/20 p-2 rounded">
                              {JSON.stringify(err.details, null, 2)}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                Click "Validate" button to check term validity
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Add New Course</h2>
            <form onSubmit={handleAddCourse}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Course Code</label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="w-full px-4 py-2 glass border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="e.g., CS101"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Course Name</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-4 py-2 glass border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="e.g., Introduction to Computer Science"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center p-3 glass border border-white/10 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all mb-4">
                  <input
                    type="checkbox"
                    checked={isElective}
                    onChange={(e) => setIsElective(e.target.checked)}
                    className="mr-3 w-5 h-5 accent-purple-500"
                  />
                  <span className="text-white font-semibold">Is Elective</span>
                </label>
                <label className="block text-gray-300 mb-3">Components</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 glass border border-white/10 rounded-lg cursor-not-allowed opacity-60">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mr-3 w-5 h-5 accent-cyan-500"
                    />
                    <span className="text-white font-semibold">Lecture (L) - Required</span>
                  </label>
                  <label className="flex items-center p-3 glass border border-white/10 rounded-lg cursor-not-allowed opacity-60">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mr-3 w-5 h-5 accent-cyan-500"
                    />
                    <span className="text-white font-semibold">Section (S) - Required</span>
                  </label>
                  <label className="flex items-center p-3 glass border border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all">
                    <input
                      type="checkbox"
                      checked={hasLab}
                      onChange={(e) => setHasLab(e.target.checked)}
                      className="mr-3 w-5 h-5 accent-cyan-500"
                    />
                    <span className="text-white font-semibold">Lab (LB) - Optional</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl transition-all"
                >
                  Add Course
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCourseModal(false);
                    setNewCourseCode("");
                    setNewCourseName("");
                    setHasLab(false);
                    setIsElective(false);
                  }}
                  className="flex-1 px-4 py-2 glass border border-white/10 rounded-lg font-semibold text-white hover:border-gray-500/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Create New Class</h2>
            <form onSubmit={handleCreateClass}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Term</label>
                <input
                  type="text"
                  value={term?.term_number || ""}
                  disabled
                  className="w-full px-4 py-2 glass border border-white/10 rounded-lg text-gray-400 bg-white/5 cursor-not-allowed"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Class Number</label>
                <input
                  type="text"
                  value={newClassNumber}
                  onChange={(e) => setNewClassNumber(e.target.value)}
                  className="w-full px-4 py-2 glass border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="e.g., 1"
                  required
                />
                <p className="text-gray-400 text-sm mt-1">
                  Class will be created as: <span className="text-cyan-400 font-semibold">{term?.term_number}_{newClassNumber || "?"}</span>
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl transition-all"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateClassModal(false);
                    setNewClassNumber("");
                  }}
                  className="flex-1 px-4 py-2 glass border border-white/10 rounded-lg font-semibold text-white hover:border-gray-500/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Class Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Delete Class</h2>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete class{" "}
              <span className="font-semibold text-white">
                {classes.find((c) => c.id === showDeleteConfirm)?.class_code}
              </span>
              ? This action cannot be undone.
            </p>
            <p className="text-yellow-400 text-sm mb-6 font-semibold">
              ⚠️ Note: You can only delete classes that have no courses assigned. If this class has courses, please remove them first.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteClass(showDeleteConfirm)}
                disabled={deletingClassId === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold shadow-lg shadow-red-500/50 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingClassId === showDeleteConfirm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setError(null);
                }}
                disabled={deletingClassId === showDeleteConfirm}
                className="flex-1 px-4 py-2 glass border border-white/10 rounded-lg font-semibold text-white hover:border-gray-500/50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Electives Manager Component
function ElectivesManager({ termId, courses }: { termId: number; courses: Course[] }) {
  const [selectedElectives, setSelectedElectives] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Validate termId before loading
    const isValidTermId = termId && !isNaN(termId) && termId > 0 && Number.isInteger(termId);
    if (isValidTermId) {
      loadElectives();
    } else {
      setLoading(false);
    }
  }, [termId]);

  const loadElectives = async () => {
    console.log(`[loadElectives] Called with termId:`, termId, `type:`, typeof termId);
    
    // Double-check termId is valid - strict validation
    if (!termId || isNaN(termId) || termId <= 0 || !Number.isInteger(termId)) {
      console.error(`[loadElectives] Invalid termId:`, {
        termId,
        type: typeof termId,
        isNaN: isNaN(termId),
        isPositive: termId > 0,
        isInteger: Number.isInteger(termId),
        stack: new Error().stack,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`[loadElectives] Calling electivesAPI.getByTerm with:`, termId);
      const response = await electivesAPI.getByTerm(termId);
      console.log(`[loadElectives] Successfully loaded electives:`, response);
      const electiveIds = (response.data || []).map((e: any) => e.course_id);
      setSelectedElectives(electiveIds);
    } catch (err: any) {
      console.error(`[loadElectives] Failed to load electives:`, {
        message: err.message,
        stack: err.stack,
        termId,
        error: err,
      });
      // Don't show error to user if it's just an invalid ID - component will handle it
      if (!err.message?.includes("Invalid term ID")) {
        // Only log other errors
      }
    } finally {
      console.log(`[loadElectives] Finally block - setting loading to false`);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate termId - strict validation
    if (!termId || isNaN(termId) || termId <= 0 || !Number.isInteger(termId)) {
      alert("Invalid term ID. Please refresh the page and try again.");
      return;
    }

    try {
      setSaving(true);
      await electivesAPI.set(termId, selectedElectives);
      alert("Electives saved successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save electives");
    } finally {
      setSaving(false);
    }
  };

  const toggleElective = (courseId: number) => {
    setSelectedElectives((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const electiveCourses = courses.filter((c) => c.is_elective);

  if (loading) {
    return <div className="text-gray-400">Loading electives...</div>;
  }

  return (
    <div>
      <div className="space-y-2 mb-6">
        {electiveCourses.map((course, index) => (
          <motion.label
            key={course.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center p-4 glass border border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all group"
          >
            <input
              type="checkbox"
              checked={selectedElectives.includes(course.id)}
              onChange={() => toggleElective(course.id)}
              className="mr-4 w-5 h-5 accent-cyan-500"
            />
            <div>
              <div className="font-semibold text-white group-hover:text-gradient transition-colors">
                {course.code}
              </div>
              <div className="text-gray-400 text-sm">{course.name}</div>
            </div>
          </motion.label>
        ))}
      </div>
      {electiveCourses.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No elective courses found. Create courses and mark them as electives first.
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:bg-gray-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl transition-all disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Electives"}
      </button>
    </div>
  );
}
