import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="home">
      <section className="home-inner fade-up">
        <div className="home-mark">EE</div>
        <h1>External Examinations Portal</h1>
        <p>
          Imtehanaat-Ukhra — An institutional portal for registering external examination plans beyond Jamea,
          raza coordination, and Idara review.
        </p>
        <div className="entry-grid">
          <Link className="entry-card" to="/student">
            <GraduationCap size={30} />
            <h2>Student Portal</h2>
            <p>Register external examination details, preserve your draft, and view raza status.</p>
            <span>
              Enter Student Portal <ArrowRight size={16} />
            </span>
          </Link>
          <Link className="entry-card accent" to="/admin">
            <ShieldCheck size={30} />
            <h2>Admin Portal</h2>
            <p>Review student submissions, search records, approve requests, and leave Idara notes.</p>
            <span>
              Enter Admin Portal <ArrowRight size={16} />
            </span>
          </Link>
        </div>
        <div className="privacy-line">Sign in with Google to continue. Data is private and role-protected.</div>
      </section>
    </main>
  );
}
