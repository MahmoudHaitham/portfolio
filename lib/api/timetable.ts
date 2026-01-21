const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Ensure endpoint doesn't have double slashes or invalid characters
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  console.log(`[fetchAPI] Making request to: ${url}`, { method: options.method || "GET", headers });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    console.log(`[fetchAPI] Response status: ${response.status} for ${url}`);

  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get("content-type");
    try {
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        const text = await response.text();
        errorData = { message: text || "Request failed" };
      }
    } catch (parseError) {
      errorData = { message: `Request failed: ${response.status} ${response.statusText}` };
    }
    
    const errorMessage = errorData?.message || errorData?.error || `Request failed: ${response.status} ${response.statusText}`;
    console.error(`[fetchAPI] Request failed for ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
      errorData,
      endpoint,
      url,
      contentType,
    });
    throw new Error(errorMessage);
  }

    const data = await response.json();
    console.log(`[fetchAPI] Success for ${url}:`, data);
    return data;
  } catch (error: any) {
    console.error(`[fetchAPI] Exception caught for ${url}:`, {
      message: error.message,
      stack: error.stack,
      endpoint,
      url,
      options,
    });
    throw error;
  }
}

// Terms API
export const termsAPI = {
  getAll: () => fetchAPI("/terms"),
  getById: (id: number) => {
    console.log(`[termsAPI.getById] Called with id:`, id, `type:`, typeof id);
    // Ensure id is a valid number
    const numericId = typeof id === "number" ? id : parseInt(String(id), 10);
    if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
      console.error(`[termsAPI.getById] Invalid term ID:`, { id, numericId, type: typeof id });
      throw new Error(`Invalid term ID: ${id}`);
    }
    console.log(`[termsAPI.getById] Validated ID, calling fetchAPI with:`, numericId);
    return fetchAPI(`/terms/${numericId}`);
  },
  create: (data: { term_number: string }) =>
    fetchAPI("/terms", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { term_number?: string; is_published?: boolean }) =>
    fetchAPI(`/terms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  publish: (id: number) =>
    fetchAPI(`/terms/${id}/publish`, { method: "POST" }),
  validate: (id: number) =>
    fetchAPI(`/terms/${id}/validate`, { method: "POST" }),
  delete: (id: number) =>
    fetchAPI(`/terms/${id}`, { method: "DELETE" }),
};

// Classes API
export const classesAPI = {
  getByTerm: (termId: number) => fetchAPI(`/terms/${termId}/classes`),
  create: (termId: number, data: { class_code: string }) =>
    fetchAPI(`/terms/${termId}/classes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (classId: number) =>
    fetchAPI(`/classes/${classId}`, { method: "DELETE" }),
};

// Courses API
export const coursesAPI = {
  getAll: () => fetchAPI("/courses"),
  getById: (id: number) => fetchAPI(`/courses/${id}`),
  create: (data: { code: string; name: string; is_elective?: boolean; components?: string[] }) =>
    fetchAPI("/courses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { code?: string; name?: string; is_elective?: boolean }) =>
    fetchAPI(`/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// Class Courses API
export const classCoursesAPI = {
  getByClass: (classId: number) => fetchAPI(`/classes/${classId}/courses`),
  assign: (classId: number, course_ids: number[]) =>
    fetchAPI(`/classes/${classId}/courses`, {
      method: "POST",
      body: JSON.stringify({ course_ids }),
    }),
  delete: (classCourseId: number) =>
    fetchAPI(`/class-courses/${classCourseId}`, {
      method: "DELETE",
    }),
};

// Components API
export const componentsAPI = {
  getByClassCourse: (classCourseId: number) =>
    fetchAPI(`/class-courses/${classCourseId}/components`),
  create: (classCourseId: number, components: { component_type: "L" | "S" | "LB" }[]) =>
    fetchAPI(`/class-courses/${classCourseId}/components`, {
      method: "POST",
      body: JSON.stringify({ components }),
    }),
};

// Sessions API
export const sessionsAPI = {
  getByComponent: (componentId: number) => {
    console.log(`[sessionsAPI.getByComponent] Called with componentId:`, componentId, `type:`, typeof componentId);
    const numericId = typeof componentId === "number" ? componentId : parseInt(String(componentId), 10);
    if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
      console.error(`[sessionsAPI.getByComponent] Invalid component ID:`, { componentId, numericId });
      throw new Error(`Invalid component ID: ${componentId}`);
    }
    return fetchAPI(`/components/${numericId}/sessions`);
  },
  create: (
    componentId: number,
    data: {
      day: string;
      slot: number;
      room?: string;
      instructor?: string;
    }
  ) => {
    console.log(`[sessionsAPI.create] Called with componentId:`, componentId, `type:`, typeof componentId, `data:`, data);
    const numericId = typeof componentId === "number" ? componentId : parseInt(String(componentId), 10);
    if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
      console.error(`[sessionsAPI.create] Invalid component ID:`, { componentId, numericId });
      throw new Error(`Invalid component ID: ${componentId}`);
    }
    return fetchAPI(`/components/${numericId}/sessions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: (
    sessionId: number,
    data: {
      day?: string;
      slot?: number;
      room?: string;
      instructor?: string;
    }
  ) =>
    fetchAPI(`/sessions/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (sessionId: number) =>
    fetchAPI(`/sessions/${sessionId}`, { method: "DELETE" }),
};

// Electives API
export const electivesAPI = {
  getByTerm: (termId: number) => fetchAPI(`/terms/${termId}/electives`),
  set: (termId: number, course_ids: number[]) =>
    fetchAPI(`/terms/${termId}/electives`, {
      method: "POST",
      body: JSON.stringify({ course_ids }),
    }),
};

// Public/Student Timetable View API
export const timetableViewAPI = {
  getPublishedTerms: () => fetchAPI("/timetable/terms"),
  getTermTimetable: (termId: number) => fetchAPI(`/timetable/terms/${termId}`),
  getClassTimetable: (classId: number) => fetchAPI(`/timetable/classes/${classId}`),
};

// Student Timetable Generator API
// Now uses secure tokens instead of term IDs
export const studentTimetableAPI = {
  getPublishedTerms: () => fetchAPI("/timetable/terms"),
  getTermTimetable: (termToken: string) => fetchAPI(`/timetable/terms/${termToken}`),
  getCoreCourses: (termToken: string) => fetchAPI(`/timetable/terms/${termToken}/core-courses`),
  getElectiveCourses: (termToken: string) => fetchAPI(`/timetable/terms/${termToken}/elective-courses`),
  generateSchedules: (data: {
    termId: string | number; // Accepts token (string) or ID (number) for backward compatibility
    excludedDays: string[];
    electiveCourseIds?: number[];
    excludedCoreCourseIds?: number[];
  }) => fetchAPI("/timetable/generate", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  // Other section APIs
  getAllCoursesForOther: () => fetchAPI("/timetable/other/courses"),
  generateOtherSectionSchedules: (data: {
    selectedCourseIds: number[];
    excludedDays: string[];
  }) => fetchAPI("/timetable/other/generate", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

