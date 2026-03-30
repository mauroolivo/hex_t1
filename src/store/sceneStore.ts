import { create } from 'zustand';

type SceneCube = {
  id: string;
  size: number;
  color: string;
  position: [number, number, number];
};

type SceneState = {
  cubes: SceneCube[];
  cubeSize: number;
  setCubeSize: (size: number) => void;
  addCubeAtPoint: (x: number, z: number) => void;
  clearCubes: () => void;
};

const CUBE_COLORS = ['#0f766e', '#d97706', '#c2410c', '#2563eb', '#7c3aed'];

function clampCubeSize(size: number) {
  if (!Number.isFinite(size)) {
    return 1;
  }

  return Math.min(4, Math.max(0.5, Number(size.toFixed(2))));
}

export const useSceneStore = create<SceneState>((set) => ({
  cubes: [],
  cubeSize: 1,
  setCubeSize: (size) => {
    set({ cubeSize: clampCubeSize(size) });
  },
  addCubeAtPoint: (x, z) => {
    set((state) => {
      const size = clampCubeSize(state.cubeSize);

      return {
        cubes: [
          ...state.cubes,
          {
            id: crypto.randomUUID(),
            size,
            color: CUBE_COLORS[state.cubes.length % CUBE_COLORS.length],
            position: [x, size / 2, z],
          },
        ],
      };
    });
  },
  clearCubes: () => {
    set({ cubes: [] });
  },
}));

export type { SceneCube };
