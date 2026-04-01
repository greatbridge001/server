// ============================================================
// SmartFuture — Course Recommendation Engine
// ============================================================

const GRADE_POINTS = {
  A: 12, "A-": 11, "B+": 10, B: 9, "B-": 8,
  "C+": 7, C: 6, "C-": 5, "D+": 4, D: 3, "D-": 2, E: 1,
};

const GRADE_ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"];

function gradeGTE(grade, minimum) {
  const gi = GRADE_ORDER.indexOf(grade);
  const mi = GRADE_ORDER.indexOf(minimum);
  if (gi === -1 || mi === -1) return false;
  return gi <= mi; // lower index = higher grade
}

function getPoints(grade) {
  return GRADE_POINTS[grade] || 0;
}

// ============================================================
// ALL COURSES DATABASE
// ============================================================
const ALL_COURSES = [
  // === C+ and above ===
  { name: "Information Technology", category: "Computing & IT", minGrade: "C+", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "C+") },
  { name: "Computer Science", category: "Computing & IT", minGrade: "C+", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "C+") },
  { name: "Software Engineering", category: "Computing & IT", minGrade: "C+", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "C+") },
  { name: "Cyber Security", category: "Computing & IT", minGrade: "C+", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "C+") },
  { name: "Data Science", category: "Computing & IT", minGrade: "C+", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "C+") },
  { name: "Bachelor of Commerce", category: "Business & Economics", minGrade: "C+", highIncome: false, check: (s) => gradeGTE(s.Maths || s.Math || s.Business || "E", "C") },
  { name: "Business Administration", category: "Business & Economics", minGrade: "C+", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || s.Business || "E", "C") },
  { name: "Procurement & Supply Chain", category: "Business & Economics", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Human Resource Management", category: "Business & Economics", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Marketing", category: "Business & Economics", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Entrepreneurship", category: "Business & Economics", minGrade: "C+", highIncome: true, check: () => true },
  { name: "Bachelor of Education (Arts)", category: "Education", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Bachelor of Education (Science)", category: "Education", minGrade: "C+", highIncome: false, check: (s) => gradeGTE(s.Biology || s.Physics || s.Chemistry || "E", "C+") },
  { name: "Special Needs Education", category: "Education", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Sociology", category: "Social Sciences", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Political Science", category: "Social Sciences", minGrade: "C+", highIncome: false, check: () => true },
  { name: "International Relations", category: "Social Sciences", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Criminology", category: "Social Sciences", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Community Development", category: "Social Sciences", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Agribusiness", category: "Agriculture & Environment", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Environmental Science", category: "Agriculture & Environment", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Food Science", category: "Agriculture & Environment", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Nutrition & Dietetics", category: "Agriculture & Environment", minGrade: "C+", highIncome: false, check: (s) => gradeGTE(s.Biology || "E", "C+") },
  { name: "Animal Science", category: "Agriculture & Environment", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Journalism", category: "Arts & Media", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Mass Communication", category: "Arts & Media", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Public Relations", category: "Arts & Media", minGrade: "C+", highIncome: false, check: () => true },
  { name: "Film & Animation", category: "Arts & Media", minGrade: "C+", highIncome: false, check: () => true },

  // === B- and above ===
  { name: "Economics", category: "Finance & Analytics", minGrade: "B-", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "B-") },
  { name: "Statistics", category: "Finance & Analytics", minGrade: "B-", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "B-") },
  { name: "Geography", category: "Geography & GIS", minGrade: "B-", highIncome: false, check: (s) => gradeGTE(s.Geography || "E", "C+") },
  { name: "Geospatial Information Systems (GIS)", category: "Geography & GIS", minGrade: "B-", highIncome: false, check: (s) => gradeGTE(s.Geography || "E", "C+") },
  { name: "Construction Management", category: "Technical", minGrade: "B-", highIncome: false, check: () => true },
  { name: "Quantity Surveying", category: "Technical", minGrade: "B-", highIncome: false, check: () => true },

  // === B and above ===
  { name: "Civil Engineering", category: "Engineering", minGrade: "B", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "B") && gradeGTE(s.Physics || "E", "B") },
  { name: "Electrical Engineering", category: "Engineering", minGrade: "B", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "B") && gradeGTE(s.Physics || "E", "B") },
  { name: "Mechanical Engineering", category: "Engineering", minGrade: "B", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "B") && gradeGTE(s.Physics || "E", "B") },
  { name: "Nursing", category: "Health Sciences", minGrade: "B", highIncome: false, check: (s) => gradeGTE(s.Biology || "E", "B") && gradeGTE(s.Chemistry || "E", "C+") },
  { name: "Public Health", category: "Health Sciences", minGrade: "B", highIncome: false, check: () => true },
  { name: "Clinical Medicine", category: "Health Sciences", minGrade: "B", highIncome: false, check: () => true },

  // === B+ and above ===
  { name: "Bachelor of Laws (LLB)", category: "Law", minGrade: "B+", highIncome: true, check: (s) => gradeGTE(s.English || "E", "B") },
  { name: "Architecture", category: "Architecture", minGrade: "B+", highIncome: true, check: () => true },
  { name: "Finance", category: "Advanced Business", minGrade: "B+", highIncome: true, check: () => true },
  { name: "Actuarial Science", category: "Advanced Business", minGrade: "B+", highIncome: true, check: (s) => gradeGTE(s.Maths || s.Math || "E", "B+") },

  // === A- and above ===
  { name: "Pharmacy", category: "Medical Sciences", minGrade: "A-", highIncome: true, check: (s) => gradeGTE(s.Biology || "E", "B+") && gradeGTE(s.Chemistry || "E", "B+") },
  { name: "Dentistry", category: "Medical Sciences", minGrade: "A-", highIncome: true, check: (s) => gradeGTE(s.Biology || "E", "B+") && gradeGTE(s.Chemistry || "E", "B+") },
  { name: "Medical Laboratory Science", category: "Medical Sciences", minGrade: "A-", highIncome: true, check: (s) => gradeGTE(s.Biology || "E", "B+") && gradeGTE(s.Chemistry || "E", "B+") },

  // === A ===
  { name: "Medicine & Surgery", category: "Medical Sciences", minGrade: "A", highIncome: true, check: (s) => gradeGTE(s.Biology || "E", "A-") && gradeGTE(s.Chemistry || "E", "A-") },
];

// ============================================================
// MAIN FUNCTION: getRecommendations
// ============================================================
function getRecommendations(meanGrade, subjects) {
  const studentIndex = GRADE_ORDER.indexOf(meanGrade);
  if (studentIndex === -1) return [];

  return ALL_COURSES.filter((course) => {
    const courseIndex = GRADE_ORDER.indexOf(course.minGrade);
    if (courseIndex === -1) return false;
    // Student grade must be >= course minimum
    if (studentIndex > courseIndex) return false;
    // Subject conditions must pass
    return course.check(subjects);
  });
}

module.exports = { getRecommendations, GRADE_POINTS, GRADE_ORDER, gradeGTE };