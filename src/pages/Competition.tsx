import { useState } from "react";
import { supabase } from "../lib/supabase";
import {
  PAYSTACK_PUBLIC_KEY,
  KES_RATE,
  IS_EARLY_BIRD,
  SHOW_COMPETITION_DATE_PILL,
  COMPETITION_INDIVIDUAL_EARLY_BIRD_PRICE,
  COMPETITION_INDIVIDUAL_STANDARD_PRICE,
  COMPETITION_INDIVIDUAL_PRICE,
  COMPETITION_TEAM_PRICE,
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

type CompetitionType = "" | "individual" | "team-of-8";
type TeamMember = { name: string; age: string; school: string };
type FormData = {
  studentName: string;
  studentAge: string;
  currentSchool: string;
  country: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
  teamName: string;
  teamMembers: TeamMember[];
};

const emptyMember = (): TeamMember => ({ name: "", age: "", school: "" });

const initialFormData: FormData = {
  studentName: "",
  studentAge: "",
  currentSchool: "",
  country: "",
  parentName: "",
  parentEmail: "",
  parentWhatsapp: "",
  teamName: "",
  teamMembers: Array.from({ length: 7 }, emptyMember),
};

function SchoolEnquiryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&#x2715;</button>
        <h3>School Enquiry</h3>
        <p className="modal-note">
          Interested in sending a team from your school? We'd love to hear from
          you. Click below to send us an email and we'll get back to you with
          group options and logistics.
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

export default function Competition() {
  const [regOpen, setRegOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [competitionType, setCompetitionType] = useState<CompetitionType>("");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useMpesa, setUseMpesa] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const priceUsd = competitionType === "team-of-8" ? COMPETITION_TEAM_PRICE : COMPETITION_INDIVIDUAL_PRICE;
  const priceKes = priceUsd * KES_RATE;

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function updateMember(index: number, field: keyof TeamMember, value: string) {
    setFormData((f) => {
      const members = [...f.teamMembers];
      members[index] = { ...members[index], [field]: value };
      return { ...f, teamMembers: members };
    });
  }

  function validateForm() {
    const next: Record<string, string> = {};
    if (!competitionType) next.competitionType = "Please select individual or team.";
    if (!formData.studentName.trim()) next.studentName = "Student name is required.";
    if (!formData.studentAge.trim()) next.studentAge = "Student age is required.";
    else if (Number(formData.studentAge) <= 0) next.studentAge = "Enter a valid age.";
    if (!formData.currentSchool.trim()) next.currentSchool = "School name is required.";
    if (!formData.country.trim()) next.country = "Country is required.";
    if (!formData.parentName.trim()) next.parentName = "Parent/guardian name is required.";
    if (!formData.parentEmail.trim()) next.parentEmail = "Parent email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.parentEmail)) next.parentEmail = "Enter a valid email.";
    if (!formData.parentWhatsapp.trim()) next.parentWhatsapp = "WhatsApp number is required.";
    if (competitionType === "team-of-8") {
      if (!formData.teamName.trim()) next.teamName = "Team name is required.";
      formData.teamMembers.forEach((m, i) => {
        if (!m.name.trim()) next[`member_${i}_name`] = "Name required.";
        if (!m.school.trim()) next[`member_${i}_school`] = "School required.";
      });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function createPendingRegistration() {
    const { data: reg, error } = await supabase
      .from("registrations_competition")
      .insert({
        student_name: formData.studentName,
        student_age: Number(formData.studentAge),
        current_school: formData.currentSchool,
        country: formData.country,
        parent_name: formData.parentName,
        parent_email: formData.parentEmail,
        parent_whatsapp: formData.parentWhatsapp,
        competition_type: competitionType,
        team_name: competitionType === "team-of-8" ? formData.teamName : null,
        payment_status: "pending",
        amount_usd: priceUsd,
        payment_method: useMpesa ? "mpesa" : "card",
      })
      .select()
      .single();
    if (error) throw error;

    if (competitionType === "team-of-8") {
      const memberRows = formData.teamMembers.map((m) => ({
        registrations_competition_id: reg.id,
        team_name: formData.teamName,
        member_name: m.name,
        member_age: m.age ? Number(m.age) : null,
        member_school: m.school,
      }));
      const { error: mErr } = await supabase.from("competition_team_members").insert(memberRows);
      if (mErr) throw mErr;
    }

    return reg;
  }

  async function markRegistrationPaid(regId: string, reference: string) {
    await supabase
      .from("registrations_competition")
      .update({ payment_status: "paid", payment_reference: reference })
      .eq("id", regId);
    await supabase.from("payments").insert({
      registration_id: regId,
      reference,
      amount_usd: priceUsd,
      payment_method: useMpesa ? "mpesa" : "card",
    });
  }

  async function markRegistrationCancelled(regId: string) {
    await supabase
      .from("registrations_competition")
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
      const amountKobo = useMpesa ? Math.round(priceKes * 100) : Math.round(priceUsd * 100);
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
      {/* ── HERO ── deep navy */}
      <section className="hero hero-compact" id="hero">
        <div>
          <p className="eyebrow">PUMaC Africa · Competition</p>
          <h1>Register for Competition</h1>
          <div className="hero-pills">
            {SHOW_COMPETITION_DATE_PILL && (
              <span className="competition-date-pill">Competition Date: Jan 30, 2027</span>
            )}
            <span className="competition-date-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline",verticalAlign:"middle",marginRight:"5px",marginTop:"-2px"}}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              Nairobi, Kenya
            </span>
            {IS_EARLY_BIRD && (
              <span className="early-bird-pill">Early Bird: Save 17%</span>
            )}
          </div>
          <p>
            Compete against the best mathematical minds from across Africa.
            Individual and team categories available. The competition takes place
            in person — bring your A-game.
          </p>
          <p className="hero-subline">Registration deadline: January 23, 2027</p>
          <button className="btn btn-primary" onClick={() => setRegOpen(true)}>Register Now</button>
        </div>
      </section>

      {/* ── COMPETITION RULES ── cream-1 */}
      <section className="section section--cream-1" id="rules">
        <p className="section-label">Competition rules</p>
        <h2>How It Works</h2>
        <div className="cards-grid">
          <div className="card">
            <h3>Eligibility</h3>
            <ul className="card-list">
              <li>Under 20 years old as of January 30, 2027</li>
              <li>Not enrolled full-time in any post-secondary institution</li>
              <li>Open to African students aged 13–18</li>
              <li>Virtual participation available from anywhere in Africa</li>
              <li>Must register before January 23, 2027</li>
            </ul>
          </div>
          <div className="card">
            <h3>Format</h3>
            <ul className="card-list">
              <li>Individual registration: $15 per student</li>
              <li>Team registration: $100 per team of 8</li>
              <li>All participants compete in both Individual and Team rounds</li>
              <li>Individual registrants are grouped into teams of 8 for the Power Round and Team Round</li>
            </ul>
          </div>
          <div className="card">
            <h3>Divisions</h3>
            <ul className="card-list">
              <li><strong>Division A</strong> — experienced competitors and students trained with Learning Sprouts</li>
              <li><strong>Division B</strong> — newer to math competitions</li>
              <li>Awards calculated separately per division</li>
              <li>Division placement reviewed by PUMaC organisers</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── COMPETITION FLOW ── cream-2 */}
      <section className="section section--cream-2" id="flow">
        <p className="section-label">Competition day</p>
        <h2>What to Expect</h2>
        <div className="comp-flow">
          <div className="comp-flow-step">
            <div className="comp-flow-num">1</div>
            <div className="comp-flow-content">
              <h4>Power Round</h4>
              <p>Released one week before competition day. Teams collaborate online and submit answers from home — no need to be in person for this round.</p>
            </div>
          </div>
          <div className="comp-flow-arrow">↓</div>
          <div className="comp-flow-step">
            <div className="comp-flow-num">2</div>
            <div className="comp-flow-content">
              <h4>Individual Tests</h4>
              <p>Choose 2 subjects from Algebra, Combinatorics, Geometry, or Number Theory. Each test is 60 minutes. No calculators. No collaboration.</p>
            </div>
          </div>
          <div className="comp-flow-arrow">↓</div>
          <div className="comp-flow-step">
            <div className="comp-flow-num">3</div>
            <div className="comp-flow-content">
              <h4>Team Test</h4>
              <p>30-minute timed round. Collaboration is encouraged — work together as a team. One answer sheet submitted per team.</p>
            </div>
          </div>
          <div className="comp-flow-arrow">↓</div>
          <div className="comp-flow-step">
            <div className="comp-flow-num">4</div>
            <div className="comp-flow-content">
              <h4>Individual Finals</h4>
              <p>Top 10 scorers per subject are invited to sit a 90-minute proof-based final. Invitation only. No collaboration permitted.</p>
              <p className="comp-flow-note">Mini-events run during Individual Finals and while scores are being tallied.</p>
            </div>
          </div>
          <div className="comp-flow-arrow">↓</div>
          <div className="comp-flow-step">
            <div className="comp-flow-num">5</div>
            <div className="comp-flow-content">
              <h4>Scoring &amp; Awards</h4>
              <p>Final scores combine Power Round + Individual Tests + Team Test. Division A and Division B results are announced separately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── cream-3 */}
      <section className="section section--cream-3" id="pricing">
        <p className="section-label">Pricing</p>
        <h2>Registration Fees</h2>
        <div className="pricing-grid">
          <div className="pricing-card pricing-card--navy">
            <h3>Individual</h3>
            {IS_EARLY_BIRD ? (
              <>
                <p className="price-amount">{formatUsd(COMPETITION_INDIVIDUAL_EARLY_BIRD_PRICE)}</p>
                <p className="price-original">{formatUsd(COMPETITION_INDIVIDUAL_STANDARD_PRICE)}</p>
                <span className="early-bird-badge">Early Bird</span>
              </>
            ) : (
              <p className="price-amount">{formatUsd(COMPETITION_INDIVIDUAL_STANDARD_PRICE)}</p>
            )}
            <p>Per student</p>
            <button className="btn btn-primary" onClick={() => { setCompetitionType("individual"); setRegOpen(true); }}>Register as Individual</button>
          </div>
          <div className="pricing-card pricing-card--navy pricing-card--featured">
            <h3>Team of 8</h3>
            <p className="price-amount">{formatUsd(COMPETITION_TEAM_PRICE)}</p>
            <p>Per team of 8 students</p>
            <button className="btn btn-primary" onClick={() => { setCompetitionType("team-of-8"); setRegOpen(true); }}>Register a Team</button>
          </div>
        </div>
      </section>

      {/* ── SCHOOLS ── deep navy with cream CTA box */}
      <section className="section section--navy-dark" id="schools">
        <div className="schools-cta-box">
          <p className="section-label">Schools</p>
          <h2>Bringing a School Team?</h2>
          <p className="section-copy">If you're a teacher or administrator coordinating multiple teams, reach out and we'll help with logistics and group arrangements.</p>
          <button className="btn btn-primary" onClick={() => setEnquiryOpen(true)}>Send a School Enquiry</button>
        </div>
      </section>

      {enquiryOpen && <SchoolEnquiryModal onClose={() => setEnquiryOpen(false)} />}

      {regOpen && (
        <div className="modal-overlay" onClick={() => setRegOpen(false)}>
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setRegOpen(false)}>&#x2715;</button>
            <h3>Competition Registration</h3>
            <div className="modal-layout">
              <div className="modal-form-col">
                <div className="form-group">
                  <label className="form-label">Competition Category</label>
                  <div className="competition-type-toggle">
                    <button type="button" className={competitionType === "individual" ? "active" : ""} onClick={() => setCompetitionType("individual")}>Individual</button>
                    <button type="button" className={competitionType === "team-of-8" ? "active" : ""} onClick={() => setCompetitionType("team-of-8")}>Team of 8</button>
                  </div>
                  {errors.competitionType && <p className="field-error">{errors.competitionType}</p>}
                </div>
                {competitionType === "team-of-8" && (
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input className="form-input" value={formData.teamName} onChange={(e) => updateField("teamName", e.target.value)} placeholder="Your team name" />
                    {errors.teamName && <p className="field-error">{errors.teamName}</p>}
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{competitionType === "team-of-8" ? "Team Captain Name" : "Student Name"}</label>
                    <input className="form-input" value={formData.studentName} onChange={(e) => updateField("studentName", e.target.value)} placeholder="Full name" />
                    {errors.studentName && <p className="field-error">{errors.studentName}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age</label>
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
                {competitionType === "team-of-8" && (
                  <div className="form-group">
                    <label className="form-label">Other Team Members (7)</label>
                    {formData.teamMembers.map((m, i) => (
                      <div key={i} className="team-member-row">
                        <p className="team-member-label">Member {i + 2}</p>
                        <div className="form-row">
                          <div className="form-group">
                            <input className="form-input" placeholder="Full name" value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} />
                            {errors[`member_${i}_name`] && <p className="field-error">{errors[`member_${i}_name`]}</p>}
                          </div>
                          <div className="form-group">
                            <input className="form-input" placeholder="Age" type="number" value={m.age} onChange={(e) => updateMember(i, "age", e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <input className="form-input" placeholder="School" value={m.school} onChange={(e) => updateMember(i, "school", e.target.value)} />
                          {errors[`member_${i}_school`] && <p className="field-error">{errors[`member_${i}_school`]}</p>}
                        </div>
                      </div>
                    ))}
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
                  {competitionType && (
                    <li>
                      <span>{competitionType === "individual" ? "Individual Entry" : "Team of 8 Entry"}</span>
                      <span>{formatUsd(priceUsd)}</span>
                    </li>
                  )}
                </ul>
                <div className="summary-total">
                  <span>Total</span>
                  <span>{competitionType ? (useMpesa ? formatKes(priceKes) : formatUsd(priceUsd)) : "—"}</span>
                </div>
                {useMpesa && <p className="modal-price-note">KES amount calculated at {KES_RATE} KES/USD</p>}
                <button className="btn-pay" onClick={handlePay} disabled={submitting || !competitionType}>
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