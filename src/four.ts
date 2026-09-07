import { load } from "@loaders.gl/core";
import { PLYLoader } from "@loaders.gl/ply";
import { mat3, mat4, vec3, vec4, vec2 } from "gl-matrix";
import { cache } from "react";

abstract class ThreeDObject {
  protected _pose: mat4;

  constructor(pose: mat4) {
    this._pose = mat4.copy(mat4.create(), pose);
  }

  set position([x, y, z]: vec3) {
    this._pose[12] = x;
    this._pose[13] = y;
    this._pose[14] = z;
  }

  get position() {
    const position = vec3.create();
    return mat4.getTranslation(position, this._pose);
  }
}

export class Camera extends ThreeDObject {
  private _intrinsic: mat3;

  // We use distortion coefficients: k1, k2, p1, p2.
  private _dist_coeffs: vec4;

  public screen_dimensions: [number, number]

  public near_plane: number
  public far_plane: number

  constructor(pose: mat4, screen_dimensions: [number, number], near_plane: number, far_plane: number, intrinsic?: mat4, dist_coeffs?: vec4) {
    super(pose);

    this._intrinsic = intrinsic?mat3.copy(mat3.create(), intrinsic):mat3.identity(mat3.create());

    this._dist_coeffs = dist_coeffs?vec4.copy(vec4.create(), dist_coeffs):this._dist_coeffs = vec4.create();
      
    this.screen_dimensions = screen_dimensions;

    this.near_plane = near_plane;
    this.far_plane = far_plane;
  }

  set focal_point(focal_point: vec3) {
    vec3.subtract(focal_point, focal_point, this.position);
    const k_hat_prime = focal_point;

    // NOTE: we don't actually set focal_length. the user must set it explicitly.
    // const focal_length = vec3.length(k_hat_prime)

    const rotation_angle = vec3.angle(this.position, k_hat_prime);

    // The axis of rotation is a vector that is orthogonal to the original z and the new_z.
    const k_hat = vec3.fromValues(0, 0, 1); // Z axis
    const rotation_axis = vec3.create();
    vec3.cross(rotation_axis, k_hat, k_hat_prime);

    // The 3x3 rotation matrix can be found using a formula given an angle and an axis of rotation.
    // https://en.wikipedia.org/wiki/Rodrigues'_rotation_formula
    const this_position_copy = this.position; // make a copy before we change it...
    mat4.fromRotation(this._pose, rotation_angle, rotation_axis);
    // We must re-set the position since this created a brand new matrix.
    this.position = this_position_copy;
  }

  set focal_length([fx, fy]: vec2) {
    this._intrinsic[0] = fx;
    this._intrinsic[4] = fy;
  }

  set dist_coeffs(dist_coeffs: vec4) {
    this._dist_coeffs = vec4.copy(vec4.create(), dist_coeffs);
  }

  get WCDCMatrix(): mat4 {
    // Projection matrix / extrinsic matrix
    const WCVCMatrix = mat4.invert(mat4.create(), this._pose);
    if (WCVCMatrix == null) {
      console.error("WCVCMatrix is null :( => pose not invertible.")
      return mat4.create()
    }

    // Perspective matrix
    const fx = this._intrinsic[0]
    const fy = this._intrinsic[4]
    const cx = this._intrinsic[6]
    const cy = this._intrinsic[7]
    const A = this.near_plane + this.far_plane
    const B = this.near_plane * this.far_plane
    const PerspectiveMatrix = mat4.fromValues(
      fx, 0, -cx, 0,
      0, fy, -cy, 0,
      0,  0,   A, B,
      0,  0,  -1, 0
    )

    // Transform to NDC
    const [W, H] = this.screen_dimensions
    const left = -W/2
    const right = W/2
    const bottom = -H/2
    const top = H/2

    const tx = -(right+left)/(right-left);
    const ty = -(top+bottom)/(top-bottom);
    const tz = -(this.far_plane+this.near_plane)/(this.far_plane-this.near_plane);

    const NDCMatrix = mat4.fromValues(
      2/(right-left), 0, 0, tx,
      0, 2/(top-bottom), 0, ty,
      0, 0, -2/(this.far_plane-this.near_plane), tz,
      0, 0, 0, 1
    )

    // Proj matrix
    const VCDCMatrix = mat4.multiply(mat4.create(), NDCMatrix, PerspectiveMatrix);

    const WCDCMatrix = mat4.multiply(mat4.create(), VCDCMatrix, WCVCMatrix)

    return WCDCMatrix;
  }

}

export class Actor extends ThreeDObject {
  mapper: Mapper;
  shaderProgram: ShaderProgram

  constructor(pose: mat4, mapper: Mapper, shaderProgram: ShaderProgram) {
    super(pose);
    this.mapper = mapper;
    this.shaderProgram = shaderProgram;
  }

  setup(gl: WebGLRenderingContext): boolean {
    // Call shader program setup.
    this.shaderProgram.setup(gl)
    // Call mapper setup.
    this.mapper.setup(gl)
    return true;
  }

  render(gl: WebGLRenderingContext, WCDCMatrix: mat4) {
    // update the uniforms


    // We draw teh triangles to the context.
    return true;
  }
}

export class Renderer {
  private gl: WebGLRenderingContext;
  public camera: Camera;
  public actors: Set<Actor>;
  private _was_setup:boolean = false;

  constructor(gl: WebGLRenderingContext, camera: Camera) {
    this.gl = gl;
    this.camera = camera;
    this.actors = new Set();
  }

  setup() {
    this.gl.getExtension("OES_standard_derivatives");
    this.gl.enable(this.gl.DEPTH_TEST);

    this.actors.forEach(actor => actor.setup(this.gl));
    this._was_setup = true;
  }

  render() {
    if (!this._was_setup) {this.setup()};

    const WCDCMatrix = this.camera.WCDCMatrix;

    this.actors.forEach(actor => actor.render(this.gl, WCDCMatrix));

  }
}

export class Mapper {
  vertices: Array<number>;
  indices: Array<number>;

  constructor(vertices: Array<number>, indices: Array<number>) {
    this.vertices = vertices;
    this.indices = indices;
  }

  setup(gl: WebGLRenderingContext) {
    // 

  }

}

interface ShaderAttribute {
  name: string,
  location: GLint
}


interface ShaderUniforms {
  name: string,
  location: GLint
}

export class ShaderProgram {
  fragmentSource: string
  vertexSource: string
  shader_attributes: Array<ShaderAttribute>
  shader_uniforms: Array<ShaderUniforms>
  program: WebGLProgram|null

  constructor() {
    this.fragmentSource = `
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
`

    this.vertexSource = `
// This attribute holds the position of my vertex.
attribute vec3 a_position;

uniform float u_time;
uniform mat4 MCDCMatrix;

// NOTE: No need to register a varying in javascript, as it is handeled by the glsl shader
// compiler and linker.
// This varying vec3 will hold the position of the vertex, and will be interpolated by the
// GPU before being passed to the fragment shader.
varying vec3 v_position;

void main() {
  vec4 pos = MCDCMatrix*vec4(a_position, 1.0);
  v_position = pos.xyz;
  gl_Position = pos;
}
`
    this.shader_attributes = [{ name: 'a_position', location: -1 }]
    this.shader_uniforms = [
      { name: 'MCDCMatrix', location: -1 }, 
      { name: 'u_time', location: -1}
    ]
    this.program = null;
  }

  setup(gl: WebGLRenderingContext) {
    // Create and compile our vertex & fragment shader with webgl.
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, this.vertexSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      this.fragmentSource,
    );

    // Combining and compiling the both shaders into a program.
    const program = createProgram(gl, vertexShader, fragmentShader);
    this.program = program
    
    // extract attributes
    this.shader_attributes

    // extract uniforms
    for (let i = 0; i < this.shader_attributes.length; i++) {
      const name = this.shader_attributes[i].name;
      const loc = gl.getAttribLocation(
        program,
        name,
      );

      this.shader_attributes[i].location = loc;
    }
  }

  render(gl: WebGLRenderingContext, uniforms: Array<ShaderUniforms>) {

  }

}



// WebGL utils
//
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

