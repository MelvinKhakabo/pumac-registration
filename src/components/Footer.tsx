import { FiMail, FiPhone, FiGlobe, FiMapPin } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Col 1: Brand */}
        <div className="footer-col">
          <p className="footer-brand">PUMaC Africa</p>
          <p className="footer-tagline">
            Africa's First Ivy League Mathematics Competition, hosted
            by Learning Sprouts.
          </p>
        </div>

        {/* Col 2: Contact */}
        <div className="footer-col">
          <p className="footer-col-heading">Contact Us</p>
          <ul>
            <li>
              <FiMail size={14} />
              <a href="mailto:ask@learningsprouts.school">
                ask@learningsprouts.school
              </a>
            </li>
            <li>
              <FiPhone size={14} />
              <a href="tel:+254719218992">+254 719 218 992</a>
            </li>
            <li>
              <FaInstagram size={14} />
              <a
                href="https://www.instagram.com/learningsprouts_/"
                target="_blank"
                rel="noreferrer"
              >
                @learningsprouts_
              </a>
            </li>
            <li>
              <FiGlobe size={14} />
              <a
                href="https://learningsprouts.school"
                target="_blank"
                rel="noreferrer"
              >
                learningsprouts.school
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: Address */}
        <div className="footer-col">
          <p className="footer-col-heading">Find Us</p>
          <address className="footer-address">
            <FiMapPin size={14} />
            <span>
              Loresho Shopping Centre
              <br />
              Loresho, Nairobi
              <br />
              Kenya
            </span>
          </address>
        </div>
      </div>

      <div className="footer-copy">
        <p>
          &copy; {new Date().getFullYear()} Learning Sprouts. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}