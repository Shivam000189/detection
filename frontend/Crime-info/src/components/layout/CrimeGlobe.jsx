// // frontend/Crime-info/src/pages/CrimeGlobe.jsx
// import { useEffect, useRef, useState, useCallback } from "react";
// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { Globe, MapPin, Search, RotateCcw, Share2, Trash2, X } from "lucide-react";

// const RADIUS = 100;

// // Country boundary data for continent outlines
// const countryBoundaries = {
//   "North America": [
//     [[72,-140],[72,-100],[72,-80],[65,-65],[55,-60],[50,-65],[45,-65],[45,-67],[43,-70],[40,-74],[35,-76],[30,-82],[25,-80],[25,-85],[30,-90],[30,-95],[25,-98],[20,-105],[20,-110],[25,-115],[30,-118],[35,-120],[40,-124],[45,-125],[48,-125],[50,-130],[55,-132],[58,-140],[60,-148],[62,-165],[65,-168],[72,-165],[72,-140]],
//     [[20,-105],[15,-92],[10,-85],[10,-78],[15,-80],[18,-88],[20,-95],[20,-105]]
//   ],
//   "South America": [
//     [[12,-72],[10,-65],[5,-60],[5,-52],[0,-50],[-5,-35],[-10,-38],[-15,-40],[-20,-42],[-25,-48],[-30,-52],[-35,-56],[-38,-58],[-40,-62],[-45,-65],[-50,-72],[-55,-68],[-55,-70],[-50,-72],[-45,-72],[-40,-72],[-35,-72],[-30,-72],[-25,-70],[-20,-70],[-15,-75],[-10,-78],[-5,-80],[0,-80],[5,-77],[10,-72],[12,-72]]
//   ],
//   "Europe": [
//     [[72,10],[72,30],[70,35],[65,30],[60,25],[58,30],[55,25],[55,15],[52,15],[50,10],[48,15],[45,12],[42,10],[40,0],[38,-5],[38,0],[42,3],[43,5],[45,8],[48,2],[50,5],[52,5],[55,8],[58,10],[62,5],[65,12],[68,15],[70,20],[72,30],[72,10]],
//     [[38,0],[38,-5],[37,-5],[36,0],[38,0]]
//   ],
//   "Africa": [
//     [[37,10],[35,15],[32,32],[30,35],[25,35],[20,40],[15,42],[12,45],[5,42],[0,42],[-5,40],[-10,40],[-15,35],[-20,35],[-25,32],[-30,30],[-33,28],[-35,25],[-35,20],[-30,18],[-25,15],[-20,12],[-15,12],[-10,10],[-5,5],[0,5],[5,0],[8,-5],[10,-15],[15,-17],[20,-17],[25,-15],[30,-12],[32,-8],[35,-5],[37,0],[37,10]]
//   ],
//   "Asia": [
//     [[72,40],[70,50],[68,60],[65,70],[60,80],[55,85],[50,90],[48,95],[45,100],[42,105],[40,110],[38,115],[35,120],[30,122],[25,120],[22,115],[20,110],[18,105],[15,100],[10,98],[8,100],[5,100],[2,105],[0,105],[-5,108],[-8,115],[-8,120],[-5,125],[0,130],[5,135],[10,130],[15,125],[20,122],[25,120],[28,125],[30,130],[35,135],[38,138],[42,140],[45,142],[48,142],[52,142],[55,142],[58,140],[60,135],[62,130],[65,125],[68,120],[70,110],[72,100],[72,80],[72,60],[72,40]]
//   ],
//   "Australia": [
//     [[-12,130],[-15,125],[-18,122],[-22,115],[-25,113],[-28,114],[-32,115],[-35,118],[-38,145],[-38,150],[-35,152],[-30,153],[-28,153],[-25,152],[-22,150],[-20,148],[-18,145],[-15,142],[-12,135],[-12,130]]
//   ]
// };

// // Urban centers for risk calculation
// const urbanCenters = [
//   [40.7, -74], [51.5, -0.1], [35.7, 139.7], [19, 72.8],
//   [-23.5, -46.6], [31.2, 121.5], [1.35, 103.8], [-33.9, 18.4],
//   [25.2, 55.3], [55.7, 37.6], [34, -118], [37.8, -122],
//   [48.9, 2.3], [40.4, -3.7], [52.5, 13.4], [41.9, 12.5],
//   [30, 31.2], [6.5, 3.4], [-1.3, 36.8], [13.7, 100.5],
//   [-6.2, 106.8], [14.6, 121], [37.6, 127], [39.9, 116.4],
// ];

// export default function CrimeGlobe() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(null);
//   const cameraRef = useRef(null);
//   const rendererRef = useRef(null);
//   const controlsRef = useRef(null);
//   const globeRef = useRef(null);
//   const raycasterRef = useRef(new THREE.Raycaster());
//   const mouseRef = useRef(new THREE.Vector2());
//   const hotspotMarkersRef = useRef([]);
//   const animationIdRef = useRef(null);

//   const [mode, setMode] = useState("browse");
//   const [loading, setLoading] = useState(true);
//   const [infoPanelVisible, setInfoPanelVisible] = useState(false);
//   const [selectedHotspot, setSelectedHotspot] = useState(null);
//   const [stats, setStats] = useState({
//     hotspotCount: 0,
//     avgRisk: null,
//     highRiskCount: 0,
//     totalRisk: 0
//   });
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
//   const [searchQuery, setSearchQuery] = useState("");

//   // Utility functions
//   const latLngToVec3 = useCallback((lat, lng, radius) => {
//     const phi = (90 - lat) * Math.PI / 180;
//     const theta = (lng + 180) * Math.PI / 180;
//     return new THREE.Vector3(
//       -radius * Math.sin(phi) * Math.cos(theta),
//       radius * Math.cos(phi),
//       radius * Math.sin(phi) * Math.sin(theta)
//     );
//   }, []);

//   const vec3ToLatLng = useCallback((point) => {
//     const normalized = point.clone().normalize();
//     const lat = 90 - Math.acos(normalized.y) * 180 / Math.PI;
//     let lng = Math.atan2(normalized.z, -normalized.x) * 180 / Math.PI - 180;
//     if (lng > 180) lng -= 360;
//     if (lng < -180) lng += 360;
//     return { lat, lng };
//   }, []);

//   const generateRiskScore = useCallback((lat, lng) => {
//     const seed = Math.abs(Math.round(lat * 137 + lng * 73 + lat * lng * 0.5));
//     const hash = ((seed * 2654435761) >>> 0) % 100;
//     let risk = hash;

//     urbanCenters.forEach(([ul, ulng]) => {
//       const dist = Math.sqrt((lat - ul) ** 2 + (lng - ulng) ** 2);
//       if (dist < 5) {
//         risk = Math.min(95, risk + (30 - dist * 5));
//       }
//     });

//     return Math.max(5, Math.min(98, Math.round(risk)));
//   }, []);

//   const getRiskColor = useCallback((risk) => {
//     if (risk > 70) return 0xef4444;
//     if (risk > 40) return 0xf59e0b;
//     return 0x10b981;
//   }, []);

//   const getRiskLevel = useCallback((risk) => {
//     if (risk > 70) return "high";
//     if (risk > 40) return "moderate";
//     return "low";
//   }, []);

//   // Create stars
//   const createStars = useCallback((scene) => {
//     const starGeo = new THREE.BufferGeometry();
//     const starCount = 4000;
//     const positions = new Float32Array(starCount * 3);

//     for (let i = 0; i < starCount; i++) {
//       const theta = Math.random() * Math.PI * 2;
//       const phi = Math.acos(2 * Math.random() - 1);
//       const r = 300 + Math.random() * 250;
//       positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
//       positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
//       positions[i * 3 + 2] = r * Math.cos(phi);
//     }

//     starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
//     const starMat = new THREE.PointsMaterial({
//       color: 0xffffff,
//       size: 0.6,
//       transparent: true,
//       opacity: 0.5,
//       sizeAttenuation: true
//     });
//     scene.add(new THREE.Points(starGeo, starMat));
//   }, []);

//   // Create globe
//   const createGlobe = useCallback((scene) => {
//     const globeGeo = new THREE.SphereGeometry(RADIUS, 128, 128);
//     const globeMat = new THREE.MeshPhongMaterial({
//       color: 0x08101e,
//       emissive: 0x040a14,
//       transparent: true,
//       opacity: 0.9,
//       shininess: 5,
//     });
//     const globe = new THREE.Mesh(globeGeo, globeMat);
//     scene.add(globe);
//     globeRef.current = globe;

//     // Grid
//     const gridGroup = new THREE.Group();
//     for (let lat = -80; lat <= 80; lat += 20) {
//       const phi = (90 - lat) * Math.PI / 180;
//       const r = RADIUS * Math.sin(phi);
//       const y = RADIUS * Math.cos(phi);
//       const pts = [];
//       for (let i = 0; i <= 128; i++) {
//         const theta = (i / 128) * Math.PI * 2;
//         pts.push(new THREE.Vector3(-r * Math.cos(theta), y, r * Math.sin(theta)));
//       }
//       const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
//       const lineMat = new THREE.LineBasicMaterial({ color: 0x0c1e35, transparent: true, opacity: 0.25 });
//       gridGroup.add(new THREE.Line(lineGeo, lineMat));
//     }
//     for (let lng = -180; lng < 180; lng += 30) {
//       const theta = (lng + 180) * Math.PI / 180;
//       const pts = [];
//       for (let i = 0; i <= 128; i++) {
//         const phi = (i / 128) * Math.PI;
//         const r = RADIUS * Math.sin(phi);
//         pts.push(new THREE.Vector3(-r * Math.cos(theta), RADIUS * Math.cos(phi), r * Math.sin(theta)));
//       }
//       const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
//       const lineMat = new THREE.LineBasicMaterial({ color: 0x0c1e35, transparent: true, opacity: 0.25 });
//       gridGroup.add(new THREE.Line(lineGeo, lineMat));
//     }
//     globe.add(gridGroup);

//     // Atmosphere
//     const atmosGeo = new THREE.SphereGeometry(RADIUS * 1.015, 64, 64);
//     const atmosMat = new THREE.ShaderMaterial({
//       vertexShader: `
//         varying vec3 vNormal;
//         varying vec3 vPosition;
//         void main() {
//           vNormal = normalize(normalMatrix * normal);
//           vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
//           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//       `,
//       fragmentShader: `
//         varying vec3 vNormal;
//         varying vec3 vPosition;
//         void main() {
//           vec3 viewDir = normalize(-vPosition);
//           float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
//           float intensity = pow(rim, 3.0) * 0.5;
//           gl_FragColor = vec4(0.0, 0.4, 0.6, intensity);
//         }
//       `,
//       transparent: true,
//       side: THREE.FrontSide,
//       blending: THREE.AdditiveBlending,
//       depthWrite: false,
//     });
//     scene.add(new THREE.Mesh(atmosGeo, atmosMat));

//     // Lighting
//     scene.add(new THREE.AmbientLight(0x1a2a4a, 0.6));
//     const dirLight = new THREE.DirectionalLight(0x404060, 0.4);
//     dirLight.position.set(100, 80, 100);
//     scene.add(dirLight);
//     const pointLight = new THREE.PointLight(0x00b4d8, 0.3, 300);
//     pointLight.position.set(-60, 60, 120);
//     scene.add(pointLight);

//     return globe;
//   }, []);

//   // Create country outlines
//   const createCountryOutlines = useCallback((scene) => {
//     const outlineGroup = new THREE.Group();

//     Object.values(countryBoundaries).forEach(continent => {
//       continent.forEach(ring => {
//         const pts = [];
//         ring.forEach(([lat, lng]) => {
//           const pos = latLngToVec3(lat, lng, RADIUS + 0.3);
//           pts.push(pos);
//         });
//         pts.push(pts[0].clone());

//         const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
//         const curvePts = curve.getPoints(120);
//         const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
//         const lineMat = new THREE.LineBasicMaterial({
//           color: 0x1a4a6a,
//           transparent: true,
//           opacity: 0.4,
//           linewidth: 1,
//         });
//         outlineGroup.add(new THREE.Line(lineGeo, lineMat));
//       });
//     });

//     scene.add(outlineGroup);
//   }, [latLngToVec3]);

//   // Create continent labels
// //   const createLabels = useCallback((scene) => {
// //     const labels = [
// //       { text: "NORTH AMERICA", lat: 45, lng: -100 },
// //       { text: "SOUTH AMERICA", lat: -15, lng: -55 },
// //       { text: "EUROPE", lat: 50, lng: 15 },
// //       { text: "AFRICA", lat: 5, lng: 22 },
// //       { text: "ASIA", lat: 40, lng: 100 },
// //       { text: "OCEANIA", lat: -25, lng: 135 },
// //     ];

// //     labels.forEach(l => {
// //       const canvas = document.createElement('canvas');
// //       canvas.width = 512 inside your routes:
// //     <Route path="/globe" element={<Private><CrimeGlobe /></Private>} />


// const createLabels = useCallback((scene) => {
//   const labels = [
//     { text: "NORTH AMERICA", lat: 45, lng: -100 },
//     { text: "SOUTH AMERICA", lat: -15, lng: -55 },
//     { text: "EUROPE", lat: 50, lng: 15 },
//     { text: "AFRICA", lat: 5, lng: 22 },
//     { text: "ASIA", lat: 40, lng: 100 },
//     { text: "OCEANIA", lat: -25, lng: 135 },
//   ];

//   labels.forEach(l => {
//     const canvas = document.createElement("canvas");
//     canvas.width = 512;
//     canvas.height = 64;

//     const ctx = canvas.getContext("2d");
//     ctx.fillStyle = "rgba(100,180,220,0.12)";
//     ctx.font = "bold 36px Inter, sans-serif";
//     ctx.textAlign = "center";
//     ctx.textBaseline = "middle";
//     ctx.fillText(l.text, 256, 32);

//     const texture = new THREE.CanvasTexture(canvas);

//     const spriteMat = new THREE.SpriteMaterial({
//       map: texture,
//       transparent: true,
//       depthWrite: false,
//     });

//     const sprite = new THREE.Sprite(spriteMat);

//     const pos = latLngToVec3(l.lat, l.lng, RADIUS + 6);
//     sprite.position.copy(pos);
//     sprite.scale.set(40, 5, 1);

//     scene.add(sprite);
//   });
// }, [latLngToVec3]);

// useEffect(() => {
//   const scene = new THREE.Scene();
//   sceneRef.current = scene;

//   const camera = new THREE.PerspectiveCamera(
//     60,
//     window.innerWidth / window.innerHeight,
//     0.1,
//     2000
//   );
//   camera.position.set(0, 0, 300);
//   cameraRef.current = camera;

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.setPixelRatio(window.devicePixelRatio);
//   rendererRef.current = renderer;

//   mountRef.current.appendChild(renderer.domElement);

//   const controls = new OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;
//   controlsRef.current = controls;

//   // 🌍 Build scene
//   createStars(scene);
//   createGlobe(scene);
//   createCountryOutlines(scene);
//   createLabels(scene);

//   // 🎬 Animation loop
//   const animate = () => {
//     animationIdRef.current = requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);
//   };
//   animate();

//   // 🧹 Cleanup
//   return () => {
//     cancelAnimationFrame(animationIdRef.current);
//     renderer.dispose();
//     if (mountRef.current) {
//       mountRef.current.removeChild(renderer.domElement);
//     }
//   };
// }, []);

//     return (
//         <div
//             ref={mountRef}
//             style={{ width: "100vw", height: "100vh", background: "black" }}
//         />
//         );
// }



import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const RADIUS = 100;

// ── Lat/Lng → 3D position ─────────────────────────────────────────
function latLngToVec3(lat, lng, r = RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Crime hotspot data ─────────────────────────────────────────────
const HOTSPOTS = [
  { lat: 40.7128,  lng: -74.006,  city: "New York",      risk: 82 },
  { lat: 51.5074,  lng: -0.1278,  city: "London",        risk: 61 },
  { lat: 35.6762,  lng: 139.6503, city: "Tokyo",         risk: 44 },
  { lat: 19.076,   lng: 72.8777,  city: "Mumbai",        risk: 78 },
  { lat: -23.5505, lng: -46.6333, city: "São Paulo",     risk: 88 },
  { lat: 31.2304,  lng: 121.4737, city: "Shanghai",      risk: 55 },
  { lat: 28.6139,  lng: 77.209,   city: "Delhi",         risk: 75 },
  { lat: -33.8688, lng: 151.2093, city: "Sydney",        risk: 49 },
  { lat: 48.8566,  lng: 2.3522,   city: "Paris",         risk: 58 },
  { lat: 55.7558,  lng: 37.6176,  city: "Moscow",        risk: 66 },
  { lat: 34.0522,  lng: -118.2437,city: "Los Angeles",   risk: 71 },
  { lat: 6.5244,   lng: 3.3792,   city: "Lagos",         risk: 91 },
  { lat: -1.2921,  lng: 36.8219,  city: "Nairobi",       risk: 73 },
  { lat: 30.0444,  lng: 31.2357,  city: "Cairo",         risk: 67 },
  { lat: 4.7109,   lng: -74.0721, city: "Bogotá",        risk: 80 },
  { lat: 13.7563,  lng: 100.5018, city: "Bangkok",       risk: 52 },
];

function getRiskColor(risk) {
  if (risk >= 80) return new THREE.Color(0xef4444); // red
  if (risk >= 60) return new THREE.Color(0xf97316); // orange
  return new THREE.Color(0x22d3ee);                  // cyan
}

export default function CrimeGlobe() {
  const mountRef = useRef(null);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const markersRef = useRef([]);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (!sceneRef.current || !cameraRef.current || !mountRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const hits = raycaster.intersectObjects(markersRef.current);

    if (hits.length > 0) {
      setHoveredCity(hits[0].object.userData);
      mountRef.current.style.cursor = "pointer";
    } else {
      setHoveredCity(null);
      mountRef.current.style.cursor = "grab";
    }
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ────────────────────────────────────────────
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 30, 280);
    cameraRef.current = camera;

    // ── Controls ──────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.4;
    controls.enableZoom = true;
    controls.minDistance = 160;
    controls.maxDistance = 420;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;

    // ── Starfield ─────────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 500 + Math.random() * 300;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.55 })
      )
    );

    // ── Globe body — very dark, almost transparent ─────────────────
    const globeGeo = new THREE.SphereGeometry(RADIUS, 96, 96);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x020408,
      emissive: 0x000d1a,
      transparent: true,
      opacity: 0.92,
      shininess: 2,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // ── Latitude grid lines ───────────────────────────────────────
    const gridGroup = new THREE.Group();
    const gridColor = new THREE.Color(0x00e5ff);

    for (let lat = -80; lat <= 80; lat += 10) {
      const phi = (90 - lat) * (Math.PI / 180);
      const r = RADIUS * Math.sin(phi);
      const y = RADIUS * Math.cos(phi);
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const t = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(-r * Math.cos(t), y, r * Math.sin(t)));
      }
      const alpha = lat === 0 ? 0.55 : Math.abs(lat) % 30 === 0 ? 0.28 : 0.10;
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: gridColor,
        transparent: true,
        opacity: alpha,
      });
      gridGroup.add(new THREE.Line(lineGeo, lineMat));
    }

    // ── Longitude grid lines ──────────────────────────────────────
    for (let lng = 0; lng < 360; lng += 10) {
      const theta = (lng + 180) * (Math.PI / 180);
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const phi = (i / 128) * Math.PI;
        const r = RADIUS * Math.sin(phi);
        pts.push(
          new THREE.Vector3(-r * Math.cos(theta), RADIUS * Math.cos(phi), r * Math.sin(theta))
        );
      }
      const alpha = lng % 30 === 0 ? 0.28 : 0.10;
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: gridColor,
        transparent: true,
        opacity: alpha,
      });
      gridGroup.add(new THREE.Line(lineGeo, lineMat));
    }
    scene.add(gridGroup);

    // ── Country outlines from GeoJSON ─────────────────────────────
    fetch("/data/countries.geo.json")
      .then((r) => r.json())
      .then((geojson) => {
        const outlineGroup = new THREE.Group();
        const countryMat = new THREE.LineBasicMaterial({
          color: 0x00bcd4,
          transparent: true,
          opacity: 0.55,
        });

        geojson.features.forEach((feature) => {
          const drawRing = (ring) => {
            const pts = ring.map(([lng, lat]) => latLngToVec3(lat, lng, RADIUS + 0.35));
            if (pts.length < 2) return;
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            outlineGroup.add(new THREE.Line(geo, countryMat));
          };
          const { type, coordinates } = feature.geometry;
          if (type === "Polygon") coordinates.forEach(drawRing);
          else if (type === "MultiPolygon")
            coordinates.forEach((poly) => poly.forEach(drawRing));
        });

        scene.add(outlineGroup);
      })
      .catch(() => {/* GeoJSON optional */});

    // ── Atmosphere glow (rim light shader) ────────────────────────
    const atmosGeo = new THREE.SphereGeometry(RADIUS * 1.045, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos    = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          float rim = 1.0 - max(dot(normalize(-vPos), vNormal), 0.0);
          float intensity = pow(rim, 3.2) * 0.65;
          gl_FragColor = vec4(0.0, 0.85, 1.0, intensity);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));

    // ── Outer glow halo ───────────────────────────────────────────
    const haloGeo = new THREE.SphereGeometry(RADIUS * 1.18, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos    = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          float rim = 1.0 - max(dot(normalize(-vPos), vNormal), 0.0);
          float intensity = pow(rim, 5.0) * 0.22;
          gl_FragColor = vec4(0.0, 0.55, 0.9, intensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(haloGeo, haloMat));

    // ── Lighting ──────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a1a2a, 1.2));
    const sun = new THREE.DirectionalLight(0x4488cc, 0.5);
    sun.position.set(200, 100, 150);
    scene.add(sun);
    const fill = new THREE.PointLight(0x002244, 0.3, 500);
    fill.position.set(-150, -80, -100);
    scene.add(fill);

    // ── Hotspot markers ───────────────────────────────────────────
    const markers = [];
    markersRef.current = [];

    HOTSPOTS.forEach((spot) => {
      const pos = latLngToVec3(spot.lat, spot.lng, RADIUS + 1.2);
      const color = getRiskColor(spot.risk);

      // Ring marker
      const ringGeo = new THREE.RingGeometry(1.8, 2.6, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.rotateX(Math.PI / 2);
      ring.userData = spot;
      scene.add(ring);
      markersRef.current.push(ring);

      // Center dot
      const dotGeo = new THREE.SphereGeometry(0.9, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = spot;
      scene.add(dot);
      markersRef.current.push(dot);

      // Pulse ring (animated in loop)
      const pulseGeo = new THREE.RingGeometry(2.8, 3.2, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.position.copy(pos);
      pulse.lookAt(new THREE.Vector3(0, 0, 0));
      pulse.rotateX(Math.PI / 2);
      pulse.userData = { ...spot, isPulse: true, phase: Math.random() * Math.PI * 2 };
      scene.add(pulse);

      markers.push({ ring, dot, pulse, color });
    });

    // ── Resize handler ────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Animate ───────────────────────────────────────────────────
    let frameId;
    const animate = (time) => {
      frameId = requestAnimationFrame(animate);
      const t = time * 0.001;

      // Pulse markers
      markers.forEach(({ pulse, color }, i) => {
        const phase = pulse.userData.phase;
        const s = 1 + Math.sin(t * 1.8 + phase) * 0.55;
        pulse.scale.set(s, s, s);
        pulse.material.opacity = 0.45 - Math.sin(t * 1.8 + phase) * 0.3;
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate(0);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#020508] overflow-hidden font-mono">
      {/* Subtle noise / vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Three.js canvas */}
      <div
        ref={mountRef}
        onMouseMove={handleMouseMove}
        className="absolute inset-0 z-0"
        style={{ cursor: "grab" }}
      />

      {/* Top-left title */}
      <div className="absolute top-8 left-8 z-20 select-none">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] text-cyan-400 tracking-[0.25em] uppercase">
            Live Crime Intelligence
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-widest">
          CRIME<span className="text-cyan-400">AI</span>
        </h1>
        <p className="text-[10px] text-white/30 tracking-widest mt-1 uppercase">
          Global Threat Monitor
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-8 z-20 select-none space-y-2">
        {[
          { label: "Critical  ≥ 80", color: "#ef4444" },
          { label: "High  60–79",    color: "#f97316" },
          { label: "Moderate  < 60", color: "#22d3ee" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}` }}
            />
            <span className="text-[10px] text-white/45 tracking-widest uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="absolute top-8 right-8 z-20 select-none text-right space-y-3">
        {[
          { label: "Active Zones",   value: HOTSPOTS.length },
          { label: "High Risk",      value: HOTSPOTS.filter((h) => h.risk >= 80).length },
          { label: "Avg Risk Score", value: Math.round(HOTSPOTS.reduce((s, h) => s + h.risk, 0) / HOTSPOTS.length) + "%" },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-[22px] font-bold text-white tabular-nums">{value}</div>
            <div className="text-[9px] text-white/30 tracking-[0.2em] uppercase">{label}</div>
          </div>
        ))}
      </div>

      {/* Hotspot list — bottom right */}
      <div className="absolute bottom-8 right-8 z-20 select-none max-h-64 overflow-y-auto space-y-1 scrollbar-none">
        {HOTSPOTS.sort((a, b) => b.risk - a.risk)
          .slice(0, 8)
          .map((spot) => {
            const color =
              spot.risk >= 80 ? "#ef4444" : spot.risk >= 60 ? "#f97316" : "#22d3ee";
            return (
              <div key={spot.city} className="flex items-center gap-2 justify-end">
                <span className="text-[10px] text-white/40 tracking-wider">{spot.city}</span>
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 5px ${color}` }}
                />
                <span
                  className="text-[10px] font-bold w-8 text-right tabular-nums"
                  style={{ color }}
                >
                  {spot.risk}
                </span>
              </div>
            );
          })}
      </div>

      {/* Hover tooltip */}
      {hoveredCity && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{ left: mousePos.x + 16, top: mousePos.y + 16 }}
        >
          <div
            className="px-3 py-2 rounded-lg border text-xs"
            style={{
              background: "rgba(2, 10, 20, 0.92)",
              borderColor: "rgba(0, 229, 255, 0.25)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="text-cyan-400 font-bold tracking-wider mb-0.5">
              {hoveredCity.city}
            </div>
            <div className="text-white/50">
              Risk:{" "}
              <span
                className="font-bold"
                style={{
                  color:
                    hoveredCity.risk >= 80
                      ? "#ef4444"
                      : hoveredCity.risk >= 60
                      ? "#f97316"
                      : "#22d3ee",
                }}
              >
                {hoveredCity.risk}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drag hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 select-none">
        <span className="text-[9px] text-white/20 tracking-[0.3em] uppercase">
          Drag to rotate · Scroll to zoom
        </span>
      </div>
    </div>
  );
}