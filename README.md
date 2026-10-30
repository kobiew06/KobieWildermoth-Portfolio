# Kobie Wildermoth portfolio

A buildless HTML, CSS and JavaScript portfolio for GitHub Pages. The existing dark purple design is retained. Updated sections cover studies, personal projects, practical skills, and the CST230 storage demo.

## Pages

- `index.html`: portfolio, project explorer, JARVIS screenshots, Nexus and Task Planner videos, PC troubleshooting game, and cloud storage project.
- `images/jarvis/`: original app-window captures with captions that describe whether a view is saved or idle.
- `storage/index.html`: sign-in and private file operations.
- `storage/config.js`: public AWS configuration. Empty until the backend is deployed.

The backend template and console instructions are in the sibling `aws-demo/` folder in the working project. Upload the contents of this portfolio directory to the root of the existing GitHub Pages repository. No npm installation or build is needed.

The storage demo is not live until the AWS stack, bucket CORS, web configuration and user accounts are configured. It does not use mock files or client-side-only authentication.

Contact opens the visitor's email application. The existing CV and social links are retained. The dated “Currently working on” line should be refreshed when the project focus changes. JARVIS screenshots distinguish saved conversations from idle control panels; they do not claim that the pictured features were demonstrated live.

## PC troubleshooting game

`pc-3d.js` creates a rotatable mid-tower PC with selectable components using Three.js. The model is built from geometry in the source rather than an external asset. The glass side panel can be removed, and the monitor and diagnostic LEDs track the game state. Answer buttons and a diagram provide a fallback where WebGL is unavailable. Camera rotation supports dragging and arrow keys; video, microphone and camera access are not required.

Three.js 0.180.0 and OrbitControls are bundled in `vendor/three/`. Keep their MIT license with the files when publishing. The game remains a static GitHub Pages feature and does not need a server.
