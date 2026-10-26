import type { ReactNode } from "react";
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
    description: (
      <>Built an <strong>MCP server</strong> for a student portal, empowering agents to help with homework and emails. Integrated <strong>OAuth2</strong> to let users login from their favourite MCP client (i.e. Codex / Claude code). Automated a secondary login flow using a backend <strong>playwright</strong> instance to log into Omnivox on a user’s behalf. <strong>Reverse engineered</strong> the Omnivox website to replicate the http headers and intercept the bearer token.</>
    ),
    visual_link:
      "https://www.youtube.com/embed/bILXbqu0I_Q",
  },
  {
    name: "CPU",
    date: "August 2026",
    tags: [ TagItems.SCHOOL_PROJECT ],
    stack: [  ],
    gh_link: "https://github.com/Benjamincf0/uni",
    description: (
      <>Designed and implemented an <strong>ARM cpu</strong> using logic gates. Designed an <strong>ALU</strong>, register file, and a state machine to manage the 5 stage instructions. Implemented branching operations, along with memory read/write. Tested the cpu by executing <strong>assembly instructions</strong> that performed multiplication.</>
    ),
    visual_link:
      "./projects/cpu.png",
  },
  {
    name: "Miniasyncio",
    date: "June 2026",
    tags: [ TagItems.PERSONAL_PROJECT],
    stack: [ TechItems.PYTHON ],
    gh_link: "",
    description: (
      <>Designed and implemented an <strong>asynchronous python package</strong> inspired by Asyncio. Implemented my own <strong>coroutines</strong>, <strong>event loop</strong>, and tasks. Published my package on <strong>pypi.org</strong> for easy install via pip.</>
    ),
    visual_link:
      "./projects/miniasyncio.png",
  },
  {
    name: "Unfraudify",
    date: "May 2026",
    tags: [ TagItems.HACKATHON, TagItems.GROUP_PROJECT, TagItems.VIBE_CODING],
    stack: [ TechItems.GMAPS, TechItems.CODEX, TechItems.REACT, TechItems.TYPESCRIPT ],
    gh_link: "https://github.com/Benjamincf0/unfraud",
    description: (
      <>A fraud triage app built for the MCP Hacks challenge. Ingests a CSV of card transactions, scores every row for <strong>fraud risk</strong>, explains each alert in plain language. Gives a human reviewer a <strong>keyboard-driven queue</strong> to approve, dismiss, or escalate decisions.</>
    ),
    visual_link:
      "https://www.youtube.com/embed/UJjLP23gBKk",
  },
  {
    name: "NeuralFlow",
    date: "May 2026",
    tags: [ TagItems.PERSONAL_PROJECT, TagItems.NO_AI_CODE ],
    stack: [ TechItems.PYGAME, TechItems.PYTHON, TechItems.NUMPY ],
    gh_link: "https://github.com/Benjamincf0/Neural-Network-Library",
    description: (
      <>Created a NN library complete with <strong>mini-batch gradient descent</strong> and activation/cost functions. Trained a sequential neural network achieving <strong>∼96% test accuracy</strong> on <strong>MNIST</strong> dataset. Implemented customizable network and layer shapes for enhanced flexibility and scalability. Visualized inference with an interactive real-time digit recognition game using <strong>PyGame</strong></>
    ),
    visual_link: "https://www.youtube.com/embed/4Dq92_spTPA",
  },
  {
    name: "CheeseOps",
    date: "May 2026",
    tags: [ TagItems.SCHOOL_PROJECT, TagItems.GROUP_PROJECT, TagItems.NO_AI_CODE ],
    stack: [ TechItems.UMPLE, TechItems.JAVA ],
    gh_link: "https://github.com/Benjamincf0/CheeseManager",
    description: (
      <>Developed an application for a comté cheese distribution business following the <strong>MVC</strong> pattern in Java. Created an aesthetically pleasing user interface with <strong>JavaFX</strong> using reusable components. Collaborated with teammates to create a <strong>UML</strong> class diagram and state diagram using <strong>Umple</strong>.</>
    ),
    visual_link: "./projects/cheese_manager.png",
  },
  {
    name: "WebChat",
    date: "May 2026",
    tags: [ TagItems.PERSONAL_PROJECT, TagItems.NO_AI_CODE],
    stack: [ TechItems.CSS, TechItems.HTML, TechItems.JAVASCRIPT, TechItems.FIREBASE],
    gh_link: "https://github.com/Benjamincf0/WebChat",
    description: (
      <>Developed a <strong>full-stack</strong> web messaging platform with <strong>authentication</strong> to message friends. Programmed search and adding friends features with <strong>Cloud Functions</strong>. Implemented <strong>Firestore security rules</strong> to ensure secure communications.</>
    ),
    visual_link: "https://www.youtube.com/embed/jmI3FrzOFIY",
  },
  {
    name: "C-Snake",
    date: "May 2026",
    tags: [ TagItems.PERSONAL_PROJECT, TagItems.NO_AI_CODE ],
    stack: [ TechItems.C ],
    gh_link: "https://github.com/Benjamincf0/cnake",
    description: (
      <>Learned <strong>ANSI escape sequences</strong> to render stuff to the screen with colours, etc. Implemented a <strong>circular array</strong> using a struct. Used <strong>termios</strong> to customize the terminal and to allow for non-blocking & non-buffered controls.</>
    ),
    visual_link: "https://www.youtube.com/embed/jgfgDvXhVFg",
  },
  {
    name: "RoboDelivery",
    date: "November 2025",
    tags: [ TagItems.SCHOOL_PROJECT, TagItems.GROUP_PROJECT, TagItems.NO_AI_CODE ],
    stack: [ TechItems.PYTHON , TechItems.RASPBERRY_PI ],
    gh_link: "https://github.com/BagetTeam/bakers-pi-final",
    description: (
      <>A robot that <strong>delivers packages to rooms automatically</strong>! It <strong>traverses the map</strong>, looks through rooms without meetings (red pads) and finds the package landing pad (green pad) where the package is going to be delivered at. After a successful delivery, it returns back to the mail room (blue room), and celebrates. Cool sound effects added to the robot to give a nice ambiance when the robot is traveling and delivering packages, including a superb audio when it finishes its job.. ;)</>
    ),
    visual_link: "https://www.youtube.com/embed/plpx3dQ-prg",
  },
  {
    name: "Biximap",
    date: "May 2026",
    tags: [ TagItems.PERSONAL_PROJECT ],
    stack: [ TechItems.GMAPS, TechItems.PYTHON , TechItems.JUPYTER_LAB ],
    gh_link: "https://github.com/Benjamincf0/learning",
    description: (
      <>I used bixi's <strong>open data</strong> in combination with the <strong>google maps routes api</strong> to guess the paths taken by bixi riders, and plot them into a nice <strong>heatmap</strong>. Take a look at the notebooks if you like :)</>
    ),
    visual_link: "./projects/biximap.png",
  },
  {
    name: "Plushie Detector",
    date: "November 2025",
    tags: [ TagItems.PERSONAL_PROJECT ],
    stack: [ TechItems.PYTHON , TechItems.JUPYTER_LAB, TechItems.LABEL_STUDIO ],
    gh_link: "https://github.com/Benjamincf0/plushie_detector",
    description: (
      <>Trained a <strong>YOLO</strong> model to detect different plushies by creating my own <strong>custom labelled dataset</strong> in <strong>label studio</strong>.</>
    ),
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
  description: ReactNode;
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
            width="100%"
            height="100%"
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
              <p key={name} style={{ "--tag-color": bg_color } as React.CSSProperties}>
                {name}
              </p>
            ))}
          </div>
          <div className="projectTitle">
          <h3>{name}</h3>
          <a className="github" href={gh_link} target="_blank">
            <svg
              href={gh_link}
              role="presentation"
              aria-hidden="true"
            >
              <use href="/icons.svg#github-icon"></use>
            </svg>
          </a>
          </div>
        </div>
        <div className="mainContent">
          <p className="description">{description}</p>
          <TechStack stack={stack} />
        </div>
      </div>
    </div>
  );
}
