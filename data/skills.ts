import { 
  SiPython, SiTypescript, SiJavascript, SiCplusplus,
  SiMysql, SiGnubash, SiPhp, SiHtml5, SiCss3, SiReact, SiNextdotjs, 
  SiTailwindcss, SiFigma, SiNodedotjs, SiExpress, SiPostgresql, 
  SiRedis, SiArduino, SiTensorflow, SiPytorch, SiOpencv,
  SiFramer, SiDocker, SiGit, SiMongodb, SiFirebase
} from 'react-icons/si';
import { 
  FaBrain, FaRobot, FaNetworkWired, FaMicrochip, FaDatabase, 
  FaChartLine, FaUsers, FaLightbulb, FaHandshake, FaComments,
  FaClock, FaTasks, FaCode, FaPalette, FaServer, FaCog,
  FaJava, FaHashtag
} from 'react-icons/fa';
import { IconType } from 'react-icons';

export const categories = [
  { id: "programming", name: "Programming", icon: FaCode, color: "from-cyan-500 to-blue-600" },
  { id: "frontend", name: "Frontend", icon: FaPalette, color: "from-blue-500 to-purple-600" },
  { id: "backend", name: "Backend", icon: FaServer, color: "from-purple-500 to-pink-600" },
  { id: "databases", name: "Databases", icon: FaDatabase, color: "from-pink-500 to-red-600" },
  { id: "embedded", name: "Embedded & IoT", icon: FaMicrochip, color: "from-red-500 to-orange-600" },
  { id: "aiml", name: "AI/ML", icon: FaBrain, color: "from-orange-500 to-yellow-600" },
  { id: "soft", name: "Soft Skills", icon: FaUsers, color: "from-green-500 to-cyan-600" },
];

interface Skill {
  name: string;
  level: number;
  category: string;
  Icon: IconType;
  description: string;
  tags: string[];
  experience: string;
  color: string;
}

export const skillsData: Skill[] = [
  // Programming
  { name: "Python", level: 95, category: "programming", Icon: SiPython, description: "Advanced scripting and development", tags: ["Data Science", "Backend", "Automation"], experience: "5+ years", color: "from-blue-400 to-yellow-400" },
  { name: "TypeScript", level: 92, category: "programming", Icon: SiTypescript, description: "Type-safe JavaScript development", tags: ["Frontend", "Backend", "Full-Stack"], experience: "3+ years", color: "from-blue-500 to-blue-700" },
  { name: "JavaScript", level: 95, category: "programming", Icon: SiJavascript, description: "Modern web development", tags: ["ES6+", "Async", "DOM"], experience: "5+ years", color: "from-yellow-400 to-yellow-600" },
  { name: "C/C++", level: 90, category: "programming", Icon: SiCplusplus, description: "System programming and performance", tags: ["Low-Level", "Embedded", "DSA"], experience: "4+ years", color: "from-blue-600 to-purple-600" },
  { name: "Java", level: 88, category: "programming", Icon: FaJava, description: "Object-oriented enterprise development", tags: ["OOP", "Spring", "Desktop"], experience: "3+ years", color: "from-red-500 to-orange-500" },
  { name: "C#", level: 85, category: "programming", Icon: FaHashtag, description: ".NET development and desktop apps", tags: [".NET", "WinForms", "Desktop"], experience: "2+ years", color: "from-purple-500 to-purple-700" },
  { name: "SQL", level: 90, category: "programming", Icon: SiMysql, description: "Database queries and management", tags: ["Queries", "Optimization", "Joins"], experience: "4+ years", color: "from-blue-500 to-cyan-500" },
  { name: "Bash", level: 80, category: "programming", Icon: SiGnubash, description: "Shell scripting and automation", tags: ["Linux", "Automation", "DevOps"], experience: "3+ years", color: "from-gray-600 to-green-600" },
  { name: "PHP", level: 75, category: "programming", Icon: SiPhp, description: "Server-side web development", tags: ["Backend", "Web", "Laravel"], experience: "2+ years", color: "from-purple-400 to-blue-600" },
  { name: "HTML", level: 95, category: "programming", Icon: SiHtml5, description: "Web markup language", tags: ["Semantic", "Responsive", "Modern"], experience: "5+ years", color: "from-orange-500 to-red-600" },
  { name: "CSS", level: 95, category: "programming", Icon: SiCss3, description: "Web styling language", tags: ["Flexbox", "Grid", "Animations"], experience: "5+ years", color: "from-blue-400 to-blue-600" },

  // Frontend
  { name: "React", level: 95, category: "frontend", Icon: SiReact, description: "Component-based UI development", tags: ["Hooks", "Context", "Performance"], experience: "4+ years", color: "from-cyan-400 to-blue-500" },
  { name: "Next.js", level: 92, category: "frontend", Icon: SiNextdotjs, description: "React framework for production", tags: ["SSR", "SSG", "App Router"], experience: "3+ years", color: "from-gray-800 to-gray-950" },
  { name: "Tailwind CSS", level: 95, category: "frontend", Icon: SiTailwindcss, description: "Utility-first CSS framework", tags: ["Responsive", "Custom", "JIT"], experience: "3+ years", color: "from-cyan-400 to-blue-600" },
  { name: "Figma", level: 88, category: "frontend", Icon: SiFigma, description: "UI/UX design and prototyping", tags: ["Design", "Prototyping", "User-Centric"], experience: "4+ years", color: "from-purple-500 to-pink-500" },
  { name: "Framer Motion", level: 90, category: "frontend", Icon: SiFramer, description: "Animation library for React", tags: ["Animations", "Gestures", "Transitions"], experience: "2+ years", color: "from-pink-500 to-purple-600" },

  // Backend
  { name: "Node.js", level: 92, category: "backend", Icon: SiNodedotjs, description: "JavaScript runtime for server", tags: ["Express", "APIs", "Real-time"], experience: "4+ years", color: "from-green-500 to-green-700" },
  { name: "Express.js", level: 90, category: "backend", Icon: SiExpress, description: "Web framework for Node.js", tags: ["REST", "Middleware", "Routing"], experience: "4+ years", color: "from-gray-700 to-gray-900" },
  { name: "REST APIs", level: 93, category: "backend", Icon: FaNetworkWired, description: "RESTful API design and development", tags: ["REST", "JSON", "HTTP"], experience: "4+ years", color: "from-blue-500 to-purple-600" },
  { name: "Docker", level: 82, category: "backend", Icon: SiDocker, description: "Containerization platform", tags: ["Containers", "DevOps", "Deployment"], experience: "2+ years", color: "from-blue-400 to-blue-600" },
  { name: "Git", level: 90, category: "backend", Icon: SiGit, description: "Version control system", tags: ["VCS", "Collaboration", "Branching"], experience: "5+ years", color: "from-orange-500 to-red-600" },

  // Databases
  { name: "PostgreSQL", level: 90, category: "databases", Icon: SiPostgresql, description: "Advanced relational database", tags: ["ACID", "Transactions", "Indexes"], experience: "3+ years", color: "from-blue-500 to-blue-700" },
  { name: "MySQL", level: 88, category: "databases", Icon: SiMysql, description: "Popular relational database", tags: ["InnoDB", "Replication", "Optimization"], experience: "4+ years", color: "from-blue-600 to-cyan-600" },
  { name: "Redis", level: 82, category: "databases", Icon: SiRedis, description: "In-memory data structure store", tags: ["Caching", "Pub/Sub", "Performance"], experience: "2+ years", color: "from-red-500 to-red-700" },
  { name: "MongoDB", level: 80, category: "databases", Icon: SiMongodb, description: "NoSQL document database", tags: ["NoSQL", "JSON", "Scalable"], experience: "2+ years", color: "from-green-500 to-green-700" },
  { name: "Firebase", level: 78, category: "databases", Icon: SiFirebase, description: "Backend-as-a-Service platform", tags: ["Real-time", "Auth", "Cloud"], experience: "2+ years", color: "from-yellow-500 to-orange-600" },

  // Embedded & IoT
  { name: "Arduino", level: 85, category: "embedded", Icon: SiArduino, description: "Microcontroller programming", tags: ["C/C++", "Sensors", "Actuators"], experience: "3+ years", color: "from-teal-400 to-cyan-600" },
  { name: "VHDL", level: 80, category: "embedded", Icon: FaMicrochip, description: "Hardware description language", tags: ["MIPS", "FPGA", "Digital Design"], experience: "2+ years", color: "from-purple-500 to-pink-600" },
  { name: "Embedded Systems", level: 82, category: "embedded", Icon: FaCog, description: "Embedded software development", tags: ["Real-time", "Firmware", "Hardware"], experience: "3+ years", color: "from-gray-600 to-blue-600" },
  { name: "IoT", level: 85, category: "embedded", Icon: FaNetworkWired, description: "Internet of Things development", tags: ["Sensors", "Cloud", "Protocols"], experience: "2+ years", color: "from-blue-500 to-purple-600" },

  // AI/ML
  { name: "Machine Learning", level: 88, category: "aiml", Icon: FaBrain, description: "ML algorithms and models", tags: ["Classification", "Regression", "Training"], experience: "2+ years", color: "from-purple-500 to-pink-600" },
  { name: "Deep Learning", level: 82, category: "aiml", Icon: FaRobot, description: "Neural networks and deep models", tags: ["CNN", "RNN", "Neural Nets"], experience: "2+ years", color: "from-pink-500 to-red-600" },
  { name: "TensorFlow", level: 80, category: "aiml", Icon: SiTensorflow, description: "Machine learning framework", tags: ["Models", "Training", "Deployment"], experience: "2+ years", color: "from-orange-500 to-yellow-600" },
  { name: "PyTorch", level: 80, category: "aiml", Icon: SiPytorch, description: "Deep learning framework", tags: ["Research", "Models", "GPU"], experience: "1+ years", color: "from-red-500 to-orange-600" },
  { name: "Computer Vision", level: 78, category: "aiml", Icon: SiOpencv, description: "Image and video analysis", tags: ["CNN", "Detection", "Classification"], experience: "1+ years", color: "from-blue-500 to-green-600" },
  { name: "Data Analysis", level: 85, category: "aiml", Icon: FaChartLine, description: "Data processing and insights", tags: ["Pandas", "NumPy", "Visualization"], experience: "3+ years", color: "from-green-500 to-teal-600" },

  // Soft Skills
  { name: "Leadership", level: 90, category: "soft", Icon: FaUsers, description: "Leading teams and projects", tags: ["Team Lead", "Mentoring", "Vision"], experience: "3+ years", color: "from-blue-500 to-purple-600" },
  { name: "Teamwork", level: 95, category: "soft", Icon: FaHandshake, description: "Collaborative development", tags: ["Collaboration", "Communication", "Agile"], experience: "5+ years", color: "from-green-500 to-teal-600" },
  { name: "Problem Solving", level: 93, category: "soft", Icon: FaLightbulb, description: "Analytical thinking and solutions", tags: ["Analysis", "Debugging", "Optimization"], experience: "5+ years", color: "from-yellow-500 to-orange-600" },
  { name: "Communication", level: 88, category: "soft", Icon: FaComments, description: "Clear and effective communication", tags: ["Technical Writing", "Presentations", "Documentation"], experience: "4+ years", color: "from-cyan-500 to-blue-600" },
  { name: "Time Management", level: 90, category: "soft", Icon: FaClock, description: "Efficient task prioritization", tags: ["Planning", "Priorities", "Deadlines"], experience: "4+ years", color: "from-purple-500 to-pink-600" },
  { name: "Project Management", level: 85, category: "soft", Icon: FaTasks, description: "Planning and execution", tags: ["Agile", "Scrum", "Delivery"], experience: "2+ years", color: "from-pink-500 to-red-600" },
];
