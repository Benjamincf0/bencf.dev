import Navbar from "#components/navbar.tsx";
import Hero from "#components/hero.tsx";
import Experiences from "#components/experiences.tsx";
import Projects from "#components/projects.tsx";
import ContactForm from "#components/contactme.tsx";
import Testimonials from "#components/testimonials.tsx"
import Readings from "#components/readings.tsx"
import Contributions from "#components/contributions.tsx"
import "#styles/App.css";

function App() {
  return (
    <>
      <section id="header" >
        <Navbar />
        <Hero />
      </section>

      <div className="ticks"></div>

      <section id="main">
        {/* <h2><span className="hover-line">Education</span></h2> */}
        <h2><span className="hover-line">Experience</span></h2>
        <Experiences />
        <div className="ticks"></div>
        <h2><span className="hover-line">Projects</span></h2>
        <Projects />
        <h2><span className="hover-line">Recent readings</span></h2>
        <Readings />
        <h2><span className="hover-line">Open Source Contributions</span></h2>
        <Contributions />
        <h2><span className="hover-line">Testimonials</span></h2>
        <Testimonials />
      </section>

      <section id="contact">
        <ContactForm />
      </section>

      <section id="footer">
        <h4>Copyright © 2026 Benjamin Curis-Friedman</h4>
      </section>
    </>
  );
}

export default App;
