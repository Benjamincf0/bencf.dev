import { useEffect, useRef, useState } from "react";
import HeroChat from "#components/herochat.tsx";
import { createHeroChat } from "../herochat.ts";
import "#styles/hero.css";
import * as THREE from "three/webgpu";
import { SPZLoader } from "three/addons/loaders/SPZLoader.js";
import {
  GaussianSplat,
  distortCenter,
  giggleCenter,
  giggleStrength,
} from "../GaussianSplat.js";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatFormRef = useRef<HTMLFormElement>(null);
  const chatStatusRef = useRef<HTMLSpanElement>(null);
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
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
    let rendererInitialized = false;
    let active = true;
    let chat: ReturnType<typeof createHeroChat> | undefined;
    let chatCamera: THREE.PerspectiveCamera | undefined;

    const isNativeControl = (event: MouseEvent | PointerEvent) =>
      event.target instanceof Element && Boolean(event.target.closest("a, button, input, textarea, select"));

    const onMouseMove = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      const canvas = canvasRef.current;
      if (chat && chatCamera && canvas && heroRef.current) {
        heroRef.current.style.cursor = chat.movePointer(event.clientX, event.clientY, chatCamera, canvas);
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const onClick = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (chat && chatCamera && canvas && chat.hitTest(event.clientX, event.clientY, chatCamera, canvas)) return;
      clickNdc.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2,
      );
      gigglePending = true;
    };
    window.addEventListener("click", onClick);

    const onPointerDown = (event: PointerEvent) => {
      if (isNativeControl(event)) return;
      const canvas = canvasRef.current;
      if (chat && chatCamera && canvas) chat.pointerDown(event, chatCamera, canvas);
    };
    window.addEventListener("pointerdown", onPointerDown);

    async function initializeScene() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderer = new THREE.WebGPURenderer({ canvas, alpha: true, antialias: true });
      await renderer.init();
      renderer.setClearColor(0x000000, 0);
      rendererInitialized = true;
      if (!active) {
        void renderer.dispose();
        return;
      }
      renderer.setPixelRatio(window.devicePixelRatio);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
      camera.up.set(0, 0, -1);
      chatCamera = camera;

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
      let chatRevealed = false;

      const input = chatInputRef.current;
      const form = chatFormRef.current;
      const status = chatStatusRef.current;
      if (input && form && status) {
        chat = createHeroChat({ input, form, status });
        chat.group.visible = canvas.clientWidth > 800;
        scene.add(chat.group);
      }

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

      // Prepare both objects before the first frame so they appear together.
      camera.position.copy(cameraPath.getPointAt(0));
      camera.lookAt(lookAtTarget);
      chat?.update(0);
      await renderer.compileAsync(scene, camera);
      if (!active) return;

      renderer.setAnimationLoop(() => {
        resizeRenderer();

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
        camera.updateMatrixWorld();

        if (chat) {
          chat.group.visible = canvas.clientWidth > 800;
          chat.update(clock.getElapsedTime());
        }

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

        renderer.render(scene, camera);

        // Enable editing and autofocus with the first portrait/chat frame, during the intro.
        if (chat && !chatRevealed) {
          chatRevealed = true;
          setChatReady(true);
        }
      });
    }

    void initializeScene().catch((error: unknown) => {
      if (!active) return;
      console.error("Could not initialize the portrait scene:", error);
      chat?.dispose();
      chat = undefined;
      setChatReady(false);
    });

    return () => {
      active = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("pointerdown", onPointerDown);
      chat?.dispose();
      if (rendererInitialized) void renderer?.dispose();
    };
  }, []);

  return (
    <div id="hero" ref={heroRef}>
      <div className="title">
        <h1>Hey I'm Ben</h1>
        <h2>Take a look at my projects.</h2>
      </div>
      <div className="canvas_container">
        <canvas ref={canvasRef} id="myCanvas" />
      </div>
      <div className="hero-chat-anchor">
        <HeroChat
          ready={chatReady}
          inputRef={chatInputRef}
          formRef={chatFormRef}
          statusRef={chatStatusRef}
        />
      </div>
    </div>
  );
}
