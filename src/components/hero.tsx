import { useEffect, useRef } from "react";
import "#styles/hero.css";
import * as THREE from "three/webgpu";
import { SPZLoader } from "three/addons/loaders/SPZLoader.js";
import { GaussianSplat, distortCenter } from "../GaussianSplat.js";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    let renderer: THREE.WebGPURenderer | undefined;
    let rendererInitialized = false;
    let active = true;

    const onMouseMove = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    async function initializeScene() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderer = new THREE.WebGPURenderer({ canvas });
      await renderer.init();
      rendererInitialized = true;
      if (!active) {
        void renderer.dispose();
        return;
      }
      renderer.setPixelRatio(window.devicePixelRatio);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
      camera.up.set(0, 0, -1);

      const resizeRenderer = () => {
        const { clientWidth: width, clientHeight: height } = canvas;
        if (width === 0 || height === 0) return;

        renderer?.setSize(width, height, false);
        camera.aspect = width / height;
        // Keep the portrait offset beside the title and aligned while scrolling.
        camera.setViewOffset(
          width,
          height,
          -height / 4,
          window.scrollY,
          width,
          height,
        );
        camera.updateProjectionMatrix();
      };

      resizeRenderer();

      const splatGeometry = await new SPZLoader().loadAsync("splat_ben2.spz");
      if (!active) return;
      const splats = new GaussianSplat(splatGeometry);
      splats.translateZ(0.1);
      scene.add(splats);

      const cameraPath = new THREE.CatmullRomCurve3(
        [new THREE.Vector3(-3, -9, -3), new THREE.Vector3(0, -7, -1)],
        false,
      );

      const clock = new THREE.Clock();
      const introDuration = 6;
      const lookAtTarget = new THREE.Vector3(0, 0, 0);
      const viewDirection = new THREE.Vector3();
      const orbitRight = new THREE.Vector3();
      const orbitRange = 0.4;

      renderer.setAnimationLoop(() => {
        resizeRenderer();

        distortCenter.value.set(0.5 - pointer.x * camera.aspect, 0.3, pointer.y);
        const progress = Math.min(clock.getElapsedTime(), introDuration) / introDuration;
        const position = cameraPath.getPointAt(1 - (progress - 1) ** 4);
        tilt.x = THREE.MathUtils.lerp(tilt.x, pointer.x, 0.05);
        tilt.y = THREE.MathUtils.lerp(tilt.y, pointer.y, 0.05);

        // Orbit the camera position around the world origin, keeping its up axis fixed.
        orbitRight
          .crossVectors(viewDirection.subVectors(lookAtTarget, position), camera.up)
          .normalize();
        position.applyAxisAngle(camera.up, tilt.x * orbitRange);
        orbitRight.applyAxisAngle(camera.up, tilt.x * orbitRange);
        position.applyAxisAngle(orbitRight, tilt.y * orbitRange);
        camera.position.copy(position);
        camera.lookAt(lookAtTarget);

        renderer.render(scene, camera);
      });
    }

    void initializeScene();

    return () => {
      active = false;
      window.removeEventListener("mousemove", onMouseMove);
      if (rendererInitialized) void renderer?.dispose();
    };
  }, []);

  return (
    <div id="hero">
      <div className="title">
        <h1>Hey I'm Ben</h1>
        <h2>Take a look at my projects.</h2>
      </div>
      <div className="canvas_container">
        <canvas ref={canvasRef} id="myCanvas" />
      </div>
    </div>
  );
}
