import * as THREE from "three/webgpu";

interface ChatControls {
  input: HTMLInputElement;
  form: HTMLFormElement;
  status: HTMLElement;
}

function roundedBody(width: number, height: number, radius: number, depth: number) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x + width, y + height - radius);
  shape.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(x + radius, y + height);
  shape.absarc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + radius);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 12,
    curveSegments: 32,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function canvasLabel(width: number, height: number, pixelWidth: number, pixelHeight: number) {
  const canvas = document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The chat text needs a 2D canvas context.");

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mesh.position.z = 0.021;
  mesh.renderOrder = 2;
  return { mesh, context, texture, canvas };
}

// Visible controls are meshes; the native form supplies text editing and accessibility.
export function createHeroChat({ input, form, status }: ChatControls) {
  const group = new THREE.Group();
  group.name = "hero-chat";
  // The scan's up axis is -Z. Keep the chat above it without changing the camera.
  group.up.set(0, 0, -1);
  group.position.set(0, 0.18, -0.93);
  group.lookAt(0, -7, -0.93);
  group.rotateY(-0.12);
  group.rotateX(0.04);

  const faceMaterial = new THREE.MeshStandardMaterial({
    color: 0x17191c,
    roughness: 0.3,
    metalness: 0.08,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const inputWidth = 1.5;
  const inputHeight = 0.25;
  const inputBody = new THREE.Mesh(
    roundedBody(inputWidth, inputHeight, inputHeight / 2, 0.026),
    faceMaterial,
  );
  inputBody.name = "chat-input";
  inputBody.renderOrder = 1;
  const label = canvasLabel(inputWidth, inputHeight, 1200, 200);
  group.add(inputBody, label.mesh);

  const buttonBody = new THREE.Mesh(
    roundedBody(0.25, 0.25, 0.125, 0.026),
    faceMaterial,
  );
  buttonBody.name = "chat-send";
  buttonBody.renderOrder = 1;
  buttonBody.position.x = inputWidth / 2 + 0.075 + 0.125;

  // Lucide arrow-up, with rounded caps and joins. See /licenses/lucide.txt.
  const arrow = canvasLabel(0.1, 0.1, 192, 192);
  arrow.context.scale(12, 12);
  arrow.context.translate(-4, -4);
  arrow.context.strokeStyle = "#f5f6f7";
  arrow.context.lineWidth = 1.5;
  arrow.context.lineCap = "round";
  arrow.context.lineJoin = "round";
  arrow.context.beginPath();
  arrow.context.moveTo(12, 19);
  arrow.context.lineTo(12, 5);
  arrow.context.moveTo(5, 12);
  arrow.context.lineTo(12, 5);
  arrow.context.lineTo(19, 12);
  arrow.context.stroke();
  arrow.texture.needsUpdate = true;
  arrow.mesh.position.z = 0.021;
  arrow.mesh.material.opacity = 0.4;
  buttonBody.add(arrow.mesh);
  group.add(buttonBody);

  const statusLabel = canvasLabel(inputWidth, 0.12, 1200, 96);
  statusLabel.mesh.position.y = 0.23;
  statusLabel.mesh.visible = false;
  group.add(statusLabel.mesh);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 4, 5);
  key.target = group;
  group.add(ambient, key);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const localPoint = new THREE.Vector3();
  const sendButton = form.querySelector("button");
  let hovered: "input" | "send" | null = null;
  let lastTextState = "";
  let lastStatus = "";
  let textOffset = 0;
  let pressedUntil = 0;

  const hitTest = (x: number, y: number, camera: THREE.Camera, canvas: HTMLCanvasElement) => {
    if (!group.visible || canvas.clientWidth <= 800) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    ndc.set(((x - bounds.left) / bounds.width) * 2 - 1, 1 - ((y - bounds.top) / bounds.height) * 2);
    camera.updateMatrixWorld();
    group.updateWorldMatrix(true, true);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects([inputBody, buttonBody], false)[0];
  };

  const movePointer = (x: number, y: number, camera: THREE.Camera, canvas: HTMLCanvasElement) => {
    const hit = hitTest(x, y, camera, canvas);
    hovered = hit ? (hit.object === inputBody ? "input" : "send") : null;
    return hovered === "input" ? "text" : hovered === "send" ? "pointer" : "";
  };

  const pointerDown = (event: PointerEvent, camera: THREE.Camera, canvas: HTMLCanvasElement) => {
    const hit = hitTest(event.clientX, event.clientY, camera, canvas);
    if (!hit || event.button !== 0) return false;
    event.preventDefault();

    if (hit.object === buttonBody) {
      if (input.value.trim()) {
        pressedUntil = performance.now() + 120;
        form.requestSubmit();
      }
    } else {
      input.focus({ preventScroll: true });
      group.worldToLocal(localPoint.copy(hit.point));
      const target = ((localPoint.x + inputWidth / 2) / inputWidth) * label.canvas.width - 64 + textOffset;
      label.context.font = "56px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      let caret = 0;
      let previousWidth = 0;
      for (const character of input.value) {
        const next = caret + character.length;
        const width = label.context.measureText(input.value.slice(0, next)).width;
        if (target < (previousWidth + width) / 2) break;
        caret = next;
        previousWidth = width;
      }
      input.setSelectionRange(caret, caret);
    }
    lastTextState = "";
    return true;
  };

  const update = (elapsed: number) => {
    const focused = document.activeElement === input;
    const buttonFocused = document.activeElement === sendButton;
    const enabled = Boolean(input.value.trim());
    const highlighted = enabled && (hovered === "send" || buttonFocused);
    faceMaterial.opacity = THREE.MathUtils.lerp(faceMaterial.opacity, focused || buttonFocused ? 0.65 : hovered ? 0.6 : 0.55, 0.15);
    arrow.mesh.material.opacity = THREE.MathUtils.lerp(arrow.mesh.material.opacity, highlighted ? 1 : enabled ? 0.9 : 0.4, 0.15);
    buttonBody.position.z = THREE.MathUtils.lerp(buttonBody.position.z, performance.now() < pressedUntil ? -0.004 : 0, 0.3);

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const caretVisible = focused && Math.floor(elapsed * 2) % 2 === 0;
    const textState = JSON.stringify([input.value, start, end, focused, caretVisible]);
    if (textState !== lastTextState) {
      const { context, canvas, texture } = label;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = "56px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      context.textBaseline = "middle";
      const padding = 64;
      const available = canvas.width - padding * 2;
      const caret = input.selectionDirection === "backward" ? start : end;
      const caretWidth = context.measureText(input.value.slice(0, caret)).width;
      textOffset = Math.max(0, Math.min(textOffset, caretWidth));
      textOffset = Math.max(textOffset, caretWidth - available + 4);

      context.save();
      context.beginPath();
      context.rect(padding, 0, available, canvas.height);
      context.clip();
      if (focused && start !== end) {
        const left = context.measureText(input.value.slice(0, start)).width;
        const right = context.measureText(input.value.slice(0, end)).width;
        context.fillStyle = "rgba(255, 255, 255, 0.2)";
        context.fillRect(padding + left - textOffset, 62, right - left, 76);
      }
      context.fillStyle = input.value ? "#f5f6f7" : "#e1e5e9";
      context.fillText(input.value || input.placeholder, padding - textOffset, canvas.height / 2);
      if (caretVisible && start === end) {
        context.fillStyle = "#f5f6f7";
        context.fillRect(padding + caretWidth - textOffset, 65, 4, 70);
      }
      context.restore();
      texture.needsUpdate = true;
      lastTextState = textState;
    }

    const statusText = status.textContent ?? "";
    if (statusText !== lastStatus) {
      const { context, canvas, texture } = statusLabel;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = "44px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      context.textBaseline = "middle";
      context.fillStyle = "#62666b";
      context.fillText(statusText, 64, canvas.height / 2);
      texture.needsUpdate = true;
      statusLabel.mesh.visible = Boolean(statusText);
      lastStatus = statusText;
    }
  };

  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material);
        }
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    label.texture.dispose();
    arrow.texture.dispose();
    statusLabel.texture.dispose();
    group.removeFromParent();
  };

  return { group, update, hitTest, movePointer, pointerDown, dispose };
}
