import "#styles/contactme.css";
import { useState } from "react";

const LAMBDA_ENDPOINT =
  "https://5cepsmezf5cyzd3t2toigs5nhe0rljhp.lambda-url.us-east-1.on.aws/";

export default function ContactForm() {
  const [contactFormState, setContactFormState] = useState<string>("Send");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // -> stops reload -> stops auto-reset -> keeps data
    const form = e.currentTarget;
    const formData = new FormData(e.currentTarget);

    setContactFormState("Sending ...");
    const jsonFormData = JSON.stringify(Object.fromEntries(formData.entries()));
    console.log(jsonFormData);

    try {
      const response = await fetch(LAMBDA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonFormData,
      });
      if (!response.ok) {
        throw new Error(`Response status ${response.status}`);
      }

      setContactFormState("Sent");
      form.reset();
    } catch (error) {
      setContactFormState(`Failed: ${error.message}`);
    }
    setTimeout(() => {
      setContactFormState(`Send`);
    }, 3000);
  }

  return (
    <>
      <div id="contactForm">
        <form onSubmit={handleSubmit}>
          <div className="left">
            <h3>Let's work together!</h3>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
            />
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="johndoe@gmail.com"
              required
            />
            <button
              type="submit"
              disabled={contactFormState != "Send"}
              data-status={contactFormState.includes("Failed") ? "error" : contactFormState === "Sent" ? "sent" : "idle"}
            >
              {contactFormState}
            </button>
          </div>
          <div className="right">
            <label htmlFor="subject">Subject</label>
            <input id="subject" name="subject" type="text" required />
            <label htmlFor="textarea">Your message</label>
            <textarea id="textarea" name="message" required></textarea>
          </div>
        </form>
      </div>
    </>
  );
}
