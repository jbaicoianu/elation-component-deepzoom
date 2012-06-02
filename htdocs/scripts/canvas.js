elation.extend("deepzoom.canvas", function(src, position, container) {
  this.src = src;
  this.position = position || [0,0];
  this.levels = {};
  this.viewport = [0, 0];
  this.tilesize = 128;
  this.viewportbuffer = 2;
  this.activelevel = 0;
  this.maxvisiblelevels = 9;
  this.debug = false;
  this.container = container || document.body;
  elation.events.add([this], "deepzoom_image_load", this);

  this.setDebug = function(debug) {
    this.debug = debug;
    this.setPosition(this.position[0], this.position[1], true);
  }
  this.getLevel = function(level) {
    if (!this.levels[level]) {
      this.levels[level] = new elation.deepzoom.canvas_level(this, level, this.container);
    }
    return this.levels[level];
  }
  this.getCanvas = function(level) {
    //console.log('getcanvas:', level, this);
    this.getLevel(level);

    if (this.loaded) {
      //this.levels[level].setCanvasSize(this.tilesize * 2);
      var canvassize = this.getCanvasSize(level);
      this.levels[level].setCanvasSize(canvassize[0], canvassize[1]);
      this.levels[level].setPosition(this.position[0], this.position[1]);
      elation.events.fire({type: "deepzoom_canvas_update", element: this, fn: this, data: {level: level, offset: this.offset}});
    } else {
      (function(self, level) {
        elation.events.add([self], "deepzoom_image_load", function() { 
          self.getCanvas(level); 
          self.levels[level].setPosition(self.position[0], self.position[1]);
        });
      })(this, level);
    }
    var ret = this.levels[level].getCanvas();
    //this.levels[level].setPosition(this.position[0], this.position[1]);
    return ret;
  }
  this.getCanvasSize = function(level) {
    if (typeof level == 'undefined') {
      level = this.maxlevel;
    }
    var levelinfo = this.getLevelInfo(level);
    if (levelinfo) {
      return [
        Math.min(levelinfo.width, Math.ceil((this.viewport[0] * this.viewportbuffer) / this.tilesize) * this.tilesize),
        Math.min(levelinfo.height, Math.ceil((this.viewport[1] * this.viewportbuffer) / this.tilesize) * this.tilesize)
      ];
    }
    return [0, 0];
    /*
    return [
      Math.ceil((this.viewport[0] * this.viewportbuffer) / this.tilesize) * this.tilesize,
      Math.ceil((this.viewport[1] * this.viewportbuffer) / this.tilesize) * this.tilesize
    ];
    */
  }
  this.setViewport = function(width, height, zoom) {
    this.viewport = [width, height];
    for (var k in this.levels) {
      this.levels[k].setViewport(width, height);
    }
    if (zoom) {
      this.setZoom(zoom);
    }
  }
  this.setZoom = function(zoom) {
    var newlevel = this.minlevel + Math.floor((Math.log(zoom) / Math.LN2));
    if (newlevel > this.maxlevel)
      newlevel = this.maxlevel;
    if (newlevel != this.activelevel) {
      this.setActiveLevel(newlevel);
    }

    for (var k in this.levels) {
      this.levels[k].setZoom(zoom);
    }
  }
  this.setActiveLevel = function(level) {
    if (level > this.maxlevel) {
      level = this.maxlevel;
    }
    if (level > this.activelevel) {
      // update any currently-inactive canvases 
    }
    this.activelevel = level;
    for (var i = this.minlevel; i <= this.maxlevel; i++) {
      if (i > this.activelevel - this.maxvisiblelevels && i <= this.activelevel) {
        var level = this.getLevel(i);
        level.show();
        level.setPosition(this.position[0], this.position[1], true);
      } else {
        if (this.levels[i]) {
          this.levels[i].hide();
        }
      }
    }
  }
  this.setPosition = function(x, y, force) {
    if (this.loaded) {
//console.log('hi', [this.position[0], this.position[1]], [x, y]);
      if (!this.position || force || this.position[0] != x || this.position[1] != y) {
        this.position = [x, y];
        for (var i = this.minlevel; i <= this.activelevel; i++) {
          if (this.levels[i]) {
            this.levels[i].setPosition(x, y, force);
          }
        }
      }
    } else {
      (function(self, x, y) {
        elation.events.add([self], "deepzoom_image_load", function() { self.setPosition(x, y, force); });
      })(this, x, y, force);
    }
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      return this[ev.type](ev);
    }
  }
  this.deepzoom_image_load = function(ev) {
    if (!this.viewport || this.viewport[0] == 0 || this.viewport[1] == 0) {
      this.viewport = [this.tilesize, this.tilesize];
    }
    if (!this.activelevel)
      this.setActiveLevel(this.minlevel);
    if (!this.position) {
      this.setPosition(.5, .5);
    }
    //console.log('deepzoom_image_load', this.position, this.viewport);
  }

  this.init();
});
elation.deepzoom.canvas.prototype = new elation.deepzoom.image;
elation.extend("deepzoom.canvas_level", function(img, level, parentcontainer) {
  this.img = img;
  this.level = level;
  this.canvas = false;
  this.tl = false;
  this.br = false;
  this.tiles = [];
  this.offset = [.5,.5];
  this.parentcontainer = parentcontainer;
  this.hidden = true;
  this.needsupdate = true;
  this.zoom = 1;

  this.init = function() {
  }
  this.show = function() {
    if (this.hidden) {
      if (this.parentcontainer) {
        var canvas = this.getCanvas();
        this.parentcontainer.appendChild(this.container);
        //console.log('show', this.level, this.container, this.parentcontainer);
      }
      this.hidden = false;
      this.needsupdate = true;
      if (this.img.position) {
        this.setPosition(this.img.position[0], this.img.position[1]);
      }
    }
  }
  this.hide = function() {
    if (!this.hidden) {
      if (this.parentcontainer) {
        this.parentcontainer.removeChild(this.container);
      }
      //this.clearCanvas();
      this.hidden = true;
    }
  }
  this.getCanvas = function() {
    if (!this.canvas) {
      this.container = elation.html.create({tag: 'div', classname: 'deepzoom_canvas_level deepzoom_canvas_level_' + this.level});
      this.container.style.zIndex = this.level;
      this.container.style.position = 'absolute';
      this.container.style.top = '0px';
      this.container.style.left = '0px';
      this.setViewport(this.img.viewport[0], this.img.viewport[1]);
      this.canvas = elation.html.create({tag: 'canvas'});
      var canvassize = this.img.getCanvasSize(this.level);
      this.setCanvasSize(canvassize[0], canvassize[1]);
      //console.log('level', level, canvassize);
      this.container.appendChild(this.canvas);
    }
    return this.canvas;
  }
  this.getCanvasContext = function() {
    if (!this.ctx) {
      var canvas = this.getCanvas();
      this.ctx = canvas.getContext('2d');
    }
    return this.ctx;
  }
  this.setCanvasSize = function(x, y) {
    var canvas = this.getCanvas();
    canvas.width = x;
    canvas.height = y;
  }
  this.clearCanvas = function() {
    var canvas = this.getCanvas();
    canvas.width = canvas.width;
  }
  this.setViewport = function(x, y) {
    if (this.container) {
      this.container.style.width = x + 'px';
      this.container.style.height = y + 'px';
    }
  }
  this.setPosition = function(x, y, force) {
    if (!this.img || this.hidden) return;

    var realpos = [x * this.img.size[0], y * this.img.size[1]];
    var vtiles = this.img.getVisibleTiles([x, y], [this.canvas.width, this.canvas.height], this.level, true);
    //var vtiles = this.img.getVisibleTiles([x, y], this.img.viewport, this.level, true);
    if (force || vtiles.offset[0] != this.offset[0] || vtiles.offset[1] != this.offset[1]) {
      var needsupdate = this.needsupdate;
      //console.log('position level', this, [x, y], vtiles);
      if (force !== false && (force || !this.tl || !this.br ||
          vtiles.tl[0] !== this.tl[0] || vtiles.tl[1] !== this.tl[1] ||
          vtiles.br[0] !== this.br[0] || vtiles.br[1] !== this.br[1])) {
        //console.log('tiles changed for level', this.level, [this.tl, this.br], [vtiles.tl, vtiles.br]);
        //this.clearCanvas();
        // Visible tiles changed, update the canvas
        this.offset = vtiles.offset;
        this.tl = vtiles.tl;
        this.br = vtiles.br;
        this.upscaleFromParent([x, y]);
        needsupdate = true;

        //console.log('get images for ' + this.level + ' between', this.tl, this.br);
        this.loading = 0;
        for (var row = this.tl[1]; row <= this.br[1]; row++) {
          var ny = row - this.tl[1];
          for (var col = this.tl[0]; col <= this.br[0]; col++) {
            var nx = col - this.tl[0];
if (row >= 0 && col >= 0) {
            this.loading++;
            if (this.tiles[col] && this.tiles[col][row]) {
              this.addTile(this.tiles[col][row], [col, row]);
            } else {
              (function(self, row, col) {
                if (!self.tiles[col]) self.tiles[col] = {};
                self.tiles[col][row] = self.img.getTileImage(self.level, row, col, function(img) { 
                  self.addTile(img, [col, row]);
                }); 
              })(this, row, col);
            }
}
            //console.log(this.img.tilesrc, [x, y], [row, col], this.tiles[x][y]);
          }
        }
      } else {
        this.offset = vtiles.offset;
        //this.offset[0] -= (this.tl[0] - vtiles.tl[0]) / (this.br[0] - this.tl[0]);
        //this.offset[1] -= (this.tl[1] - vtiles.tl[1]) / (this.br[1] - this.tl[1]);
//if (this.level == this.img.activelevel)
//  console.log(this.offset[0], this.offset[1]);
      }
//console.log(this.level, x, y, this.offset);
      this.updateDOM();
      elation.events.fire({type: "deepzoom_canvas_update", element: this.img, fn: this.img, data: {level: this.level, offset: this.offset, needsupdate: needsupdate}});
      this.needsupdate = false;
    }
  }
  this.addTile = function(tile, pos) {
    //console.log('add tile image to canvas', tile, pos);
    var size = this.img.tilesize;
    var overlap = this.img.overlap;

    //var canvas = this.getCanvas();
    //var ctx = canvas.getContext("2d");

    var ctx = this.getCanvasContext();
    var realsize = [tile.width - overlap, tile.height - overlap]; // FIXME - need to account for border tiles
    var tilepos = [size * (pos[0] - this.tl[0]), size * (pos[1] - this.tl[1])];
    /*
    if (realsize[0] < size || realsize[1] < size) {
      if (pos[0] == 0 && pos[1] == 0) {
        tilepos = [size - realsize[0], size - realsize[1]];
      } else if (pos[0] == 0 && pos[1] == 1) {
        tilepos = [2 * size - realsize[0], size];
      } else if (pos[0] == 1 && pos[1] == 0) {
        tilepos = [size, 2 * size - realsize[1]];
      }
    }
    */

    ctx.drawImage(tile, overlap, overlap, realsize[0],realsize[1],tilepos[0],tilepos[1],realsize[0],realsize[1]);

    if (this.img.debug) {
      ctx.strokeStyle = 'rgba(255,255,0,.5)';
      ctx.strokeRect(tilepos[0], tilepos[1], realsize[0], realsize[1]);
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'black';
      ctx.fillText(this.level + elation.JSON.stringify(pos), tilepos[0] + 6, tilepos[1] + 6);
      ctx.fillStyle = 'yellow';
      ctx.fillText(this.level + elation.JSON.stringify(pos), tilepos[0] + 5, tilepos[1] + 5);
    }
    /*
    if (--this.loading == 0) {
      elation.events.fire({type: "deepzoom_canvas_update", element: this.img, fn: this.img, data: {level: this.level, offset: this.offset, needsupdate: true}});
    }
    */
  }
  this.upscaleFromParent = function(pos) {
    if (this.level > this.img.minlevel + 1) {
      //console.log('upscale ' + this.level + ' from ' + (this.level-1));
      var parentlevel = this.img.getLevel(this.level-1);
      if (parentlevel && parentlevel.offset[0] > 0 && parentlevel.offset[1] > 0) {
        var parentcanvas = parentlevel.getCanvas(),
            parentctx = parentlevel.getCanvasContext(),
            canvas = this.getCanvas(),
            ctx = this.getCanvasContext(),
            viewport = this.img.viewport,
            offset = [this.offset[0] * canvas.width, this.offset[1] * canvas.height],
            parentviewport = [this.img.viewport[0] / 2, this.img.viewport[1] / 2],
            parentoffset = [(parentlevel.offset[0] * parentcanvas.width) + parentviewport[0], (parentlevel.offset[1] * parentcanvas.height) + parentviewport[1]];

        this.clearCanvas();

//console.log(parentoffset, viewport, offset);
        // Clone as much as we can from the parent level to fill this level's canvas
        ctx.drawImage(
            parentcanvas, 
            Math.max(parentoffset[0], 0), Math.max(parentoffset[1], 0),
            viewport[0], viewport[1],
            offset[0], offset[1],
            viewport[0] * 2, viewport[1] * 2
        );
      }
    }
  }
  this.setZoom = function(zoom) {
    this.zoom = zoom;
    this.updateDOM();
  }
  this.updateDOM = function() {
    var scale = Math.pow(2, this.level - this.img.minlevel);
    var zoom = this.zoom / scale;
    var offset = [this.offset[0] * this.canvas.width, this.offset[1] * this.canvas.height];

    var transform = "";
    //transform += "translate(" + 0 + "px, " + -(this.canvas.height/2 * zoom) + "px) ";
    transform += "scale(" + zoom + "," + zoom + ") ";
    this.container.style.webkitTransform = transform;
    this.container.style.MozTransform = transform;
    this.container.style.msTransform = transform;

    var leveloffset = [
      (this.img.viewport[0] - this.canvas.width) / 2 - (this.offset[0] * this.canvas.width),
      (this.img.viewport[1] - this.canvas.height) / 2 - (this.offset[1] * this.canvas.height)
    ];
//if (this.level == this.img.activelevel)
    //console.log(this.level, scale, zoom, [this.canvas.width, this.canvas.height], this.offset, offset, leveloffset);
    var canvastransform = "";
    canvastransform += "translate(" + leveloffset[0] + "px, " + leveloffset[1] + "px) ";

    this.container.style.position = 'absolute';
    this.container.style.top = '0px';
    this.container.style.left = '0px';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0px';
    this.canvas.style.left = '0px';

    this.canvas.style.webkitTransform = canvastransform;
    this.canvas.style.MozTransform = canvastransform;
    this.canvas.style.msTransform = canvastransform;

    //console.log(scale, transform, this.offset, offset, this);
  }
  this.init();
});
elation.component.add("deepzoom.viewer.canvas", function() {
  this.zoomfactor = 1;
  //this.position = [.7415, .3460];
  this.position = [.5, .5];
  this.debug = false;

  this.init = function() {
    elation.html.addclass(this.container, "deepzoom_viewer_canvas");
    this.src = this.args.src || this.container.src;
    if (this.src) {
      this.deepzoom = new elation.deepzoom.canvas(this.src, this.position, this.container);
      elation.events.add(this.deepzoom, "deepzoom_image_load", this);
      if (this.container.tagName == 'IMG') {
        this.container.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
      }
      var borderwidth = 0; // FIXME - this shouldn't be hardcoded
      this.deepzoom.setViewport(this.container.offsetWidth - borderwidth, this.container.offsetHeight - borderwidth, this.zoomfactor);
    }
    this.setDebug(elation.html.hasclass(this.container, "debug"));
    elation.events.add(this.container, "mousewheel,mousedown,dblclick,touchstart", this);

    // stupid IE
    (function(self) {
      self.container.onmousewheel = function(ev) { self.mousewheel(ev); }
    })(this);
  }
  this.setDebug = function(debug) {
    if (debug) {
      elation.html.addclass(this.container, "debug");
    } else {
      elation.html.removeclass(this.container, "debug");
    }
    if (this.deepzoom) {
      this.deepzoom.setDebug(debug);
    }
    this.debug = debug;
  }
  this.deepzoom_image_load = function(ev) {
    this.deepzoom.setZoom(this.zoomfactor);
  }
  this.mousewheel = function(ev) {
    var move = (ev.wheelDeltaY || ev.wheelDelta) / 120 || -ev.detail;
    this.zoomfactor *= (move < 0 ? 9/10 : 10/9)
    if (this.zoomfactor < 1) this.zoomfactor = 1;
    this.deepzoom.setZoom(this.zoomfactor);
    ev.preventDefault();
  }
  this.DOMMouseScroll = function(ev) {
    this.mousewheel(ev);
  }
  this.mousedown = function(ev) {
    //console.log('down');
    if (ev.button == 0) {
      this.lastpos = [ev.clientX, ev.clientY];
      elation.events.add(document, "mousemove,mouseup,touchmove,touchend", this);
      if (ev.preventDefault) {
        ev.preventDefault();
      }
    }
  }
  this.mousemove = function(ev) {
    //console.log('move', this.zoomfactor);
    var pos = [ev.clientX, ev.clientY];
    var diff = [this.lastpos[0] - pos[0], this.lastpos[1] - pos[1]];
console.log(this.zoomfactor, this.deepzoom.size, this.deepzoom.viewport, this.deepzoom);
    //diff[0] /= this.zoomfactor * this.deepzoom.viewport[0] / 3.65;
    //diff[1] /= this.zoomfactor * this.deepzoom.viewport[1] / 3.65; // FIXME - why?
    diff[0] /= this.zoomfactor * (this.deepzoom.size[0] / this.deepzoom.viewport[0]);
    diff[1] /= this.zoomfactor * (this.deepzoom.size[1] / this.deepzoom.viewport[1]);

    // Clamp to [0..1]
    // FIXME - should actually allow for a half-tile border around the edges
console.log(this.deepzoom.viewport, this.deepzoom.size);
    var newpos = [
      Math.max(Math.min(this.deepzoom.position[0] + diff[0], 1), 0),
      Math.max(Math.min(this.deepzoom.position[1] + diff[1], 1), 0),
      //this.deepzoom.position[0] + diff[0],
      //this.deepzoom.position[1] + diff[1]
    ];

    this.deepzoom.setPosition(newpos[0], newpos[1]);
    //this.position = newpos;
    this.lastpos = pos;
  }
  this.mouseup = function(ev) {
    //console.log('up');
    this.deepzoom.setPosition(this.deepzoom.position[0], this.deepzoom.position[1]);
    elation.events.remove(document, "mousemove,mouseup,touchmove,touchend", this);
  }
  this.touchstart = function(ev) {
    if (ev.touches.length == 1) {
      var fakeev = {
        type: 'mousemove',
        button: 0,
        clientX: ev.touches[0].clientX,
        clientY: ev.touches[0].clientY,
        preventDefault: function() { }
      };
      this.mousedown(fakeev);
    } else if (ev.touches.length == 2) {
      this.lasttouchdiff = [ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY];
    }
    ev.preventDefault();
  }
  this.touchmove = function(ev) {
    if (ev.touches.length == 1) {
      var fakeev = {
        type: 'mousemove',
        button: 0,
        clientX: ev.touches[0].clientX,
        clientY: ev.touches[0].clientY,
        preventDefault: function() { }
      };
      this.mousemove(fakeev);
    } else if (ev.touches.length == 2) {
      var diff = [ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY];
      var dist = Math.sqrt(Math.pow(diff[0], 2) + Math.pow(diff[1], 2));
      var lastdist = Math.sqrt(Math.pow(this.lasttouchdiff[0], 2) + Math.pow(this.lasttouchdiff[1], 2));
      this.lasttouchdiff = diff;

      this.zoomfactor *= (dist < lastdist ? .9 : 1.1);
      if (this.zoomfactor < 1) this.zoomfactor = 1;
      this.deepzoom.setZoom(this.zoomfactor);
    }
    ev.preventDefault();
  }
  this.touchend = function(ev) {
    this.mouseup(ev);
  }
});
