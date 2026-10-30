import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const host = document.getElementById('pc-scene');
const mount = document.getElementById('pc3d-stage');
const hoverLabel = document.getElementById('pc3d-label');
const resetButton = document.getElementById('pc3d-reset');

try { createBench(); }
catch (error) {
  mount.replaceChildren();
  const message = document.createElement('p');
  message.className = 'pc3d-loading';
  message.textContent = '3D is unavailable in this browser. The diagram and answer buttons still work.';
  mount.append(message);
  console.warn('The 3D bench could not start.', error.message);
}

function createBench() {
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  mount.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('role','img');
  renderer.domElement.setAttribute('aria-label','Rotatable 3D PC. Drag to turn it, or use arrow keys. Use the component answer buttons to play without a pointer.');
  renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34,1,.1,50);
  const initialCamera = new THREE.Vector3(4.8,4.8,11.5);
  camera.position.copy(initialCamera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-.15,2,0);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.minPolarAngle = .45;
  controls.maxPolarAngle = 1.52;
  controls.minAzimuthAngle = -.85;
  controls.maxAzimuthAngle = 1.1;
  controls.update();
  controls.saveState();

  scene.add(new THREE.HemisphereLight(0xe5edf6,0x342b40,3));
  const key = new THREE.DirectionalLight(0xfff3e6,5);
  key.position.set(1,8,7); key.castShadow = true;
  key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:1,far:22});
  key.shadow.bias = -.001;
  key.shadow.normalBias = .025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc3cce3,3);
  rim.position.set(-5,4,-2);scene.add(rim);
  const fill = new THREE.DirectionalLight(0xd3b9e7,1.5);
  fill.position.set(6,2,0);scene.add(fill);

  const mat = (color,metalness=.1,roughness=.5) => new THREE.MeshStandardMaterial({color,metalness,roughness});
  const steel=mat(0x363940,.75,.3), dark=mat(0x17191f,.3,.5), edge=mat(0x727782,.8,.3);
  const pcb=mat(0x252c2b,.2,.75), black=mat(0x101116,.1,.65), gold=mat(0xb6a665,.75,.35);
  const silver=mat(0x9299a3,.9,.3), accent=mat(0x6e627b,.5,.45), rubber=mat(0x17181b,0,.9);
  const partGroups = new Map();
  const spinningFans = [];
  const rgbMaterials = [];
  const rgbLights = [];
  const pc = new THREE.Group();scene.add(pc);
  const boxGeo = new THREE.BoxGeometry(1,1,1);
  function box(parent,w,h,d,x,y,z,material=steel) {
    const mesh=new THREE.Mesh(boxGeo,material);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cyl(parent,radius,length,x,y,z,material=steel,segments=24) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,segments),material);
    mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function text(parent,words,w,h,x,y,z,fg='#d4d7dd',bg=null) {
    const c=document.createElement('canvas');c.width=512;c.height=128;
    const ctx=c.getContext('2d');
    if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);}
    ctx.fillStyle=fg;ctx.font='500 44px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(words,256,64);
    const texture=new THREE.CanvasTexture(c);
    texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:!bg,depthWrite:false}));
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function part(name) {const g=new THREE.Group();g.userData.part=name;pc.add(g);partGroups.set(name,g);return g;}
  function wire(parent,points,radius=.025,material=rubber) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius,6,false),material);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function screw(parent,x,y,z) {cyl(parent,.026,.015,x,y,z,edge,10);box(parent,.027,.006,.005,x,y,z+.01,black);}
  function fan(parent,radius,x,y,z,kind='case') {
    const frameSize=radius*2.16;
    box(parent,frameSize,frameSize,.075,x,y,z-.055,black);
    cyl(parent,radius*.98,.022,x,y,z-.008,rubber,40);
    const rimMesh=new THREE.Mesh(new THREE.TorusGeometry(radius,.025,8,48),steel);
    rimMesh.position.set(x,y,z+.01);parent.add(rimMesh);
    const rgb=kind!=='gpu';
    const bladeMaterial=rgb?new THREE.MeshStandardMaterial({color:0x49315f,metalness:0,roughness:.45,emissive:0x5a068f,emissiveIntensity:.7}):dark;
    const diffuserMaterial=rgb?new THREE.MeshStandardMaterial({color:0x863ab8,roughness:.35,emissive:0x9d16ea,emissiveIntensity:.9}):steel;
    if(rgb){rgbMaterials.push({material:bladeMaterial,intensity:.7},{material:diffuserMaterial,intensity:.9});}
    if(rgb) {
      const outerDiffuser=new THREE.Mesh(new THREE.TorusGeometry(radius*.89,radius*.045,8,48),diffuserMaterial);
      outerDiffuser.position.set(x,y,z+.025);parent.add(outerDiffuser);
      const innerDiffuser=new THREE.Mesh(new THREE.TorusGeometry(radius*.24,radius*.035,8,40),diffuserMaterial);
      innerDiffuser.position.set(x,y,z+.045);parent.add(innerDiffuser);
    }
    const rotor=new THREE.Group();rotor.position.set(x,y,z+.025);parent.add(rotor);
    const shape=new THREE.Shape();
    shape.moveTo(.19*radius,.03*radius);
    shape.quadraticCurveTo(.70*radius,-.31*radius,.84*radius,.04*radius);
    shape.quadraticCurveTo(.90*radius,.42*radius,.30*radius,.35*radius);
    shape.lineTo(.13*radius,.16*radius);shape.closePath();
    const bladeGeo=new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false,curveSegments:10});
    for(let i=0;i<9;i++){const blade=new THREE.Mesh(bladeGeo,bladeMaterial);blade.rotation.z=i*Math.PI*2/9;rotor.add(blade);}
    cyl(rotor,radius*.22,.045,0,0,.035,black);
    const spindle=new THREE.Mesh(new THREE.TorusGeometry(radius*.19,.008,6,32),silver);spindle.position.z=.06;rotor.add(spindle);
    for(const dx of [-.93,.93])for(const dy of [-.93,.93])screw(parent,x+dx*radius,y+dy*radius,z+.008);
    spinningFans.push({rotor,kind});return rotor;
  }

  // A conventional closed-frame mid-tower, viewed through its left side.
  const bodyCenter=1.72;
  box(pc,3.35,.12,1.8,bodyCenter,.18,0,dark);
  box(pc,3.35,.12,1.8,bodyCenter,4.28,0,dark);
  box(pc,.10,4.1,1.8,.10,2.23,0,dark);
  box(pc,3.25,4.0,.08,bodyCenter,2.2,-.88,dark);
  for(const x of [.13,3.32])for(const z of [-.83,.83])box(pc,.075,4.05,.075,x,2.23,z,dark);
  for(const y of [.24,4.23])box(pc,3.21,.065,.065,bodyCenter,y,.86,dark);
  for(const x of [.50,2.95])for(const z of [-.55,.55])box(pc,.28,.18,.32,x,.05,z,rubber);
  for(let i=0;i<23;i++)box(pc,.065,.018,1.28,.55+i*.105,4.35,0,black);
  // Panoramic front glass: intake fans mount on the inner side instead.
  const frontGlassMaterial=new THREE.MeshPhysicalMaterial({color:0xc1d0e1,metalness:0,roughness:.06,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide});
  const frontGlass=new THREE.Mesh(new THREE.PlaneGeometry(1.7,3.95),frontGlassMaterial);frontGlass.rotation.y=Math.PI/2;frontGlass.position.set(3.40,2.23,0);pc.add(frontGlass);
  box(pc,.10,4.04,.07,3.4,2.23,-.87,dark);
  box(pc,.10,.13,1.8,3.4,4.23,0,dark);
  box(pc,.10,.15,1.8,3.4,.25,0,dark);
  // Two side intakes, three roof exhausts, three lower intakes and a rear exhaust.
  for(let i=0;i<2;i++)fan(pc,.49,2.80,2.40+i*1.10,-.45);
  for(let i=0;i<3;i++) {
    const topFan=new THREE.Group();topFan.position.set(.68+i*1.07,4.02,0);topFan.rotation.x=Math.PI/2;pc.add(topFan);fan(topFan,.46,0,0,0);
    const bottomFan=new THREE.Group();bottomFan.position.set(.68+i*1.07,1.10,0);bottomFan.rotation.x=-Math.PI/2;pc.add(bottomFan);fan(bottomFan,.46,0,0,0);
  }
  const rearFan=new THREE.Group();rearFan.position.set(.24,3.20,0);rearFan.rotation.y=Math.PI/2;pc.add(rearFan);fan(rearFan,.46,0,0,0);
  for(const position of [[1.2,3.5,.35],[2.8,2.5,.4]]) {
    const light=new THREE.PointLight(0xa83cff,3.5,4.8,2);light.position.set(...position);pc.add(light);rgbLights.push(light);
  }
  // Removable tempered-glass side, with corner fixings.
  const glassPanel=new THREE.Group();
  const glassMaterial=new THREE.MeshPhysicalMaterial({color:0xaab9cd,metalness:0,roughness:.08,transparent:true,opacity:.035,depthWrite:false,side:THREE.FrontSide});
  box(glassPanel,3.14,3.87,.024,bodyCenter,2.23,.88,glassMaterial);
  for(const x of [.22,3.22])for(const y of [.37,4.1])screw(glassPanel,x,y,.91);
  pc.add(glassPanel);
  const panelButton=document.createElement('button');panelButton.type='button';panelButton.textContent='Remove side panel';panelButton.setAttribute('aria-pressed','true');
  document.querySelector('.pc3d-toolbar').insertBefore(panelButton,resetButton);
  panelButton.addEventListener('click',()=>{glassPanel.visible=!glassPanel.visible;panelButton.textContent=glassPanel.visible?'Remove side panel':'Fit side panel';panelButton.setAttribute('aria-pressed',String(glassPanel.visible));render();});

  // ATX motherboard, rear I/O, slots and heatsinks.
  box(pc,2.45,2.9,.07,1.40,2.62,-.68,pcb);
  for(let i=0;i<16;i++)box(pc,.12+(i%4)*.14,.008,.004,.48+(i%4)*.48,1.32+Math.floor(i/4)*.72,-.64,mat(0x414c48,.45,.6));
  for(const x of [.25,2.56])for(const y of [1.25,3.96])screw(pc,x,y,-.62);
  for(let i=0;i<8;i++)box(pc,.12,.15,.07,.37+(i%2)*.17,2.6+Math.floor(i/2)*.23,-.59,black);
  box(pc,.45,1.2,.22,.40,3.35,-.50,steel);
  for(let i=0;i<9;i++)box(pc,.018,1.13,.24,.2+i*.047,3.35,-.48,dark);
  for(let i=0;i<3;i++)box(pc,1.8,.055,.05,1.36,1.43+i*.18,-.60,black);
  // Tower air cooler: fin stack, metal top cover and a side-mounted RGB fan.
  const cooler=part('cooler');
  box(cooler,.72,1.13,.72,1.12,3.11,-.19,steel);
  for(let i=0;i<20;i++)box(cooler,.78,.018,.76,1.12,2.57+i*.055,-.19,silver);
  box(cooler,.79,1.15,.035,1.12,3.11,.205,black);
  box(cooler,.025,1.10,.045,.76,3.11,.23,silver);
  box(cooler,.025,1.10,.045,1.48,3.11,.23,silver);
  const coolerReadout=text(cooler,'42°',.32,.17,1.12,3.10,.232,'#ccb2eb');
  const coolerFan=new THREE.Group();coolerFan.position.set(1.58,3.12,-.16);coolerFan.rotation.y=Math.PI/2;cooler.add(coolerFan);fan(coolerFan,.49,0,0,0,'cooler');
  for(let i=0;i<4;i++)wire(cooler,[[.92+i*.12,2.58,-.35],[.92+i*.12,2.45,-.26],[1.0+i*.06,2.48,-.05]],.025,silver);
  const ram=part('ram');
  for(let i=0;i<2;i++) {
    const x=2.08+i*.23;
    box(ram,.13,1.23,.12,x,3.10,-.49,black);
    box(ram,.10,1.05,.13,x,3.11,-.40,steel);
    const ramRGB=new THREE.MeshStandardMaterial({color:0xdab7f6,emissive:0xac3cff,emissiveIntensity:1.5});rgbMaterials.push({material:ramRGB,intensity:1.5});box(ram,.11,.055,.14,x,3.75,-.46,ramRGB);
    box(ram,.12,.055,.15,x,2.44,-.46,silver);
    for(let k=0;k<4;k++)box(ram,.06,.17,.02,x,2.75+k*.19,-.32,black);
  }
  // GPU installed horizontally in a PCIe slot; its fans face down into the case.
  const gpu=part('gpu');
  box(gpu,2.7,.37,.98,1.62,1.96,.04,dark);
  box(gpu,2.67,.055,1.0,1.62,2.17,.04,steel);
  box(gpu,2.55,.22,.03,1.62,1.97,.55,black);
  text(gpu,'GRAPHICS',.79,.12,1.62,1.98,.57,'#c3c7cf');
  box(gpu,2.40,.026,.02,1.62,1.80,.57,accent);
  for(let i=0;i<2;i++) {
    const gpuFan=new THREE.Group();gpuFan.position.set(.98+i*1.25,1.74,.02);gpuFan.rotation.x=Math.PI/2;gpu.add(gpuFan);
    fan(gpuFan,.43,0,0,0,'gpu');
  }
  box(gpu,.08,.56,1.09,.22,1.96,.04,edge);
  for(let i=0;i<4;i++)box(gpu,.1,.04,.12,.20,1.80+i*.1,.52,black);
  const ssd=part('ssd');
  box(ssd,.96,.24,.05,1.14,1.32,-.59,pcb);
  for(let i=0;i<3;i++)box(ssd,.18,.17,.04,.87+i*.23,1.32,-.54,black);
  text(ssd,'NVMe',.45,.1,1.14,1.32,-.51,'#c2c6cf');screw(ssd,1.61,1.32,-.52);
  // Lower PSU shroud conceals the unit and spare cables, as on a standard tower.
  const psu=part('psu');
  box(psu,3.15,.74,1.61,1.72,.66,0,dark);
  box(psu,3.03,.64,.025,1.72,.66,.82,steel);
  for(let i=0;i<14;i++)box(psu,.055,.3,.012,.50+i*.065,.65,.84,black);
  text(psu,'PSU',.28,.1,.90,.92,.84,'#80848d');
  // Sleeved power cables enter the GPU at its front end.
  for(let i=0;i<4;i++)wire(pc,[[2.65+i*.035,1.06,.4],[2.93+i*.035,1.24,.54],[2.87+i*.035,1.65,.59],[2.65+i*.035,2.15,.35]],.022);
  for(let i=0;i<4;i++)wire(pc,[[2.5+i*.03,1.06,-.3],[2.65+i*.025,1.5,-.35],[2.65+i*.025,2.8,-.40],[2.57,2.9+i*.04,-.51]],.018);
  const dramMaterial=new THREE.MeshStandardMaterial({color:0x332817,emissive:0x000000});
  const vgaMaterial=new THREE.MeshStandardMaterial({color:0x333333,emissive:0x000000});
  cyl(pc,.035,.018,2.29,2.36,-.56,dramMaterial);cyl(pc,.035,.018,2.47,2.36,-.56,vgaMaterial);
  text(pc,'DRAM VGA',.4,.065,2.38,2.25,-.55,'#a3a3aa');
  const powerMaterial=new THREE.MeshStandardMaterial({color:0xc7bbdb,emissive:0x6f478d,emissiveIntensity:.6});
  cyl(pc,.035,.025,3.12,4.35,.63,powerMaterial);

  // A separate monitor and cable, rather than a label floating over the case.
  const monitor=new THREE.Group();monitor.position.set(-2.15,2.15,.25);scene.add(monitor);
  box(monitor,3.10,1.78,.10,0,0,0,black);
  box(monitor,2.97,1.66,.018,0,.02,.09,dark);
  box(monitor,.15,.79,.17,0,-1.2,-.01,steel);
  box(monitor,1.1,.07,.65,0,-1.61,.05,steel);
  const screenCanvas=document.createElement('canvas');screenCanvas.width=1024;screenCanvas.height=640;
  const screenContext=screenCanvas.getContext('2d');
  const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.93,1.62),new THREE.MeshBasicMaterial({map:screenTexture}));
  screen.position.set(0,.03,.105);monitor.add(screen);
  text(monitor,'KW',.14,.05,0,-.79,.09,'#727680');
  const cable=part('cable');
  wire(cable,[[-2.1,.54,.2],[-2.6,.15,.3],[-1,.05,.7],[-.15,.2,.75],[.15,1.9,-.1]],.035);
  box(cable,.28,.13,.15,-2.1,.55,.21,rubber);
  text(cable,'HDMI',.25,.09,-2.1,.55,.30,'#aaa6b3');

  // Matte bench surface and soft physical shadows.
  const floor=box(scene,8.7,.08,4.4,-.6,-.11,.3,mat(0x242329,.1,.86));floor.receiveShadow=true;
  box(scene,8.8,.12,.08,-.6,-.12,2.49,dark);

  const labels={gpu:'Graphics card',ram:'RAM',cooler:'CPU cooler',ssd:'SSD',psu:'Power supply',cable:'Display cable / input'};
  // Each component owns its material instances; RGB state cannot leak between parts.
  const pickables=[];
  partGroups.forEach(group=>{
    const clonedMaterials=new Map();
    group.traverse(node=>{if(node.isMesh){
      const source=node.material;
      if(!clonedMaterials.has(source)) {
        const clone=source.clone();clonedMaterials.set(source,clone);
        const rgbEntry=rgbMaterials.find(entry=>entry.material===source);
        if(rgbEntry)rgbMaterials.push({material:clone,intensity:rgbEntry.intensity});
      }
      node.material=clonedMaterials.get(source);pickables.push(node);
    }});
  });
  const selectionOutline=new THREE.BoxHelper(partGroups.get('gpu'),0xc084ed);
  selectionOutline.visible=false;scene.add(selectionOutline);
  const cableOverlay=new THREE.Group();scene.add(cableOverlay);
  const cableSelectionMaterial=new THREE.MeshBasicMaterial({color:0xc084ed,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const cableGroup=partGroups.get('cable');
  cableGroup.updateWorldMatrix(true,true);
  cableGroup.traverse(node=>{if(node.isMesh){const overlay=new THREE.Mesh(node.geometry,cableSelectionMaterial);overlay.matrixAutoUpdate=false;overlay.matrix.copy(node.matrixWorld);cableOverlay.add(overlay);}});
  cableOverlay.visible=false;
  let hovered=null,focusedPart=null;
  function updateSelection() {
    const correct=document.querySelector('.game-choices .part-correct')?.dataset.part;
    const wrong=document.querySelector('.game-choices .part-wrong')?.dataset.part;
    const partName=correct||hovered||focusedPart||wrong;
    const color=correct?0x94d5ae:(partName&&partName===wrong)?0xd8a571:0xc084ed;
    selectionOutline.visible=!!partName&&partName!=='cable';
    cableOverlay.visible=partName==='cable';
    if(selectionOutline.visible){selectionOutline.setFromObject(partGroups.get(partName));selectionOutline.material.color.setHex(color);}
    cableSelectionMaterial.color.setHex(color);
    hoverLabel.textContent=partName?`${labels[partName]}${correct?' · correct':''}`:'Drag to rotate · Click a component';
    renderer.domElement.style.cursor=hovered&&!correct?'pointer':'grab';
    render();
  }
  function highlight(partName) {hovered=partName;updateSelection();}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function hit(event) {
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    // Glass is see-through; solid case panels and fan housings occlude parts.
    const hits=raycaster.intersectObjects([pc,monitor],true);
    for(const intersection of hits) {
      const object=intersection.object;
      let ancestor=object,shown=true;
      while(ancestor){if(!ancestor.visible){shown=false;break;}ancestor=ancestor.parent;}
      if(!shown)continue;
      const material=object.material;
      if(material?.transparent&&material.opacity<.2)continue;
      let group=object;while(group&&!group.userData.part)group=group.parent;
      return group?.userData.part||null;
    }
    return null;
  }
  let pointerDown=null;
  renderer.domElement.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};});
  renderer.domElement.addEventListener('pointermove',event=>{
    if(pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>5){highlight(null);return;}
    const partName=hit(event);if(partName!==hovered)highlight(partName);
  });
  renderer.domElement.addEventListener('pointerleave',()=>highlight(null));
  renderer.domElement.addEventListener('pointercancel',()=>{pointerDown=null;highlight(null);});
  renderer.domElement.addEventListener('pointerup',event=>{
    if(pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)<6){
      const partName=hit(event);if(partName)document.getElementById('pc-game').dispatchEvent(new CustomEvent('pc-part-select',{detail:{part:partName}}));
    }
    pointerDown=null;
  });
  document.querySelectorAll('.game-choices [data-part]').forEach(button=>{
    button.addEventListener('pointerenter',()=>highlight(button.dataset.part));
    button.addEventListener('pointerleave',()=>highlight(null));
    button.addEventListener('focus',()=>{focusedPart=button.dataset.part;updateSelection();});
    button.addEventListener('blur',()=>{focusedPart=null;updateSelection();});
  });
  resetButton.addEventListener('click',()=>{controls.reset();render();});
  renderer.domElement.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();
    const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(event.key==='ArrowLeft')spherical.theta-=.1;
    if(event.key==='ArrowRight')spherical.theta+=.1;
    if(event.key==='ArrowUp')spherical.phi-=.1;
    if(event.key==='ArrowDown')spherical.phi+=.1;
    spherical.phi=THREE.MathUtils.clamp(spherical.phi,.45,1.52);
    spherical.theta=THREE.MathUtils.clamp(spherical.theta,-.85,1.1);
    camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target));controls.update();render();
  });

  let previousFault=null;
  function updateState() {
    const fault=host.dataset.fault;
    if(fault!==previousFault){hovered=null;focusedPart=null;previousFault=fault;}
    const fixed=host.classList.contains('is-fixed');
    const readoutTexture=coolerReadout.material.map;
    const readoutCtx=readoutTexture.image.getContext('2d');
    readoutCtx.clearRect(0,0,512,128);readoutCtx.font='500 44px monospace';readoutCtx.textAlign='center';readoutCtx.textBaseline='middle';
    readoutCtx.fillStyle=fault==='cooler'?'#f09489':'#ccb2eb';
    readoutCtx.fillText(fault==='psu'?'':fault==='cooler'?'100°':'42°',256,64);readoutTexture.needsUpdate=true;
    dramMaterial.emissive.setHex(fault==='ram'?0xff8d16:0x000000);dramMaterial.emissiveIntensity=2;
    vgaMaterial.emissive.setHex(fault==='gpu'?0xffffff:0x000000);vgaMaterial.emissiveIntensity=2;
    powerMaterial.emissiveIntensity=fault==='psu'?0:.6;
    rgbMaterials.forEach(entry=>{if(!entry.color)entry.color=entry.material.color.clone();entry.material.emissiveIntensity=fault==='psu'?0:entry.intensity;if(fault==='psu')entry.material.color.setHex(0x25252a);else entry.material.color.copy(entry.color);});
    rgbLights.forEach(light=>{light.intensity=fault==='psu'?0:3.5;});
    const ctx=screenContext;
    ctx.fillStyle='#080b10';ctx.fillRect(0,0,1024,640);
    if(fault!=='psu') {
      ctx.strokeStyle=fixed?'#405b49':'#272e38';ctx.lineWidth=2;ctx.strokeRect(40,40,944,560);
      ctx.fillStyle=fixed?'#a7d7b6':'#ced3dc';ctx.font='500 42px monospace';ctx.textAlign='center';
      const title=document.getElementById('monitor-message').textContent;
      ctx.fillText(title,512,295);
      ctx.fillStyle='#777f8e';ctx.font='24px monospace';ctx.fillText(document.getElementById('monitor-detail').textContent,512,355);
      ctx.font='18px monospace';ctx.fillText(fixed?'POST completed':'DIAGNOSTIC BENCH',512,530);
    }
    screenTexture.needsUpdate=true;
    updateSelection();render();
  }
  new MutationObserver(updateSelection).observe(document.querySelector('.game-choices'),{attributes:true,attributeFilter:['class'],subtree:true});
  new MutationObserver(updateState).observe(host,{attributes:true,attributeFilter:['data-fault','class'],subtree:false});
  new MutationObserver(updateState).observe(document.getElementById('monitor-message'),{childList:true});
  let visible=false,frameId=0,last=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function render(){renderer.render(scene,camera);}
  function tick(time) {
    frameId=0;if(!visible)return;
    frameId=requestAnimationFrame(tick);
    if(time-last<32)return;
    const delta=Math.min((time-last)/1000,.05);last=time;
    if(!reduced.matches&&!document.body.classList.contains('motion-paused')) {
      const fault=host.dataset.fault;
      spinningFans.forEach(({rotor,kind})=>{if(fault!=='psu'&&!(fault==='cooler'&&kind==='cooler'))rotor.rotation.z+=delta*(kind==='gpu'?2:3);});
    }
    controls.update();render();
  }
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting&&!document.hidden;
    if(visible&&!frameId){last=performance.now();frameId=requestAnimationFrame(tick);}
    if(!visible&&frameId){cancelAnimationFrame(frameId);frameId=0;}
  }).observe(host);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){visible=false;cancelAnimationFrame(frameId);frameId=0;}
    else{visible=host.getBoundingClientRect().bottom>0&&host.getBoundingClientRect().top<innerHeight;if(visible&&!frameId)frameId=requestAnimationFrame(tick);}
  });
  controls.addEventListener('change',render);
  new ResizeObserver(()=>{
    const width=mount.clientWidth,height=mount.clientHeight;if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=camera.aspect<1?44:34;camera.updateProjectionMatrix();render();
  }).observe(mount);
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();visible=false;cancelAnimationFrame(frameId);host.classList.remove('pc3d-ready');
    hoverLabel.textContent='3D view paused. Reload to restore it, or use the diagram and answer buttons.';
  });
  resetButton.hidden=false;host.classList.add('pc3d-ready');
  updateState();
}
