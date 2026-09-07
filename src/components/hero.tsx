import { useEffect, useRef, useState } from "react";
import "#styles/hero.css";
import { load } from "@loaders.gl/core";
// import { PolyDataMapper, WebGLActor, Camera, WebGLRenderer} from "./../four.ts"
import statusActiveIcon from "#assets/status-active-svgrepo-com.svg";
// import { PLYLoader } from "@loaders.gl/ply";
// const plyData = await loadPlyBuffer("./bunny.ply");
// import { mat4, vec3 } from "gl-matrix";
import * as THREE from "three/webgpu";
import { SPZLoader } from "three/addons/loaders/SPZLoader.js";
// import { GaussianSplatPLYLoader } from "three/addons/loaders/GaussianSplatPLYLoader.js";
import { GaussianSplat } from "three/addons/objects/GaussianSplat.js";

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

function createTerminal({
  width = 1024,
  height = 512,
  bgColor = '#000000',
  textColor = '#00ff00',
  font = '28px "Courier New", monospace',
  padding = 20,
  lineHeight = 34
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const texture = new THREE.CanvasTexture(canvas);
  const lines = [];

  function redraw() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = textColor;
    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + i * lineHeight);
    });
    texture.needsUpdate = true;
  }

  function appendLine(text) {
    lines.push(text);
    const maxLines = Math.floor((height - padding * 2) / lineHeight);
    if (lines.length > maxLines) lines.shift(); // drop oldest, keeps it scrolling
    redraw();
  }

  redraw();
  return { canvas, texture, appendLine };
}

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // This function runs after the component renders.
  // It initializes our webgl context, shader program, and positionBuffer.
  useEffect(() => {
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      resizeCanvasToDisplaySize(canvas);
      const renderer = new THREE.WebGPURenderer({ canvas });
      await renderer.init();
      renderer.setPixelRatio(window.devicePixelRatio);
      // renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.01,
        100,
      );
      camera.up.set(0, -1, 0);

      // load splat
      const splatGeometry = await new SPZLoader().loadAsync("splat(4).spz");
      const splats = new GaussianSplat(splatGeometry);
      splats.translateZ(0.1)
      scene.add(splats);

      const curve = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 2, 2),
          new THREE.Vector3(0, 1, 0.1),
          new THREE.Vector3(0, 0.5, 0.01),
        ],
        false,
      ); // true = closed loop

      const clock = new THREE.Clock();
      const duration = 6; // seconds for one full loop

      const terminal = createTerminal();

      const geometry = new THREE.PlaneGeometry(0.4, 0.23);
      const material = new THREE.MeshBasicMaterial({ map: terminal.texture });
      const screen = new THREE.Mesh(geometry, material);
      screen.translateZ(0.08);
      screen.rotation.z = Math.PI;
      screen.rotation.x = -Math.PI / 2;
      scene.add(screen);

      terminal.appendLine('> Welcome to my portfolio website');
      terminal.appendLine('> Look at my projects!');

      renderer.setAnimationLoop(() => {
        const t = Math.min(clock.getElapsedTime(), duration) / duration; // 0 → 1
        const pos = curve.getPointAt(1 - (t - 1) ** 4);
        camera.position.copy(pos);
        camera.lookAt(0, 0, 0); // or use curve.getTangentAt(t) to look ahead

        renderer.render(scene, camera);
      });
    })();
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
      <canvas ref={canvasRef} id="myCanvas" />
    </div>
  );
}
