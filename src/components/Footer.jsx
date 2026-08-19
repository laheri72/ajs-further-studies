import { Github, ShieldCheck } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <ShieldCheck size={16} className="footer-icon" />
          <span>
            &copy; {year} <strong>Imtehanaat-Ukhra</strong> — External Examinations Portal. All Rights Reserved.
          </span>
        </div>
        <div className="footer-links">
          <a
            href="https://github.com/laheri72/"
            target="_blank"
            rel="noreferrer"
            className="footer-github-link"
            title="Maintained by Laheri72"
          >
            <Github size={15} />
            <span>Maintained by <strong>Laheri72</strong></span>
          </a>
        </div>
      </div>
    </footer>
  );
}
