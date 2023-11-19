// title = "GLOOP";

// description = `
// [Slide] Move
// `;

// characters = [
//   `
//  llll
// llllll
// ll  ll
// ll  ll
// `,
//   `
//  lll
// l   l
// l l l
// l   l
//  lll
// `,
//   `
// l l
//  l
// l l
// `,
//   `
//  l l l
// l   l
//  l   l
// l   l
//  l   l
// l l l
// `,
// ];

// options = {
//   isPlayingBgm: true,
//   isReplayEnabled: true,
// };

// let p, v, vya, pis, sps;

// function update() {
//   if (ticks === 0) {
//     p = vec(50, 50);
//     v = vec();
//     vya = -1;
//     pis = [];
//     sps = [];
//   }
//   color("light_cyan");
//   for (let x = 0; x < 15; x++) {
//     for (let y = 0; y < 18; y++) {
//       if ((x + y) % 2 === 0) {
//         char("d", x * 6 + 8, y * 6);
//       }
//     }
//   }
//   v.y += 0.02 * difficulty * vya;
//   v.mul(0.99);
//   p.add(v);
//   p.x = clamp(input.pos.x, 8, 92);
//   p.y = wrap(p.y, 0, 99);
//   color("black");
//   char("a", p);
//   while (pis.length < 7) {
//     pis.push({
//       p: vec(rnd(10, 90), rnd(10, 90)),
//     });
//   }
//   if (rnd() < 0.02 * difficulty) {
//     const pp = vec(rnd(10, 90), rnd(10, 90));
//     if (abs(pp.x - p.x) + abs(wrap(pp.y - p.y, -50, 50)) > 25) {
//       sps.push({
//         p: pp,
//         isAlive: true,
//       });
//     }
//   }
//   pis = pis.filter((pi) => {
//     let isAlive = true;
//     if (char("b", pi.p).isColliding.char.a) {
//       if (abs(v.y) > 1) {
//         play("select");
//         isAlive = false;
//         sps.map((sp) => {
//           if (sp.p.distanceTo(pi.p) < 20) {
//             play("coin");
//             sp.isAlive = false;
//           }
//         });
//       } else {
//         play("hit");
//       }
//       v.y *= -0.3;
//       vya *= -1;
//       p.y = pi.p.y + vya * 5;
//     }
//     return isAlive;
//   });
//   let sc = 1;
//   color("red");
//   sps = sps.filter((sp) => {
//     if (sp.isAlive) {
//       if (char("c", sp.p).isColliding.char.a) {
//         play("explosion");
//         end();
//       }
//       return true;
//     } else {
//       addScore(sc, sp.p);
//       sc++;
//     }
//   });
// }
title = "SPEEDY BULLET TEST";

description = `
`;

const G = {
  WIDTH: 150,
  HEIGHT: 100,

  STAR_SPEED_MIN: 0.5,
	STAR_SPEED_MAX: 1.0,

  PLAYER_FIRE_RATE: 8,
  PLAYER_GUN_OFFSET: 3,
  PLAYER_SPEED: 1,
  PLAYER_SPAWN_OFFSET: 15,

  FBULLET_SPEED: 2,

  UPDOWN_MARGIN: 4,

  CHARGE_DECREASE_PER_FRAME: 0.01,
  RAPID_INCREASE_PER_SHOT: 0.15,

  SPEED_LOWER_BOUND: 0.5,
  SPEED_UPPER_BOUND: 2,

  CHARGE_ACTIVE: false,
  CHARGE_TIMER: 0,

  RAPID_ACTIVE: false,
  RAPID_INTERVAL: 0,
  RAPID_INTERVAL_MAX: 25,
}

options = {
  viewSize: {x: G.WIDTH, y: G.HEIGHT},
  isCapturing: true,
  isCapturingGameCanvasOnly: true,
  captureCanvasScale: 2,
  seed: 83
};

/**
 * @typedef {{
 * pos: Vector,
 * firingCooldown: number,
 * speed: number,
 * direction: Vector,
 * }} Player
 */

/**
 * @type { Player }
 */
let player;

/**
 * @typedef {{
 * pos: Vector
 * size: number
 * }} FBullet
 */

/**
 * @type {FBullet[]}
 */
let fBullets;

/**
* @typedef {{
* pos: Vector,
* speed: number
* }} Star
*/

/**
* @type  { Star [] }
*/
let stars;

/**
* @typedef {{
* timer: number,
* active: boolean
* }} Timer
*/

/**
 * @type { Timer }
 */
let chargeTimer;

/**
 * @type { Timer }
 */
let rapidFireTimer;

/**
* @typedef {{
* pos: Vector,
* sprite: string
* }} eneData
*/
	
/**
 * @type { eneData[] }
 */
let enemies;

// Enemy formations:
// Digit 1 represnts enemy type {1: Basic, 2: Bomb, 3: Wall}
// Digit 2/3/4 represents the y pos in hex
let formationWalls = [[0x3000 + 20, 0x3000 + 10, 0x3000 + 15], 
[0x3000 + 80, 0x3000 + 85, 0x3000 + 75], 
[0x3000 + 35, 0x3000 + 40, 0x3000 + 45]];
let formationBasics = [[0x1000 + 20, 0x1000 + 10, 0x1000 + 60, 0x1000 + 75], 
[0x1000 + 85, 0x1000 + 35, 0x1000 + 65, 0x1000 + 25], 
[0x1000 + 50, 0x1000 + 40, 0x1000 + 30]];
let formationBombs = [[0x2000 + 35], [0x2000 + 75], [0x2000 + 50], [0x2000 + 5], [0x2000 + 95]];

function update() {
  if (!ticks)
  {
    initPlayer();
    initStars();
	enemies = new Array();
  }


  updateStars();
  updatePlayer();

  updateBullets();
  updateEnemies();
  updateBullets();

  inputRapidCharge();
  
}

characters = [
`
ccc
cccccc
lllllllllllll
lllllllllllll
cccccc
ccc
`
]

function initPlayer()
{
  player = {
      pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
      firingCooldown: G.PLAYER_FIRE_RATE,
      speed: G.PLAYER_SPEED,
      direction: vec(0, 1)
    };

  fBullets = [];

  player.pos = vec(G.PLAYER_SPAWN_OFFSET, G.HEIGHT / 2);

}

function initStars()
{
  stars = times(20, () => {
      // Random number generator function
      // rnd( min, max )
      const posX = rnd(0, G.WIDTH);
      const posY = rnd(0, G.HEIGHT);
      // An object of type Star with appropriate properties
      return {
          // Creates a Vector
          pos: vec(posX, posY),
          // More RNG
          speed: rnd(G.STAR_SPEED_MIN, G.STAR_SPEED_MAX)
      };
  });
  
}

function initWave(formation) {
	var offset = rndi(-20, 21);
	formation.forEach(enemy => {
		switch(enemy >> 12) {
			default:
			case 0x1:
				enemies.push({pos: vec(150, (enemy & 0xFFF) + offset), sprite: "basic"});
				break;
			case 0x2:
				enemies.push({pos: vec(150, (enemy & 0xFFF) + offset), sprite: "bomb"});
				break;
			case 0x3:
				enemies.push({pos: vec(150, (enemy & 0xFFF) + offset), sprite: "wall"});
				break;
		}
	});
}

function newRandWave(type = null) {
	if (type == null) {
		type = rndi(1, 4)
	}
	switch(type) {
		default:
		case 1:
			initWave(formationBasics[rndi(formationBasics.length)]);
			break;
		case 2:
			initWave(formationBombs[rndi(formationBombs.length)]);
			break;
		case 3:
			initWave(formationWalls[rndi(formationWalls.length)]);
			break;
	}
}

function updateEnemies() {
	if (ticks % 120 == 0) {
		newRandWave();
	}
	remove(enemies, (e) => {
		e.pos.x -= 0.3;
		if (e.pos.x <= 0) {
			return true;
		}
		//char(e.pos.x, e.pos.y, e.sprite)
		switch(e.sprite) {
			case "basic":
				color("light_red");
				break;
			case "bomb":
				color("red");
				break;
			case "wall":
				color("black");
				break;
		}
		let playerCollision = box(e.pos.x, e.pos.y, 5,5).isColliding.char.a;
		let bulletCollision = box(e.pos.x, e.pos.y, 5,5).isColliding.rect.light_blue;
		if (playerCollision) {
			end();
		}
		if (e.sprite == "wall") {
			return false;
		}
    if (bulletCollision == true && e.sprite == "bomb") {
      // Explosion VFX?
      end();
    }
    if (bulletCollision) {
      score += 10;
    }
		return bulletCollision;
	});
	color("black");
}

function updateBullets() {
	color("light_blue");
	remove(fBullets, (b) => {
		b.pos.x += (1.0 / (b.size + 1)) * 2;
		//change isColliding.rect to isColliding.char when needed
		let enemyWallCollision = box(b.pos.x, b.pos.y, b.size, b.size).isColliding.rect.black;
		if (b.pos.x >= G.WIDTH + 5 || enemyWallCollision || b.size <= 0) {
      play("explosion");
			return true;
		}
	});
	color("black");
}

function updateStars()
{
  stars.forEach((s) =>
  {
    // move left
    s.pos.x -= s.speed;
    // Bring the star back to top once it's past the bottom of the screen
    if (s.pos.x < 0) s.pos.x = G.WIDTH;

    // Color to draw
    color("green");

    box(s.pos, 1);
  });
}

function updatePlayer()
{
    player.pos.clamp(0, G.WIDTH, 0, G.HEIGHT);
    player.pos.y += player.direction.y * player.speed;

    if (player.pos.y > G.HEIGHT - G.UPDOWN_MARGIN)
      player.direction.y = -1;
    else if (player.pos.y < 0 + G.UPDOWN_MARGIN)
      player.direction.y = 1;
    
    // Cooling down for the next shot
    player.firingCooldown--;
    // time to fire the next shot
    if (player.firingCooldown <= 0 && input.isJustReleased) {
      // create bullet
      fBullets.push({
        pos: vec(player.pos.x + 6, player.pos.y),
		size: (G.CHARGE_TIMER / 30) + 1
      });
      // Reset firing cooldown
      player.firingCooldown = G.PLAYER_FIRE_RATE;
    }

    color("black");
    char("a", player.pos);
}

function inputRapidCharge()
{
  //text(`timer: ${G.CHARGE_TIMER}`, 3, 8)
  //text(`pl speed: ${player.speed}`, 3, 16)
  //text(`rapid interval: ${G.RAPID_INTERVAL}`, 3, 24)


  if (input.isJustPressed)
  {
    // Start charge timer
    G.CHARGE_ACTIVE = true;

    if (G.RAPID_ACTIVE == false)
    {
      // if false, start reset timer
      G.RAPID_ACTIVE = true
      G.RAPID_INTERVAL = G.RAPID_INTERVAL_MAX;
    }
    else if (G.RAPID_ACTIVE == true)
    {
      // otherwise, just reset timer and keep it "active"

      if (player.speed <= G.SPEED_UPPER_BOUND == G.RAPID_INTERVAL > 0)
        player.speed += G.RAPID_INCREASE_PER_SHOT * (G.RAPID_INTERVAL / 30);

      G.RAPID_INTERVAL = G.RAPID_INTERVAL_MAX; 
    }

    console.log("pew!");

  }

  if (input.isPressed)
  {
    if (G.CHARGE_ACTIVE)
      G.CHARGE_TIMER += 1;

    if (G.CHARGE_TIMER > 30 && player.speed >= G.SPEED_LOWER_BOUND)
    {
      player.speed -= (G.CHARGE_DECREASE_PER_FRAME) * 2;
      console.log("Speed decreasing");
    }
  }

  if (input.isJustReleased)
  {
    // play shooting sound effect
    play("laser");
    // Charge: Disable.

    if (G.CHARGE_TIMER > 60)
    {
      // Shoot a big blast.
      console.log("BLAST!!!")
      play("powerUp");
    }

    G.CHARGE_TIMER = 0;
    G.CHARGE_ACTIVE = false;
  }

  if (G.RAPID_ACTIVE)
  {
    G.RAPID_INTERVAL -= 1;
    if (G.RAPID_INTERVAL <= 0)
    G.RAPID_ACTIVE = false;
  }
}
