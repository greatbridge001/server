// ============================================================
// SmartFuture — KUCCPS Cluster Points Calculator
// ============================================================

const GRADE_POINTS = {
  A: 12, "A-": 11, "B+": 10, B: 9, "B-": 8,
  "C+": 7, C: 6, "C-": 5, "D+": 4, D: 3, "D-": 2, E: 1,
};

function getPoints(grade) {
  return GRADE_POINTS[grade] || 0;
}

// Cluster subject requirements per course category
const CLUSTER_MAP = {
  "Computer Science": ["Maths", "Physics", "English", "Chemistry"],
  "Information Technology": ["Maths", "Physics", "English", "Chemistry"],
  "Software Engineering": ["Maths", "Physics", "English", "Chemistry"],
  "Cyber Security": ["Maths", "Physics", "English", "Chemistry"],
  "Data Science": ["Maths", "Physics", "English", "Chemistry"],
  "Bachelor of Commerce": ["Maths", "English", "Business", "Geography"],
  "Business Administration": ["Maths", "English", "Business", "Geography"],
  "Procurement & Supply Chain": ["Maths", "English", "Business", "Geography"],
  "Human Resource Management": ["English", "Maths", "Business", "Geography"],
  "Marketing": ["English", "Maths", "Business", "Geography"],
  "Entrepreneurship": ["English", "Maths", "Business", "Geography"],
  "Economics": ["Maths", "English", "Business", "Geography"],
  "Statistics": ["Maths", "Physics", "English", "Chemistry"],
  "Finance": ["Maths", "English", "Business", "Geography"],
  "Actuarial Science": ["Maths", "Physics", "Chemistry", "English"],
  "Civil Engineering": ["Maths", "Physics", "Chemistry", "English"],
  "Electrical Engineering": ["Maths", "Physics", "Chemistry", "English"],
  "Mechanical Engineering": ["Maths", "Physics", "Chemistry", "English"],
  "Architecture": ["Maths", "Physics", "Chemistry", "English"],
  "Construction Management": ["Maths", "Physics", "Geography", "English"],
  "Quantity Surveying": ["Maths", "Physics", "Geography", "English"],
  "Nursing": ["Biology", "Chemistry", "Physics", "English"],
  "Public Health": ["Biology", "Chemistry", "English", "Maths"],
  "Clinical Medicine": ["Biology", "Chemistry", "Physics", "English"],
  "Pharmacy": ["Biology", "Chemistry", "Physics", "Maths"],
  "Dentistry": ["Biology", "Chemistry", "Physics", "Maths"],
  "Medical Laboratory Science": ["Biology", "Chemistry", "Physics", "Maths"],
  "Medicine & Surgery": ["Biology", "Chemistry", "Physics", "Maths"],
  "Bachelor of Laws (LLB)": ["English", "Kiswahili", "History", "CRE"],
  "Bachelor of Education (Arts)": ["English", "Kiswahili", "History", "Geography"],
  "Bachelor of Education (Science)": ["Maths", "Physics", "Chemistry", "Biology"],
  "Special Needs Education": ["English", "Kiswahili", "Biology", "Geography"],
  "Sociology": ["English", "History", "Geography", "CRE"],
  "Political Science": ["English", "History", "Geography", "CRE"],
  "International Relations": ["English", "History", "Geography", "Kiswahili"],
  "Criminology": ["English", "History", "Geography", "CRE"],
  "Community Development": ["English", "Geography", "Biology", "CRE"],
  "Journalism": ["English", "Kiswahili", "History", "Geography"],
  "Mass Communication": ["English", "Kiswahili", "History", "Geography"],
  "Public Relations": ["English", "Kiswahili", "Business", "Geography"],
  "Film & Animation": ["English", "Art", "Maths", "Geography"],
  "Agribusiness": ["Biology", "Chemistry", "Maths", "English"],
  "Environmental Science": ["Biology", "Chemistry", "Geography", "English"],
  "Food Science": ["Biology", "Chemistry", "Physics", "Maths"],
  "Nutrition & Dietetics": ["Biology", "Chemistry", "English", "Maths"],
  "Animal Science": ["Biology", "Chemistry", "Agriculture", "English"],
  "Geography": ["Geography", "Maths", "English", "History"],
  "Geospatial Information Systems (GIS)": ["Geography", "Maths", "Physics", "English"],
};

// Subject aliases (normalize user inputs)
const ALIASES = {
  Math: "Maths",
  Mathematics: "Maths",
  Eng: "English",
  Bio: "Biology",
  Chem: "Chemistry",
  Phy: "Physics",
  Geo: "Geography",
  Bus: "Business",
  Kisw: "Kiswahili",
  Hist: "History",
};

function normalizeSubjects(subjects) {
  const normalized = {};
  for (const [key, val] of Object.entries(subjects)) {
    const normKey = ALIASES[key] || key;
    normalized[normKey] = val;
  }
  return normalized;
}

function calculateClusterPoints(courseName, rawSubjects) {
  const subjects = normalizeSubjects(rawSubjects);
  const clusterSubjects = CLUSTER_MAP[courseName];

  if (!clusterSubjects) {
    // Fallback: use best 4 subjects
    const sorted = Object.entries(subjects)
      .map(([s, g]) => ({ subject: s, grade: g, points: getPoints(g) }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 4);
    const total = sorted.reduce((sum, s) => sum + s.points, 0);
    const breakdown = {};
    sorted.forEach((s) => (breakdown[s.subject] = s.points));
    return { course: courseName, clusterSubjectsUsed: sorted.map((s) => s.subject), pointsBreakdown: breakdown, clusterPoints: total };
  }

  const used = [];
  const breakdown = {};
  let total = 0;

  for (const subj of clusterSubjects) {
    if (subjects[subj] !== undefined) {
      const pts = getPoints(subjects[subj]);
      breakdown[subj] = pts;
      total += pts;
      used.push(subj);
    } else {
      // Try to substitute with best remaining subject
      const remaining = Object.entries(subjects)
        .filter(([s]) => !used.includes(s))
        .map(([s, g]) => ({ subject: s, grade: g, points: getPoints(g) }))
        .sort((a, b) => b.points - a.points);
      if (remaining.length > 0) {
        const sub = remaining[0];
        breakdown[`${sub.subject} (sub for ${subj})`] = sub.points;
        total += sub.points;
        used.push(sub.subject);
      }
    }
  }

  return {
    course: courseName,
    clusterSubjectsUsed: used,
    pointsBreakdown: breakdown,
    clusterPoints: Math.min(total, 48),
  };
}

module.exports = { calculateClusterPoints };