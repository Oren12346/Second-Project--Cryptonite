// src/pages/About.tsx
import "./About.css";
import aboutImg from "../assets/shiesty.webp";

export default function About() {
  return (
    <div className="aboutPage">
      <header className="aboutHeader">
        <h1 className="aboutTitle">About</h1>
        <p className="aboutSubtitle">
          Information about the project, its main features, and the author.
        </p>

        <div className="aboutImageWrap">
          <img
            src={aboutImg}
            alt="Invincible illustration"
            className="aboutImage"
          />
        </div>
      </header>

      <section className="aboutGrid">
        <article className="aboutCard">
          <h2 className="aboutCardTitle">Project Description</h2>
          <p className="aboutText">
            Cryptonite is a cryptocurrency tracking web application built with
            React and TypeScript. The project allows users to view crypto coins,
            explore market data, and follow price changes in a clean and
            user-friendly interface.
          </p>
        </article>

        <article className="aboutCard">
          <h2 className="aboutCardTitle">Main Features</h2>
          <ul className="aboutList">
            <li>View a list of popular cryptocurrencies.</li>
            <li>Select up to 5 coins for tracking.</li>
            <li>View detailed information for each coin.</li>
            <li>Real-time price updates in the Reports page.</li>
            <li>Simulated AI recommendation (BUY / DON'T BUY).</li>
          </ul>
        </article>

        <article className="aboutCard">
          <h2 className="aboutCardTitle">Created By</h2>
          <p className="aboutText">Oren Meshulam</p>
        </article>
      </section>
    </div>
  );
}
