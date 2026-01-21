"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { timetableViewAPI } from "@/lib/api/timetable";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

interface Term {
  id: number;
  term_number: string;
  is_published: boolean;
}

export default function TimetableViewPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublishedTerms();
  }, []);

  const loadPublishedTerms = async () => {
    try {
      setLoading(true);
      const response = await timetableViewAPI.getPublishedTerms();
      setTerms(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load published terms");
    } finally {
      setLoading(false);
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
          <p className="text-white text-xl">Loading timetables...</p>
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
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block mb-4"
          >
            <Calendar className="w-16 h-16 text-cyan-400" />
          </motion.div>
          <h1 className="text-5xl font-bold mb-2">
            University <span className="text-gradient">Timetable</span>
          </h1>
          <p className="text-gray-400 text-lg">View published academic schedules</p>
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

        {/* Terms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terms.map((term, index) => (
            <motion.div
              key={term.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href={`/timetable/terms/${term.id}`}
                className="block p-6 glass border border-white/10 rounded-xl hover:border-cyan-500/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                      <Clock className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white group-hover:text-gradient transition-colors">
                      {term.term_number}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full text-sm font-semibold">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Published
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {terms.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No published timetables available at this time.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
