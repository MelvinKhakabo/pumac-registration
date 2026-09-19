import { useState } from "react";
import { supabase } from "../lib/supabase";
import {
  PAYSTACK_PUBLIC_KEY,
  KES_RATE,
  allTrainingMonths,
  mockTests,
  formatUsd,
  formatKes,
  isKenya,
} from "../lib/constants";

interface PaystackHandler {
  openIframe: () => void;
}

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  channels: string[];
  metadata: Record<string, unknown>;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackSetupOptions) => PaystackHandler;
    };
  }
}

type ProgramType = "training" | "mock-test";

type FormData = {
  studentName: string;
  studentAge: string;
  currentSchool: string;
  country: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
  preferredContactMethod: "email" | "whatsapp";
};

const initialFormData: FormData = {
  studentName: "",
  studentAge: "",
  currentSchool: "",
  country: "",
  parentName: "",
  parentEmail: "",
  parentWhatsapp: "",
  preferredContactMethod: "whatsapp",
};

function SchoolEnquiryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&#x2715;</button>
        <h3>School Enquiry</h3>
        <p className="modal-note">
          Interested in enrolling multiple students from your school? We'd love
          to hear from you. Click below to send us an email and we'll get back
          to you with group pricing and scheduling options.
        </p>
        <a
          className="btn-pay"
          href="mailto:ask@learningsprouts.school?subject=School%20Enquiry%20%E2%80%94%20PUMaC%20Africa"
        >
          Email Us
        </a>
      </div>
    </div>
  );
}

type TrainingMonth = typeof allTrainingMonths[0];

function MonthCard({
  month,
  status,
  onRegister,
}: {
  month: TrainingMonth;
  status: "upcoming" | "in-progress" | "completed";
  onRegister: () => void;
}) {
  return (
    <div className={`training-month-card${status === "completed" ? " training-month-card--completed" : ""}`}>
      <div className="training-month-header">
        <h3>{month.label}</h3>
        <span className="topic-pill">{month.topic}</span>
      </div>
      <p className="training-dates">{month.dates}</p>
      <p className="training-time">
        Saturdays, 12:00 PM – 1:30 PM (SAST, UTC+2) · 1:00 PM – 2:30 PM (EAT, UTC+3)
      </p>
      <p className="training-office-hours">
        Optional: PUMaC Office Hours · Fridays, 6:30 PM – 7:30 PM (SAST, UTC+2) · 7:30 PM – 8:30 PM (EAT, UTC+3)
      </p>
      <p className="training-price">{formatUsd(month.priceUsd)}</p>
      {status === "upcoming" && (
        <button className="btn btn-primary" onClick={onRegister}>Register</button>
      )}
      {status === "in-progress" && (
        <span className="status-badge status-badge--progress">In Progress</span>
      )}
      {status === "completed" && (
        <span className="status-badge status-badge--done">Completed</span>
      )}
    </div>
  );
}

export default function Training() {
  const [regOpen, setRegOpen] = useState(false);
  const [programType, setProgramType] = useState<ProgramType>("training");
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedMocks, setSelectedMocks] = useState<string[]>([]);
  const [useMpesa, setUseMpesa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const now = new Date();

  const upcomingMonths   = allTrainingMonths.filter((m) => now <= m.firstSessionDate);
  const inProgressMonths = allTrainingMonths.filter((m) => now > m.firstSessionDate && now <= m.lastSessionDate);
  const completedMonths  = allTrainingMonths.filter((m) => now > m.lastSessionDate);

  function openReg(type: ProgramType) {
    setProgramType(type);
    setRegOpen(true);
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function toggleMonth(id: string) {
    setSelectedMonths((m) =>
      m.includes(id) ? m.filter((x) => x !== id) : [...m, id]
    );
  }

  function toggleMock(id: string) {
    setSelectedMocks((m) =>
      m.includes(id) ? m.filter((x) => x !== id) : [...m, id]
    );
  }

  const trainingTotal = allTrainingMonths
    .filter((m) => selectedMonths.includes(m.id))
    .reduce((sum, m) => sum + m.priceUsd, 0);

  const mockTotal = mockTests
    .filter((m) => selectedMocks.includes(m.id))
    .reduce((sum, m) => sum + m.priceUsd, 0);

  const totalUsd = programType === "training" ? trainingTotal : mockTotal;
  const totalKes = totalUsd * KES_RATE;

  function validateForm() {
    const next: Record<string, string> = {};
    if (!formData.studentName.trim()) next.studentName = "Student name is required.";
    if (!formData.studentAge.trim()) next.studentAge = "Student age is required.";
    else if (Number(formData.studentAge) <= 0) next.studentAge = "Enter a valid age.";
    if (!formData.currentSchool.trim()) next.currentSchool = "School name is required.";
    if (!formData.country.trim()) next.country = "Country is required.";
    if (!formData.parentName.trim()) next.parentName = "Parent/guardian name is required.";
    if (!formData.parentEmail.trim()) next.parentEmail = "Parent email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.parentEmail))
      next.parentEmail = "Enter a valid email.";
    if (!formData.parentWhatsapp.trim())
      next.parentWhatsapp = "WhatsApp number is required.";
    if (programType === "training" && selectedMonths.length === 0)
      next.months = "Select at least one training month.";
    if (programType === "mock-test" && selectedMocks.length === 0)
      next.mocks = "Select at least one mock test.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function createPendingRegistration() {
    if (programType === "training") {
      // ── Insert into registrations_training ──
      const { data: reg, error } = await supabase
        .from("registrations_training")
        .insert({
          student_name: formData.studentName,
          student_age: Number(formData.studentAge),
          current_school: formData.currentSchool,
          country: formData.country,
          parent_name: formData.parentName,
          parent_email: formData.parentEmail,
          parent_whatsapp: formData.parentWhatsapp,
          preferred_contact_method: formData.preferredContactMethod,
          payment_status: "pending",
          amount_usd: totalUsd,
          payment_method: useMpesa ? "mpesa" : "card",
        })
        .select()
        .single();
      if (error) throw error;

      if (selectedMonths.length > 0) {
        const monthRows = selectedMonths.map((mid) => ({
          registrations_training_id: reg.id,
          month_id: mid,
        }));
        const { error: mErr } = await supabase
          .from("registration_training_months")
          .insert(monthRows);
        if (mErr) throw mErr;
      }

      return reg;
    } else {
      // ── Insert into registrations_mock_tests ──
      const { data: reg, error } = await supabase
        .from("registrations_mock_tests")
        .insert({
          student_name: formData.studentName,
          student_age: Number(formData.studentAge),
          current_school: formData.currentSchool,
          country: formData.country,
          parent_name: formData.parentName,
          parent_email: formData.parentEmail,
          parent_whatsapp: formData.parentWhatsapp,
          preferred_contact_method: formData.preferredContactMethod,
          selected_mock_ids: selectedMocks,
          payment_status: "pending",
          amount_usd: totalUsd,
          payment_method: useMpesa ? "mpesa" : "card",
        })
        .select()
        .single();
      if (error) throw error;
      return reg;
    }
  }

  async function markRegistrationPaid(regId: string, reference: string) {
    const table = programType === "training" ? "registrations_training" : "registrations_mock_tests";
    await supabase
      .from(table)
      .update({ payment_status: "paid", payment_reference: reference })
      .eq("id", regId);
    await supabase.from("payments").insert({
      registration_id: regId,
      reference,
      amount_usd: totalUsd,
      payment_method: useMpesa ? "mpesa" : "card",
    });
  }

  async function markRegistrationCancelled(regId: string) {
    const table = programType === "training" ? "registrations_training" : "registrations_mock_tests";
    await supabase
      .from(table)
      .update({ payment_status: "cancelled" })
      .eq("id", regId);
  }

  async function handlePay() {
    if (!validateForm()) return;
    setSubmitting(true);
    let reg: { id: string } | null = null;
    try {
      reg = await createPendingRegistration();
      if (!reg) throw new Error("Registration failed.");
      const amountKobo = useMpesa
        ? Math.round(totalKes * 100)
        : Math.round(totalUsd * 100);
      const currency = useMpesa ? "KES" : "USD";
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: formData.parentEmail,
        amount: amountKobo,
        currency,
        channels: useMpesa ? ["mobile_money"] : ["card"],
        metadata: { registration_id: reg.id },
        callback: async (response: { reference: string }) => {
          await markRegistrationPaid(reg!.id, response.reference);
          window.location.href = `/thank-you.html?reference=${response.reference}`;
        },
        onClose: async () => {
          if (reg) await markRegistrationCancelled(reg.id);
          setSubmitting(false);
        },
      });
      handler.openIframe();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again or email ask@learningsprouts.school.");
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="hero hero-compact" id="hero">
        <div>
          <p className="eyebrow">PUMaC Africa · Training</p>
          <h1>Train for PUMaC Africa</h1>
          <p>
            Monthly live online sessions covering the four core PUMaC topics —
            Algebra, Geometry, Number Theory, and Combinatorics. Each 90-minute
            session is led by experienced instructors via Zoom, with weekly
            Friday office hours for Q&amp;A, extra practice, and support.
          </p>
          <p className="hero-subline">
            Training: Saturdays, 12:00 PM – 1:30 PM (SAST, UTC+2) · 1:00 PM – 2:30 PM (EAT, UTC+3)
          </p>
          <p className="hero-subline">
            Office Hours: Fridays, 6:30 PM – 7:30 PM (SAST, UTC+2) · 7:30 PM – 8:30 PM (EAT, UTC+3)
          </p>
        </div>
      </section>

      <section className="section section--cream-1" id="training">
        <div className="section-inner">
          <p className="section-label">Monthly training</p>

          {/* ── Upcoming ── */}
          {upcomingMonths.length > 0 && (
            <>
              <h2>Upcoming Training</h2>
              <p className="section-copy">
                Register for one or more months below. Each month covers a
                different subject and includes four 90-minute Saturday sessions
                plus weekly Friday office hours.
              </p>
              <div className="training-grid">
                {upcomingMonths.map((month) => (
                  <MonthCard
                    key={month.id}
                    month={month}
                    status="upcoming"
                    onRegister={() => openReg("training")}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── In Progress ── */}
          {inProgressMonths.length > 0 && (
            <>
              <h2 style={{ marginTop: upcomingMonths.length > 0 ? "56px" : "0" }}>
                Currently In Progress
              </h2>
              <p className="section-copy">
                These sessions have already started and are no longer open for registration.
              </p>
              <div className="training-grid">
                {inProgressMonths.map((month) => (
                  <MonthCard
                    key={month.id}
                    month={month}
                    status="in-progress"
                    onRegister={() => {}}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Completed ── */}
          {completedMonths.length > 0 && (
            <div style={{ marginTop: "56px" }}>
              <button
                className="toggle-completed-btn"
                onClick={() => setShowCompleted((v) => !v)}
              >
                {showCompleted ? "▲" : "▼"}&nbsp;&nbsp;
                {showCompleted ? "Hide" : "Show"} Previously Completed Training ({completedMonths.length})
              </button>
              {showCompleted && (
                <div className="training-grid" style={{ marginTop: "24px" }}>
                  {completedMonths.map((month) => (
                    <MonthCard
                      key={month.id}
                      month={month}
                      status="completed"
                      onRegister={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="section section--cream-2" id="mock-tests">
        <div className="section-inner">
          <p className="section-label">Practice</p>
          <h2>Mock Tests</h2>
          <p className="section-copy">
            Sit a full timed mock exam under competition conditions, followed by
            an instructor-led review. Kenyan students attend in-person at our
            Nairobi centre; all other students write online.
          </p>
          <div className="training-grid">
            {mockTests.map((mock) => (
              <div key={mock.id} className="training-month-card">
                <div className="training-month-header">
                  <h3>{mock.label}</h3>
                </div>
                <p className="training-dates">{mock.date}</p>
                <p className="training-time">
                  In-person (Kenya): 1:00 PM – 4:00 PM EAT · Online: flexible
                </p>
                <p className="training-office-hours">Timed Test + Instructor Review</p>
                <p className="training-price">{formatUsd(mock.priceUsd)}</p>
                <button className="btn btn-primary" onClick={() => openReg("mock-test")}>
                  Register
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cream-3" id="schools">
        <div className="section-inner">
          <p className="section-label">Schools</p>
          <h2>Enrolling a Group?</h2>
          <p className="section-copy">
            If you're a teacher or school administrator looking to enrol multiple
            students, get in touch and we'll work out the details with you.
          </p>
          <button className="btn btn-primary" onClick={() => setEnquiryOpen(true)}>
            Send a School Enquiry
          </button>
        </div>
      </section>

      {enquiryOpen && <SchoolEnquiryModal onClose={() => setEnquiryOpen(false)} />}

      {regOpen && (
        <div className="modal-overlay" onClick={() => setRegOpen(false)}>
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setRegOpen(false)}>&#x2715;</button>
            <h3>
              {programType === "training" ? "Training Registration" : "Mock Test Registration"}
            </h3>
            <div className="modal-layout">
              <div className="modal-form-col">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Student Name</label>
                    <input className="form-input" value={formData.studentName} onChange={(e) => updateField("studentName", e.target.value)} placeholder="Full name" />
                    {errors.studentName && <p className="field-error">{errors.studentName}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Student Age</label>
                    <input className="form-input" type="number" value={formData.studentAge} onChange={(e) => updateField("studentAge", e.target.value)} placeholder="Age" min={10} max={21} />
                    {errors.studentAge && <p className="field-error">{errors.studentAge}</p>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Current School</label>
                    <input className="form-input" value={formData.currentSchool} onChange={(e) => updateField("currentSchool", e.target.value)} placeholder="School name" />
                    {errors.currentSchool && <p className="field-error">{errors.currentSchool}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input className="form-input" value={formData.country} onChange={(e) => { updateField("country", e.target.value); setUseMpesa(false); }} placeholder="Country" />
                    {errors.country && <p className="field-error">{errors.country}</p>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Parent / Guardian Name</label>
                  <input className="form-input" value={formData.parentName} onChange={(e) => updateField("parentName", e.target.value)} placeholder="Full name" />
                  {errors.parentName && <p className="field-error">{errors.parentName}</p>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Parent Email</label>
                    <input className="form-input" type="email" value={formData.parentEmail} onChange={(e) => updateField("parentEmail", e.target.value)} placeholder="email@example.com" />
                    {errors.parentEmail && <p className="field-error">{errors.parentEmail}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent WhatsApp</label>
                    <input className="form-input" type="tel" value={formData.parentWhatsapp} onChange={(e) => updateField("parentWhatsapp", e.target.value)} placeholder="+254..." />
                    {errors.parentWhatsapp && <p className="field-error">{errors.parentWhatsapp}</p>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Contact Method</label>
                  <div className="payment-method-toggle">
                    <button type="button" className={formData.preferredContactMethod === "whatsapp" ? "active" : ""} onClick={() => updateField("preferredContactMethod", "whatsapp")}>WhatsApp</button>
                    <button type="button" className={formData.preferredContactMethod === "email" ? "active" : ""} onClick={() => updateField("preferredContactMethod", "email")}>Email</button>
                  </div>
                </div>
                {programType === "training" && (
                  <div className="form-group">
                    <label className="form-label">Select Training Month(s)</label>
                    <div className="checkbox-group">
                      {upcomingMonths.map((month) => (
                        <label key={month.id} className="checkbox-item">
                          <input type="checkbox" checked={selectedMonths.includes(month.id)} onChange={() => toggleMonth(month.id)} />
                          <span>{month.label} — {month.topic} ({formatUsd(month.priceUsd)})</span>
                        </label>
                      ))}
                    </div>
                    {errors.months && <p className="field-error">{errors.months}</p>}
                  </div>
                )}
                {programType === "mock-test" && (
                  <div className="form-group">
                    <label className="form-label">Select Mock Test(s)</label>
                    <div className="checkbox-group">
                      {mockTests.map((mock) => (
                        <label key={mock.id} className="checkbox-item">
                          <input type="checkbox" checked={selectedMocks.includes(mock.id)} onChange={() => toggleMock(mock.id)} />
                          <span>{mock.label} — {mock.date} ({formatUsd(mock.priceUsd)})</span>
                        </label>
                      ))}
                    </div>
                    {errors.mocks && <p className="field-error">{errors.mocks}</p>}
                  </div>
                )}
                {isKenya(formData.country) && (
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <div className="payment-method-toggle">
                      <button type="button" className={!useMpesa ? "active" : ""} onClick={() => setUseMpesa(false)}>Card (USD)</button>
                      <button type="button" className={useMpesa ? "active" : ""} onClick={() => setUseMpesa(true)}>M-Pesa (KES)</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-summary-col">
                <h4>Order Summary</h4>
                <ul className="summary-list">
                  {programType === "training" && allTrainingMonths.filter((m) => selectedMonths.includes(m.id)).map((m) => (
                    <li key={m.id}><span>{m.label}</span><span>{formatUsd(m.priceUsd)}</span></li>
                  ))}
                  {programType === "mock-test" && mockTests.filter((m) => selectedMocks.includes(m.id)).map((m) => (
                    <li key={m.id}><span>{m.label}</span><span>{formatUsd(m.priceUsd)}</span></li>
                  ))}
                </ul>
                <div className="summary-total">
                  <span>Total</span>
                  <span>{useMpesa ? formatKes(totalKes) : formatUsd(totalUsd)}</span>
                </div>
                {useMpesa && <p className="modal-price-note">KES amount calculated at {KES_RATE} KES/USD</p>}
                <button className="btn-pay" onClick={handlePay} disabled={submitting || totalUsd === 0}>
                  {submitting ? "Processing..." : "Pay Now"}
                </button>
                <p className="stk-pending-note">
                  {useMpesa ? "You'll receive an M-Pesa STK push on your phone to complete payment." : "You'll be redirected to Paystack to complete payment securely."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}