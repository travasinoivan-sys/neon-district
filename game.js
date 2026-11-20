let scene, camera, renderer, player;
let started = false;
let keys = {};
let clock;

const menu = document.querySelector('#menu');
const hud = document.querySelector('#hud');
const speedLabel = document.querySelector('#speed');

window.addEventListener('DOMContentLoaded', init);

document.querySelector('#start').addEventListener('click', () => {
  started = true;
  menu.classList.add('hidden');
  hud.style.display = 'flex';
});

window.addEventListener('keydown', event => keys[event.code] = true);
window.addEventListener('keyup', event => keys[event.code] = false);

function init() {
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x09091b);
  scene.fog = new THREE.Fog(0x09091b, 25, 95);

  camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 500);
  camera.position.set(0, 8, 13);

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
    antialias: true
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;

  scene.add(new THREE.HemisphereLight(0x8abfff, 0x161020, 1.8));

  const sun = new THREE.DirectionalLight(0xffc5ef, 2.5);
  sun.position.set(-15, 25, 10);
  sun.castShadow = true;
  scene.add(sun);

  createWorld();
  createPlayer();
  animate();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

function createWorld() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshStandardMaterial({ color: 0x17172a, roughness: 0.82 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x25263b });
  for (const x of [-26, 26]) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 180), roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.x = x;
    road.position.y = 0.01;
    scene.add(road);
  }

  const buildingColors = [0x24245b, 0x32204a, 0x19364d, 0x4d203b];
  for (let z = -70; z <= 70; z += 14) {
    for (const x of [-48, -32, 32, 48]) {
      const height = 8 + Math.random() * 22;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(10, height, 10),
        new THREE.MeshStandardMaterial({
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
          roughness: 0.55
        })
      );
      building.position.set(x, height / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);

      if (height > 16) addNeonSign(building, z);
    }
  }
}

function addNeonSign(building, z) {
  const colors = [0xff2b77, 0x66e7ff, 0xffd166];
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 1.2, 0.15),
    new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
  );
  sign.position.set(building.position.x, building.position.y + 1, z > 0 ? 5.08 : -5.08);
  scene.add(sign);
}

function createPlayer() {
  player = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.75, 1.2, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xff2b77, roughness: 0.5 })
  );
  body.position.y = 1.7;
  body.castShadow = true;
  player.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xe9bba6 })
  );
  head.position.y = 3.35;
  head.castShadow = true;
  player.add(head);

  scene.add(player);
}

function readController() {
  const pad = navigator.getGamepads?.().find(Boolean);
  if (!pad) return { x: 0, z: 0 };

  const deadZone = value => Math.abs(value) > 0.15 ? value : 0;
  return { x: deadZone(pad.axes[0]), z: deadZone(pad.axes[1]) };
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  let moveX = 0;
  let moveZ = 0;

  if (started) {
    moveX = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    moveZ = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);

    const controller = readController();
    moveX += controller.x;
    moveZ += controller.z;

    const length = Math.hypot(moveX, moveZ);
    if (length > 0.05) {
      moveX /= Math.max(length, 1);
      moveZ /= Math.max(length, 1);

      const sprint = keys.ShiftLeft ? 1.8 : 1;
      const speed = 8 * sprint;
      player.position.x += moveX * speed * delta;
      player.position.z += moveZ * speed * delta;
      player.rotation.y = Math.atan2(moveX, moveZ);

      speedLabel.textContent = `${Math.round(speed * 3.6)} KM/H`;
    } else {
      speedLabel.textContent = '0 KM/H';
    }

    player.position.x = THREE.MathUtils.clamp(player.position.x, -72, 72);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -85, 85);

    const target = player.position.clone().add(new THREE.Vector3(0, 5.5, 12));
    camera.position.lerp(target, 1 - Math.pow(0.001, delta));
    camera.lookAt(player.position.x, 2.2, player.position.z);
  }

  renderer.render(scene, camera);
}
