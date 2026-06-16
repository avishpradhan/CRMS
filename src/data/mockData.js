export const students = [
  {
    id: 1,
    name: "Aarav Sharma",
    email: "aarav.sharma@university.edu",
    phone: "+91 98765 43210",
    branch: "Computer Science",
    cgpa: 8.9,
    skills: ["React", "Node.js", "Python", "MongoDB", "Docker"],
    projects: [
      { title: "E-Commerce Platform", description: "Full-stack e-commerce with payment integration", tech: "React, Node.js, Stripe" },
      { title: "Chat Application", description: "Real-time messaging with WebSocket", tech: "Socket.io, Express, React" }
    ],
    resume: "aarav_sharma_resume.pdf",
    placementStatus: "Placed",
    avatar: null,
    registeredAt: "2025-08-15"
  },
  {
    id: 2,
    name: "Priya Patel",
    email: "priya.patel@university.edu",
    phone: "+91 87654 32109",
    branch: "Information Technology",
    cgpa: 9.2,
    skills: ["Java", "Spring Boot", "Angular", "MySQL", "AWS"],
    projects: [
      { title: "Hospital Management System", description: "Complete HMS with appointment scheduling", tech: "Spring Boot, Angular, MySQL" }
    ],
    resume: "priya_patel_resume.pdf",
    placementStatus: "Placed",
    avatar: null,
    registeredAt: "2025-08-12"
  },
  {
    id: 3,
    name: "Rohan Desai",
    email: "rohan.desai@university.edu",
    phone: "+91 76543 21098",
    branch: "Electronics",
    cgpa: 7.8,
    skills: ["C++", "Embedded Systems", "MATLAB", "Python"],
    projects: [
      { title: "IoT Smart Home", description: "Home automation using Arduino and Raspberry Pi", tech: "Arduino, Python, MQTT" }
    ],
    resume: "rohan_desai_resume.pdf",
    placementStatus: "Not Placed",
    avatar: null,
    registeredAt: "2025-09-01"
  },
  {
    id: 4,
    name: "Sneha Kulkarni",
    email: "sneha.k@university.edu",
    phone: "+91 65432 10987",
    branch: "Computer Science",
    cgpa: 8.5,
    skills: ["Python", "Django", "React", "PostgreSQL", "TensorFlow"],
    projects: [
      { title: "Sentiment Analysis Tool", description: "NLP-based sentiment analysis for product reviews", tech: "Python, TensorFlow, Flask" },
      { title: "Portfolio Website", description: "Personal portfolio with CMS", tech: "React, Strapi, Tailwind" }
    ],
    resume: "sneha_kulkarni_resume.pdf",
    placementStatus: "In Process",
    avatar: null,
    registeredAt: "2025-08-20"
  },
  {
    id: 5,
    name: "Vikram Singh",
    email: "vikram.singh@university.edu",
    phone: "+91 54321 09876",
    branch: "Mechanical",
    cgpa: 7.2,
    skills: ["AutoCAD", "SolidWorks", "ANSYS", "Python"],
    projects: [
      { title: "Drone Design", description: "Designed and simulated a delivery drone", tech: "SolidWorks, ANSYS" }
    ],
    resume: "vikram_singh_resume.pdf",
    placementStatus: "Not Placed",
    avatar: null,
    registeredAt: "2025-09-05"
  },
  {
    id: 6,
    name: "Ananya Rao",
    email: "ananya.rao@university.edu",
    phone: "+91 43210 98765",
    branch: "Computer Science",
    cgpa: 9.5,
    skills: ["Go", "Kubernetes", "React", "GraphQL", "Redis"],
    projects: [
      { title: "Microservices Architecture", description: "Built a scalable microservices platform", tech: "Go, Docker, Kubernetes" },
      { title: "Real-time Dashboard", description: "Analytics dashboard with live data", tech: "React, D3.js, WebSocket" }
    ],
    resume: "ananya_rao_resume.pdf",
    placementStatus: "Placed",
    avatar: null,
    registeredAt: "2025-08-10"
  },
  {
    id: 7,
    name: "Karthik Menon",
    email: "karthik.m@university.edu",
    phone: "+91 32109 87654",
    branch: "Information Technology",
    cgpa: 8.1,
    skills: ["JavaScript", "Vue.js", "Firebase", "Node.js"],
    projects: [
      { title: "Task Manager App", description: "Collaborative task management tool", tech: "Vue.js, Firebase, Vuetify" }
    ],
    resume: "karthik_menon_resume.pdf",
    placementStatus: "In Process",
    avatar: null,
    registeredAt: "2025-08-25"
  },
  {
    id: 8,
    name: "Divya Nair",
    email: "divya.nair@university.edu",
    phone: "+91 21098 76543",
    branch: "Electronics",
    cgpa: 8.7,
    skills: ["VHDL", "Verilog", "Python", "MATLAB", "C"],
    projects: [
      { title: "FPGA Image Processor", description: "Real-time image processing on FPGA", tech: "Verilog, MATLAB" }
    ],
    resume: "divya_nair_resume.pdf",
    placementStatus: "Placed",
    avatar: null,
    registeredAt: "2025-08-18"
  },
  {
    id: 9,
    name: "Arjun Gupta",
    email: "arjun.gupta@university.edu",
    phone: "+91 10987 65432",
    branch: "Computer Science",
    cgpa: 7.6,
    skills: ["PHP", "Laravel", "MySQL", "JavaScript", "Bootstrap"],
    projects: [
      { title: "Blog Platform", description: "Multi-user blog platform with CMS", tech: "Laravel, MySQL, Bootstrap" }
    ],
    resume: "arjun_gupta_resume.pdf",
    placementStatus: "Not Placed",
    avatar: null,
    registeredAt: "2025-09-10"
  },
  {
    id: 10,
    name: "Meera Joshi",
    email: "meera.joshi@university.edu",
    phone: "+91 09876 54321",
    branch: "Information Technology",
    cgpa: 9.0,
    skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Tableau"],
    projects: [
      { title: "Stock Prediction Model", description: "ML model for stock market prediction", tech: "Python, TensorFlow, Pandas" },
      { title: "Data Visualization Dashboard", description: "Interactive data viz for business insights", tech: "Python, Tableau, Flask" }
    ],
    resume: "meera_joshi_resume.pdf",
    placementStatus: "Placed",
    avatar: null,
    registeredAt: "2025-08-08"
  }
];

export const recruiters = [
  {
    id: 1,
    companyName: "Google",
    contactPerson: "Sarah Mitchell",
    email: "sarah.m@google.com",
    phone: "+1 555-0101",
    website: "https://careers.google.com",
    industry: "Technology",
    description: "Global technology leader specializing in internet services, cloud computing, and AI.",
    logo: null,
    status: "Active",
    registeredAt: "2025-07-01",
    totalHires: 5
  },
  {
    id: 2,
    companyName: "Microsoft",
    contactPerson: "James Wilson",
    email: "james.w@microsoft.com",
    phone: "+1 555-0102",
    website: "https://careers.microsoft.com",
    industry: "Technology",
    description: "World's largest software company, known for Windows, Azure, and enterprise solutions.",
    logo: null,
    status: "Active",
    registeredAt: "2025-07-05",
    totalHires: 8
  },
  {
    id: 3,
    companyName: "Infosys",
    contactPerson: "Rahul Mehta",
    email: "rahul.m@infosys.com",
    phone: "+91 80-1234-5678",
    website: "https://www.infosys.com/careers",
    industry: "IT Services",
    description: "Leading IT services and consulting company headquartered in India.",
    logo: null,
    status: "Active",
    registeredAt: "2025-07-10",
    totalHires: 15
  },
  {
    id: 4,
    companyName: "Amazon",
    contactPerson: "Emily Chen",
    email: "emily.c@amazon.com",
    phone: "+1 555-0104",
    website: "https://www.amazon.jobs",
    industry: "E-Commerce / Cloud",
    description: "Global leader in e-commerce, cloud computing, and artificial intelligence.",
    logo: null,
    status: "Active",
    registeredAt: "2025-07-15",
    totalHires: 6
  },
  {
    id: 5,
    companyName: "TCS",
    contactPerson: "Pooja Iyer",
    email: "pooja.i@tcs.com",
    phone: "+91 22-6778-9900",
    website: "https://www.tcs.com/careers",
    industry: "IT Services",
    description: "India's largest IT services company and a global leader in consulting.",
    logo: null,
    status: "Pending",
    registeredAt: "2025-08-01",
    totalHires: 20
  },
  {
    id: 6,
    companyName: "Deloitte",
    contactPerson: "Mark Thompson",
    email: "mark.t@deloitte.com",
    phone: "+1 555-0106",
    website: "https://www2.deloitte.com/careers",
    industry: "Consulting",
    description: "One of the Big Four professional services firms offering consulting and advisory.",
    logo: null,
    status: "Active",
    registeredAt: "2025-07-20",
    totalHires: 4
  }
];

export const drives = [
  {
    id: 1,
    companyName: "Google",
    recruiterId: 1,
    role: "Software Engineer",
    package: "₹25 LPA",
    location: "Bangalore, India",
    skills: ["DSA", "System Design", "Python", "Go"],
    branches: ["Computer Science", "Information Technology"],
    minCGPA: 8.0,
    backlogAllowed: false,
    deadline: "2026-07-15",
    postedDate: "2026-06-01",
    status: "Active",
    applicants: 45,
    description: "Join Google's engineering team to work on products used by billions of people worldwide. You'll be involved in designing, developing, and maintaining scalable systems."
  },
  {
    id: 2,
    companyName: "Microsoft",
    recruiterId: 2,
    role: "Full Stack Developer",
    package: "₹22 LPA",
    location: "Hyderabad, India",
    skills: ["React", "Node.js", "Azure", "TypeScript"],
    branches: ["Computer Science", "Information Technology"],
    minCGPA: 7.5,
    backlogAllowed: false,
    deadline: "2026-07-20",
    postedDate: "2026-06-05",
    status: "Active",
    applicants: 62,
    description: "Build next-generation web applications and services that empower every person and organization on the planet."
  },
  {
    id: 3,
    companyName: "Infosys",
    recruiterId: 3,
    role: "Systems Engineer",
    package: "₹6.5 LPA",
    location: "Pune, India",
    skills: ["Java", "SQL", "Problem Solving"],
    branches: ["Computer Science", "Information Technology", "Electronics", "Mechanical"],
    minCGPA: 6.5,
    backlogAllowed: true,
    deadline: "2026-08-01",
    postedDate: "2026-06-10",
    status: "Active",
    applicants: 120,
    description: "Begin your career at one of the world's most respected IT services companies. Work on cutting-edge projects for global clients."
  },
  {
    id: 4,
    companyName: "Amazon",
    recruiterId: 4,
    role: "SDE-1",
    package: "₹28 LPA",
    location: "Bangalore, India",
    skills: ["DSA", "OOP", "Java/C++", "System Design"],
    branches: ["Computer Science"],
    minCGPA: 8.5,
    backlogAllowed: false,
    deadline: "2026-07-10",
    postedDate: "2026-05-25",
    status: "Active",
    applicants: 38,
    description: "Solve complex problems and build innovative solutions at scale. Work on services used by millions of customers daily."
  },
  {
    id: 5,
    companyName: "TCS",
    recruiterId: 5,
    role: "Assistant System Engineer",
    package: "₹4.5 LPA",
    location: "Multiple Locations",
    skills: ["Programming", "Communication", "Aptitude"],
    branches: ["Computer Science", "Information Technology", "Electronics", "Mechanical"],
    minCGPA: 6.0,
    backlogAllowed: true,
    deadline: "2026-08-15",
    postedDate: "2026-06-15",
    status: "Upcoming",
    applicants: 0,
    description: "TCS' flagship recruitment program for engineering graduates. Get trained and deployed on international projects."
  },
  {
    id: 6,
    companyName: "Deloitte",
    recruiterId: 6,
    role: "Analyst",
    package: "₹12 LPA",
    location: "Mumbai, India",
    skills: ["Data Analysis", "SQL", "Excel", "Communication"],
    branches: ["Computer Science", "Information Technology"],
    minCGPA: 7.0,
    backlogAllowed: false,
    deadline: "2026-07-25",
    postedDate: "2026-06-08",
    status: "Active",
    applicants: 55,
    description: "Join Deloitte's consulting practice and work with Fortune 500 clients on digital transformation initiatives."
  },
  {
    id: 7,
    companyName: "Google",
    recruiterId: 1,
    role: "ML Engineer",
    package: "₹35 LPA",
    location: "Bangalore, India",
    skills: ["Python", "TensorFlow", "Machine Learning", "Statistics"],
    branches: ["Computer Science"],
    minCGPA: 8.5,
    backlogAllowed: false,
    deadline: "2026-07-18",
    postedDate: "2026-06-03",
    status: "Active",
    applicants: 22,
    description: "Apply cutting-edge machine learning techniques to Google's products. Develop models that impact billions of users."
  },
  {
    id: 8,
    companyName: "Microsoft",
    recruiterId: 2,
    role: "Data Scientist",
    package: "₹24 LPA",
    location: "Noida, India",
    skills: ["Python", "R", "ML", "SQL", "Statistics"],
    branches: ["Computer Science", "Information Technology"],
    minCGPA: 8.0,
    backlogAllowed: false,
    deadline: "2026-07-22",
    postedDate: "2026-06-07",
    status: "Closed",
    applicants: 48,
    description: "Use data science to drive business decisions across Microsoft's product portfolio."
  }
];

export const applications = [
  { id: 1, studentId: 1, driveId: 1, status: "Selected", appliedDate: "2026-06-05", lastUpdated: "2026-06-28" },
  { id: 2, studentId: 1, driveId: 2, status: "Interview Scheduled", appliedDate: "2026-06-08", lastUpdated: "2026-06-20" },
  { id: 3, studentId: 1, driveId: 3, status: "Shortlisted", appliedDate: "2026-06-12", lastUpdated: "2026-06-18" },
  { id: 4, studentId: 2, driveId: 1, status: "Rejected", appliedDate: "2026-06-06", lastUpdated: "2026-06-25" },
  { id: 5, studentId: 2, driveId: 2, status: "Selected", appliedDate: "2026-06-09", lastUpdated: "2026-06-30" },
  { id: 6, studentId: 3, driveId: 3, status: "Applied", appliedDate: "2026-06-14", lastUpdated: "2026-06-14" },
  { id: 7, studentId: 4, driveId: 1, status: "Interview Scheduled", appliedDate: "2026-06-07", lastUpdated: "2026-06-22" },
  { id: 8, studentId: 4, driveId: 4, status: "Applied", appliedDate: "2026-06-10", lastUpdated: "2026-06-10" },
  { id: 9, studentId: 5, driveId: 3, status: "Applied", appliedDate: "2026-06-15", lastUpdated: "2026-06-15" },
  { id: 10, studentId: 6, driveId: 1, status: "Selected", appliedDate: "2026-06-04", lastUpdated: "2026-06-27" },
  { id: 11, studentId: 6, driveId: 4, status: "Shortlisted", appliedDate: "2026-06-11", lastUpdated: "2026-06-19" },
  { id: 12, studentId: 6, driveId: 7, status: "Interview Scheduled", appliedDate: "2026-06-06", lastUpdated: "2026-06-21" },
  { id: 13, studentId: 7, driveId: 2, status: "Applied", appliedDate: "2026-06-12", lastUpdated: "2026-06-12" },
  { id: 14, studentId: 8, driveId: 6, status: "Selected", appliedDate: "2026-06-10", lastUpdated: "2026-06-29" },
  { id: 15, studentId: 9, driveId: 3, status: "Rejected", appliedDate: "2026-06-13", lastUpdated: "2026-06-20" },
  { id: 16, studentId: 10, driveId: 7, status: "Selected", appliedDate: "2026-06-05", lastUpdated: "2026-06-26" },
  { id: 17, studentId: 10, driveId: 8, status: "Interview Scheduled", appliedDate: "2026-06-09", lastUpdated: "2026-06-23" }
];

export const interviews = [
  { id: 1, applicationId: 2, studentId: 1, driveId: 2, company: "Microsoft", role: "Full Stack Developer", date: "2026-07-05", time: "10:00 AM", mode: "Virtual", meetingLink: "https://teams.microsoft.com/meet/abc123", status: "Upcoming" },
  { id: 2, applicationId: 7, studentId: 4, driveId: 1, company: "Google", role: "Software Engineer", date: "2026-07-03", time: "2:00 PM", mode: "On-Campus", meetingLink: null, status: "Upcoming" },
  { id: 3, applicationId: 12, studentId: 6, driveId: 7, company: "Google", role: "ML Engineer", date: "2026-07-08", time: "11:30 AM", mode: "Virtual", meetingLink: "https://meet.google.com/xyz789", status: "Upcoming" },
  { id: 4, applicationId: 17, studentId: 10, driveId: 8, company: "Microsoft", role: "Data Scientist", date: "2026-07-06", time: "3:00 PM", mode: "Virtual", meetingLink: "https://teams.microsoft.com/meet/def456", status: "Upcoming" },
  { id: 5, applicationId: 1, studentId: 1, driveId: 1, company: "Google", role: "Software Engineer", date: "2026-06-20", time: "10:00 AM", mode: "On-Campus", meetingLink: null, status: "Completed" },
  { id: 6, applicationId: 5, studentId: 2, driveId: 2, company: "Microsoft", role: "Full Stack Developer", date: "2026-06-22", time: "11:00 AM", mode: "Virtual", meetingLink: "https://teams.microsoft.com/meet/ghi789", status: "Completed" }
];

export const notifications = [
  { id: 1, title: "New Drive Posted", message: "Google has posted a new drive for Software Engineer role.", type: "info", read: false, timestamp: "2026-06-10T09:00:00", forRole: "student" },
  { id: 2, title: "Application Shortlisted", message: "Your application for Infosys - Systems Engineer has been shortlisted.", type: "success", read: false, timestamp: "2026-06-10T10:30:00", forRole: "student" },
  { id: 3, title: "Interview Scheduled", message: "Your interview with Microsoft is scheduled for July 5, 2026.", type: "warning", read: true, timestamp: "2026-06-09T14:00:00", forRole: "student" },
  { id: 4, title: "New Application Received", message: "Aarav Sharma applied for Software Engineer position.", type: "info", read: false, timestamp: "2026-06-10T08:45:00", forRole: "recruiter" },
  { id: 5, title: "Drive Deadline Approaching", message: "SDE-1 drive deadline is in 3 days.", type: "warning", read: false, timestamp: "2026-06-10T07:00:00", forRole: "recruiter" },
  { id: 6, title: "New Student Registration", message: "5 new students registered today.", type: "info", read: false, timestamp: "2026-06-10T11:00:00", forRole: "admin" },
  { id: 7, title: "Recruiter Approval Pending", message: "TCS has requested registration. Approval pending.", type: "warning", read: false, timestamp: "2026-06-10T06:30:00", forRole: "admin" },
  { id: 8, title: "Placement Milestone", message: "50% placement rate achieved for CS batch 2026!", type: "success", read: true, timestamp: "2026-06-09T16:00:00", forRole: "admin" },
  { id: 9, title: "Application Rejected", message: "Your application for Google - Software Engineer was not selected.", type: "danger", read: true, timestamp: "2026-06-08T12:00:00", forRole: "student" },
  { id: 10, title: "System Maintenance", message: "Scheduled maintenance on June 12, 2026 from 2-4 AM.", type: "info", read: false, timestamp: "2026-06-10T12:00:00", forRole: "admin" }
];

export const placementStats = {
  branchWise: [
    { branch: "Computer Science", totalStudents: 120, placed: 95, percentage: 79 },
    { branch: "Information Technology", totalStudents: 100, placed: 72, percentage: 72 },
    { branch: "Electronics", totalStudents: 80, placed: 45, percentage: 56 },
    { branch: "Mechanical", totalStudents: 90, placed: 38, percentage: 42 },
    { branch: "Civil", totalStudents: 70, placed: 25, percentage: 36 },
    { branch: "Electrical", totalStudents: 60, placed: 30, percentage: 50 }
  ],
  monthlyTrend: [
    { month: "Jan", placements: 12 },
    { month: "Feb", placements: 18 },
    { month: "Mar", placements: 25 },
    { month: "Apr", placements: 35 },
    { month: "May", placements: 42 },
    { month: "Jun", placements: 55 }
  ],
  companyWise: [
    { company: "TCS", hires: 20 },
    { company: "Infosys", hires: 15 },
    { company: "Microsoft", hires: 8 },
    { company: "Google", hires: 5 },
    { company: "Amazon", hires: 6 },
    { company: "Deloitte", hires: 4 },
    { company: "Wipro", hires: 12 },
    { company: "HCL", hires: 10 }
  ],
  applicationsPerMonth: [
    { month: "Jan", applications: 45 },
    { month: "Feb", applications: 78 },
    { month: "Mar", applications: 120 },
    { month: "Apr", applications: 156 },
    { month: "May", applications: 198 },
    { month: "Jun", applications: 230 }
  ],
  overallStats: {
    totalStudents: 520,
    totalPlaced: 305,
    totalDrives: 48,
    totalApplications: 827,
    averagePackage: "₹8.5 LPA",
    highestPackage: "₹35 LPA",
    placementRate: "58.6%"
  }
};

export const currentUser = {
  student: { ...students[0], role: "student" },
  recruiter: { ...recruiters[0], role: "recruiter", companyName: "Google" },
  admin: { id: 99, name: "Dr. Rajesh Kumar", email: "admin@university.edu", role: "admin", department: "Training & Placement Cell" }
};
