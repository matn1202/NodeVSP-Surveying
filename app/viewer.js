// The 3D stimulus: orbit only. No gizmos, no parameter panels, no picking -- it
// exists so a participant can see the shape.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/OBJLoader.js';

// A server may or may not add Content-Encoding to a .gz; sniff the magic bytes.
async function objText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  const buf = await r.arrayBuffer();
  const u = new Uint8Array(buf);
  if (u[0] === 0x1f && u[1] === 0x8b) {
    const s = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(s).text();
  }
  return new TextDecoder().decode(buf);
}

/** Load `url` into `el` and start orbiting. Returns {dispose}. Rejects if the load fails.
 *  `dir` is the camera's starting direction (x aft, y right, z up); `distance` is in bounding radii.
 *  scripts/render_stills.mjs uses both to bake the game's still images from this same viewer. */
export async function mountViewer(el, url, { dir = [-1.4, -1.6, 0.9], distance = 2.6 } = {}) {
  const obj = new OBJLoader().parse(await objText(url));
  // v/f only, so no normals: flat shading, and both sides since winding is not guaranteed.
  const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, flatShading: true, roughness: 0.75, metalness: 0.1, side: THREE.DoubleSide });
  obj.traverse((o) => { if (o.isMesh) o.material = mat; });

  const scene = new THREE.Scene();
  scene.add(obj, new THREE.HemisphereLight(0xffffff, 0x334155, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-1, -2, 3);
  scene.add(sun);

  const box = new THREE.Box3().setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  const r = box.getSize(new THREE.Vector3()).length() / 2;
  const camera = new THREE.PerspectiveCamera(35, 1, r / 50, r * 50);
  camera.up.set(0, 0, 1); // OpenVSP: z is up
  camera.position.copy(c).add(new THREE.Vector3(...dir).normalize().multiplyScalar(r * distance));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.append(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(c);
  controls.enableDamping = true;
  controls.enablePan = false;

  const fit = () => {
    const { clientWidth: w, clientHeight: h } = el;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(el);
  fit();

  let raf;
  const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); };
  loop();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
