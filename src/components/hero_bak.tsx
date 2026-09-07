import { useEffect, useRef, useState } from "react";
import "#styles/hero.css";
import { load } from "@loaders.gl/core";
// import { PolyDataMapper, WebGLActor, Camera, WebGLRenderer} from "./../four.ts"
import statusActiveIcon from "#assets/status-active-svgrepo-com.svg";
import { PLYLoader } from "@loaders.gl/ply";
const plyData = await loadPlyBuffer("./bunny.ply");
import { mat4, vec3 } from "gl-matrix";

const vertexShaderSource = `
  // This attribute holds the position of my vertex.
  attribute vec3 a_position;

  uniform float u_time;

  uniform mat4 WCVCMatrix;

  // NOTE: No need to register a varying in javascript, as it is handeled by the glsl shader
  // compiler and linker.

  // This varying vec3 will hold the position of the vertex, and will be interpolated by the
  // GPU before being passed to the fragment shader.
  varying vec3 v_position;

  mat4 getRotationY(float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return mat4(
            c, 0.0,  -s, 0.0,
          0.0, 1.0, 0.0, 0.0,
            s, 0.0,   c, 0.0,
          0.0, 0.0, 0.0, 1.0
      );
  }
 
  void main() {
    vec4 pos = getRotationY(u_time*0.0001)*WCVCMatrix*vec4(a_position, 1.0)*(sin(32.0*asin(a_position.z/length(a_position))+u_time*0.001)*0.02+0.98);
    v_position = pos.xyz;
    gl_Position = vec4(pos.xyz*9.0 - vec3(0, 0.9, 0), 1.0);
  }
`;

const fragmentShaderSource = `
  // This macro enables the derivative of the varyings accross adjacent fragments.
  #extension GL_OES_standard_derivatives : enable

  // fragment shaders don't have a default precision so we need
  // to pick one. mediump is a good default
  precision mediump float;

  // This vec3 is passed from the GPU and interpolated.
  varying vec3 v_position;

  void main() {
    // Compute the derivative of the v_position accross adjacent fragments.
    
    // partial derivative of the position wrt. the horizontal axis of the screen.
    // Basically saying, how does the (interpolated) position of the vertex vary
    // in each dimension when we move 1 pixel/fragment to the right.
    vec3 dx = dFdx(v_position);

    // Same thing but wrt. vertical axis of screen.
    vec3 dy = dFdy(v_position);

    vec3 normal = normalize(cross(dx, dy));
    vec3 color = normal * 0.5 + 0.5;
    
    gl_FragColor = vec4(color, 1); // return reddish-purple
  }
`;

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

let WCVCMatrix = mat4.create();
mat4.rotateY(WCVCMatrix, WCVCMatrix, 1.14);

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

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

    gl.getExtension("OES_standard_derivatives");
    gl.enable(gl.DEPTH_TEST);

    // Create and compile our vertex & fragment shader with webgl.
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    // Combining and compiling the both shaders into a program.
    const program = createProgram(gl, vertexShader, fragmentShader);

    // We get the location of our vertex shader attribute that is declared in the vertex shader.
    const positionAttributeLocation = gl.getAttribLocation(
      program,
      "a_position",
    );

    // This holds the vertices of the triangles.
    const positionBuffer = gl.createBuffer();

    // This holds the indices of the vertices forming each triangle.
    const indexBuffer = gl.createBuffer();

    // This binds my positionBuffer to the gl.ARRAY_BUFFER bind point.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Now we create a strongly typed array, and copy it to the GPU on the gl.ARRAY_BUFFER bind point.
    // gl.STATIC_DRAW is a hint to webgl that we won't change this buffer often, so it can optimize things.
    gl.bufferData(gl.ARRAY_BUFFER, plyData.vertices, gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, plyData.indices, gl.STATIC_DRAW);
    console.log("testing");

    const WCVCMatrixUniformLocation = gl.getUniformLocation(
      program,
      "WCVCMatrix",
    );
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");
    if (!WCVCMatrixUniformLocation) {
      throw Error("Couldn't fetch uniform location.");
    }

    // RENDERING ...

    // This makes sure the canvas pixels match the css pixel dimensions.
    resizeCanvasToDisplaySize(gl.canvas);

    // Here we're telling webgl what's our canvas dimensions so that it can convert from clip -> screen space.
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    // NOTE: I think if we had a setup where different objects could draw themselves, we might want to specify the program associated with that object before calling drawElements to allow for different shading of different objects.
    gl.useProgram(program);

    // Next we tell webgl how to take our position buffer and supply it as the attribute to our vertex shader.

    // Turn on the vertex shader attribute array
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );

    // set the resolution uniform of the fragment shader.
    gl.uniformMatrix4fv(WCVCMatrixUniformLocation, false, WCVCMatrix);
    gl.uniform1f(timeUniformLocation, performance.now());

    // Now we tell it to execute finally 😅
    const primitiveType = gl.TRIANGLES;
    offset = 0;
    const count = plyData.indices.length;
    const indexType = gl.UNSIGNED_SHORT;
    gl.drawElements(primitiveType, count, indexType, offset);
    console.log("rendered");

    // Create the observer
    // const observer = new ResizeObserver();

    // observer.observe(canvas);
    setInterval(() => {
      // console.log(WCVCMatrix);
      if (gl.canvas instanceof OffscreenCanvas) return;
      resizeCanvasToDisplaySize(gl.canvas);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear the canvas.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      gl.uniformMatrix4fv(WCVCMatrixUniformLocation, false, WCVCMatrix);
      gl.uniform1f(timeUniformLocation, performance.now());

      // Draw the geometry.
      const primitiveType = gl.TRIANGLES;
      const offset = 0;
      const count = plyData.indices.length;
      const indexType = gl.UNSIGNED_SHORT;
      gl.drawElements(primitiveType, count, indexType, offset);
      // console.log("rendered");
    }, 10);
  }, []); // Only runs once since we pass [] as depsList

  let x0 = null;
  let y0 = null;
  function startDrag() {
    setIsDragging(true);
    console.log("started dragging");
  }

  function drag(e) {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!x0 || !y0) {
      x0 = x;
      y0 = y;
      return;
    }

    const phi = Math.atan(x - x0);
    const theta = Math.atan(y - y0);

    mat4.rotateY(WCVCMatrix, WCVCMatrix, 0.01 * theta);
    mat4.rotateX(WCVCMatrix, WCVCMatrix, 0.01 * phi);
  }

  function stopDrag() {
    setIsDragging(false);
  }

  return (
    <div id="hero">
      <div className="infoTag">
        {canvasContext ? <img className="icon" src={statusActiveIcon} /> : ""}
        <p>{canvasContext ? canvasContext : "no rendering backend"}</p>
      </div>
      <canvas
        ref={canvasRef}
        id="myCanvas"
        onMouseDown={startDrag}
        onMouseMove={drag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      />
    </div>
  );
}
