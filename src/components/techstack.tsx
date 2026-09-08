import "#styles/techstack.css";

export const TechItems = {
  TYPESCRIPT: {
    name: "Typescript",
    img_src: "typescript-icon",
  },
  GLSL: {
    name: "glsl",
    img_src: "glsl-icon",
  },
  HTML: {
    name: "HTML",
    img_src: "html-icon",
  },
  TENSORFLOW: {
    name: "Tensorflow",
    img_src: "tensorflow-icon",
  },
  REACT: {
    name: "React",
    img_src: "react-icon",
  },
  PYTHON: {
    name: "Python",
    img_src: "python-icon",
  },
  NUMPY: {
    name: "Numpy",
    img_src: "numpy-icon",
  },
  CSS: {
    name: "CSS",
    img_src: "css-icon",
  },
  C: {
    name: "C",
    img_src: "c-icon",
  },
  CPP: {
    name: "C++",
    img_src: "cpp-icon",
  },
  JAVA: {
    name: "Java",
    img_src: "java-icon",
  },
  JAVASCRIPT: {
    name: "Javascript",
    img_src: "javascript-icon",
  },
  FIREBASE: {
    name: "Firebase",
    img_src: "firebase-icon",
  },
  CLAUDE_CODE: {
    name: "Claude code",
    img_src: "claude-code-icon",
  },
  CODEX: {
    name: "Codex",
    img_src: "codex-icon",
  },
  PYGAME: {
    name: "Pygame",
    img_src: "pygame-icon",
  },
  UMPLE: {
    name: "Umple",
    img_src: "umple-icon",
  },
  RASPBERRY_PI: {
    name: "Raspberry Pi",
    img_src: "raspberry-pi-icon",
  },
  FASTAPI: {
    name: "FastAPI",
    img_src: "fastapi-icon",
  },
  MCP: {
    name: "MCP server",
    img_src: "mcp-icon",
  },
  GMAPS: {
    name: "Maps API",
    img_src: "gmaps-icon",
  },
  JUPYTER_LAB: {
    name: "Jupyter lab notebook",
    img_src: "jupyter-lab-icon",
  },
  LABEL_STUDIO: {
    name: "Label Studio",
    img_src: "labelstudio-icon",
  },
  JAVASCRIPT: {
    name: "Javascript",
    img_src: "javascript-icon",
  },
  JAVASCRIPT: {
    name: "Javascript",
    img_src: "javascript-icon",
  },
  JAVASCRIPT: {
    name: "Javascript",
    img_src: "javascript-icon",
  },
  JAVASCRIPT: {
    name: "Javascript",
    img_src: "javascript-icon",
  },
  JAVASCRIPT: {
    name: "Javascript",
    img_src: "javascript-icon",
  },

  // 'as const' freezes the object so its read-only.
} as const;

export interface TechStackData {
  name: string;
  img_src: string;
}

export function TechStack({ stack }: { stack: TechStackData[] }) {
  return (
    <ul className="techStack">
      {stack.map(({ name, img_src }, index) => (
        <li
          key={name}
          style={{
            left: `${-15 * index + 15 * (stack.length - 1)}px`,
          }}
        >
          <div className="wrapper">
            <svg
              role="presentation"
            >
              <use href={"/icons.svg#"+img_src}></use>
            </svg>
            <div className="grower">
              <p>{name}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
