import Contribution from "#components/contribution.tsx";
import { contributions } from "../data/contributions";

export default function Contributions() {
  return (
    <div className="contributions-container">
      {contributions.map((contribution) => (
        <Contribution key={contribution.url} {...contribution} />
      ))}
    </div>
  );
}
