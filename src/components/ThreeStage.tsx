import { useEffect, useRef } from 'react';
import * as THREE from 'three/src/Three.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { type SceneCube, useSceneStore } from '../store/sceneStore';

type OrbitControlsWithLifecycle = OrbitControls & {
  disconnect(): void;
};

type CubeMesh = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;

const textureLoader = new THREE.TextureLoader();

function disposeMaterialEntry(material: THREE.Material) {
  const materialWithMap = material as THREE.Material & {
    map?: THREE.Texture | null;
  };

  materialWithMap.map?.dispose();
  material.dispose();
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((entry) => {
      disposeMaterialEntry(entry);
    });

    return;
  }

  disposeMaterialEntry(material);
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

function buildCubeGeometry(size: number) {
  return new THREE.BoxGeometry(size, size, size);
}

function buildCubeMaterial(cube: SceneCube) {
  const texture = cube.textureUrl
    ? textureLoader.load(cube.textureUrl, (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
      })
    : null;

  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  return new THREE.MeshStandardMaterial({
    color: texture ? '#ffffff' : cube.color,
    map: texture,
    roughness: 0.45,
    metalness: 0.08,
  });
}

function applyCubeMeshState(mesh: CubeMesh, cube: SceneCube) {
  mesh.position.set(...cube.position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData['cubeId'] = cube.id;
  mesh.userData['cubeSize'] = cube.size;
  mesh.userData['cubeColor'] = cube.color;
  mesh.userData['cubeTextureUrl'] = cube.textureUrl ?? null;
}

function buildCubeMesh(cube: SceneCube) {
  const mesh = new THREE.Mesh(
    buildCubeGeometry(cube.size),
    buildCubeMaterial(cube)
  ) as CubeMesh;

  applyCubeMeshState(mesh, cube);

  return mesh;
}

function updateCubeMesh(mesh: CubeMesh, cube: SceneCube) {
  const previousSize = mesh.userData['cubeSize'] as number | undefined;
  const previousColor = mesh.userData['cubeColor'] as string | undefined;
  const previousTextureUrl = mesh.userData['cubeTextureUrl'] as
    | string
    | null
    | undefined;
  const nextTextureUrl = cube.textureUrl ?? null;

  if (previousSize !== cube.size) {
    mesh.geometry.dispose();
    mesh.geometry = buildCubeGeometry(cube.size);
  }

  if (previousColor !== cube.color || previousTextureUrl !== nextTextureUrl) {
    disposeMaterial(mesh.material);
    mesh.material = buildCubeMaterial(cube);
  }

  applyCubeMeshState(mesh, cube);

  return mesh;
}

export function ThreeStage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const cubeMeshesRef = useRef<Map<string, CubeMesh>>(new Map());
  const cubes = useSceneStore((state) => state.cubes);

  useEffect(() => {
    const mountElement = mountRef.current;
    const cubeMeshes = cubeMeshesRef.current;

    if (!mountElement) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#d8e1d9');
    // scene.fog = new THREE.Fog('#d8e1d9', 30, 65);

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
      renderer.domElement
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
      cubeMeshes.clear();
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
    const cubeMeshes = cubeMeshesRef.current;

    if (!cubeGroup) {
      return;
    }

    const nextCubeIds = new Set(cubes.map((cube) => cube.id));

    cubeMeshes.forEach((mesh, cubeId) => {
      if (nextCubeIds.has(cubeId)) {
        return;
      }

      cubeGroup.remove(mesh);
      mesh.geometry.dispose();
      disposeMaterial(mesh.material);
      cubeMeshes.delete(cubeId);
    });

    cubes.forEach((cube) => {
      const existingMesh = cubeMeshes.get(cube.id);

      if (existingMesh) {
        updateCubeMesh(existingMesh, cube);

        return;
      }

      const nextMesh = buildCubeMesh(cube);

      cubeMeshes.set(cube.id, nextMesh);
      cubeGroup.add(nextMesh);
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
