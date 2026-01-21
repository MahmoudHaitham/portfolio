"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  classesAPI,
  classCoursesAPI,
  coursesAPI,
  componentsAPI,
  sessionsAPI,
} from "@/lib/api/timetable";
import { ArrowLeft, Plus, BookOpen, Calendar, MapPin, User, Clock, XCircle, Trash2 } from "lucide-react";

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
  component_types?: string; // e.g., "L,S" or "L,S,LB"
}

interface ClassCourse {
  id: number;
  class_id: number;
  course_id: number;
  course: Course;
  components: Component[];
}

interface Component {
  id: number;
  class_course_id: number;
  component_type: "L" | "S" | "LB";
  sessions: Session[];
}

interface Session {
  id: number;
  component_id: number;
  day: string;
  slot: number;
  room: string | null;
  instructor: string | null;
}

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const SLOTS = [1, 2, 3, 4]; // Only 4 slots instead of 8

export default function ClassEditorPage() {
  const params = useParams();
  const router = useRouter();
  const classId = parseInt(params.id as string);

  const [classItem, setClassItem] = useState<Class | null>(null);
  const [classCourses, setClassCourses] = useState<ClassCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "timetable">("courses");
  const [selectedCell, setSelectedCell] = useState<{ day: string; slot: number } | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [selectedCourseForSlot, setSelectedCourseForSlot] = useState<number | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<"L" | "S" | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    if (classId) {
      loadClassData();
      loadAllCourses();
    }
  }, [classId, router]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      // Get class courses with all details
      const coursesRes = await classCoursesAPI.getByClass(classId);
      
      // Extract class info from first course if available
      if (coursesRes.data && coursesRes.data.length > 0) {
        const firstCourse = coursesRes.data[0] as any;
        if (firstCourse.class) {
          setClassItem({
            id: firstCourse.class.id,
            class_code: firstCourse.class.class_code,
            term_id: firstCourse.class.term_id,
          });
        }
      }
      
      // Load components and sessions for each class course
      const coursesWithDetails = await Promise.all(
        ((coursesRes.data || []) as ClassCourse[]).map(async (cc: ClassCourse) => {
          try {
              const componentsRes = await componentsAPI.getByClassCourse(cc.id);
              const components = await Promise.all(
                ((componentsRes.data || []) as Component[]).map(async (comp: Component) => {
                try {
                  const sessionsRes = await sessionsAPI.getByComponent(comp.id);
                  return { ...comp, sessions: sessionsRes.data || [] };
                } catch {
                  return { ...comp, sessions: [] };
                }
              })
            );
            return { ...cc, components };
          } catch {
            return { ...cc, components: [] };
          }
        })
      );
      
      setClassCourses(coursesWithDetails);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  const loadAllCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      setAllCourses(response.data || []);
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  };

  const handleAssignCourses = async (courseIds: number[]) => {
    try {
      // Check for already assigned courses
      const coursesRes = await classCoursesAPI.getByClass(classId);
      const existingClassCourses = coursesRes.data || [];
      const existingCourseIds = existingClassCourses.map((cc: ClassCourse) => cc.course_id);
      
      const alreadyAssigned: number[] = [];
      const toAssign: number[] = [];
      
      for (const courseId of courseIds) {
        if (existingCourseIds.includes(courseId)) {
          alreadyAssigned.push(courseId);
        } else {
          toAssign.push(courseId);
        }
      }
      
      // Show notification for already assigned courses
      if (alreadyAssigned.length > 0) {
        const alreadyAssignedCourses = allCourses.filter(c => alreadyAssigned.includes(c.id));
        const courseNames = alreadyAssignedCourses.map(c => c.code).join(", ");
        alert(`The following courses are already assigned to this class: ${courseNames}`);
      }
      
      // Only assign courses that aren't already assigned
      if (toAssign.length > 0) {
        await classCoursesAPI.assign(classId, toAssign);
        // Reload data to show updated courses
        loadClassData();
      }
    } catch (err: any) {
      console.error(`[handleAssignCourses] Error:`, err);
      setError(err.message || "Failed to assign courses");
    }
  };

  const handleCreateComponents = async (classCourseId: number, componentTypes: ("L" | "S" | "LB")[]) => {
    try {
      await componentsAPI.create(
        classCourseId,
        componentTypes.map((type) => ({ component_type: type }))
      );
      loadClassData();
    } catch (err: any) {
      setError(err.message || "Failed to create components");
    }
  };

  const handleCellClick = (day: string, slot: number) => {
    // Check if slot is already occupied
    const hasExistingSession = classCourses.some((cc) =>
      cc.components.some((comp) =>
        comp.sessions.some((s) => s.day === day && s.slot === slot)
      )
    );

    if (!hasExistingSession) {
      setSelectedCell({ day, slot });
      setSelectedCourseForSlot(null);
      setSelectedComponentType(null);
      setShowSessionModal(true);
    }
  };

  const handleCreateSession = async (data: {
    courseId: number;
    componentType: "L" | "S" | "LB";
    day: string;
    slot: number;
    room?: string;
    instructor?: string;
  }) => {
    if (!selectedCell) return;
    
    try {
      // Find the class course for this course
      const classCourse = classCourses.find((cc) => cc.course_id === data.courseId);
      if (!classCourse) {
        setError("Course not found in this class");
        return;
      }

      // Check if this course already has a session of this component type scheduled
      const existingComponent = classCourse.components.find(
        (comp) => comp.component_type === data.componentType
      );
      
      if (existingComponent) {
        // Check if this component already has a session (prevent duplicate L, S, or LB - each can only have one session per class)
        const hasSession = existingComponent.sessions.length > 0;
        if (hasSession) {
          const componentName = data.componentType === "L" ? "Lecture" : data.componentType === "S" ? "Section" : "Lab";
          setError(`This course already has a ${componentName} session scheduled. Each course can only have one ${componentName} per class.`);
          return;
        }

        // Check if this component already has a session at this day/slot
        const hasSessionAtSlot = existingComponent.sessions.some(
          (s) => s.day === data.day && s.slot === data.slot
        );
        if (hasSessionAtSlot) {
          setError("A session already exists at this time slot");
          return;
        }

        // Create session with existing component
        await sessionsAPI.create(existingComponent.id, {
          day: data.day,
          slot: data.slot,
          room: data.room,
          instructor: data.instructor,
        });
      } else {
        // Component doesn't exist, create it first
        const componentTypes = [data.componentType];
        await componentsAPI.create(classCourse.id, [
          { component_type: data.componentType }
        ]);

        // Reload to get the created component
        await new Promise(resolve => setTimeout(resolve, 300));
        const componentsRes = await componentsAPI.getByClassCourse(classCourse.id);
        const components = componentsRes.data || [];
        const newComponent = components.find((c: Component) => c.component_type === data.componentType);

        if (!newComponent) {
          setError("Failed to create component");
          return;
        }

        // Create session with new component
        await sessionsAPI.create(newComponent.id, {
          day: data.day,
          slot: data.slot,
          room: data.room,
          instructor: data.instructor,
        });
      }

      setShowSessionModal(false);
      setSelectedCell(null);
      setSelectedCourseForSlot(null);
      setSelectedComponentType(null);
      loadClassData();
    } catch (err: any) {
      console.error(`[handleCreateSession] Error:`, err);
      setError(err.message || "Failed to create session");
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return;
    }
    
    try {
      await sessionsAPI.delete(sessionId);
      loadClassData();
    } catch (err: any) {
      console.error(`[handleDeleteSession] Error:`, err);
      setError(err.message || "Failed to delete session");
    }
  };

  const handleDeleteCourse = async (classCourseId: number, courseCode: string) => {
    if (!confirm(`Are you sure you want to remove "${courseCode}" from this class? This will also delete all components and sessions for this course.`)) {
      return;
    }
    
    try {
      await classCoursesAPI.delete(classCourseId);
      loadClassData();
    } catch (err: any) {
      console.error(`[handleDeleteCourse] Error:`, err);
      setError(err.message || "Failed to delete course assignment");
    }
  };

  const getCellContent = (day: string, slot: number) => {
    const sessions: Array<{ session: Session; component: Component; course: Course }> = [];
    
    classCourses.forEach((cc) => {
      cc.components.forEach((comp) => {
        comp.sessions.forEach((session) => {
          if (session.day === day && session.slot === slot) {
            sessions.push({
              session,
              component: comp,
              course: cc.course,
            });
          }
        });
      });
    });

    return sessions;
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
            onClick={() => router.back()}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-cyan-500/20 rounded-xl">
              <BookOpen className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2">
                Class <span className="text-gradient">
                  {classItem?.class_code 
                    ? `#${classItem.class_code.split('_').pop() || classId}` 
                    : `#${classId}`}
                </span>
              </h1>
              <p className="text-gray-400">Manage courses and timetable</p>
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
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
              activeTab === "courses"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Courses & Components
          </button>
          <button
            onClick={() => setActiveTab("timetable")}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
              activeTab === "timetable"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Calendar className="w-5 h-5" />
            Timetable Grid
          </button>
        </div>

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <CoursesManager
            classCourses={classCourses}
            allCourses={allCourses}
            onAssignCourses={handleAssignCourses}
            onCreateComponents={handleCreateComponents}
            onDeleteCourse={handleDeleteCourse}
          />
        )}

        {/* Timetable Grid Tab */}
        {activeTab === "timetable" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-cyan-400" />
              Timetable Grid
            </h2>
            <div className="glass border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-4 text-left text-white font-semibold">Day / Slot</th>
                    {SLOTS.map((slot) => (
                      <th key={slot} className="p-4 text-center text-white font-semibold">
                        {slot}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, dayIndex) => (
                    <motion.tr
                      key={day}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: dayIndex * 0.05 }}
                      className="border-t border-white/10"
                    >
                      <td className="p-4 text-white font-semibold">{day}</td>
                      {SLOTS.map((slot) => {
                        const cellContent = getCellContent(day, slot);
                        const isEmpty = cellContent.length === 0;
                        return (
                          <td
                            key={slot}
                            onClick={() => isEmpty && handleCellClick(day, slot)}
                            className={`p-2 min-w-[150px] h-24 border border-white/10 transition-all group ${
                              isEmpty ? "hover:bg-white/5 cursor-pointer" : "cursor-default"
                            }`}
                          >
                            {cellContent.length > 0 ? (
                              <div className="space-y-1">
                                {cellContent.map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-xs p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/50 rounded-lg backdrop-blur-sm group-hover:border-cyan-400 transition-colors relative"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(item.session.id);
                                      }}
                                      className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 hover:border-red-500 rounded text-red-300 hover:text-red-100 transition-all opacity-0 group-hover:opacity-100"
                                      title="Delete session"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </button>
                                    <div className="font-semibold text-white pr-6">
                                      {item.course.code} ({item.component.component_type})
                                    </div>
                                    {item.session.room && (
                                      <div className="text-gray-300 text-xs flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {item.session.room}
                                      </div>
                                    )}
                                    {item.session.instructor && (
                                      <div className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                                        <User className="w-3 h-3" />
                                        {item.session.instructor}
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-xs text-center pt-4 group-hover:text-cyan-400 transition-colors">
                                Click to add
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Session Creation Modal */}
      {showSessionModal && selectedCell && (
        <CourseComponentSelectionModal
          day={selectedCell.day}
          slot={selectedCell.slot}
          classCourses={classCourses}
          allCourses={allCourses}
          onSave={handleCreateSession}
          onClose={() => {
            setShowSessionModal(false);
            setSelectedCell(null);
            setSelectedCourseForSlot(null);
            setSelectedComponentType(null);
          }}
        />
      )}
    </div>
  );
}

// Courses Manager Component
function CoursesManager({
  classCourses,
  allCourses,
  onAssignCourses,
  onCreateComponents,
  onDeleteCourse,
}: {
  classCourses: ClassCourse[];
  allCourses: Course[];
  onAssignCourses: (courseIds: number[]) => void;
  onCreateComponents: (classCourseId: number, types: ("L" | "S" | "LB")[]) => void;
  onDeleteCourse: (classCourseId: number, courseCode: string) => void;
}) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

  const handleAssign = () => {
    onAssignCourses(selectedCourseIds);
    setSelectedCourseIds([]);
    setShowAssignModal(false);
  };

  const handleCreateBundle = (classCourseId: number) => {
    const types: ("L" | "S" | "LB")[] = ["L"];
    const hasS = window.confirm("Does this course have a Section (S)?");
    const hasLB = window.confirm("Does this course have a Lab (LB)?");
    if (hasS) types.push("S");
    if (hasLB) types.push("LB");
    onCreateComponents(classCourseId, types);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          Courses
        </h2>
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Assign Courses
        </button>
      </div>

      <div className="space-y-4">
        {classCourses.map((cc, index) => (
          <motion.div
            key={cc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 glass border border-white/10 rounded-xl hover:border-cyan-500/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white group-hover:text-gradient transition-colors">
                  {cc.course.code}
                </h3>
                <p className="text-gray-400">{cc.course.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {cc.components.length === 0 && (
                  <button
                    onClick={() => handleCreateBundle(cc.id)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl transition-all"
                  >
                    Create Components
                  </button>
                )}
                <button
                  onClick={() => onDeleteCourse(cc.id, cc.course.code)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-red-500/50 hover:shadow-xl transition-all flex items-center gap-2"
                  title="Remove course from class"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            {cc.components.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-gray-300 font-semibold mb-2">Components:</div>
                {cc.components.map((comp, compIndex) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: compIndex * 0.05 }}
                    className="p-3 glass border border-white/10 rounded-lg hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">
                        {comp.component_type === "L"
                          ? "Lecture (L)"
                          : comp.component_type === "S"
                          ? "Section (S)"
                          : "Lab (LB)"}
                      </span>
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {comp.sessions.length} session(s)
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {classCourses.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No courses assigned. Assign courses to get started.
        </div>
      )}

      {/* Assign Courses Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              Assign Courses
            </h2>
            <div className="space-y-2 mb-6">
              {allCourses.map((course, index) => (
                <motion.label
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center p-4 glass border border-white/10 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-all group"
                >
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(course.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCourseIds([...selectedCourseIds, course.id]);
                      } else {
                        setSelectedCourseIds(selectedCourseIds.filter((id) => id !== course.id));
                      }
                    }}
                    className="mr-4 w-5 h-5 accent-cyan-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-gradient transition-colors">
                      {course.code}
                    </div>
                    <div className="text-gray-400 text-sm">{course.name}</div>
                  </div>
                </motion.label>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleAssign}
                disabled={selectedCourseIds.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:bg-gray-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl transition-all disabled:cursor-not-allowed"
              >
                Assign Selected ({selectedCourseIds.length})
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedCourseIds([]);
                }}
                className="flex-1 px-4 py-2 glass border border-white/10 rounded-lg font-semibold text-white hover:border-gray-500/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// Course and Component Selection Modal
function CourseComponentSelectionModal({
  day,
  slot,
  classCourses,
  allCourses,
  onSave,
  onClose,
}: {
  day: string;
  slot: number;
  classCourses: ClassCourse[];
  allCourses: Course[];
  onSave: (data: { courseId: number; componentType: "L" | "S" | "LB"; day: string; slot: number; room?: string; instructor?: string }) => void;
  onClose: () => void;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<"L" | "S" | "LB" | null>(null);
  const [room, setRoom] = useState("");
  const [instructor, setInstructor] = useState("");

  // Get courses that are assigned to this class
  const assignedCourses = classCourses.map(cc => cc.course);

  // Get available component types for selected course
  const getAvailableComponentTypes = (courseId: number): ("L" | "S" | "LB")[] => {
    const classCourse = classCourses.find(cc => cc.course_id === courseId);
    if (!classCourse) {
      // Check if course has LB in component_types
      const course = allCourses.find(c => c.id === courseId);
      const hasLab = course?.component_types?.includes("LB") || false;
      return hasLab ? ["L", "S", "LB"] : ["L", "S"];
    }

    const available: ("L" | "S" | "LB")[] = [];
    
    // Check if L component exists and has no sessions
    const lectureComponent = classCourse.components.find(c => c.component_type === "L");
    if (!lectureComponent || lectureComponent.sessions.length === 0) {
      available.push("L");
    }
    
    // Check if S component exists and has no sessions
    const sectionComponent = classCourse.components.find(c => c.component_type === "S");
    if (!sectionComponent || sectionComponent.sessions.length === 0) {
      available.push("S");
    }

    // Check if course has LB in component_types - LB can only be added once per class
    const course = allCourses.find(c => c.id === courseId);
    const hasLab = course?.component_types?.includes("LB") || false;
    if (hasLab) {
      // Check if LB component exists and if it already has a session
      const labComponent = classCourse.components.find(c => c.component_type === "LB");
      if (!labComponent || labComponent.sessions.length === 0) {
        // LB can only be added once, so check if it doesn't have a session yet
        available.push("LB");
      }
    }

    return available;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedComponentType) {
      return;
    }

    // Check if this component type is already scheduled for this course (L, S, and LB can only have one session each)
    const classCourse = classCourses.find(cc => cc.course_id === selectedCourseId);
    if (classCourse) {
      const component = classCourse.components.find(c => c.component_type === selectedComponentType);
      if (component && component.sessions.length > 0) {
        const componentName = selectedComponentType === "L" ? "Lecture" : selectedComponentType === "S" ? "Section" : "Lab";
        alert(`This course already has a ${componentName} session scheduled. Each course can only have one ${componentName} per class.`);
        return;
      }
    }

    onSave({
      courseId: selectedCourseId,
      componentType: selectedComponentType,
      day,
      slot,
      room: room || undefined,
      instructor: instructor || undefined,
    });
  };

  const availableTypes = selectedCourseId ? getAvailableComponentTypes(selectedCourseId) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-cyan-400" />
          Add Session
        </h2>
        <div className="mb-4 p-3 glass border border-white/10 rounded-lg">
          <div className="text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <strong>Day:</strong> {day} | <strong>Slot:</strong> {slot}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Course Selection */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Select Course (Subject)
            </label>
            <select
              value={selectedCourseId || ""}
              onChange={(e) => {
                const courseId = parseInt(e.target.value);
                setSelectedCourseId(courseId || null);
                setSelectedComponentType(null); // Reset component type when course changes
              }}
              className="w-full px-4 py-2 glass border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              required
            >
              <option value="" className="bg-gray-800">Select a course...</option>
              {assignedCourses.map((course) => (
                <option key={course.id} value={course.id} className="bg-gray-800">
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Component Type Selection */}
          {selectedCourseId && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Select Component Type
              </label>
              <div className="flex gap-3 flex-wrap">
                {availableTypes.includes("L") && (
                  <button
                    type="button"
                    onClick={() => setSelectedComponentType("L")}
                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-semibold transition-all ${
                      selectedComponentType === "L"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50"
                        : "glass border border-white/10 text-gray-300 hover:border-cyan-500/50"
                    }`}
                  >
                    Lecture (L)
                  </button>
                )}
                {availableTypes.includes("S") && (
                  <button
                    type="button"
                    onClick={() => setSelectedComponentType("S")}
                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-semibold transition-all ${
                      selectedComponentType === "S"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50"
                        : "glass border border-white/10 text-gray-300 hover:border-blue-500/50"
                    }`}
                  >
                    Section (S)
                  </button>
                )}
                {availableTypes.includes("LB") && (
                  <button
                    type="button"
                    onClick={() => setSelectedComponentType("LB")}
                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-semibold transition-all ${
                      selectedComponentType === "LB"
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                        : "glass border border-white/10 text-gray-300 hover:border-purple-500/50"
                    }`}
                  >
                    Lab (LB)
                  </button>
                )}
              </div>
              {availableTypes.length === 0 && (
                <p className="text-red-400 text-sm mt-2">
                  This course already has all its component sessions scheduled. Each component type (Lecture, Section, Lab) can only have one session per class.
                </p>
              )}
            </div>
          )}

          {/* Room (optional) */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Room (optional)
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-4 py-2 glass border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              placeholder="e.g., A101"
            />
          </div>

          {/* Instructor (optional) */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Instructor (optional)
            </label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="w-full px-4 py-2 glass border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              placeholder="Instructor name"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!selectedCourseId || !selectedComponentType}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:bg-gray-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-xl transition-all disabled:cursor-not-allowed"
            >
              Create Session
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 glass border border-white/10 rounded-lg font-semibold text-white hover:border-gray-500/50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

