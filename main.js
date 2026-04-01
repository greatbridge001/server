// ============================================================
// SmartFuture Career Hub — Frontend JavaScript
// ============================================================

// CHANGE THIS to your backend URL when deployed on Render
// During local testing: http://localhost:3000
const API_BASE = "http://localhost:3000";

// ============================================================
// SPA ROUTING
// ============================================================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Close mobile menu
  document.getElementById('navLinks').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  // Nav links
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(el.dataset.page);
    });
  });

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Courses page: show payment or results
  initCoursesPage();

  // Universities page
  initUniversitiesPage();

  // Contact form
  initContactForm();
});

// ============================================================
// COURSES PAGE LOGIC
// ============================================================
let currentSessionId = null;
let paymentPollInterval = null;

const SUBJECTS = ['English', 'Kiswahili', 'Maths', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Business', 'CRE', 'Agriculture'];
const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
const MEAN_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];

function initCoursesPage() {
  const subjectsGrid = document.getElementById('subjectsGrid');
  if (!subjectsGrid) return;

  // Build subject inputs
  SUBJECTS.forEach(subj => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
      <label>${subj}</label>
      <select name="subj_${subj}">
        <option value="">— Select —</option>
        ${GRADES.map(g => `<option value="${g}">${g}</option>`).join('')}
      </select>
    `;
    subjectsGrid.appendChild(div);
  });

  // Form submit
  const form = document.getElementById('gradesForm');
  if (form) form.addEventListener('submit', handleGradesSubmit);

  // Pay button
  const payBtn = document.getElementById('payBtn');
  if (payBtn) payBtn.addEventListener('click', handlePayment);

  // Check payment status button
  const checkBtn = document.getElementById('checkPaymentBtn');
  if (checkBtn) checkBtn.addEventListener('click', () => checkPaymentStatus(true));

  // Download
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);
}

async function handleGradesSubmit(e) {
  e.preventDefault();
  const meanGrade = document.getElementById('meanGrade').value;
  if (!meanGrade) { showAlert('gradesAlert', 'Please select your Mean Grade.', 'error'); return; }

  const subjects = {};
  SUBJECTS.forEach(subj => {
    const val = document.querySelector(`select[name="subj_${subj}"]`).value;
    if (val) subjects[subj] = val;
  });

  if (Object.keys(subjects).length < 3) {
    showAlert('gradesAlert', 'Please enter at least 3 subject grades.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/save-grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meanGrade, subjects }),
    });
    const data = await res.json();
    if (data.sessionId) {
      currentSessionId = data.sessionId;
      document.getElementById('gradesFormSection').style.display = 'none';
      document.getElementById('paymentWall').style.display = 'block';
    } else {
      showAlert('gradesAlert', data.error || 'Something went wrong.', 'error');
    }
  } catch (err) {
    showAlert('gradesAlert', 'Could not connect to server. Is it running?', 'error');
  }
}

async function handlePayment() {
  const phone = document.getElementById('payPhone').value.trim();
  if (!phone) { showAlert('payAlert', 'Please enter your M-PESA phone number.', 'error'); return; }
  if (!currentSessionId) { showAlert('payAlert', 'Session expired. Please re-enter grades.', 'error'); return; }

  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Sending STK Push...';

  try {
    const res = await fetch(`${API_BASE}/api/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount: 1, sessionId: currentSessionId }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert('payAlert', '✅ STK Push sent! Check your phone and enter your M-PESA PIN.', 'success');
      document.getElementById('checkPaymentBtn').style.display = 'inline-flex';
      startPaymentPolling();
    } else {
      showAlert('payAlert', data.error || 'Payment failed. Please try again.', 'error');
    }
  } catch (err) {
    showAlert('payAlert', 'Could not connect to server.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💳 Pay KSh 1 via M-PESA';
  }
}

function startPaymentPolling() {
  let count = 0;
  paymentPollInterval = setInterval(async () => {
    count++;
    if (count > 20) { clearInterval(paymentPollInterval); return; }
    const paid = await checkPaymentStatus(false);
    if (paid) clearInterval(paymentPollInterval);
  }, 5000);
}

async function checkPaymentStatus(showMessage) {
  if (!currentSessionId) return false;
  try {
    const res = await fetch(`${API_BASE}/api/check-payment?sessionId=${currentSessionId}`);
    const data = await res.json();
    if (data.paid) {
      if (showMessage) showAlert('payAlert', '✅ Payment confirmed! Loading your results...', 'success');
      setTimeout(() => loadResults(), 1000);
      return true;
    } else {
      if (showMessage) showAlert('payAlert', '⏳ Payment not yet confirmed. Please try again shortly.', 'info');
      return false;
    }
  } catch { return false; }
}

async function loadResults() {
  if (!currentSessionId) return;
  try {
    const res = await fetch(`${API_BASE}/api/results?sessionId=${currentSessionId}`);
    const data = await res.json();
    if (data.error) { showAlert('payAlert', data.error, 'error'); return; }

    document.getElementById('paymentWall').style.display = 'none';
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';

    const container = document.getElementById('coursesList');
    container.innerHTML = '';

    if (!data.recommendations || data.recommendations.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--gray-500)">No matching courses found for your grades.</p>';
      return;
    }

    document.getElementById('resultsGrade').textContent = `Mean Grade: ${data.meanGrade}`;

    data.recommendations.forEach((course, i) => {
      const cd = course.clusterData;
      const points = cd ? cd.clusterPoints : '—';
      const incomeTag = course.highIncome ? '<span class="high-income-badge">💰 High Income</span>' : '';
      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `
        <div class="course-info">
          <h3>${i + 1}. ${course.name} ${incomeTag}</h3>
          <p>${course.category}</p>
          ${cd ? `<p style="font-size:0.8rem;margin-top:6px;color:var(--gray-500)">Cluster subjects: ${Object.keys(cd.pointsBreakdown).join(', ')}</p>` : ''}
        </div>
        <div class="cluster-badge">${points}/48 pts</div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    showAlert('payAlert', 'Error loading results. Please try again.', 'error');
  }
}

async function handleDownload() {
  if (!currentSessionId) return;
  window.open(`${API_BASE}/api/download?sessionId=${currentSessionId}`, '_blank');
}

// ============================================================
// UNIVERSITIES PAGE
// ============================================================
const UNIVERSITIES = [
  // Public
  { name: "University of Nairobi", county: "Nairobi", type: "Public" },
  { name: "Kenyatta University", county: "Kiambu", type: "Public" },
  { name: "Moi University", county: "Uasin Gishu", type: "Public" },
  { name: "Egerton University", county: "Nakuru", type: "Public" },
  { name: "Jomo Kenyatta University of Agriculture and Technology", county: "Kiambu", type: "Public" },
  { name: "Maseno University", county: "Kisumu", type: "Public" },
  { name: "Masinde Muliro University of Science and Technology", county: "Kakamega", type: "Public" },
  { name: "Technical University of Kenya", county: "Nairobi", type: "Public" },
  { name: "Technical University of Mombasa", county: "Mombasa", type: "Public" },
  { name: "Pwani University", county: "Kilifi", type: "Public" },
  { name: "Chuka University", county: "Tharaka-Nithi", type: "Public" },
  { name: "Laikipia University", county: "Laikipia", type: "Public" },
  { name: "South Eastern Kenya University", county: "Kitui", type: "Public" },
  { name: "Meru University of Science and Technology", county: "Meru", type: "Public" },
  { name: "Multimedia University of Kenya", county: "Nairobi", type: "Public" },
  { name: "Dedan Kimathi University of Technology", county: "Nyeri", type: "Public" },
  { name: "Kisii University", county: "Kisii", type: "Public" },
  { name: "University of Eldoret", county: "Uasin Gishu", type: "Public" },
  // Private
  { name: "Strathmore University", county: "Nairobi", type: "Private" },
  { name: "United States International University Africa", county: "Nairobi", type: "Private" },
  { name: "Daystar University", county: "Machakos", type: "Private" },
  { name: "Mount Kenya University", county: "Kiambu", type: "Private" },
  { name: "Catholic University of Eastern Africa", county: "Nairobi", type: "Private" },
  { name: "Africa Nazarene University", county: "Kajiado", type: "Private" },
  { name: "Kenya Methodist University", county: "Meru", type: "Private" },
  { name: "Kabarak University", county: "Nakuru", type: "Private" },
  { name: "Zetech University", county: "Kiambu", type: "Private" },
  { name: "Riara University", county: "Nairobi", type: "Private" },
];

let currentUniFilter = 'All';

function initUniversitiesPage() {
  const searchInput = document.getElementById('uniSearch');
  const countyFilter = document.getElementById('countyFilter');
  const tabs = document.querySelectorAll('.tab[data-uni]');

  if (!searchInput) return;

  // Populate county filter
  const counties = [...new Set(UNIVERSITIES.map(u => u.county))].sort();
  counties.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    countyFilter.appendChild(opt);
  });

  searchInput.addEventListener('input', renderUniversities);
  countyFilter.addEventListener('change', renderUniversities);
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentUniFilter = tab.dataset.uni;
      renderUniversities();
    });
  });

  renderUniversities();
}

function renderUniversities() {
  const search = document.getElementById('uniSearch').value.toLowerCase();
  const county = document.getElementById('countyFilter').value;
  const grid = document.getElementById('uniGrid');
  if (!grid) return;

  const filtered = UNIVERSITIES.filter(u => {
    if (currentUniFilter !== 'All' && u.type !== currentUniFilter) return false;
    if (county && u.county !== county) return false;
    if (search && !u.name.toLowerCase().includes(search) && !u.county.toLowerCase().includes(search)) return false;
    return true;
  });

  grid.innerHTML = filtered.length === 0
    ? '<p style="color:var(--gray-500);text-align:center;grid-column:1/-1">No universities found.</p>'
    : filtered.map(u => `
      <div class="uni-card">
        <span class="uni-type-badge badge-${u.type.toLowerCase()}">${u.type}</span>
        <h3>${u.name}</h3>
        <p class="uni-county">📍 ${u.county} County</p>
      </div>
    `).join('');
}

// ============================================================
// CONTACT FORM
// ============================================================
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]').value;
    const phone = form.querySelector('[name="phone"]').value;
    const message = form.querySelector('[name="message"]').value;
    // WhatsApp redirect
    const text = encodeURIComponent(`Hi SmartFuture!\n\nName: ${name}\nPhone: ${phone}\n\nMessage: ${message}`);
    window.open(`https://wa.me/254769642043?text=${text}`, '_blank');
    showAlert('contactAlert', '✅ Opening WhatsApp with your message...', 'success');
    form.reset();
  });
}

// ============================================================
// UTILITY
// ============================================================
function showAlert(id, message, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}