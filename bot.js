// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
 
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ----------------------------------
var Board = {
    width : 800,
    height : 400,
    x : 0,
    y : 0,
    centerX : this.width / 2,
    centerY : this.height / 2,
    borderOffset : 20,

    drawBorder : function() {
        GameEngine.ctx.lineWidth = 1;
        GameEngine.ctx.strokeStyle = '#09f';
        GameEngine.ctx.stroke();
        GameEngine.ctx.strokeRect(this.x + this.borderOffset, this.y + this.borderOffset, this.width - (this.borderOffset * 2), this.height - (this.borderOffset * 2));
    }
}

// ----------------------------------
var GameEngine = {

    canvas : null,
    ctx : null,

    simulationTime : 60,
    timer : null,
    
    graphicManager : null,

    init : function() {
        this.graphicManager = GraphicManager;

        this.canvas = document.getElementById('canvas');
        this.ctx    = this.canvas.getContext('2d');
    
    },

    start : function() {
        this.draw();
    },

    stop : function() {
        cancelAnimationFrame();
    },

    reset : function() {

    },

    draw : function() {

        GameEngine.ctx.clearRect(0, 0, 800, 600);

        Board.drawBorder();    

        var graphics = GameEngine.graphicManager.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {

            if (graphics[i].type === 'bot') {
                GameEngine.checkCollision(graphics[i])
            }

            graphics[i].update();
            graphics[i].draw();
        }

        requestAnimationFrame(GameEngine.draw);
    },

    checkCollision : function(graphic) {
        var graphics = GameEngine.graphicManager.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {          
            if(graphic.isCollidingWith(graphics[i])) {            
                graphic.collidedWith(graphics[i]);
            }
        }
    }
}

// ----------------------------------
var GraphicManager = {

    graphics : [],

    reset : function() {        
        var graphics = this.graphics,
            len = graphics.length,
            i = 0;

        for (i = 0; i < len; i++) {
            graphics[i].reset();
        }
    },

    addGraphic : function(_type, _options) {
        var graphic = null;

        switch(_type) {

            case ('bot') :
                graphic = new Bot(_options);
                break;

            case ('puck') :
                graphic = new Puck(_options);
                break;
        }

        this.graphics.push(graphic);
    },

    removeGraphic : function() {

    },

    findGraphicById : function() {
        
    },

    getRandomBoardPosition : function() {

        var x = getRandomInt(10, Board.width - Board.borderOffset),
            y = getRandomInt(10, Board.height - Board.borderOffset);

        return { x: x , y: y};
    },

    // Returns true if obj is within the game board borders
    positionIsWithinBoard : function(x, y) {
        var xPosition = (x > Board.borderOffset && x < Board.width - Board.borderOffset),
            yPosition = (y > Board.borderOffset && y < Board.height - Board.borderOffset);
        
        return (xPosition && yPosition);
    }
}


// ----------------------------------
var Graphic = function(_options) {
    this.id = _options.id;
    this.isVisible = true;
    this.shape = null;
}

Graphic.prototype = {

    draw : function() {
        if(this.isVisible) {
            this.shape.draw();
        }
    },

    // Returns true if obj is within the game board borders
    isWithinBoard : function() {            
        return positionIsWithinBoard(this.x, this.y);
    },

    reset : function() {

    }
}

// ----------------------------------
var Bot = function(_options) {

    jQuery.extend(this, _options);
    // x, y, color
    this.isVisible = true;

    this.type = 'bot';

    this.width = 20;
    this.height = 20;

    this.speed = 0.1;
    this.vx = getRandomInt(0, 10);
    this.vy = getRandomInt(0, 10);

    this.hasPuck = false;
    this.puck = null;
    this.pucks = [];
}

Bot.prototype = {

    shape : function() {
        GameEngine.ctx.fillStyle = "#09f";
        GameEngine.ctx.fillRect(this.x, this.y, this.width, this.height);
    },

    draw : function() {
        if(this.isVisible) {
            this.shape();
        }
    },

    update : function() {

        this.collidesWithBoardBorder();

        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;
    },

    collidesWithBoardBorder : function() {
        
        if(GraphicManager.positionIsWithinBoard(this.x, this.y))
            return false;

        if (this.x < Board.borderOffset || this.x + this.width >= Board.width - Board.borderOffset) {
            this.vx = -this.vx;
        }

        if (this.y < Board.borderOffset || this.y + this.height >= Board.height - Board.borderOffset) {
            this.vy = -this.vy;
        }

    },

    isWithinArea : function(x, y) {

        if( x >= this.x &&
            x <= this.x + this.width &&
            y >= this.y &&
            y < this.y + this.height)
        {
            return true;
        }

        return false;
    },

    isCollidingWith : function(obj) {

        if(this === obj) {
            return false;
        }

        if(
            this.isWithinArea(obj.x, obj.y) ||
            this.isWithinArea(obj.x + obj.width, obj.y) ||
            this.isWithinArea(obj.x, obj.y + obj.height) ||
            this.isWithinArea(obj.x + obj.width, obj.y + obj.height)
           )
        {
            return true;
        }

        return false;
    },

    collidedWith : function(obj) {

        if (obj.type === 'puck') {
            
            if (!this.hasPuck) {
                this.hasPuck = true;
                obj.isTakenBy(this);
            }

        } else if (obj.type === 'bot') {
            this.vx = -this.vx;
            this.vy = -this.vy;
        }

        // Collides with item
            // -> pick up if has none            
            // -> drop if has one

        // Collides with other Bot
            // -> turn 180 around
    },

    getRandomDirection : function() {

    },

    setVector : function(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    },

    setIsFull : function(_state) {
        this.isFull = _state;
    }

}

// ----------------------------------
var Puck = function(_options) {
    jQuery.extend(this, _options);

    this.type = 'puck';

    this.width = 5;
    this.height = 5;

    this.isVisible = true;
    this.isTaken = false;
    this.bot = null;
}

Puck.prototype = {

    shape : function() {
        GameEngine.ctx.fillStyle = "#FFC200";
        GameEngine.ctx.fillRect(this.x, this.y, this.width, this.height);
    },

    draw : function() {
        if(this.isVisible) {
            this.shape();
        }
    },

    update : function() {
        if(this.isTaken) {
            this.x += this.bot.vx * this.bot.speed;
            this.y += this.bot.vy * this.bot.speed;
        }
    },

    isTakenBy : function(_bot) {
        this.bot = _bot;

        if(_bot) {
            this.isTaken = true;
        }
    }


}