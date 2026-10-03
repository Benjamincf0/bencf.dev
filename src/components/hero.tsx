import { useEffect, useRef } from "react";
import "#styles/hero.css";
import { load } from "@loaders.gl/core";
import statusActiveIcon from "#assets/status-active-svgrepo-com.svg";
import * as THREE from "three/webgpu";
import { SPZLoader } from "three/addons/loaders/SPZLoader.js";
import { GaussianSplat } from "three/addons/objects/GaussianSplat.js";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // This function runs after the component renders.
  // It initializes our webgl context, shader program, and positionBuffer.
  useEffect(() => {
    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const scroll = 0;
    let renderer: THREE.WebGPURenderer | undefined;
    let rendererInitialized = false;
    let resizeObserver: ResizeObserver | undefined;
    let active = true;

    const onMouseMove = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouseMove);
    const onScroll = (event) => {
      console.log(window.scrollY)
    };
    window.addEventListener("scroll", onScroll);

    (async () => {
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
        const principalOffset = { x: -1*height/4, y: window.scrollY }; // pixels; +x shifts
        camera.setViewOffset(
          width,
          height, // full virtual sensor
          principalOffset.x,
          principalOffset.y, // intrinsic offset,
          width,
          height, // rendered portion
        );
        camera.updateProjectionMatrix();
      };

      resizeRenderer();
      // load splat
      const splatGeometry = await new SPZLoader().loadAsync("splat_ben2.spz");
      if (!active) return;
      const splats = new GaussianSplat(splatGeometry);
      splats.translateZ(0.1);
      scene.add(splats);

      const curve = new THREE.CatmullRomCurve3(
        [new THREE.Vector3(0, -9, 0.1), new THREE.Vector3(-0.5, -7, 0.3)],
        false,
      ); // true = closed loop

      const clock = new THREE.Clock();
      const duration = 6; // seconds for one full loop
      const lookAtTarget = new THREE.Vector3(0, -0.5, 0);
      const viewDirection = new THREE.Vector3();
      const orbitRight = new THREE.Vector3();
      const orbitRange = 0.4;

      renderer.setAnimationLoop(() => {
        resizeRenderer();
        const t = Math.min(clock.getElapsedTime(), duration) / duration; // 0 → 1
        const pos = curve.getPointAt(1 - (t - 1) ** 4);
        tilt.x = THREE.MathUtils.lerp(tilt.x, pointer.x, 0.05);
        tilt.y = THREE.MathUtils.lerp(tilt.y, pointer.y, 0.05);

        // Orbit the camera position around the world origin, keeping its up axis fixed.
        orbitRight
          .crossVectors(viewDirection.subVectors(lookAtTarget, pos), camera.up)
          .normalize();
        pos.applyAxisAngle(camera.up, tilt.x * orbitRange);
        orbitRight.applyAxisAngle(camera.up, tilt.x * orbitRange);
        pos.applyAxisAngle(orbitRight, tilt.y * orbitRange);
        camera.position.copy(pos);
        camera.lookAt(lookAtTarget);

        renderer.render(scene, camera);
      });
    })();

    return () => {
      active = false;
      window.removeEventListener("mousemove", onMouseMove);
      resizeObserver?.disconnect();
      if (rendererInitialized) void renderer?.dispose();
    };
  }, []); // Only runs once since we pass [] as depsList

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
