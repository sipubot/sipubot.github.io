/*
	KeycapField lets you take a div and turn it into a starfield.

*/

function KeycapFieldImages() {
  this.keycapList = [
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAD1BMVEUAAAD///9VVVUAAACqqqpggSv+AAAAAXRSTlMAQObYZgAAAEtJREFUCNd1jcENgDAMAy02cJsBaMIAICbI/kthRc2Te1nWycbhBXAlhZ1wqxBYybHIgDPnsxsFNXIsdyP+nNnOaKeW+yv6/QbeAh/+7w6qn7DhWwAAAABJRU5ErkJggg==',
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAD1BMVEUAAAD///9VVVUAAACqqqpggSv+AAAAAXRSTlMAQObYZgAAAExJREFUCNd1y8ENwCAMA8CIDVxlgOIwQCsmyP5LkUTwxB9bJ1kyJKubQ98aCrUtsIsgpZEdKUOj/pDuOUKoeI7YPFKv4cC+Vz6RWZEFlLYLYltjut4AAAAASUVORK5CYII=',
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAD1BMVEUAAAD///9VVVUAAACqqqpggSv+AAAAAXRSTlMAQObYZgAAADhJREFUCNdjIAYwKYGBA4OiIBgoM6iAaRFlBkVnY0EhiIihkpAiSMTRUMlJEUkNQheTMRgY4LEKACepCGT9ISzjAAAAAElFTkSuQmCC'
  ];
}

KeycapFieldImages.prototype.keycaps = function() {
  //image list
  var keycap = [this.keycapList.length];
  for (var i = 0; i < this.keycapList.length; i++) {
    keycap[i] = new Image();
    keycap[i].src = 'data:image/png;base64,' + this.keycapList[i];
  }
  this.keycaps = keycap;
};

var imageObj = new KeycapFieldImages();
imageObj.keycaps();

//	Define the starfield class.
function KeycapField() {
  this.fps = 20;
  this.canvas = null;
  this.width = 0;
  this.width = 0;
  this.minVelocity = 15;
  this.maxVelocity = 30;
  this.stars = 100;
  this.intervalId = 0;
}

//	The main function - initialises the starfield.
KeycapField.prototype.initialise = function(div) {
  var self = this;
  //	Store the div.
  this.containerDiv = div;
  self.width = window.innerWidth;
  self.height = window.innerHeight;

  window.onresize = function(event) {
    self.width = window.innerWidth;
    self.height = window.innerHeight;
    self.canvas.width = self.width;
    self.canvas.height = self.height;
    self.draw();
  };

  //	Create the canvas.
  var canvas = document.createElement('canvas');
  div.appendChild(canvas);
  this.canvas = canvas;
  this.canvas.width = this.width;
  this.canvas.height = this.height;
};

KeycapField.prototype.start = function() {
  //	Create the stars.
  var stars = [];
  for (var i = 0; i < this.stars; i++) {
    stars[i] = new Star(Math.random() * this.width, Math.random() * this.height, Math.random() * 20 + 1,
      (Math.random() * (this.maxVelocity - this.minVelocity)) + this.minVelocity, Math.floor(Math.random() * 3));
  }
  this.stars = stars;

  var self = this;
  //	Start the timer.
  this.intervalId = setInterval(function() {
    self.update();
    self.draw();
  }, 1000 / this.fps);
};

KeycapField.prototype.stop = function() {
  clearInterval(this.intervalId);
};

KeycapField.prototype.update = function() {
  var dt = 1 / this.fps;

  for (var i = 0; i < this.stars.length; i++) {
    var star = this.stars[i];
    star.y += dt * star.velocity;
    //	If the star has moved from the bottom of the screen, spawn it at the top.
    if (star.y > this.height) {
      this.stars[i] = new Star(Math.random() * this.width, 0, Math.random() * 20 + 1,
        (Math.random() * (this.maxVelocity - this.minVelocity)) + this.minVelocity, Math.floor(Math.random() * 3));
    }
  }
};

KeycapField.prototype.draw = function() {

  //	Get the drawing context.
  var ctx = this.canvas.getContext("2d");

  //	Draw the background.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, this.width, this.height);

  //	Draw stars.
  ctx.fillStyle = '#ffffff';
  for (var i = 0; i < this.stars.length; i++) {
    var star = this.stars[i];
    ctx.drawImage(imageObj.keycaps[star.imageNum], star.x, star.y, star.size, star.size);
  }
};

function Star(x, y, size, velocity, imageNum) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.velocity = velocity;
  this.imageNum = imageNum;
}
