"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { studentTimetableAPI } from "@/lib/api/timetable";
import { Calendar, CheckCircle2 } from "lucide-react";

interface Term {
  id?: number; // ID removed for security, use token instead
  token: string; // Secure token instead of ID
  term_number: string;
  is_published: boolean;
}

export default function StudentTimetablePage() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublishedTerms();
  }, []);

  const loadPublishedTerms = async () => {
    try {
      setLoading(true);
      const response = await studentTimetableAPI.getPublishedTerms();
      const publishedTerms = (response.data || []).filter((t: Term) => {
        const termNum = parseInt(t.term_number);
        return termNum >= 3 && termNum <= 10;
      });
      setTerms(publishedTerms);
    } catch (err: any) {
      setError(err.message || "Failed to load terms");
    } finally {
      setLoading(false);
    }
  };

  const handleTermSelect = (termToken: string) => {
    router.push(`/student/timetable/${termToken}`);
  };

  return (
    <div className="min-h-screen p-6 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-6">
            <div className="p-5 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-2xl shadow-lg shadow-cyan-500/20">
              <Calendar className="w-10 h-10 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold mb-3">
                Student <span className="text-gradient">Timetable</span>
              </h1>
              <p className="text-gray-400 text-lg">Generate your personalized schedule</p>
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

        {/* Term Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-2xl p-10 sm:p-12 shadow-xl"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-xl shadow-lg shadow-cyan-500/20">
              <Calendar className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Select Term</h2>
              <p className="text-gray-400">Choose the academic term to generate your schedule</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading terms...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {terms.map((term, idx) => (
                <motion.button
                  key={term.token || idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleTermSelect(term.token)}
                  className="p-8 glass border rounded-2xl transition-all border-white/10 hover:border-cyan-500/50 hover:bg-white/5 hover:scale-105"
                >
                  <div className="text-white font-bold text-2xl mb-3">
                    {term.term_number}
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {terms.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <p className="text-xl font-semibold mb-2">No published terms available</p>
              <p className="text-sm">Terms 3-10 will appear here when published</p>
            </div>
          )}
        </motion.div>

        {/* Other Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 glass border border-white/10 rounded-2xl p-10 sm:p-12 shadow-xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-purple-500/30 to-pink-600/30 rounded-xl shadow-lg shadow-purple-500/20">
              <Calendar className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Other</h2>
              <p className="text-gray-400">For students who don't belong to a fixed academic term or have special cases</p>
            </div>
          </div>
          <p className="text-gray-300 mb-6">
            Select courses manually from all available terms. Maximum 2 elective courses allowed.
          </p>
          <button
            onClick={() => router.push("/student/timetable/other")}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            <Calendar className="w-6 h-6" />
            Open Other Section
          </button>
        </motion.div>
      </div>
    </div>
  );
}
