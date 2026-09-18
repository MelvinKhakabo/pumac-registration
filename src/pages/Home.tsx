import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="page">

      {/* ── Hero: mid-blue gradient ── */}
      <section className="hero" id="hero">
        <div>
          <p className="eyebrow">PUMaC Africa · Princeton University Mathematics Competition</p>
          <h1>Africa's Premier High School Mathematics Competition</h1>
          <p>
            PUMaC Africa brings the Princeton University Mathematics Competition
            to students across the continent — rigorous, inspiring, and built for
            the next generation of African mathematicians.
          </p>
          <div className="hero-actions">
            <Link to="/competition" className="btn btn-primary">
              Register for Competition
            </Link>
            <Link to="/training" className="btn btn-secondary">
              Explore Training
            </Link>
          </div>
          <p className="hero-subline">Open to students aged 13–18 from across Africa</p>
        </div>
      </section>

      {/* ── About: warm cream #fdf6ef ── */}
      <section className="section section--cream-1" id="about">
        <div className="about-layout">
          <div className="about-text">
            <p className="section-label">About</p>
            <h2>What is PUMaC Africa?</h2>
            <p className="section-copy">
              PUMaC Africa is the official Africa mirror of Princeton University's
              Mathematics Competition (PUMaC) — one of the most prestigious high
              school math competitions in the world. We bring this world-class
              experience to African students through in-person and online formats,
              paired with structured training to help every participant grow.
            </p>
            <p className="section-copy">
              Organised by Learning Sprouts, a Nairobi-based future skills training
              provider, PUMaC Africa is designed to challenge, inspire, and connect
              the brightest young mathematical minds across the continent.
            </p>
          </div>
          <div className="about-trophy">
            <div className="trophy-frame">
              <div className="trophy-icon trophy-icon--fx">f(x)</div>
              <div className="trophy-icon trophy-icon--hash">#</div>
              <div className="trophy-icon trophy-icon--tri">
                <svg viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2L38 34H2L20 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="trophy-icon trophy-icon--circles">
                <svg viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/>
                  <circle cx="36" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/>
                </svg>
              </div>
              <div className="trophy-cup">
                <svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 10h50v30c0 16-11 28-25 30v8h10v6H30v-6h10v-8C26 68 15 56 15 40V10z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
                  <path d="M15 18H5c0 12 5 20 10 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M65 18h10c0 12-5 20-10 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Three Ways: lighter cream, navy cards ── */}
      <section className="section section--cream-2" id="participate">
        <div className="section-inner">
          <p className="section-label">How to participate</p>
          <h2>Three Ways to Get Involved</h2>
          <div className="cards-grid">
            <div className="card">
              <p className="card-eyebrow">01</p>
              <h3>Training Sessions</h3>
              <p>
                Monthly live online sessions covering Algebra, Geometry, Number
                Theory, and Combinatorics (the four core PUMaC topics). Each month
                has a standalone topic.
              </p>
              <Link to="/training" className="card-link">View Training Schedule →</Link>
            </div>
            <div className="card">
              <p className="card-eyebrow">02</p>
              <h3>In-Person Competition</h3>
              <p>
                Compete head-to-head at our flagship in-person event in Nairobi,
                Kenya. Individual and team-of-8 categories, with prizes and
                certificates for top performers.
              </p>
              <Link to="/competition" className="card-link">Register for Competition →</Link>
            </div>
            <div className="card">
              <p className="card-eyebrow">03</p>
              <h3>Online Competition</h3>
              <p>
                Can't make it in person? Join the fully virtual edition of PUMaC
                Africa from anywhere on the continent. Same rigour, same prizes.
              </p>
              <Link to="/online-competition" className="card-link">Register Online →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Focus Areas: mild cream, white cards ── */}
      <section className="section section--cream-3" id="focus">
        <div className="section-inner">
          <p className="section-label">Program focus</p>
          <h2>What You'll Study</h2>
          <p className="section-copy">
            Our training curriculum mirrors the four subject areas tested at PUMaC,
            ensuring students are fully prepared for competition day.
          </p>
          <div className="focus-grid">
            <div className="focus-item">
              <h4>Algebra</h4>
              <p>Polynomials, inequalities, sequences, and functional equations.</p>
            </div>
            <div className="focus-item">
              <h4>Geometry</h4>
              <p>Euclidean geometry, trigonometry, and coordinate methods.</p>
            </div>
            <div className="focus-item">
              <h4>Number Theory</h4>
              <p>Divisibility, modular arithmetic, primes, and Diophantine equations.</p>
            </div>
            <div className="focus-item">
              <h4>Combinatorics</h4>
              <p>Counting, probability, graph theory, and combinatorial reasoning.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA: navy section, cream floating card ── */}
      <section className="cta-section" id="cta">
        <div className="cta-card">
          <h2>Ready to compete?</h2>
          <p>
            Join hundreds of students across Africa pushing the boundaries of
            mathematical thinking. Registration is open now.
          </p>
          <div className="hero-actions">
            <Link to="/competition" className="btn btn-primary">
              Register for Competition
            </Link>
            <Link to="/2027" className="btn btn-outline">
              Register Interest for 2027
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}