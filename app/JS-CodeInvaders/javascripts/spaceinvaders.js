/*
  spaceinvaders.js

  the core logic for the space invaders game.

*/

/*
    Game Class

    The Game class represents a Space Invaders game.
    Create an instance of it, change any of the default values
    in the settings, and call 'start' to run the game.

    Call 'initialise' before 'start' to set the canvas the game
    will draw to.

    Call 'moveShip' or 'shipFire' to control the ship.

    Listen for 'gameWon' or 'gameLost' events to handle the game
    ending.
*/
//

function GameImages() {
  this.keyboardImageCode = [
    'iVBORw0KGgoAAAANSUhEUgAAAFAAAAAqBAMAAADWhsE5AAAAG1BMVEXX19fm5uYAAAD09PSqqqq8vLz///84ODisrKx1VPgwAAAAzklEQVQ4y8WVQQrCMBBFB3qCCKJLGVpwawNeYOYC4qJrF71Ab6Ant5k2M4KEyS6fHwKfD+VNUgLXUKUPvOuKZwjPeE9LfYxxzn5pGiD0TOECnfoAMGbfNG1bXHBIS31CnLIfmq7FOtUXZY6eo8zRQArumZlaFmWOnhEHofax99vD5H6b2hYXdLGV2mNWaiZn3kytikrtMWfqpLlso07Kf+ifWURti0KFU9lGLec5b5vJUqOmdY0y9l91eyon0q5oNxynbTNZKtTVz0f1g/QFvZHa0OlzTEYAAAAASUVORK5CYII=',
  ];
  this.keycapList = [
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAD1BMVEUAAAD///9VVVUAAACqqqpggSv+AAAAAXRSTlMAQObYZgAAAEtJREFUCNd1jcENgDAMAy02cJsBaMIAICbI/kthRc2Te1nWycbhBXAlhZ1wqxBYybHIgDPnsxsFNXIsdyP+nNnOaKeW+yv6/QbeAh/+7w6qn7DhWwAAAABJRU5ErkJggg==',
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAD1BMVEUAAAD///9VVVUAAACqqqpggSv+AAAAAXRSTlMAQObYZgAAAExJREFUCNd1y8ENwCAMA8CIDVxlgOIwQCsmyP5LkUTwxB9bJ1kyJKubQ98aCrUtsIsgpZEdKUOj/pDuOUKoeI7YPFKv4cC+Vz6RWZEFlLYLYltjut4AAAAASUVORK5CYII=',
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAD1BMVEUAAAD///9VVVUAAACqqqpggSv+AAAAAXRSTlMAQObYZgAAADhJREFUCNdjIAYwKYGBA4OiIBgoM6iAaRFlBkVnY0EhiIihkpAiSMTRUMlJEUkNQheTMRgY4LEKACepCGT9ISzjAAAAAElFTkSuQmCC'
  ];
}

GameImages.prototype.keyboard = function() {
  //image list
  var keyboard = new Image();
  keyboard.src = 'data:image/png;base64,' + this.keyboardImageCode;
  this.keyboard = keyboard;
};

GameImages.prototype.keycaps = function() {
  var GameImages = Object(this);
  //image list
  //var imageFilejson = "images.json";
  var keycaps = [];
  GameImages.keycapList.map(function(keycapImageCode, i) {
    var keycap = new Image();
    keycap.src = 'data:image/png;base64,' + keycapImageCode;
    keycaps.push(keycap);
  });
  this.keycaps = keycaps;
};

var gameImages = new GameImages();
gameImages.keyboard();
gameImages.keycaps();
//  Creates an instance of the Game class.
function Game() {
  //  Set the initial config.
  this.config = {
    bombRate: 0.30,
    bombMinVelocity: 50,
    bombMaxVelocity: 50,
    invaderInitialVelocity: 25,
    invaderAcceleration: 0,
    invaderDropDistance: 20,
    rocketVelocity: 120,
    rocketMaxFireRate: 2,
    gameWidth: 400,
    gameHeight: 300,
    fps: 50,
    debugMode: false,
    invaderRanks: 1,
    invaderFiles: 10,
    shipSpeed: 120,
    levelDifficultyMultiplier: 0.2,
    pointsPerInvader: 5
  };
  //  All state is in the variables below.
  this.width = 0;
  this.height = 0;
  this.gameBounds = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  };
  this.intervalId = 0;
  this.score = 0;
  this.stage = 0;
  this.stageName = ['ASSEMBLY', 'C', 'JAVA', 'JAVASCRIPT'];
  this.level = 1;
  //  The state stack.
  this.stateStack = [];
  //  Input/output
  this.pressedKeys = {};
  this.gameCanvas = null;
  //  All sounds.
  this.sounds = null;
  // background screen
  this.backgroundScreen = null;
}

//  Initialis the Game with a canvas.
Game.prototype.initialise = function(gameCanvas) {
  //  Set the game canvas.
  this.gameCanvas = gameCanvas;
  //  Set the game width and height.
  this.width = gameCanvas.width;
  this.height = gameCanvas.height;
  //  Set the state game bounds.
  this.gameBounds = {
    left: gameCanvas.width / 2 - this.config.gameWidth / 2,
    right: gameCanvas.width / 2 + this.config.gameWidth / 2,
    top: gameCanvas.height / 2 - this.config.gameHeight / 2,
    bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
  };
};

Game.prototype.moveToState = function(state) {
  //  If we are in a state, leave it.
  if (this.currentState() && this.currentState().leave) {
    this.currentState().leave(game);
    this.stateStack.pop();
  }
  //  If there's an enter function for the new state, call it.
  if (state.enter) {
    state.enter(game);
  }
  //  Set the current state.
  this.stateStack.pop();
  this.stateStack.push(state);
};

//  Start the Game.
Game.prototype.start = function() {
  //  Move into the 'welcome' state.
  this.moveToState(new WelcomeState());
  //  Set the game variables.
  this.config.debugMode = /debug=true/.test(window.location.href);
  //  Start the game loop.
  var game = this;
  this.intervalId = setInterval(function() {
    GameLoop(game);
  }, 1000 / this.config.fps);
};

//  Returns the current state.
Game.prototype.currentState = function() {
  return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

//  Mutes or unmutes the game.
Game.prototype.mute = function(mute) {
  //  If we've been told to mute, mute.
  if (mute === true) {
    this.sounds.mute = true;
  } else if (mute === false) {
    this.sounds.mute = false;
  } else {
    // Toggle mute instead...
    this.sounds.mute = this.sounds.mute ? false : true;
  }
};

//  The main loop.
function GameLoop(game) {
  var currentState = game.currentState();
  if (currentState) {
    //  Delta t is the time to update/draw.
    var dt = 1 / game.config.fps;
    //  Get the drawing context.
    var ctx = this.gameCanvas.getContext("2d");
    //  Update if we have an update function. Also draw
    //  if we have a draw function.
    if (currentState.update) {
      currentState.update(game, dt);
    }
    if (currentState.draw) {
      currentState.draw(game, dt, ctx);
    }
  }
}

Game.prototype.pushState = function(state) {
  //  If there's an enter function for the new state, call it.
  if (state.enter) {
    state.enter(game);
  }
  //  Set the current state.
  this.stateStack.push(state);
};

Game.prototype.popState = function() {
  //  Leave and pop the state.
  if (this.currentState()) {
    if (this.currentState().leave) {
      this.currentState().leave(game);
    }
    //  Set the current state.
    this.stateStack.pop();
  }
};

//  The stop function stops the game.
Game.prototype.stop = function Stop() {
  clearInterval(this.intervalId);
};

//  Inform the game a key is down.
Game.prototype.keyDown = function(keyCode) {
  this.pressedKeys[keyCode] = true;
  //  Delegate to the current state too.
  if (this.currentState() && this.currentState().keyDown) {
    this.currentState().keyDown(this, keyCode);
  }
};

//  Inform the game a key is up.
Game.prototype.keyUp = function(keyCode) {
  delete this.pressedKeys[keyCode];
  //  Delegate to the current state too.
  if (this.currentState() && this.currentState().keyUp) {
    this.currentState().keyUp(this, keyCode);
  }
};

function WelcomeState() {

}

WelcomeState.prototype.enter = function(game) {
  // Create and load the sounds.
  game.sounds = new Sounds();
  game.sounds.init();
  game.sounds.loadSound('shoot', 'sounds/shoot.wav');
  game.sounds.loadSound('bang', 'sounds/bang.wav');
  game.sounds.loadSound('explosion', 'sounds/explosion.wav');
};

WelcomeState.prototype.update = function(game, dt) {


};

WelcomeState.prototype.draw = function(game, dt, ctx) {
  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);
  ctx.font = "30px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "center";
  ctx.textAlign = "center";
  ctx.fillText("Code Invaders", game.width / 2, game.height / 2 - 40);
  ctx.font = "16px Arial";
  ctx.fillText("Select Stage", game.width / 2, game.height / 2);
  //draw stage select box
  game.stageName.map(function(stage, i) {
    if (game.stage === i) {
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.strokeStyle = "#999999";
      ctx.fillStyle = '#999999';
    }
    ctx.strokeRect(game.width / 2 - 255 + i * 130, game.height / 2 + 300, 120, 60);
    ctx.fillText(game.stageName[i], game.width / 2 - 195 + i * 130, game.height / 2 + 335, 120, 60);
  });
};

WelcomeState.prototype.keyDown = function(game, keyCode) {
  if (keyCode == 32) /*space*/ {
    //  Space starts the game.
    game.level = 1;
    game.score = 0;
    game.moveToState(new LevelIntroState(game.level));
  }
  if (keyCode == 37) /*left*/ {
    //  Space starts the game.
    if (game.stage > 0) {
      game.stage--;
    }
  }
  if (keyCode == 39) /*right*/ {
    //  Space starts the game.
    if (game.stage < 3) {
      game.stage++;
    }
  }
};

function GameOverState() {

}

GameOverState.prototype.update = function(game, dt) {

};

GameOverState.prototype.draw = function(game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);
  ctx.font = "30px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "center";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", game.width / 2, game.height / 2 - 40);
  ctx.font = "16px Arial";
  ctx.fillText("You scored " + game.score + " and got to level " + game.level, game.width / 2, game.height / 2);
  ctx.font = "16px Arial";
  ctx.fillText("Press 'Space' to play again.", game.width / 2, game.height / 2 + 40);
};

GameOverState.prototype.keyDown = function(game, keyCode) {
  if (keyCode == 32) /*space*/ {
    //  Space restarts the game.
    game.score = 0;
    game.level = 1;
    game.moveToState(new LevelIntroState(1));
  }
};

//  Create a PlayState with the game config and the level you are on.
function PlayState(config, level) {
  this.config = config;
  this.level = level;
  //  Game state.
  this.invaderCurrentVelocity = 10;
  this.invaderCurrentDropDistance = 0;
  this.invadersAreDropping = false;
  this.lastRocketTime = null;
  //  Game entities.
  this.ship = null;
  this.invaders = [];
  this.rockets = [];
  this.bombs = [];
  this.boss = {};
  this.bossbombs = [];
  this.bossexplosion = [];
}

PlayState.prototype.enter = function(game) {
  //  Create the ship.
  this.ship = new Ship(game.width / 2, game.gameBounds.bottom);
  //  Setup initial state.
  this.invaderCurrentVelocity = 10;
  this.invaderCurrentDropDistance = 0;
  this.invadersAreDropping = false;
  //  Set the ship speed for this level, as well as invader params.
  var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
  this.shipSpeed = this.config.shipSpeed;
  this.invaderInitialVelocity = this.config.invaderInitialVelocity + (levelMultiplier * this.config.invaderInitialVelocity);
  this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
  this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
  this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);
  //  Create the invaders.
  var ranks = this.config.invaderRanks;
  var files = this.config.invaderFiles;
  var invaders = [];

  for (var rank = 0; rank < ranks; rank++) {
    for (var file = 0; file < files; file++) {
      invaders.push(new Invader(
        (game.width / 2) + ((files / 2 - file) * 200 / files),
        (game.gameBounds.top - rank * 20 - 100),
        rank, file, 'Invader'));
    }
  }

  this.invaders = invaders;
  this.invaderCurrentVelocity = this.invaderInitialVelocity;
  this.invaderVelocity = {
    x: -this.invaderInitialVelocity,
    y: 0
  };
  this.invaderNextVelocity = null;

  // Create Boss
  var boss = new Boss((game.width / 2), 200, game.stage);
  this.boss = boss;

  //end count
  this.endcount = 0;
};

PlayState.prototype.update = function(game, dt) {

  //  If the left or right arrow keys are pressed, move
  //  the ship. Check this on ticks rather than via a keydown
  //  event for smooth movement, otherwise the ship would move
  //  more like a text editor caret.

  //this initialize
  var PlayState = Object(this);

  if (game.pressedKeys[37]) {
    this.ship.x -= this.shipSpeed * dt;
  }
  if (game.pressedKeys[39]) {
    this.ship.x += this.shipSpeed * dt;
  }
  if (game.pressedKeys[32]) {
    this.fireRocket();
  }
  //  Keep the ship in bounds.
  if (this.ship.x < game.gameBounds.left) {
    this.ship.x = game.gameBounds.left;
  }
  if (this.ship.x > game.gameBounds.right) {
    this.ship.x = game.gameBounds.right;
  }
  //  Move each bomb.
  this.bombs.map(function(bomb, i) {
    bomb.y += dt * bomb.velocity;
    //  If the rocket has gone off the screen remove it.
    if (bomb.y > PlayState.height) {
      PlayState.bombs.splice(i--, 1);
    }
  });
  //  Move each rocket.
  this.rockets.map(function(rocket, i) {
    rocket.y -= dt * rocket.velocity;
    //  If the rocket has gone off the screen remove it.
    if (rocket.y < 0) {
      PlayState.rockets.splice(i--, 1);
    }
  });

  //  Move the invaders.
  var hitLeft = false,
    hitRight = false,
    hitBottom = false;
  this.invaders.map(function(invader) {
    var newx = invader.x + PlayState.invaderVelocity.x * dt;
    var newy = invader.y + PlayState.invaderVelocity.y * dt;
    if (hitLeft === false && newx < game.gameBounds.left) {
      hitLeft = true;
    } else if (hitRight === false && newx > game.gameBounds.right) {
      hitRight = true;
    } else if (hitBottom === false && newy > game.gameBounds.bottom) {
      hitBottom = true;
    }
    if (!hitLeft && !hitRight && !hitBottom) {
      invader.x = newx;
      invader.y = newy;
    }
  });

  //  If we've hit the left, move down then right.
  if (hitLeft) {
    this.invaderCurrentVelocity += this.config.invaderAcceleration;
    this.invaderVelocity = {
      x: this.invaderCurrentVelocity,
      y: 0
    };
  }
  //  If we've hit the right, move down then left.
  if (hitRight) {
    this.invaderCurrentVelocity += this.config.invaderAcceleration;
    this.invaderVelocity = {
      x: -this.invaderCurrentVelocity,
      y: 0
    };
  }
  //move Boss
  if (this.boss.x > 400) {
    this.boss.movedirection = 1;
  }
  if (this.boss.x < 200) {
    this.boss.movedirection = -1;
  }
  this.boss.x = this.boss.x - dt * this.boss.movedirection * 30;
  //boss bomb moving
  //  Move each bomb.
  this.bossbombs.map(function(bossbomb, i) {
    //  If the rocket has gone off the screen remove it.
    switch (bossbomb.direction) {
      case 0:
        bossbomb.y += dt * bossbomb.velocity;
        bossbomb.x -= dt * bossbomb.velocity;
        break;
      case 1:
        bossbomb.y += dt * bossbomb.velocity;
        break;
      case 2:
        bossbomb.y += dt * bossbomb.velocity;
        bossbomb.x += dt * bossbomb.velocity;
        break;
      default:
        break;
    }
    if (bossbomb.y > game.height || bossbomb.x > game.width || bossbomb.x < 0 || bossbomb.y < 0) {
      PlayState.bossbombs.splice(i--, 1);
    }
  });
  //explosion boss
  this.bossexplosion.map(function(bossexplosion, i) {
    //  If the rocket has gone off the screen remove it.
    switch (bossexplosion.direction) {
      case 0:
        bossexplosion.y += dt * bossexplosion.velocity;
        bossexplosion.x -= dt * bossexplosion.velocity;
        break;
      case 1:
        bossexplosion.y += dt * bossexplosion.velocity;
        break;
      case 2:
        bossexplosion.y += dt * bossexplosion.velocity;
        bossexplosion.x += dt * bossexplosion.velocity;
        break;
      case 3:
        bossexplosion.y -= dt * bossexplosion.velocity;
        bossexplosion.x -= dt * bossexplosion.velocity;
        break;
      case 4:
        bossexplosion.y -= dt * bossexplosion.velocity;
        break;
      case 5:
        bossexplosion.y -= dt * bossexplosion.velocity;
        bossexplosion.x += dt * bossexplosion.velocity;
        break;
      default:
        break;
    }
  });

  //  If we've hit the bottom, it's game over.
  if (hitBottom) {}
  //  Check for rocket/invader collisions.
  this.invaders.map(function(invader, i) {
    var bang = false;

    PlayState.rockets.map(function(rocket, j) {
      if (rocket.x >= (invader.x - invader.width / 2) && rocket.x <= (invader.x + invader.width / 2) &&
        rocket.y >= (invader.y - invader.height / 2) && rocket.y <= (invader.y + invader.height / 2)) {
        //  Remove the rocket, set 'bang' so we don't process
        //  this rocket again.
        PlayState.rockets.splice(j--, 1);
        bang = true;
        game.score += PlayState.config.pointsPerInvader;
      }
    });
    if (bang) {
      PlayState.invaders.splice(i--, 1);
      game.sounds.playSound('bang');
    }
  });
  //  Check for rocket/boss collisions.
  var boss_ = PlayState.boss;
  var shoted_ = false;

  this.rockets.map(function(rocket, i) {
    if (rocket.x >= (boss_.x - boss_.width / 2) && rocket.x <= (boss_.x + boss_.width / 2) &&
      rocket.y >= (boss_.y - boss_.height / 2) && rocket.y <= (boss_.y + boss_.height / 2)) {
      //  Remove the rocket, set 'bang' so we don't process
      //  this rocket again.
      PlayState.rockets.splice(i--, 1);
      shoted_ = true;
      game.score += PlayState.config.pointsPerInvader;
    }
  });
  if (shoted_) {
    this.boss.hp = PlayState.boss.hp - 20;
    if (PlayState.boss.hp < 0) {
      this.boss.hp = 0;
      //game end
    }
    game.sounds.playSound('bang');
  }
  //Bossbombshot
  if (PlayState.boss.hp > 0 && PlayState.bossbombs.length === 0) {
    //  Fire!  speed modifi needs
    PlayState.bossbombs.push(new BossBomb(PlayState.boss.x, PlayState.boss.y + PlayState.boss.height / 2, 0,
      PlayState.bombMinVelocity + Math.random() * (PlayState.bombMaxVelocity - PlayState.bombMinVelocity)));
    PlayState.bossbombs.push(new BossBomb(PlayState.boss.x, PlayState.boss.y + PlayState.boss.height / 2, 1,
      PlayState.bombMinVelocity + Math.random() * (PlayState.bombMaxVelocity - PlayState.bombMinVelocity)));
    PlayState.bossbombs.push(new BossBomb(PlayState.boss.x, PlayState.boss.y + PlayState.boss.height / 2, 2,
      PlayState.bombMinVelocity + Math.random() * (PlayState.bombMaxVelocity - PlayState.bombMinVelocity)));

  }
  //  Find all of the front rank invaders.
  var frontRankInvaders = {};
  this.invaders.map(function(invader) {
    if (!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
      frontRankInvaders[invader.file] = invader;
    }
  });
  //  Give each front rank invader a chance to drop a bomb.
  Object.keys(frontRankInvaders).map(function(key, index) {
    var chance = PlayState.bombRate * dt;
    if (chance > Math.random()) {
      //  Fire!
      PlayState.bombs.push(new Bomb(frontRankInvaders[key].x, frontRankInvaders[key].y + frontRankInvaders[key].height / 2,
        PlayState.bombMinVelocity + Math.random() * (PlayState.bombMaxVelocity - PlayState.bombMinVelocity)));
    }
  });
  //  Check for bomb/ship collisions.
  this.bombs.map(function(bomb, i) {
    if (bomb.x >= (PlayState.ship.x - PlayState.ship.width / 2) && bomb.x <= (PlayState.ship.x + PlayState.ship.width / 2) &&
      bomb.y >= (PlayState.ship.y - PlayState.ship.height / 2) && bomb.y <= (PlayState.ship.y + PlayState.ship.height / 2)) {
      PlayState.bombs.splice(i--, 1);
      PlayState.ship.hp--;
      game.sounds.playSound('explosion');
    }
  });
  //  Check for bomb/ship collisions.
  this.bossbombs.map(function(bossbomb, i) {
    if (bossbomb.x >= (PlayState.ship.x - PlayState.ship.width / 2) && bossbomb.x <= (PlayState.ship.x + PlayState.ship.width / 2) &&
      bossbomb.y >= (PlayState.ship.y - PlayState.ship.height / 2) && bossbomb.y <= (PlayState.ship.y + PlayState.ship.height / 2)) {
      PlayState.bossbombs.splice(i--, 1);
      PlayState.ship.hp--;
      game.sounds.playSound('explosion');
    }
  });
  //  Check for failure
  if (PlayState.ship.hp <= 0) {
    game.moveToState(new GameOverState());
    PlayState.ship.hp = PlayState.ship.inithp;
  }

  //  Check for victory first
  if (PlayState.boss.hp === 0 && this.endcount === 0) {
    //bome remove
    this.bossbombs = [];
    this.bombs = [];
    //explosion boss
    for (var ro = 0; ro < 6; ro++) {
      PlayState.bossexplosion.push(new ExplosionBoss(PlayState.boss.x, PlayState.boss.y + PlayState.boss.height / 2, ro,
        PlayState.bombMinVelocity + Math.random() * (PlayState.bombMaxVelocity - PlayState.bombMinVelocity)));
    }
  }
  //  Check for victory last
  if (PlayState.boss.hp === 0) {
    this.endcount += 1;
  }
  if (PlayState.boss.hp === 0 && this.endcount === 200) {
    //delay game end
    PlayState.bossexplosion = [];
    game.score += PlayState.level * 50;
    game.level += 1;
    game.moveToState(new LevelIntroState(game.level));
  }
};

PlayState.prototype.draw = function(game, dt, ctx) {
  //this initialize
  var PlayState = Object(this);
  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);
  //  Draw ship.
  ctx.fillStyle = '#999999';
  ctx.fillRect(this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), this.ship.width, this.ship.height);
  ctx.drawImage(gameImages.keyboard, this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), 80, 42);
  //gameImages.keyboard
  //  Draw invaders.
  ctx.fillStyle = '#006600';
  this.invaders.map(function(invader) {
    ctx.fillText("Test", invader.x, invader.y);
    ctx.fillRect(invader.x - invader.width / 2, invader.y - invader.height / 2, invader.width, invader.height);
  });
  // Draw Boss.
  var boss = this.boss;
  if (this.boss.hp > 0) {
    ctx.fillStyle = 'rgb(255,' + Math.floor(boss.hp / 4).toString() + ',11)';
    ctx.fillRect(boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height);
  }
  //  Draw bossbombs.
  ctx.fillStyle = '#00ffff';
  this.bossbombs.map(function(bossbomb) {
    ctx.fillRect(bossbomb.x - 2, bossbomb.y - 2, 6, 6);
  });
  //  Draw bossexplosion.
  ctx.fillStyle = '#00ffff';
  this.bossexplosion.map(function(bosssplit) {
    ctx.fillRect(bosssplit.x - 2, bosssplit.y - 2, 20, 10);
  });
  //  Draw bombs.
  ctx.fillStyle = '#ff5555';
  this.bombs.map(function(bomb) {
    ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
  });
  //  Draw rockets.
  ctx.fillStyle = '#ff0000';
  this.rockets.map(function(rocket) {
    ctx.fillRect(rocket.x, rocket.y - 2, 8, 8);
    //rocket image render differ
    ctx.drawImage(gameImages.keycaps[0], rocket.x, rocket.y - 2, 8, 8);
  });

  //  Draw info.
  var textYpos = game.gameBounds.bottom + ((game.height - game.gameBounds.bottom) / 2) + 14 / 2;
  //  Draw lives.
  ctx.fillStyle = '#dddddd';
  ctx.strokeRect(game.gameBounds.left, textYpos - 1, PlayState.ship.inithp * 2, 7);
  ctx.fillStyle = 'rgb(255,' + PlayState.ship.hp * 2 + ',0)';
  ctx.fillRect(game.gameBounds.left, textYpos, PlayState.ship.hp * 2, 5);

  ctx.fillStyle = '#ffffff';
  ctx.font = "14px Arial";
  info = "Score: " + game.score + ", Level: " + game.level;
  ctx.textAlign = "right";
  ctx.fillText(info, game.gameBounds.right, textYpos);
  //  If we're in debug mode, draw bounds.
  if (this.config.debugMode) {
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(0, 0, game.width, game.height);
    ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
      game.gameBounds.right - game.gameBounds.left,
      game.gameBounds.bottom - game.gameBounds.top);
  }

};

PlayState.prototype.keyDown = function(game, keyCode) {
  if (keyCode == 32) {
    //  Fire!
    this.fireRocket();
  }
  if (keyCode == 80) {
    //  Push the pause state.
    game.pushState(new PauseState());
  }
};

PlayState.prototype.keyUp = function(game, keyCode) {

};

PlayState.prototype.fireRocket = function() {
  //  If we have no last rocket time, or the last rocket time
  //  is older than the max rocket rate, we can fire.
  if (this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.config.rocketMaxFireRate)) {
    //  Add a rocket.
    this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
    this.lastRocketTime = (new Date()).valueOf();
    //  Play the 'shoot' sound.
    game.sounds.playSound('shoot');
  }
};

function PauseState() {

}

PauseState.prototype.keyDown = function(game, keyCode) {
  if (keyCode == 80) {
    //  Pop the pause state.
    game.popState();
  }
};

PauseState.prototype.draw = function(game, dt, ctx) {
  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);
  ctx.font = "14px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("Paused", game.width / 2, game.height / 2);
  return;
};

/*
    Level Intro State

    The Level Intro state shows a 'Level X' message and
    a countdown for the level.
*/
function LevelIntroState(level) {
  this.level = level;
  this.countdownMessage = "3";
  this.IntroStageWord = "This is Just Game";
}

LevelIntroState.prototype.update = function(game, dt) {
  //  change this intro
  if (this.countdown === undefined) {
    this.countdown = 3; // countdown from 3 secs
  }
  this.countdown -= dt;

  if (this.countdown < 2) {
    this.countdownMessage = "2";
  }
  if (this.countdown < 1) {
    this.countdownMessage = "1";
  }
  if (this.countdown <= 0) {
    //  Move to the next level, popping this state.
    game.moveToState(new PlayState(game.config, this.level));
  }

};

LevelIntroState.prototype.draw = function(game, dt, ctx) {
  if (this.count === undefined) {
    this.count = 0;
  }
  this.count += dt * game.config.fps;
  //background
  ctx.font = "68px Arial";
  ctx.textBaseline = "middle";
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = "center";
  ctx.fillText(this.IntroStageWord, game.width / 2, Math.ceil((this.count) / 10) * 46);
  //stagebox
  ctx.clearRect(game.width / 2 - 120, game.height / 2 - 60, 240, 160);
  ctx.fillStyle = '#111111';
  ctx.fillRect(game.width / 2 - 120, game.height / 2 - 60, 240, 160);
  ctx.font = "36px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("Level " + this.level, game.width / 2, game.height / 2);
  ctx.font = "24px Arial";
  ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height / 2 + 36);
  return;
};

/*

  Ship

  The ship has a position and that's about it.

*/
function Ship(x, y) {
  this.x = x;
  this.y = y;
  this.width = 80;
  this.height = 42;
  this.hp = 100;
  this.inithp = 100;
}

/*
    Rocket

    Fired by the ship, they've got a position, velocity and state.

    */
function Rocket(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
}

/*
    Bomb

    Dropped by invaders, they've got position, velocity.

*/
function Bomb(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
}

/*
    bossBomb

    Dropped by boss, they've got position, velocity.

*/
function BossBomb(x, y, direction, velocity) {
  this.x = x;
  this.y = y;
  this.direction = direction;
  this.velocity = velocity;
}
/*
    ExplosionBoss



*/
function ExplosionBoss(x, y, direction, velocity) {
  this.x = x;
  this.y = y;
  this.direction = direction;
  this.velocity = velocity;
}
/*
    Invader

    Invader's have position, type, rank/file and that's about it.
*/

function Invader(x, y, rank, file, type) {
  this.x = x;
  this.y = y;
  this.rank = rank;
  this.file = file;
  this.type = type;
  this.width = 18;
  this.height = 14;
}

/*
  Boss on Top
*/

function Boss(x, y, stage) {
  this.x = x;
  this.y = y;
  this.stage = stage;
  //get init hp need
  this.hp = 1000;
  this.movedirection = -1;
  this.width = 80;
  this.height = 40;
}

/*
    Game State

    A Game State is simply an update and draw proc.
    When a game is in the state, the update and draw procs are
    called, with a dt value (dt is delta time, i.e. the number)
    of seconds to update or draw).

*/
function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
  this.updateProc = updateProc;
  this.drawProc = drawProc;
  this.keyDown = keyDown;
  this.keyUp = keyUp;
  this.enter = enter;
  this.leave = leave;
}

/*

    Sounds

    The sounds class is used to asynchronously load sounds and allow
    them to be played.

*/
function Sounds() {
  //  The audio context.
  this.audioContext = null;
  //  The actual set of loaded sounds.
  this.sounds = {};
}

Sounds.prototype.init = function() {

  //  Create the audio context, paying attention to webkit browsers.
  context = window.AudioContext || window.webkitAudioContext;
  this.audioContext = new context();
  this.mute = false;
};

Sounds.prototype.loadSound = function(name, url) {
  //  Reference to ourselves for closures.
  var self = this;
  //  Create an entry in the sounds object.
  this.sounds[name] = null;
  //  Create an asynchronous request for the sound.
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';
  req.onload = function() {
    self.audioContext.decodeAudioData(req.response, function(buffer) {
      self.sounds[name] = {
        buffer: buffer
      };
    });
  };
  try {
    req.send();
  } catch (e) {
    console.log("An exception occured getting sound the sound " + name + " this might be " +
      "because the page is running from the file system, not a webserver.");
    console.log(e);
  }
};

Sounds.prototype.playSound = function(name) {
  //  If we've not got the sound, don't bother playing it.
  if (this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
    return;
  }
  //  Create a sound source, set the buffer, connect to the speakers and
  //  play the sound.
  var source = this.audioContext.createBufferSource();
  source.buffer = this.sounds[name].buffer;
  source.connect(this.audioContext.destination);
  source.start(0);
};
