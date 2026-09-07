import { useEffect, useRef, useState } from "react";
import "#styles/hero.css";
import { load } from "@loaders.gl/core";
import {
  ShaderProgram as BasicShaderProgram,
  Mapper,
  Actor,
  Camera,
  Renderer,
} from "./../four.ts";
import statusActiveIcon from "#assets/status-active-svgrepo-com.svg";
import { PLYLoader } from "@loaders.gl/ply";
import { mat4, vec3 } from "gl-matrix";
const { bunnyVertices, bunnyIndices } = await loadPlyBuffer("./bunny.ply");

type WebGLShaderType =
  | typeof WebGLRenderingContext.FRAGMENT_SHADER
  | typeof WebGLRenderingContext.VERTEX_SHADER;

function createShader(
  gl: WebGLRenderingContext,
  type: WebGLShaderType,
  shaderSource: string,
): WebGLShader {
  var shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Something aint right");
  }

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    throw new Error(`Could not create shader womp womp. \n\n${info}`);
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram();

  // Attach pre-existing shaders
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    throw new Error(`Could not compile WebGL program. \n\n${info}`);
  }
  return program;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  const needResize =
    canvas.width !== displayWidth || canvas.height !== displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}

async function loadPlyBuffer(url: string) {
  const data = await load(url, PLYLoader);
  const vertices = data.attributes.POSITION.value as Float32Array;

  let indices = data.indices?.value;

  // Force 16-bit array
  if (indices instanceof Uint32Array) {
    indices = new Uint16Array(indices);
  }

  if (!indices) {
    throw Error(`Failed to load indices from ply.`);
  }

  return { vertices, indices };
}

// let WCVCMatrix = mat4.create();
// mat4.rotateY(WCVCMatrix, WCVCMatrix, 1.14);

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<string>("");

  // This function runs after the component renders.
  // It initializes our webgl context, shader program, and positionBuffer.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;
    else {
      setCanvasContext("webgl");
    }
    if (gl.canvas instanceof OffscreenCanvas) return;

    resizeCanvasToDisplaySize(gl.canvas);

    const cam = new Camera(
      mat4.create(),
      [gl.canvas.width, gl.canvas.height],
      10,
      9999,
    );

    const ren = new Renderer(gl, cam);

    const bunnyActor = new Actor(
      mat4.identity(mat4.create()),
      new Mapper(bunnyVertices, bunnyIndices),
      new BasicShaderProgram(),
    );

    ren.actors.add(bunnyActor);

    // Create the observer
    // const observer = new ResizeObserver();

    setInterval(() => {
      if (gl.canvas instanceof OffscreenCanvas) return;
      resizeCanvasToDisplaySize(gl.canvas);

      ren.render();
    }, 10);
  }, []); // Only runs once since we pass [] as depsList

  return (
    <div id="hero">
      <div className="infoTag">
        {canvasContext ? <img className="icon" src={statusActiveIcon} /> : ""}
        <p>{canvasContext ? canvasContext : "no rendering backend"}</p>
      </div>
      <canvas
        ref={canvasRef}
        id="myCanvas"
      />
    </div>
  );
}
