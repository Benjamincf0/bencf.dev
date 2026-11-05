import { useEffect, useRef, useState } from "react";
import "#styles/hero.css";
import * as THREE from "three/webgpu";
import { loadSplatChunks } from "../loadSplatChunks.js";
import {
  GaussianSplat,
  distortCenter,
  giggleCenter,
  giggleStrength,
} from "../GaussianSplat.js";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererCleanup = useRef<Promise<void>>(Promise.resolve());
  const [showSplat, setShowSplat] = useState(() => window.matchMedia("(min-width: 801px)").matches);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 801px)");
    const onChange = () => setShowSplat(desktop.matches);
    onChange();
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!showSplat) return;
    const controller = new AbortController();
    const previousCleanup = rendererCleanup.current;
    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const pointerNdc = new THREE.Vector2();
    const clickNdc = new THREE.Vector2();
    const pointerRaycaster = new THREE.Raycaster();
    const distortionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3);
    const distortionWorldCenter = new THREE.Vector3();
    const distortionLocalCenter = new THREE.Vector3();
    let gigglePending = false;
    let giggleStartedAt = -Infinity;
    let renderer: THREE.WebGPURenderer | undefined;
    let splats: GaussianSplat | undefined;
    let rendererInitialized = false;
    let rendererInitialization: Promise<void> | undefined;
    let active = true;

    const onMouseMove = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onClick = (event: MouseEvent) => {
      clickNdc.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2,
      );
      gigglePending = true;
    };
    window.addEventListener("click", onClick);

    async function initializeScene() {
      // Wait for the previous renderer to release this canvas before reusing it.
      // This also skips the cancelled setup in React's development remount.
      await previousCleanup;
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderer = new THREE.WebGPURenderer({ canvas, alpha: true });
      rendererInitialization = renderer.init();
      await rendererInitialization;
      renderer.setClearColor(0x000000, 0);
      rendererInitialized = true;
      if (!active) return;
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

      const animate = () => {
        if (!splats) return;
        resizeRenderer();

        const elapsed = clock.getElapsedTime();
        splats.revealTime.value = elapsed;
        const progress = Math.min(elapsed, introDuration) / introDuration;
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

        pointerNdc.set(pointer.x, -pointer.y);
        pointerRaycaster.setFromCamera(pointerNdc, camera);
        if (pointerRaycaster.ray.intersectPlane(distortionPlane, distortionWorldCenter)) {
          splats.worldToLocal(
            distortionLocalCenter.copy(distortionWorldCenter),
          );
          distortCenter.value.copy(distortionLocalCenter);
        }

        if (gigglePending) {
          pointerRaycaster.setFromCamera(clickNdc, camera);
          if (pointerRaycaster.ray.intersectPlane(distortionPlane, distortionWorldCenter)) {
            splats.worldToLocal(
              distortionLocalCenter.copy(distortionWorldCenter),
            );
            giggleCenter.value.copy(distortionLocalCenter);
            giggleStartedAt = clock.getElapsedTime();
          }
          gigglePending = false;
        }
        const giggleElapsed = clock.getElapsedTime() - giggleStartedAt;
        giggleStrength.value =
          giggleElapsed < 0.5
            ? Math.sin(giggleElapsed * 32) * 0.1 * Math.exp(-giggleElapsed * 8)
            : 0;

        renderer?.render(scene, camera);
      };

      const manifestUrl = new URL(
        `${import.meta.env.BASE_URL}splats/splat_ben2/manifest.json`,
        window.location.href,
      );
      for await (const { geometry, totalPoints } of loadSplatChunks(manifestUrl, controller.signal)) {
        try {
          if (!active) return;
          if (!splats) {
            splats = new GaussianSplat(geometry, { capacity: totalPoints, revealDuration: 0.35 });
            splats.translateZ(0.1);
            scene.add(splats);
            clock.start();
            renderer.setAnimationLoop(animate);
          } else {
            splats.appendGeometry(geometry);
          }
        } finally {
          // The mesh copies each batch into its reserved storage.
          if (geometry !== splats?.splatGeometry) geometry.dispose();
        }
      }
    }

    void initializeScene().catch(error => {
      if (!controller.signal.aborted) console.warn("Could not finish loading the portrait:", error);
    });

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      if (rendererInitialized) renderer?.setAnimationLoop(null);
      rendererCleanup.current = (async () => {
        await previousCleanup;
        await rendererInitialization?.catch(() => {});
        splats?.dispose();
        await renderer?.dispose();
      })();
    };
  }, [showSplat]);

  return (
    <div id="hero">
      <div className="title">
        <h1>Hey I'm Ben</h1>
        <h2>Take a look at my projects.</h2>
      </div>
      <div className="canvas_container">
        {showSplat && <canvas ref={canvasRef} id="myCanvas" />}
      </div>
    </div>
  );
}
