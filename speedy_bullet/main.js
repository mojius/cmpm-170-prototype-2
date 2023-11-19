title = "SPEEDY BULLET";

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

  CHARGE_DECREASE_PER_FRAME: 0.05,
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
  seed: 83,
  theme: "crt",
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
g
 gbb
  gBbb
  gggg
 gggg
g
`,
`

  ppp
pprrrp
 pprrp
   pp

`,
`
lLllLl
LLLLLL
lllLll
LLLLLL
lLllLl
LLLLLL
`,
`
rrgr
rrrgr
 r rrr
   rrr
r rrr
rrrr
`,
`
   yy
  y  r
  LL
 LLLL
 LLLL
  LL
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
  stars = times(100, () => {
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
				enemies.push({pos: vec(150, (enemy & 0xFFF) + offset), sprite: "d"});
				break;
			case 0x2:
				enemies.push({pos: vec(150, (enemy & 0xFFF) + offset), sprite: "e"});
				break;
			case 0x3:
				enemies.push({pos: vec(150, (enemy & 0xFFF) + offset), sprite: "c"});
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
		
		let playerCollision = char(e.sprite, e.pos).isColliding.char.a;
		let bulletCollision = char(e.sprite, e.pos).isColliding.rect.purple;
		if (playerCollision) {
			end();
		}
		if (e.sprite == "c") {
			return false;
		}
    if (bulletCollision == true && e.sprite == "e") {
      end();
    }
    if (bulletCollision) {
      color("yellow");
      particle(e.pos, 40, 3, 10, 360);
      score += 10;
    }
		return bulletCollision;
	});
	color("black");
}

function updateBullets() {
	color("purple");
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
    color("light_blue");

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