import "./Navbar.css";
import { NavLink } from "react-router-dom";

type Props = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export default function Navbar({ searchTerm, onSearchChange }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">
          <div className="brand__logo">C</div>
          <div className="brand__text">
            <span className="brand__name">Cryptonite</span>
            <span className="brand__tag">Dashboard</span>
          </div>
        </div>

        <nav className="nav">
          <NavLink className="nav__link" to="/" end>
            Home
          </NavLink>
          <NavLink className="nav__link" to="/reports">
            Reports
          </NavLink>
          <NavLink className="nav__link" to="/about">
            About
          </NavLink>
          <NavLink className="nav__link" to="/ai">
            AI
          </NavLink>
        </nav>

        <div className="actions">
          <input
            className="searchInput"
            type="text"
            placeholder="Search by name or symbol..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <button className="btn btn--primary" type="button">
            New
          </button>
        </div>
      </div>
    </header>
  );
}