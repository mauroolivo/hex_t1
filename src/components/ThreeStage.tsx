import { useEffect, useRef } from 'react';
import * as THREE from 'three/src/Three.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { type SceneCube, useSceneStore } from '../store/sceneStore';

type OrbitControlsWithLifecycle = OrbitControls & {
  disconnect(): void;
};

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((entry) => {
      entry.dispose();
    });

    return;
  }

  material.dispose();
}

function clearCubeGroup(group: THREE.Group) {
  group.children.forEach((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      disposeMaterial(child.material);
    }
  });

  group.clear();
}

function buildCubeMesh(cube: SceneCube) {
  const geometry = new THREE.BoxGeometry(cube.size, cube.size, cube.size);
  const material = new THREE.MeshStandardMaterial({
    color: cube.color,
    roughness: 0.45,
    metalness: 0.08,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...cube.position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData['cubeId'] = cube.id;

  return mesh;
}

export function ThreeStage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const cubes = useSceneStore((state) => state.cubes);

  useEffect(() => {
    const mountElement = mountRef.current;

    if (!mountElement) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#d8e1d9');
    scene.fog = new THREE.Fog('#d8e1d9', 30, 65);

    const camera = new THREE.PerspectiveCamera(
      52,
      mountElement.clientWidth / mountElement.clientHeight,
      0.1,
      200
    );
    camera.position.set(12, 10, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
    renderer.domElement.style.touchAction = 'none';
    mountElement.appendChild(renderer.domElement);

    const controls = new OrbitControls(
      camera,
      renderer.domElement,
    ) as OrbitControlsWithLifecycle;
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.target.set(0, 0.75, 0);

    const hemisphereLight = new THREE.HemisphereLight(
      '#fff7ed',
      '#7dd3fc',
      1.7
    );
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 2.4);
    keyLight.position.set(12, 18, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 60;
    keyLight.shadow.camera.left = -24;
    keyLight.shadow.camera.right = 24;
    keyLight.shadow.camera.top = 24;
    keyLight.shadow.camera.bottom = -24;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#f8fafc', 0.7);
    fillLight.position.set(-8, 6, -10);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 48),
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.98,
        metalness: 0.02,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(48, 48, '#0f172a', '#94a3b8');
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.32;
    scene.add(grid);

    const cubeGroup = new THREE.Group();
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerDown = new THREE.Vector2();
    let isDragging = false;

    const handleResize = () => {
      if (!mountRef.current) {
        return;
      }

      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDown.set(event.clientX, event.clientY);
      isDragging = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        Math.hypot(
          event.clientX - pointerDown.x,
          event.clientY - pointerDown.y
        ) > 4
      ) {
        isDragging = true;
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (isDragging) {
        return;
      }

      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObject(floor, false)[0];

      if (!hit) {
        return;
      }

      useSceneStore.getState().addCubeAtPoint(hit.point.x, hit.point.z);
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.setAnimationLoop(null);
      controls.disconnect();
      clearCubeGroup(cubeGroup);
      cubeGroupRef.current = null;

      (floor.material as THREE.Material).dispose();
      floor.geometry.dispose();
      (grid.material as THREE.Material).dispose();

      renderer.dispose();
      mountElement.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const cubeGroup = cubeGroupRef.current;

    if (!cubeGroup) {
      return;
    }

    clearCubeGroup(cubeGroup);
    cubes.forEach((cube) => {
      cubeGroup.add(buildCubeMesh(cube));
    });
  }, [cubes]);

  return (
    <div className="absolute inset-0">
      <div
        ref={mountRef}
        className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_44%)]"
      />
    </div>
  );
}
