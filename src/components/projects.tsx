import reactLogo from "#assets/react.svg";
import typescriptLogo from "#assets/typescript-16-svgrepo-com.svg";
import glslLogo from "#assets/glsl-svgrepo-com.svg";
import "#styles/projects.css";
import {TechStack, TechItems} from "./techstack";
import type { TechStackData } from "./techstack";


const TagItems = {
  PERSONAL_PROJECT: {
    bg_color: "#323882",
    name: "personal project",
  },
  SCHOOL_PROJECT: {
    bg_color: "#aa3322",
    name: "school project",
  },
  GROUP_PROJECT: {
    bg_color: "#5566ee",
    name: "group project",
  },
  NO_AI_CODE: {
    bg_color: "#77569e",
    name: "no ai code",
  },
  VIBE_CODING: {
    bg_color: "#569e77",
    name: "vibe coding",
  },
  HACKATHON: {
    bg_color: "#323232",
    name: "Hackathon",
  },
} as const;

const projects = [
  {
    name: "OmniClaw",
    date: "May 2026",
    tags: [ TagItems.HACKATHON, TagItems.GROUP_PROJECT, TagItems.VIBE_CODING],
    stack: [ TechItems.CLAUDE_CODE, TechItems.CODEX, TechItems.REACT, TechItems.TYPESCRIPT, TechItems.FASTAPI, TechItems.MCP ],
    gh_link: "https://github.com/Benjamincf0/omniclaw",
    description: `• Built an MCP server for a student portal, empowering agents to help with homework and emails.
• Integrated OAuth2 to let users login from their favourite MCP client (i.e. Codex / Claude code). • Automated a secondary login flow using a backend playwright instance to log into Omnivox on a user’s behalf.
• Reverse engineered the Omnivox website to replicate the http headers and intercept the bearer token.`,
    visual_link:
      "https://www.youtube.com/embed/bILXbqu0I_Q?autoplay=1&mute=1&loop=1&playlist=bILXbqu0I_Q&controls=0",
  },
  {
    name: "Unfraudify",
    date: "May 2026",
    tags: [ TagItems.HACKATHON, TagItems.GROUP_PROJECT, TagItems.VIBE_CODING],
    stack: [ TechItems.GMAPS, TechItems.CODEX, TechItems.REACT, TechItems.TYPESCRIPT ],
    gh_link: "https://github.com/Benjamincf0/omniclaw",
    description: `• Built an MCP server for a student portal, empowering agents to help with homework and emails.
• Integrated OAuth2 to let users login from their favourite MCP client (i.e. Codex / Claude code).
• Automated a secondary login flow using a backend playwright instance to log into Omnivox on a user’s behalf.
• Reverse engineered the Omnivox website to replicate the http headers and intercept the bearer token.`,
    visual_link:
      "https://www.youtube.com/embed/UJjLP23gBKk",
  },
  {
    name: "NeuralFlow",
    date: "May 2026",
    tags: [ TagItems.PERSONAL_PROJECT, TagItems.NO_AI_CODE ],
    stack: [ TechItems.PYGAME, TechItems.PYTHON, TechItems.NUMPY ],
    gh_link: "https://github.com/Benjamincf0/Neural-Network-Library",
    description: `• Created a NN library complete with mini-batch gradient descent and activation/cost functions.
• Trained a sequential neural network achieving ∼96% test accuracy on MNIST dataset.
• Implemented customizable network and layer shapes for enhanced flexibility and scalability.
• Visualized inference with an interactive real-time digit recognition game using PyGame`,
    visual_link: "https://www.youtube.com/embed/4Dq92_spTPA",
  },
  {
    name: "Cheese Manager",
    date: "May 2026",
    tags: [ TagItems.SCHOOL_PROJECT, TagItems.GROUP_PROJECT, TagItems.NO_AI_CODE ],
    stack: [ TechItems.UMPLE, TechItems.JAVA ],
    gh_link: "https://github.com/Benjamincf0/Neural-Network-Library",
    description: `• Developed an application for a comté cheese distribution business following the MVC pattern in Java.
• Created an aesthetically pleasing user interface with JavaFX using reusable components.
• Collaborated with teammates to create a UML class diagram and state diagram using Umple.`,
    visual_link: "./projects/cheese_manager.png",
  },
  {
    name: "WebChat",
    date: "May 2026",
    tags: [ TagItems.PERSONAL_PROJECT, TagItems.NO_AI_CODE],
    stack: [ TechItems.CSS, TechItems.HTML, TechItems.JAVASCRIPT, TechItems.FIREBASE],
    gh_link: "https://github.com/Benjamincf0/Neural-Network-Library",
    description: `• Developed a full-stack web messaging platform with authentication to message friends.
• Programmed search and adding friends features with Cloud Functions.
• Implemented Firestore security rules to ensure secure communications.`,
    visual_link: "https://www.youtube.com/embed/jmI3FrzOFIY",
  },
  {
    name: "C-Snake",
    date: "May 2026",
    tags: [ TagItems.PERSONAL_PROJECT, TagItems.NO_AI_CODE ],
    stack: [ TechItems.C ],
    gh_link: "https://github.com/Benjamincf0/cnake",
    description: `• Developed an application for a comté cheese distribution business following the MVC pattern in Java.
• Created an aesthetically pleasing user interface with JavaFX using reusable components.
• Collaborated with teammates to create a UML class diagram and state diagram using Umple.`,
    visual_link: "https://www.youtube.com/embed/jgfgDvXhVFg",
  },
  {
    name: "Smart Courier Robot",
    date: "November 2025",
    tags: [ TagItems.SCHOOL_PROJECT, TagItems.GROUP_PROJECT, TagItems.NO_AI_CODE ],
    stack: [ TechItems.PYTHON , TechItems.RASPBERRY_PI ],
    gh_link: "https://github.com/Benjamincf0/cnake",
    description: `• Developed an application for a comté cheese distribution business following the MVC pattern in Java.
• Created an aesthetically pleasing user interface with JavaFX using reusable components.
• Collaborated with teammates to create a UML class diagram and state diagram using Umple.`,
    visual_link: "https://www.youtube.com/embed/plpx3dQ-prg",
  },
  {
    name: "Biximap",
    date: "May 2026",
    tags: [ TagItems.PERSONAL_PROJECT ],
    stack: [ TechItems.GMAPS, TechItems.PYTHON , TechItems.JUPYTER_LAB ],
    gh_link: "https://github.com/Benjamincf0/cnake",
    description: `• Developed an application for a comté cheese distribution business following the MVC pattern in Java.
• Created an aesthetically pleasing user interface with JavaFX using reusable components.
• Collaborated with teammates to create a UML class diagram and state diagram using Umple.`,
    visual_link: "./projects/biximap.png",
  },
  {
    name: "Plushie Detector",
    date: "November 2025",
    tags: [ TagItems.PERSONAL_PROJECT ],
    stack: [ TechItems.PYTHON , TechItems.JUPYTER_LAB, TechItems.LABEL_STUDIO ],
    gh_link: "https://github.com/Benjamincf0/plushie_detector",
    description: `• Trained a YOLO model to detect different plushies by creating my own custom labelled dataset in label studio.`,
    visual_link: "./projects/example_segmentation.png",
  },
];

interface ProjectCardTag {
  name: string;
  bg_color: string;
}

interface ProjectCardProps {
  name: string;
  date: string;
  tags: ProjectCardTag[];
  stack: TechStackData[];
  gh_link?: string;
  live_link?: string;
  description: string;
  visual_link: string;
}

export default function Projects() {
  return (
    <>
      <div id="projects">
        {projects.map((project) => (
          <Projectcard key={project.name} {...project} />
        ))}
      </div>
    </>
  );
}

function Projectcard({
  name,
  tags,
  stack,
  gh_link,
  live_link,
  description,
  visual_link,
}: ProjectCardProps) {
  return (
    <div key={name} className="projectCard card">
      <div className="top">
        {visual_link.includes("https://www.youtube.com") ? (
          <iframe
            width="560"
            height="315"
            src={visual_link}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        ) : ""}
        {visual_link.endsWith(".png")?(
        <img width="100%" src={visual_link}/>
        ):""}
      </div>
      <div className="bottom">
        <div className="header">
          <div className="tags">
            {tags.map(({ name, bg_color }) => (
              <p key={name} style={{ backgroundColor: bg_color }}>
                {name}
              </p>
            ))}
          </div>
          <h3>{name}</h3>
        </div>
        <div className="mainContent">
          <p className="description">{description}</p>
          <TechStack stack={stack} />
        </div>
      </div>
    </div>
  );
}
