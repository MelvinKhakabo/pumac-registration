import { useMemo, useState, useEffect, type MouseEvent } from "react";
import "./index.css";
import { supabase } from "./lib/supabase";
import { FiGlobe, FiMail } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";

declare global {
  interface Window {
    PaystackPop?: new () => {
      newTransaction: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        reference: string;
        metadata?: Record<string, unknown>;
        onSuccess: (response: { reference: string }) => void;
        onCancel: () => void;
      }) => void;
    };
  }
}

type ProgramType = "training" | "mock-test" | "competition";
type ContactMethod = "" | "whatsapp" | "email" | "phone_call";
type CompetitionType = "" | "individual" | "team-of-8";

type FormData = {
  studentName: string;
  studentAge: string;
  currentSchool: string;
  country: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
  preferredContactMethod: ContactMethod;
  teamName: string;
  teamMembers: string;
};

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

const trainingMonths = [
  { id: "july-2026", label: "July 2026", dates: "July 4 – July 25", time: "Saturdays, 12:00 PM – 1:30 PM (SAST, UTC+2)", priceUsd: 62 },
  { id: "august-2026", label: "August 2026", dates: "August 5 – August 26", time: "Saturdays, 12:00 PM – 1:30 PM (SAST, UTC+2)", priceUsd: 62 },
  { id: "october-2026", label: "October 2026", dates: "October 3 – October 24", time: "Saturdays, 12:00 PM – 1:30 PM (SAST, UTC+2)", priceUsd: 62 },
  { id: "november-2026", label: "November 2026", dates: "November 7 – November 28", time: "Saturdays, 12:00 PM – 1:30 PM (SAST, UTC+2)", priceUsd: 62 },
  { id: "january-2027", label: "January 2027", dates: "January 2 – January 23", time: "Saturdays, 12:00 PM – 1:30 PM (SAST, UTC+2)", priceUsd: 62 },
];

const mockTests = [
  { id: "september-mock-2026", label: "September Mock Test", date: "September 26, 2026", priceUsd: 10 },
  { id: "november-mock-2026", label: "November Mock Test", date: "November 28, 2026", priceUsd: 10 },
];

const initialFormData: FormData = {
  studentName: "",
  studentAge: "",
  currentSchool: "",
  country: "",
  parentName: "",
  parentEmail: "",
  parentWhatsapp: "",
  preferredContactMethod: "",
  teamName: "",
  teamMembers: "",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [programType, setProgramType] = useState<ProgramType>("training");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedMocks, setSelectedMocks] = useState<string[]>([]);
  const [competitionType, setCompetitionType] = useState<CompetitionType>("");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalUsd = useMemo(() => {
    if (programType === "training") return selectedMonths.length * 62;
    if (programType === "mock-test") return selectedMocks.length * 10;
    if (programType === "competition") {
      if (competitionType === "individual") return 12.5;
      if (competitionType === "team-of-8") return 100;
    }
    return 0;
  }, [programType, selectedMonths, selectedMocks, competitionType]);

  function handleNavClick(e: MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }

  function openRegistration(type: ProgramType) {
    setProgramType(type);
    setModalOpen(true);
    setSelectedMonths([]);
    setSelectedMocks([]);
    setCompetitionType("");
    setErrors({});
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!formData.studentName.trim()) nextErrors.studentName = "Student name is required.";
    if (!formData.studentAge.trim()) nextErrors.studentAge = "Student age is required.";
    else if (Number(formData.studentAge) <= 0) nextErrors.studentAge = "Enter a valid age.";
    else if (Number(formData.studentAge) >= 20) nextErrors.studentAge = "Student must be below age 20.";
    if (!formData.currentSchool.trim()) nextErrors.currentSchool = "School name is required.";
    if (!formData.country.trim()) nextErrors.country = "Country is required.";
    if (!formData.parentName.trim()) nextErrors.parentName = "Parent/guardian name is required.";
    if (!formData.parentEmail.trim()) nextErrors.parentEmail = "Parent email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.parentEmail)) nextErrors.parentEmail = "Enter a valid email.";
    if (!formData.parentWhatsapp.trim()) nextErrors.parentWhatsapp = "WhatsApp number is required.";
    if (!formData.preferredContactMethod) nextErrors.preferredContactMethod = "Select contact method.";

    if (programType === "training" && selectedMonths.length === 0) nextErrors.selection = "Select at least one training month.";
    if (programType === "mock-test" && selectedMocks.length === 0) nextErrors.selection = "Select at least one mock test.";
    if (programType === "competition" && !competitionType) nextErrors.selection = "Select individual or team registration.";

    if (programType === "competition" && competitionType === "team-of-8") {
      if (!formData.teamName.trim()) nextErrors.teamName = "Team name is required.";
      if (!formData.teamMembers.trim()) nextErrors.teamMembers = "Team members are required.";
    }

    if (totalUsd <= 0) nextErrors.total = "Please select a valid option.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveRegistration(reference: string, amountInUsdCents: number) {
    const { data: programData, error: programError } = await supabase
      .from("programs")
      .select("id")
      .eq("slug", programType)
      .single();

    if (programError || !programData) throw programError || new Error("Program not found");

    let competitionOptionId = null;

    if (programType === "competition" && competitionType) {
      const { data: optionData, error: optionError } = await supabase
        .from("competition_options")
        .select("id")
        .eq("slug", competitionType)
        .single();

      if (optionError || !optionData) throw optionError || new Error("Competition option not found");
      competitionOptionId = optionData.id;
    }

    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        program_id: programData.id,
        competition_option_id: competitionOptionId,
        student_name: formData.studentName,
        student_age: Number(formData.studentAge),
        current_school: formData.currentSchool,
        country: formData.country,
        parent_name: formData.parentName,
        parent_email: formData.parentEmail,
        parent_whatsapp: formData.parentWhatsapp,
        preferred_contact_method: formData.preferredContactMethod,
        total_usd: totalUsd,
        paystack_amount_subunit: amountInUsdCents,
        payment_status: "paid",
        paystack_reference: reference,
      })
      .select()
      .single();

    if (regError || !registration) throw regError || new Error("Registration failed");

    if (programType === "training") {
      const { data: months, error } = await supabase.from("training_months").select("id, slug");
      if (error) throw error;

      const rows = months
        ?.filter((month) => selectedMonths.includes(month.slug))
        .map((month) => ({ registration_id: registration.id, training_month_id: month.id }));

      if (rows?.length) {
        const { error: insertError } = await supabase.from("registration_training_months").insert(rows);
        if (insertError) throw insertError;
      }
    }

    if (programType === "mock-test") {
      const { data: mocks, error } = await supabase.from("mock_tests").select("id, slug");
      if (error) throw error;

      const rows = mocks
        ?.filter((mock) => selectedMocks.includes(mock.slug))
        .map((mock) => ({ registration_id: registration.id, mock_test_id: mock.id }));

      if (rows?.length) {
        const { error: insertError } = await supabase.from("registration_mock_tests").insert(rows);
        if (insertError) throw insertError;
      }
    }

    if (programType === "competition" && competitionType === "team-of-8") {
      const members = formData.teamMembers.split("\n").map((name) => name.trim()).filter(Boolean);

      if (members.length) {
        const { error } = await supabase.from("competition_team_members").insert(
          members.map((memberName) => ({
            registration_id: registration.id,
            team_name: formData.teamName,
            member_name: memberName,
          }))
        );
        if (error) throw error;
      }
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      registration_id: registration.id,
      reference,
      status: "paid",
      amount_usd: totalUsd,
      provider: "paystack",
      paid_at: new Date().toISOString(),
    });

    if (paymentError) throw paymentError;
  }

  function handlePayment() {
    if (!validateForm()) return;

    if (!PAYSTACK_PUBLIC_KEY) {
      alert("Paystack public key is missing. Please check your .env.local file.");
      return;
    }

    if (!window.PaystackPop) {
      alert("Paystack script has not loaded. Please refresh the page and try again.");
      return;
    }

    const reference = `LS-PUMAC-${Date.now()}`;
    const amountInUsdCents = Math.round(totalUsd * 100);

    const selectedTrainingMonths = trainingMonths.filter((month) => selectedMonths.includes(month.id));
    const selectedMockTests = mockTests.filter((mock) => selectedMocks.includes(mock.id));

    const paystack = new window.PaystackPop();

    paystack.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email: formData.parentEmail,
      amount: amountInUsdCents,
      currency: "USD",
      reference,
      metadata: {
        program_type: programType,
        student_name: formData.studentName,
        parent_name: formData.parentName,
        parent_email: formData.parentEmail,
        parent_whatsapp: formData.parentWhatsapp,
        charge_currency: "USD",
        total_usd: totalUsd,
        selected_training_months: selectedTrainingMonths,
        selected_mock_tests: selectedMockTests,
        competition_type: competitionType,
        team_name: formData.teamName,
      },
      onSuccess: async (response) => {
        try {
          await saveRegistration(response.reference, amountInUsdCents);
          window.location.href = `/thank-you.html?reference=${response.reference}`;
        } catch (error) {
          console.error(error);
          alert("Payment succeeded but saving failed. Please contact support.");
        }
      },
      onCancel: () => {
        alert("Payment window closed. You can try again when ready.");
      },
    });
  }

  return (
    <main className="page">
      <header className={`site-nav${scrolled ? " site-nav--scrolled" : ""}`}>
        <a href="#hero" className="nav-brand" onClick={(e) => handleNavClick(e, "hero")}>Learning Sprouts</a>

        <nav>
          <a href="#about" onClick={(e) => handleNavClick(e, "about")}>About</a>
          <a href="#focus" onClick={(e) => handleNavClick(e, "focus")}>Program</a>
          <a href="#schedule" onClick={(e) => handleNavClick(e, "schedule")}>Schedule</a>
          <a href="#pricing" onClick={(e) => handleNavClick(e, "pricing")}>Pricing</a>
          <a href="#faqs" onClick={(e) => handleNavClick(e, "faqs")}>FAQs</a>
          <button onClick={() => openRegistration("training")}>Register Now</button>
        </nav>
      </header>

      <section className="hero hero-compact" id="hero">
        <div>
          <p className="eyebrow">PUMaC Africa</p>
          <h1>Princeton University Mathematics Competition Africa</h1>
          <p>
            Train for Africa's first Ivy League Mathematics Competition (PUMaC) with
            Learning Sprouts and Princeton University Math Club.
          </p>
          <p className="hero-subline">
            Training open to students aged 13 – 18 all across Africa (virtual)
          </p>

          <div className="hero-actions button-row">
            <button onClick={() => openRegistration("training")}>Register for Training</button>
            <button className="secondary" onClick={() => openRegistration("competition")}>Register for Competition</button>
          </div>
        </div>
      </section>

      <section className="section about-section-wrap" id="about">
        <div className="about-top">
          <div className="math-visual" aria-hidden="true">
            <div className="formula">a² + b² = c²</div>
            <div className="formula">Σ n = n(n+1)/2</div>
            <div className="formula">f(x) = x² - 4x + 7</div>
            <div className="diagram triangle"></div>
            <div className="diagram circle"></div>
            <div className="grid-lines"></div>
          </div>

          <div>
            <p className="section-label">About the competition</p>
            <h2>A global math pathway for ambitious students</h2>
            <p className="section-copy">
              The Princeton University Mathematics Competition Africa gives high-achieving
              students below age 20 access to structured online training, mock tests, and
              an international-standard competition experience.
            </p>
          </div>
        </div>

        <div className="about-register">
          <p className="section-label">Registration options</p>
          <h3 className="about-register-heading">Who can register for PUMaC?</h3>

          <div className="cards-grid three">
            <article className="register-card">
              <div className="register-card-icon">👤</div>
              <h4>Individual Registration</h4>
              <p>Register for PUMaC training and competition as an individual student. Open to students aged 13–18 from anywhere in Africa.</p>
              <div className="card-actions">
                <button onClick={() => openRegistration("training")}>Register as Individual</button>
              </div>
            </article>

            <article className="register-card">
              <div className="register-card-icon">👥</div>
              <h4>Team Registration</h4>
              <p>Form a team of 8 and register for PUMaC at a discounted rate. Collaborate, compete, and represent your school or community together.</p>
              <div className="card-actions">
                <button onClick={() => openRegistration("competition")}>Register a Team</button>
              </div>
            </article>

            <article className="register-card register-card--school">
              <div className="register-card-icon">🏫</div>
              <h4>School Registration</h4>
              <p>Are you a school? Physical, on-campus training is also available for your school. Get in touch to discuss a tailored programme for your students.</p>
              <div className="card-actions">
                <a href="mailto:ask@learningsprouts.school" className="register-card-mail-btn">
                  <FiMail /> Send an Enquiry
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section learning-sprouts-section">
        <p className="section-label">About Learning Sprouts</p>
        <h2>Future Skills. Real Growth.</h2>
        <p className="section-copy">
          Learning Sprouts is a Kenya-based future skills training provider founded by
          <strong> Harvard University graduates</strong>. We offer research-driven programs
          that help students build academic excellence, creativity, leadership, and real-world
          problem-solving skills.
        </p>
      </section>

      <section className="section" id="focus">
        <p className="section-label">What you'll master</p>
        <h2>Program Focus Areas</h2>

        <div className="cards-grid">
          <article className="info-card"><span>ƒ(x)</span><h3>Algebra</h3><p>Explore equations, inequalities, functions, sequences, and advanced algebraic techniques.</p></article>
          <article className="info-card"><span>#</span><h3>Number Theory</h3><p>Dive into divisibility, prime numbers, modular arithmetic, and proof-based reasoning.</p></article>
          <article className="info-card"><span>△</span><h3>Geometry</h3><p>Strengthen visual reasoning, Euclidean geometry, transformations, and proofs.</p></article>
          <article className="info-card"><span>●●</span><h3>Combinatorics</h3><p>Learn counting principles, permutations, combinations, recursion, and mathematical strategy.</p></article>
        </div>
      </section>

      <section className="section" id="schedule">
        <p className="section-label">Program structure</p>
        <h2>Three Ways to Participate</h2>

        <div className="cards-grid three">
          <article className="program-card">
            <h3>Trainings</h3>
            <p>Weekly weekend online sessions. 1.5 hours per session, 4 sessions per month, covering all competition topics.</p>
            <div className="button-row card-actions">
              <button onClick={() => openRegistration("training")}>Register for Training</button>
            </div>
          </article>

          <article className="program-card">
            <h3>Mock Tests + Review</h3>
            <p>Timed simulations of the real competition with instructor review. Held online, with an in-person option for students based in Kenya.</p>
            <div className="button-row card-actions">
              <button onClick={() => openRegistration("mock-test")}>Register for Mock Test</button>
            </div>
          </article>

          <article className="program-card">
            <h3>Competition Day</h3>
            <p>January 30, 2027. Full-day competition with individual and team rounds at international standard.</p>
            <div className="button-row card-actions">
              <button onClick={() => openRegistration("competition")}>Register for Competition</button>
            </div>
          </article>
        </div>
      </section>

      <section className="section" id="pricing">
        <p className="section-label">Pricing & registration</p>
        <h2>Choose your PUMaC pathway</h2>

        <div className="cards-grid three">
          <article className="pricing-card">
            <h3>Training Program</h3>
            <strong>$62/month</strong>
            <p>Weekly weekend online training sessions.</p>
            <div className="button-row card-actions">
              <button onClick={() => openRegistration("training")}>Register for Training</button>
            </div>
          </article>

          <article className="pricing-card">
            <h3>Mock Tests</h3>
            <strong>$10</strong>
            <p>Timed mock test plus instructor-led review.</p>
            <div className="button-row card-actions">
              <button onClick={() => openRegistration("mock-test")}>Register for Mock Test</button>
            </div>
          </article>

          <article className="pricing-card">
            <h3>Competition Fee</h3>
            <strong>$12.50/student</strong>
            <p>Or $100 per team of 8 students.</p>
            <div className="button-row card-actions">
              <button onClick={() => openRegistration("competition")}>Register for Competition</button>
            </div>
          </article>
        </div>
      </section>

      <section className="section" id="faqs">
        <p className="section-label">FAQs</p>
        <h2>Frequently Asked Questions</h2>

        <div className="faq-list">
          <details>
            <summary>Who can join Princeton University Mathematics Competition Africa?</summary>
            <p>PUMaC is ideal for high school students aged 13–18, but any high-achieving student who hasn't hit their 20th birthday by the competition date can compete.</p>
          </details>

          <details>
            <summary>Are the training sessions online?</summary>
            <p>Yes. Training sessions are fully online and held on weekends so they fit around regular school schedules.</p>
          </details>

          <details>
            <summary>What topics are covered?</summary>
            <p>Training covers Algebra, Number Theory, Geometry, and Combinatorics.</p>
          </details>

          <details>
            <summary>When are the mock tests?</summary>
            <p>The mock tests are online and scheduled for September 26, 2026 and November 28, 2026. We have in-person mock tests for learners based in Nairobi at the Learning Sprouts Center.</p>
          </details>

          <details>
            <summary>When is the competition?</summary>
            <p>The competition date is January 30, 2027.</p>
          </details>

          <details>
            <summary>Can students register as a team?</summary>
            <p>Yes. Students can register individually or as a team of up to 8 students.</p>
          </details>
        </div>
      </section>

      {modalOpen && (
        <div className="modal-backdrop">
          <section className="registration-modal">
            <form className="registration-form">
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>×</button>

              <p className="eyebrow">Registration</p>
              <h2>
                {programType === "training" && "Register for Training"}
                {programType === "mock-test" && "Register for Mock Test"}
                {programType === "competition" && "Register for Competition"}
              </h2>

              <div className="form-grid">
                <label>Student Name<input value={formData.studentName} onChange={(e) => updateField("studentName", e.target.value)} placeholder="Student full name" />{errors.studentName && <span className="error-text">{errors.studentName}</span>}</label>
                <label>Student Age<input type="number" value={formData.studentAge} onChange={(e) => updateField("studentAge", e.target.value)} placeholder="Age" />{errors.studentAge && <span className="error-text">{errors.studentAge}</span>}</label>
                <label>School Name<input value={formData.currentSchool} onChange={(e) => updateField("currentSchool", e.target.value)} placeholder="School name" />{errors.currentSchool && <span className="error-text">{errors.currentSchool}</span>}</label>
                <label>Country<input value={formData.country} onChange={(e) => updateField("country", e.target.value)} placeholder="Country" />{errors.country && <span className="error-text">{errors.country}</span>}</label>
                <label>Parent/Guardian Name<input value={formData.parentName} onChange={(e) => updateField("parentName", e.target.value)} placeholder="Parent full name" />{errors.parentName && <span className="error-text">{errors.parentName}</span>}</label>
                <label>Parent Email<input type="email" value={formData.parentEmail} onChange={(e) => updateField("parentEmail", e.target.value)} placeholder="parent@email.com" />{errors.parentEmail && <span className="error-text">{errors.parentEmail}</span>}</label>
                <label>WhatsApp Number<input value={formData.parentWhatsapp} onChange={(e) => updateField("parentWhatsapp", e.target.value)} placeholder="+254..." />{errors.parentWhatsapp && <span className="error-text">{errors.parentWhatsapp}</span>}</label>
                <label>Preferred Contact<select value={formData.preferredContactMethod} onChange={(e) => updateField("preferredContactMethod", e.target.value as ContactMethod)}><option value="">Select one</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="phone_call">Phone Call</option></select>{errors.preferredContactMethod && <span className="error-text">{errors.preferredContactMethod}</span>}</label>
              </div>

              {errors.selection && <p className="error-text">{errors.selection}</p>}

              {programType === "training" && (
                <div className="option-grid">
                  {trainingMonths.map((month) => (
                    <button type="button" key={month.id} className={selectedMonths.includes(month.id) ? "option-card selected" : "option-card"} onClick={() => setSelectedMonths((cur) => cur.includes(month.id) ? cur.filter((id) => id !== month.id) : [...cur, month.id])}>
                      <strong>{month.label}</strong><span>{month.dates}</span><small>{month.time}</small><b>$62</b>
                    </button>
                  ))}
                </div>
              )}

              {programType === "mock-test" && (
                <div className="option-grid">
                  {mockTests.map((mock) => (
                    <button type="button" key={mock.id} className={selectedMocks.includes(mock.id) ? "option-card selected" : "option-card"} onClick={() => setSelectedMocks((cur) => cur.includes(mock.id) ? cur.filter((id) => id !== mock.id) : [...cur, mock.id])}>
                      <strong>{mock.label}</strong><span>{mock.date}</span><small>Timed mock exam + instructor review</small><b>$10</b>
                    </button>
                  ))}
                </div>
              )}

              {programType === "competition" && (
                <>
                  <div className="option-grid">
                    <button type="button" className={competitionType === "individual" ? "option-card selected" : "option-card"} onClick={() => setCompetitionType("individual")}><strong>Individual Registration</strong><span>January 30, 2027</span><b>$12.50</b></button>
                    <button type="button" className={competitionType === "team-of-8" ? "option-card selected" : "option-card"} onClick={() => setCompetitionType("team-of-8")}><strong>Team Registration</strong><span>Up to 8 students</span><b>$100</b></button>
                  </div>

                  {competitionType === "team-of-8" && (
                    <div className="form-grid team-fields">
                      <label>Team Name<input value={formData.teamName} onChange={(e) => updateField("teamName", e.target.value)} placeholder="Team name" />{errors.teamName && <span className="error-text">{errors.teamName}</span>}</label>
                      <label className="full-span">Team Members<textarea value={formData.teamMembers} onChange={(e) => updateField("teamMembers", e.target.value)} placeholder="One member name per line" />{errors.teamMembers && <span className="error-text">{errors.teamMembers}</span>}</label>
                    </div>
                  )}
                </>
              )}
            </form>

            <aside className="payment-summary">
              <p className="eyebrow">Payment Summary</p>
              <h2>{formatCurrency(totalUsd)}</h2>
              <div className="summary-line"><span>Amount charged</span><strong>{formatCurrency(totalUsd)}</strong></div>
              {errors.total && <p className="error-text">{errors.total}</p>}
              <button type="button" onClick={handlePayment}>Continue to Payment</button>
              <p>Payment will be processed securely in USD through Paystack.</p>
            </aside>
          </section>
        </div>
      )}

      <footer className="site-footer">
        <p className="footer-brand">Learning Sprouts</p>
        <div>
          <a href="https://www.instagram.com/learningsprouts_" target="_blank" rel="noreferrer"><FaInstagram /> Instagram</a>
          <a href="https://learningsprouts.school/" target="_blank" rel="noreferrer"><FiGlobe /> Website</a>
          <a href="mailto:ask@learningsprouts.school"><FiMail /> Email</a>
        </div>
      </footer>
    </main>
  );
}

export default App;