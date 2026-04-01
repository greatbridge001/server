// ============================================================
// SmartFuture Career Hub — Backend Server
// ============================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require("pdfkit");
const { getRecommendations } = require("./recommender");
const { calculateClusterPoints } = require("./calculator");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("../public"));

// In-memory store (replace with a DB for production)
const sessions = {}; // { sessionId: { grades, phone, paid, reference } }

// ============================================================
// HELPER: Format phone number
// ============================================================
function formatPhone(phone) {
  phone = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (phone.startsWith("07") || phone.startsWith("01")) {
    return "254" + phone.slice(1);
  }
  if (phone.startsWith("+254")) {
    return phone.slice(1);
  }
  return phone; // assume already 254...
}

// ============================================================
// POST /api/save-grades
// Called BEFORE payment — stores student grades
// ============================================================
app.post("/api/save-grades", (req, res) => {
  const { meanGrade, subjects } = req.body;
  if (!meanGrade || !subjects) {
    return res.status(400).json({ error: "meanGrade and subjects are required" });
  }
  const sessionId = uuidv4();
  sessions[sessionId] = { meanGrade, subjects, paid: false, phone: null, reference: null };
  return res.json({ sessionId, message: "Grades saved. Proceed to payment." });
});

// ============================================================
// POST /api/pay
// Initiates PayHero STK Push
// ============================================================
app.post("/api/pay", async (req, res) => {
  const { phone, amount, sessionId } = req.body;

  if (!phone || !sessionId) {
    return res.status(400).json({ error: "phone and sessionId are required" });
  }

  if (!sessions[sessionId]) {
    return res.status(404).json({ error: "Session not found. Please re-enter your grades." });
  }

  const formattedPhone = formatPhone(phone);
  sessions[sessionId].phone = formattedPhone;

  // Build PayHero Basic Auth
  const auth = Buffer.from(
    `${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`
  ).toString("base64");

  try {
    const response = await axios.post(
      "https://backend.payhero.co.ke/api/v2/payments",
      {
        amount: amount || 1,
        phone_number: formattedPhone,
        channel_id: parseInt(process.env.PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference: sessionId,
        callback_url: process.env.CALLBACK_URL,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      message: "STK Push sent. Enter your M-PESA PIN.",
      data: response.data,
      sessionId,
    });
  } catch (err) {
    console.error("PayHero Error:", err?.response?.data || err.message);
    return res.status(500).json({
      error: "Payment initiation failed. Please try again.",
      details: err?.response?.data || err.message,
    });
  }
});

// ============================================================
// POST /api/callback
// PayHero sends payment confirmation here
// ============================================================
app.post("/api/callback", (req, res) => {
  console.log("PayHero Callback received:", JSON.stringify(req.body, null, 2));
  const { status, external_reference, reference } = req.body;

  if (external_reference && sessions[external_reference]) {
    if (status === "SUCCESS" || status === "success") {
      sessions[external_reference].paid = true;
      sessions[external_reference].reference = reference || "N/A";
      console.log(`✅ Payment confirmed for session: ${external_reference}`);
    } else {
      sessions[external_reference].paid = false;
      console.log(`❌ Payment failed for session: ${external_reference}`);
    }
  }

  return res.json({ received: true });
});

// ============================================================
// GET /api/check-payment?sessionId=xxx
// Frontend polls this to check if payment confirmed
// ============================================================
app.get("/api/check-payment", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ error: "Session not found" });
  }
  const session = sessions[sessionId];
  return res.json({ paid: session.paid, reference: session.reference });
});

// ============================================================
// GET /api/results?sessionId=xxx
// Returns course recommendations ONLY after payment
// ============================================================
app.get("/api/results", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ error: "Session not found" });
  }
  const session = sessions[sessionId];
  if (!session.paid) {
    return res.status(403).json({ error: "Payment required before viewing results." });
  }

  const recommendations = getRecommendations(session.meanGrade, session.subjects);

  // Calculate cluster points for each recommended course
  const withPoints = recommendations.map((course) => ({
    ...course,
    clusterData: calculateClusterPoints(course.name, session.subjects),
  }));

  return res.json({
    meanGrade: session.meanGrade,
    subjects: session.subjects,
    recommendations: withPoints,
    reference: session.reference,
  });
});

// ============================================================
// GET /api/download?sessionId=xxx
// Generate and download PDF report
// ============================================================
app.get("/api/download", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ error: "Session not found" });
  }
  const session = sessions[sessionId];
  if (!session.paid) {
    return res.status(403).json({ error: "Payment required." });
  }

  const recommendations = getRecommendations(session.meanGrade, session.subjects);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="SmartFuture_Report.pdf"');
  doc.pipe(res);

  // PDF Header
  doc.fontSize(22).fillColor("#1a56db").text("SmartFuture Career Hub", { align: "center" });
  doc.fontSize(14).fillColor("#374151").text("KUCCPS Course Recommendation Report", { align: "center" });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#1a56db");
  doc.moveDown();

  // Student Info
  doc.fontSize(13).fillColor("#111827").text(`Mean Grade: ${session.meanGrade}`);
  doc.moveDown(0.5);
  doc.fontSize(12).text("Subject Grades:");
  Object.entries(session.subjects).forEach(([subj, grade]) => {
    doc.fontSize(11).fillColor("#374151").text(`  • ${subj}: ${grade}`);
  });

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#e5e7eb");
  doc.moveDown();

  // Recommended Courses
  doc.fontSize(14).fillColor("#1a56db").text("✅ Recommended Courses:");
  doc.moveDown(0.5);
  recommendations.forEach((course, i) => {
    const tag = course.highIncome ? " 💰 High Income" : "";
    doc.fontSize(12).fillColor("#111827").text(`${i + 1}. ${course.name}${tag}`);
    doc.fontSize(10).fillColor("#6b7280").text(`   Category: ${course.category}`);
  });

  doc.moveDown();
  doc.fontSize(10).fillColor("#9ca3af").text(`Payment Reference: ${session.reference}`);
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString("en-KE")}`);
  doc.fontSize(10).text("SmartFuture Career Hub | Tel: 0769642043 | Kenya");

  doc.end();
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SmartFuture server running on http://localhost:${PORT}`);
});