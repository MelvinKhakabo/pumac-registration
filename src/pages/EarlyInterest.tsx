import { useState } from "react";
import { supabase } from "../lib/supabase";
import { PiStudent, PiBuildings } from "react-icons/pi";

type ModalType = "" | "individual" | "school";

type IndividualFormData = {
  studentName: string;
  studentAge: string;
  currentSchool: string;
  country: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
  interestedIn: string[];
};

type SchoolFormData = {
  schoolName: string;
  contactName: string;
  contactRole: string;
  country: string;
  estimatedStudents: string;
  parentEmail: string;
  parentWhatsapp: string;
  interestedIn: string[];
};

const initialIndividual: IndividualFormData = {
  studentName: "",
  studentAge: "",
  currentSchool: "",
  country: "",
  parentName: "",
  parentEmail: "",
  parentWhatsapp: "",
  interestedIn: [],
};

const initialSchool: SchoolFormData = {
  schoolName: "",
  contactName: "",
  contactRole: "",
  country: "",
  estimatedStudents: "",
  parentEmail: "",
  parentWhatsapp: "",
  interestedIn: [],
};

const interestOptions = [
  { id: "training", label: "Training sessions" },
  { id: "mock-tests", label: "Mock tests" },
  { id: "competition", label: "Competition (in-person)" },
  { id: "online-competition", label: "Competition (online)" },
];

const faqs = [
  {
    category: "General",
    items: [
      {
        q: "I have a question about PUMaC Africa. What do I do?",
        a: "The fastest way to reach us is by emailing ask@learningsprouts.school. Please do not contact Princeton University directly — PUMaC Africa is organised independently by Learning Sprouts. We'll get back to you within 24 hours.",
      },
      {
        q: "How will PUMaC Africa communicate with registered students and schools?",
        a: "All communication before competition day will be through email. Make sure to use an email address you check regularly when registering.",
      },
    ],
  },
  {
    category: "Registration",
    items: [
      {
        q: "What is the difference between the In-Person and Online Competition?",
        a: "Both competitions test the same material and offer the same prizes. The In-Person Competition is held in Nairobi, Kenya. The Online Competition is fully virtual and open to students across Africa who cannot travel.",
      },
      {
        q: "Can a student participate in both the In-Person and Online Competition?",
        a: "No — you must choose one.",
      },
      {
        q: "Can a school register more than one team?",
        a: "Yes. Schools can register multiple teams. Contact us at ask@learningsprouts.school if you're coordinating a large group and we'll guide you through the process.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept M-Pesa and card payments. Payment is completed after filling out the registration form.",
      },
    ],
  },
  {
    category: "The Competition",
    items: [
      {
        q: "What subjects are tested at PUMaC Africa?",
        a: "The four subject areas are Algebra, Geometry, Number Theory, and Combinatorics — the same topics covered in our training sessions.",
      },
      {
        q: "Can we challenge a problem if we think it's ambiguous or incorrect?",
        a: "Yes. Contact a PUMaC Africa Math team staff member and they'll direct you to the right person.",
      },
      {
        q: "Is it okay if we can't solve all the problems?",
        a: "Absolutely. PUMaC problems are designed to be challenging — even solving a few is a real achievement. The goal is to push your thinking, not to get everything right.",
      },
    ],
  },
  {
    category: "Awards",
    items: [
      {
        q: "What awards are offered?",
        a: "Top performers receive trophies, medals, and certificates. Award details for each competition cycle will be announced closer to competition day.",
      },
    ],
  },
];

export default function EarlyInterest() {
  const [modal, setModal] = useState<ModalType>("");
  const [individualData, setIndividualData] = useState<IndividualFormData>(initialIndividual);
  const [schoolData, setSchoolData] = useState<SchoolFormData>(initialSchool);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  function updateIndividual<K extends keyof IndividualFormData>(key: K, value: IndividualFormData[K]) {
    setIndividualData((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function updateSchool<K extends keyof SchoolFormData>(key: K, value: SchoolFormData[K]) {
    setSchoolData((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function toggleInterest(form: "individual" | "school", id: string) {
    if (form === "individual") {
      setIndividualData((f) => ({
        ...f,
        interestedIn: f.interestedIn.includes(id)
          ? f.interestedIn.filter((i) => i !== id)
          : [...f.interestedIn, id],
      }));
    } else {
      setSchoolData((f) => ({
        ...f,
        interestedIn: f.interestedIn.includes(id)
          ? f.interestedIn.filter((i) => i !== id)
          : [...f.interestedIn, id],
      }));
    }
  }

  function validateIndividual() {
    const next: Record<string, string> = {};
    if (!individualData.studentName.trim()) next.studentName = "Student name is required.";
    if (!individualData.studentAge.trim()) next.studentAge = "Student age is required.";
    else if (Number(individualData.studentAge) <= 0) next.studentAge = "Enter a valid age.";
    if (!individualData.currentSchool.trim()) next.currentSchool = "School name is required.";
    if (!individualData.country.trim()) next.country = "Country is required.";
    if (!individualData.parentName.trim()) next.parentName = "Parent/guardian name is required.";
    if (!individualData.parentEmail.trim()) next.parentEmail = "Parent email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(individualData.parentEmail)) next.parentEmail = "Enter a valid email.";
    if (!individualData.parentWhatsapp.trim()) next.parentWhatsapp = "WhatsApp number is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateSchool() {
    const next: Record<string, string> = {};
    if (!schoolData.schoolName.trim()) next.schoolName = "School name is required.";
    if (!schoolData.contactName.trim()) next.contactName = "Contact name is required.";
    if (!schoolData.contactRole.trim()) next.contactRole = "Your role is required.";
    if (!schoolData.country.trim()) next.country = "Country is required.";
    if (!schoolData.parentEmail.trim()) next.parentEmail = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(schoolData.parentEmail)) next.parentEmail = "Enter a valid email.";
    if (!schoolData.parentWhatsapp.trim()) next.parentWhatsapp = "WhatsApp number is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleIndividualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateIndividual()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("early_interest_registrations")
        .insert({
          registration_type: "individual",
          student_name: individualData.studentName,
          student_age: Number(individualData.studentAge),
          current_school: individualData.currentSchool,
          country: individualData.country,
          parent_name: individualData.parentName,
          parent_email: individualData.parentEmail,
          parent_whatsapp: individualData.parentWhatsapp,
          interested_in: individualData.interestedIn,
        });
      if (error) throw error;
      setModal("");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again or email ask@learningsprouts.school.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSchoolSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateSchool()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("early_interest_registrations")
        .insert({
          registration_type: "school",
          school_name: schoolData.schoolName,
          school_contact_name: schoolData.contactName,
          school_contact_role: schoolData.contactRole,
          country: schoolData.country,
          estimated_students: schoolData.estimatedStudents ? Number(schoolData.estimatedStudents) : null,
          parent_email: schoolData.parentEmail,
          parent_whatsapp: schoolData.parentWhatsapp,
          interested_in: schoolData.interestedIn,
        });
      if (error) throw error;
      setModal("");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again or email ask@learningsprouts.school.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    setModal("");
    setErrors({});
  }

  if (submitted) {
    return (
      <main className="page">
        <section className="hero hero-compact">
          <div>
            <p className="eyebrow">PUMaC Africa · 2027</p>
            <h1>You're on the list!</h1>
            <p>
              Thanks for registering your interest in PUMaC Africa 2027. We'll
              be in touch as soon as registration opens. Keep an eye on your inbox.
            </p>
            <p className="hero-subline">
              Questions? Email us at{" "}
              <a href="mailto:ask@learningsprouts.school">ask@learningsprouts.school</a>
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page" style={{ background: "var(--cream-1)" }}>

      {/* ── HERO ── deep navy */}
      <section className="hero hero-compact" id="hero">
        <div>
          <p className="eyebrow">PUMaC Africa · 2027</p>
          <h1>Register Your Early Interest for 2027</h1>
          <p>
            PUMaC Africa 2027 is coming. Be the first to know when registration
            opens, get early access to training schedules, and secure your spot
            ahead of the crowd.
          </p>
          <p className="hero-subline">
            Open to students aged 13–18 from across Africa · Training: Fully Virtual · Competition: In-Person &amp; Virtual
          </p>
        </div>
      </section>

      {/* ── CARDS ── cream-1 */}
      <section className="section section--cream-1" id="interest">
        <p className="section-label">Early interest</p>
        <h2>How would you like to register?</h2>
        <p className="section-copy">
          No payment required at this stage — we'll notify you as soon as 2027
          registration opens.
        </p>
        <div className="cards-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: "900px", margin: "40px auto 0" }}>
          <div className="card early-interest-card" style={{ alignItems: "center", textAlign: "center" }}>
            <div className="early-interest-card-icon"><PiStudent size={32} /></div>
            <h3>Individual Student</h3>
            <p>Register your child's early interest. We'll reach out when training and competition registration opens for 2027.</p>
            <button className="btn btn-primary" style={{ alignSelf: "center" }} onClick={() => { setErrors({}); setModal("individual"); }}>
              Register Interest
            </button>
          </div>
          <div className="card early-interest-card" style={{ alignItems: "center", textAlign: "center" }}>
            <div className="early-interest-card-icon"><PiBuildings size={32} /></div>
            <h3>School Enquiry</h3>
            <p>Coordinating a group from your school? Leave your details and we'll be in touch with group options for 2027.</p>
            <button className="btn btn-primary" style={{ alignSelf: "center" }} onClick={() => { setErrors({}); setModal("school"); }}>
              Make a School Enquiry
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQs ── cream-2 */}
      <section className="section section--cream-2" id="faqs">
        <div className="section-inner">
          <p className="section-label">Got questions?</p>
          <h2>PUMaC Africa FAQs</h2>
          <div className="faq-list">
            {faqs.map((group) => (
              <div key={group.category} className="faq-group">
                <p className="faq-category">{group.category}</p>
                {group.items.map((item) => {
                  const key = `${group.category}-${item.q}`;
                  const isOpen = openFaq === key;
                  return (
                    <div key={key} className={`faq-item${isOpen ? " faq-item--open" : ""}`}>
                      <button
                        className="faq-question"
                        onClick={() => setOpenFaq(isOpen ? null : key)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.q}</span>
                        <span className="faq-chevron">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen && <p className="faq-answer">{item.a}</p>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDIVIDUAL MODAL ── */}
      {modal === "individual" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&#x2715;</button>
            <h3>Individual Early Interest</h3>
            <p className="modal-note">No payment needed — we'll contact you when 2027 registration opens.</p>
            <form onSubmit={handleIndividualSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Student Name</label>
                  <input className="form-input" value={individualData.studentName} onChange={(e) => updateIndividual("studentName", e.target.value)} placeholder="Full name" />
                  {errors.studentName && <p className="field-error">{errors.studentName}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Student Age</label>
                  <input className="form-input" type="number" value={individualData.studentAge} onChange={(e) => updateIndividual("studentAge", e.target.value)} placeholder="Age" min={10} max={21} />
                  {errors.studentAge && <p className="field-error">{errors.studentAge}</p>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current School</label>
                  <input className="form-input" value={individualData.currentSchool} onChange={(e) => updateIndividual("currentSchool", e.target.value)} placeholder="School name" />
                  {errors.currentSchool && <p className="field-error">{errors.currentSchool}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" value={individualData.country} onChange={(e) => updateIndividual("country", e.target.value)} placeholder="Country" />
                  {errors.country && <p className="field-error">{errors.country}</p>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Parent / Guardian Name</label>
                <input className="form-input" value={individualData.parentName} onChange={(e) => updateIndividual("parentName", e.target.value)} placeholder="Full name" />
                {errors.parentName && <p className="field-error">{errors.parentName}</p>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Parent Email</label>
                  <input className="form-input" type="email" value={individualData.parentEmail} onChange={(e) => updateIndividual("parentEmail", e.target.value)} placeholder="email@example.com" />
                  {errors.parentEmail && <p className="field-error">{errors.parentEmail}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Parent WhatsApp</label>
                  <input className="form-input" type="tel" value={individualData.parentWhatsapp} onChange={(e) => updateIndividual("parentWhatsapp", e.target.value)} placeholder="+254..." />
                  {errors.parentWhatsapp && <p className="field-error">{errors.parentWhatsapp}</p>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Interested in (select all that apply)</label>
                <div className="checkbox-group">
                  {interestOptions.map((opt) => (
                    <label key={opt.id} className="checkbox-item">
                      <input type="checkbox" checked={individualData.interestedIn.includes(opt.id)} onChange={() => toggleInterest("individual", opt.id)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-pay" disabled={submitting}>
                {submitting ? "Submitting..." : "Register My Interest"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── SCHOOL MODAL ── */}
      {modal === "school" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&#x2715;</button>
            <h3>School Enquiry — 2027</h3>
            <p className="modal-note">Leave your school's details and we'll reach out with group options when 2027 registration opens.</p>
            <form onSubmit={handleSchoolSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">School Name</label>
                  <input className="form-input" value={schoolData.schoolName} onChange={(e) => updateSchool("schoolName", e.target.value)} placeholder="Your school's name" />
                  {errors.schoolName && <p className="field-error">{errors.schoolName}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" value={schoolData.country} onChange={(e) => updateSchool("country", e.target.value)} placeholder="Country" />
                  {errors.country && <p className="field-error">{errors.country}</p>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input className="form-input" value={schoolData.contactName} onChange={(e) => updateSchool("contactName", e.target.value)} placeholder="Full name" />
                  {errors.contactName && <p className="field-error">{errors.contactName}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Your Role</label>
                  <input className="form-input" value={schoolData.contactRole} onChange={(e) => updateSchool("contactRole", e.target.value)} placeholder="e.g. Teacher, Head of Maths" />
                  {errors.contactRole && <p className="field-error">{errors.contactRole}</p>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input className="form-input" type="email" value={schoolData.parentEmail} onChange={(e) => updateSchool("parentEmail", e.target.value)} placeholder="email@school.com" />
                  {errors.parentEmail && <p className="field-error">{errors.parentEmail}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp Number</label>
                  <input className="form-input" type="tel" value={schoolData.parentWhatsapp} onChange={(e) => updateSchool("parentWhatsapp", e.target.value)} placeholder="+254..." />
                  {errors.parentWhatsapp && <p className="field-error">{errors.parentWhatsapp}</p>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Estimated number of students <span style={{fontWeight:400,opacity:0.6}}>(optional)</span></label>
                <input className="form-input" type="number" value={schoolData.estimatedStudents} onChange={(e) => updateSchool("estimatedStudents", e.target.value)} placeholder="e.g. 16" min={1} />
              </div>
              <div className="form-group">
                <label className="form-label">Interested in (select all that apply)</label>
                <div className="checkbox-group">
                  {interestOptions.map((opt) => (
                    <label key={opt.id} className="checkbox-item">
                      <input type="checkbox" checked={schoolData.interestedIn.includes(opt.id)} onChange={() => toggleInterest("school", opt.id)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-pay" disabled={submitting}>
                {submitting ? "Submitting..." : "Send School Enquiry"}
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}