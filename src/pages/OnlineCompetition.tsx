import { useState } from "react";
import { supabase } from "../lib/supabase";
import {
  PAYSTACK_PUBLIC_KEY,
  KES_RATE,
  SHOW_COMPETITION_DATE_PILL,
  formatUsd,
  formatKes,
  isKenya,
} from "../lib/constants";

const ONLINE_PRICE_USD = 15;

type FormData = {
  studentName: string;
  studentAge: string;
  studentEmail: string;
  currentSchool: string;
  country: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
};

const initialFormData: FormData = {
  studentName: "",
  studentAge: "",
  studentEmail: "",
  currentSchool: "",
  country: "",
  parentName: "",
  parentEmail: "",
  parentWhatsapp: "",
};

function SchoolEnquiryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&#x2715;</button>
        <h3>School Enquiry</h3>
        <p className="modal-note">
          Interested in registering multiple students from your school for the
          online competition? Get in touch and we'll sort out group arrangements.
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

export default function OnlineCompetition() {
  const [regOpen, setRegOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useMpesa, setUseMpesa] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const priceKes = ONLINE_PRICE_USD * KES_RATE;

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validateForm() {
    const next: Record<string, string> = {};
    if (!formData.studentName.trim()) next.studentName = "Student name is required.";
    if (!formData.studentAge.trim()) next.studentAge = "Student age is required.";
    else if (Number(formData.studentAge) <= 0) next.studentAge = "Enter a valid age.";
    if (!formData.studentEmail.trim()) next.studentEmail = "Student email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.studentEmail))
      next.studentEmail = "Enter a valid email.";
    if (!formData.currentSchool.trim()) next.currentSchool = "School name is required.";
    if (!formData.country.trim()) next.country = "Country is required.";
    if (!formData.parentName.trim()) next.parentName = "Parent/guardian name is required.";
    if (!formData.parentEmail.trim()) next.parentEmail = "Parent email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.parentEmail))
      next.parentEmail = "Enter a valid email.";
    if (!formData.parentWhatsapp.trim())
      next.parentWhatsapp = "WhatsApp number is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function createPendingRegistration() {
    const { data: reg, error } = await supabase
      .from("online_competition_registrations")
      .insert({
        student_name: formData.studentName,
        student_age: Number(formData.studentAge),
        student_email: formData.studentEmail,
        current_school: formData.currentSchool,
        country: formData.country,
        parent_name: formData.parentName,
        parent_email: formData.parentEmail,
        parent_whatsapp: formData.parentWhatsapp,
        payment_status: "pending",
        amount_usd: ONLINE_PRICE_USD,
      })
      .select()
      .single();
    if (error) throw error;
    return reg;
  }

  async function markRegistrationPaid(regId: string, reference: string) {
    await supabase
      .from("online_competition_registrations")
      .update({ payment_status: "paid", payment_reference: reference })
      .eq("id", regId);
  }

  async function markRegistrationCancelled(regId: string) {
    await supabase
      .from("online_competition_registrations")
      .update({ payment_status: "cancelled" })
      .eq("id", regId);
  }

  async function handlePay() {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const reg = await createPendingRegistration();
      const amountKobo = useMpesa
        ? Math.round(priceKes * 100)
        : Math.round(ONLINE_PRICE_USD * 100);
      const currency = useMpesa ? "KES" : "USD";
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: formData.parentEmail,
        amount: amountKobo,
        currency,
        channels: useMpesa ? ["mobile_money"] : ["card"],
        metadata: { registration_id: reg.id },
        callback: async (response: { reference: string }) => {
          await markRegistrationPaid(reg.id, response.reference);
          window.location.href = `/thank-you.html?reference=${response.reference}`;
        },
        onClose: async () => {
          await markRegistrationCancelled(reg.id);
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

      {/* ── HERO ── deep navy */}
      <section className="hero hero-compact" id="hero">
        <div>
          <p className="eyebrow">PUMaC Africa · Online Competition</p>
          <h1>Compete From Anywhere in Africa</h1>
          <div className="hero-pills">
            {SHOW_COMPETITION_DATE_PILL && (
              <span className="competition-date-pill">Competition Date: Jan 30, 2027</span>
            )}
            <span className="competition-date-pill">🌍 Fully Virtual</span>
          </div>
          <p>
            The fully virtual edition of PUMaC Africa — same rigour, same
            problems, same prizes. Open to students across the continent who
            can't join us in person.
          </p>
          <p className="hero-subline">
            {formatUsd(ONLINE_PRICE_USD)} per student · Open to all African countries
          </p>
          <button className="btn btn-primary" onClick={() => setRegOpen(true)}>
            Register Now — {formatUsd(ONLINE_PRICE_USD)}
          </button>
        </div>
      </section>

      {/* ── HOW IT WORKS ── cream-1 */}
      <section className="section section--cream-1" id="logistics">
        <p className="section-label">How it works</p>
        <h2>Competition Flow</h2>
        <div className="comp-flow">
          <div className="comp-flow-step">
            <div className="comp-flow-num">1</div>
            <div className="comp-flow-content">
              <h4>Register &amp; Pay</h4>
              <p>Complete registration and pay {formatUsd(ONLINE_PRICE_USD)} to secure your spot. You'll receive a confirmation email with your student login details.</p>
            </div>
          </div>
          <div className="comp-flow-arrow">↓</div>
          <div className="comp-flow-step">
            <div className="comp-flow-num">2</div>
            <div className="comp-flow-content">
              <h4>Power Round</h4>
              <p>Released one week before competition day. Completed as a virtual team — teams are assigned by the organisers. Done from home.</p>
            </div>
          </div>
          <div className="comp-flow-arrow">↓</div>
          <div className="comp-flow-step">
            <div className="comp-flow-num">3</div>
            <div className="comp-flow-content">
              <h4>Individual Subject Tests</h4>
              <p>Choose 2 subjects from Algebra, Combinatorics, Geometry, or Number Theory. Each test is 60 minutes. No calculators. No collaboration.</p>
            </div>
          </div>
          <div className="comp-flow-arrow">↓</div>
          <div className="comp-flow-step">
            <div className="comp-flow-num">4</div>
            <div className="comp-flow-content">
              <h4>Team Test</h4>
              <p>30-minute timed round. Your virtual team works together on a set of harder problems. One answer sheet submitted per team.</p>
            </div>
          </div>
          <div className="comp-flow-arrow">↓</div>
          <div className="comp-flow-step">
            <div className="comp-flow-num">5</div>
            <div className="comp-flow-content">
              <h4>Results &amp; Awards</h4>
              <p>Results released within 48 hours. Top performers receive digital certificates and prizes shipped to their address.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── cream-2 */}
      <section className="section section--cream-2" id="requirements">
        <p className="section-label">What you need</p>
        <h2>Technical Requirements</h2>
        <div className="cards-grid">
          <div className="card">
            <h3>Device</h3>
            <p>
              A laptop or desktop computer running a modern browser. Tablets are
              supported but not recommended for the timed rounds.
            </p>
          </div>
          <div className="card">
            <h3>Internet</h3>
            <p>
              A stable internet connection is required throughout the competition.
              We recommend at least 5 Mbps. A mobile hotspot is acceptable as a
              backup.
            </p>
          </div>
          <div className="card">
            <h3>Student Email</h3>
            <p>
              Each student must have their own email address. This is used to
              send login credentials and competition materials before the event.
            </p>
          </div>
        </div>
      </section>

      {/* ── SCHOOLS ── deep navy with cream CTA box */}
      <section className="section section--navy-dark" id="schools">
        <div className="schools-cta-box">
          <p className="section-label">Schools</p>
          <h2>Registering a Group?</h2>
          <p className="section-copy">
            If you're coordinating multiple students from one school, reach out
            and we'll make the process smooth for you.
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
            <h3>Online Competition Registration</h3>
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
                <div className="form-group">
                  <label className="form-label">Student Email</label>
                  <input className="form-input" type="email" value={formData.studentEmail} onChange={(e) => updateField("studentEmail", e.target.value)} placeholder="student@example.com" />
                  {errors.studentEmail && <p className="field-error">{errors.studentEmail}</p>}
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
                  <li>
                    <span>Online Competition Entry</span>
                    <span>{formatUsd(ONLINE_PRICE_USD)}</span>
                  </li>
                </ul>
                <div className="summary-total">
                  <span>Total</span>
                  <span>{useMpesa ? formatKes(priceKes) : formatUsd(ONLINE_PRICE_USD)}</span>
                </div>
                {useMpesa && <p className="modal-price-note">KES amount calculated at {KES_RATE} KES/USD</p>}
                <button className="btn-pay" onClick={handlePay} disabled={submitting}>
                  {submitting ? "Processing..." : "Pay Now"}
                </button>
                <p className="stk-pending-note">
                  {useMpesa
                    ? "You'll receive an M-Pesa STK push on your phone to complete payment."
                    : "You'll be redirected to Paystack to complete payment securely."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}