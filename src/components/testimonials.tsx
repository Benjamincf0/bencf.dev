import type { ReactNode } from "react";
import "#styles/testimonials.css";

const testimonials = [
  {
    author: "Alexandru Ciobanu",
    message: (
      <>It was a pleasure to work with Ben. He is <strong>intrinsically motivated</strong>, curious, and capable of absorbing, and quickly organizing vast amounts of technical information, including research literature. He is <strong>thorough and attentive to detail</strong>, but also <strong>productive</strong>. He is unafraid of working on <strong>complex systems</strong>, and helped us advance, significantly, several such projects.</>
    ),
  },
//   {
//     author: "Bob ",
//     message: `babanini
// asdf`,
//   },
//   {
//     author: "Jeff Epstein teh new yorkersd",
//     message: `babanini
// asdf`,
//   },
//   {
//     author: "Palm beach pete",
//     message: `Bombosini gosini
// tralalero tralala`,
//   },
];

interface Testimonial {
  author: string;
  message: ReactNode;
}

export default function Testimonials() {
  return (
    <div className="testimonial_carousel">
      {[0].map(() => (
        <ul className="testimonials">
          {testimonials.map(
            ({ author, message }: Testimonial, index: number) => (
              <li
                key={author}
                className="testimonial"
                style={{ "--i": index } as React.CSSProperties}
              >
                <p>{message}</p>
                <h3>- {author}</h3>
              </li>
            ),
          )}
        </ul>
      ))}
    </div>
  );
}
