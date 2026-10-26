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
];
