import type { ReactNode } from "react";

export interface ContributionData {
  url: string;
  title: ReactNode;
  description: ReactNode;
  additions: number;
  deletions: number;
  comments: number;
}

export const contributions: ContributionData[] = [
  {
    url: "https://github.com/pyvista/pyvista/pull/8836",
    title: (
      <>Add <code>Plotter.enable_camera_distortion</code> to simulate real-world camera distortion effects</>
    ),
    description: (
      <>
        Overview Added new methods <code className="notranslate">Plotter.enable_camera_distortion</code>/<code className="notranslate">disable_camera_distortion</code> that lets users specify camera distortion coefficients. When …
      </>
    ),
    additions: 670,
    deletions: 0,
    comments: 10,
  },
  {
    url: "https://github.com/pyvista/pyvista/pull/8652",
    title: (
      <>Avoid RGBA-&gt;RGB stride copy in <code>Plotter.image</code></>
    ),
    description: (
      <>
        Improved <code>Plotter.image</code> performance by requesting RGB output directly
        instead of slicing an RGBA image. Ensured image buffers are contiguous for
        downstream processing and added regression tests for RGB and RGBA output.
      </>
    ),
    additions: 28,
    deletions: 9,
    comments: 5,
  },
];
