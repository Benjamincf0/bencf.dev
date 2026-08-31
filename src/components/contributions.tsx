import "#styles/contributions.css"

function Contribution() {
  return (<div className="Box tmp-p-3">
        <svg name="Merged" aria-hidden="true" data-component="Octicon" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-git-merge d-inline-block mt-1 tmp-mt-1 float-left color-fg-done">
    <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"></path>
</svg>
      <div className="tmp-ml-4">
        <h3 className="lh-condensed my-0">
          <a className="color-fg-default markdown-title" data-hovercard-type="pull_request" data-hovercard-url="/pyvista/pyvista/pull/8836/hovercard" href="https://github.com/pyvista/pyvista/pull/8836" aria-keyshortcuts="Alt+ArrowUp" target="_blank">Add <code>Plotter.enable_camera_distortion</code> to simulate real-world camera distortion effects</a>
        </h3>

          <div className="color-fg-muted mb-0 mt-2">
            <p>Overview
Added new methods <code className="notranslate">Plotter.enable_camera_distortion</code>/<code className="notranslate">disable_camera_distortion</code> that lets users specify camera distortion coefficients. When …</p>
          </div>

        <div className="f6 color-fg-muted mt-2">
            <span className="diffstat position-relative float-left" style={{top: 0}}>
              <span className="color-fg-success">
                +670
              </span>
              {' '}
              <span className="color-fg-danger">
                −0
              </span>
              {' '}
              <span className="diffstat-block-added"></span><span className="diffstat-block-added"></span><span className="diffstat-block-added"></span><span className="diffstat-block-added"></span><span className="diffstat-block-added"></span>
              {' '}
              <span className="color-fg-muted">lines changed</span>
              <span className="color-fg-muted mx-1">•</span>
            </span>
          10
          comments
        </div>
      </div>
    </div>
)
}

export default function Contributions() {
  return  <div className="contributions-container">
    <Contribution />
  </div>
}
