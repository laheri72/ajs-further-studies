import { Github } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>
          &copy; {year} <strong>Imtehanaat-Ukhra</strong> All rights Reserved | Maintained by
        </span>
        <a href="https://github.com/laheri72/" target="_blank" rel="noreferrer">
          <Github size={15} />
          <strong>Laheri72</strong>
        </a>
      </div>
    </footer>
  );
}
