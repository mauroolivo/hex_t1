import { create } from 'zustand';

type SceneCube = {
  id: string;
  size: number;
  color: string;
  textureUrl?: string;
  position: [number, number, number];
};

type SceneState = {
  cubes: SceneCube[];
  cubeSize: number;
  setCubeSize: (size: number) => void;
  addCubeAtPoint: (x: number, z: number) => void;
  applyTextureToLatestCube: (textureUrl: string) => boolean;
  clearCubes: () => void;
};

const CUBE_COLORS = ['#0e7490', '#166534', '#9d174d', '#3730a3', '#475569'];

function clampCubeSize(size: number) {
  if (!Number.isFinite(size)) {
    return 1;
  }

  return Math.min(4, Math.max(0.5, Number(size.toFixed(2))));
}

export const useSceneStore = create<SceneState>((set, get) => ({
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
  applyTextureToLatestCube: (textureUrl) => {
    const cubes = get().cubes;

    if (cubes.length === 0) {
      return false;
    }

    const latestCubeIndex = cubes.length - 1;

    set({
      cubes: cubes.map((cube, index) => {
        if (index !== latestCubeIndex) {
          return cube;
        }

        return {
          ...cube,
          textureUrl,
        };
      }),
    });

    return true;
  },
  clearCubes: () => {
    set({ cubes: [] });
  },
}));

export type { SceneCube };
