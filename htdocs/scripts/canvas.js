elation.extend("deepzoom.canvas", function(src, position) {
  this.src = src;
  this.position = position;
  this.levels = {};
  this.viewport = [];
  this.activelevel = 0;
  elation.events.add([this], "deepzoom_image_load", this);

  this.getLevel = function(level) {
    if (!this.levels[level]) {
      this.levels[level] = new elation.deepzoom.canvas_level(this, level);
    }
    return this.levels[level];
  }
  this.getCanvas = function(level) {
    this.getLevel(level);

    if (this.loaded) {
      this.levels[level].setCanvasSize(this.tilesize * 2);
      this.levels[level].setPosition(this.position[0], this.position[1]);
      elation.events.fire({type: "deepzoom_canvas_update", element: this, fn: this, data: {level: level}});
    } else {
      (function(self, level) {
        elation.events.add([self], "deepzoom_image_load", function() { self.getCanvas(level); });
      })(this, level);
    }
    return this.levels[level].getCanvas();
  }
  this.setViewport = function(width, height) {
    this.viewport = [width, height];
  }
  this.setActiveLevel = function(level) {
    if (level > this.maxlevel) {
      level = this.maxlevel;
    }
    if (level > this.activelevel) {
      // update any currently-inactive canvases 
    }
    this.activelevel = level;
  }
  this.setPosition = function(x, y) {
    if (this.loaded) {
      if (!this.position || this.position[0] != x || this.position[1] != y) {
        this.position = [x, y];
        for (var i = this.minlevel; i <= this.activelevel; i++) {
          if (this.levels[i]) {
            this.levels[i].setPosition(x, y);
          }
        }
      }
    } else {
      (function(self, x, y) {
        elation.events.add([self], "deepzoom_image_load", function() { self.setPosition(x, y); });
      })(this, x, y);
    }
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      return this[ev.type](ev);
    }
  }
  this.deepzoom_image_load = function(ev) {
    this.viewport = [this.tilesize, this.tilesize];
    if (!this.activelevel)
      this.setActiveLevel(this.maxlevel);
    if (!this.position) {
      this.setPosition(.5, .5);
    }
    //console.log('deepzoom_image_load', this.position, this.viewport);
  }

  this.init();
});
elation.deepzoom.canvas.prototype = new elation.deepzoom.image;
elation.extend("deepzoom.canvas_level", function(img, level) {
  this.img = img;
  this.level = level;
  this.canvas = false;
  this.tl = false;
  this.br = false;
  this.tiles = [];
  this.offset = [.5,.5];

  this.init = function() {
  }
  this.getCanvas = function() {
    if (!this.canvas) {
      this.canvas = document.createElement('CANVAS');
      this.canvas.className = 'deepzoom_canvas_level_' + this.level;
      document.body.appendChild(this.canvas);
    }
    return this.canvas;
  }
  this.setCanvasSize = function(size) {
    var canvas = this.getCanvas();
    canvas.width = size;
    canvas.height = size;
  }
  this.setPosition = function(x, y) {
    var realpos = [x * this.img.size[0], y * this.img.size[1]];
    var vtiles = this.img.getVisibleTiles([x, y], this.img.viewport, this.level, false);
    if (vtiles.offset[0] != this.offset[0] || vtiles.offset[1] != this.offset[1]) {
      var needsupdate = false;
      //console.log('position level', this, [x, y], vtiles);
      if (!this.tl || !this.br ||
          vtiles.tl[0] !== this.tl[0] || vtiles.tl[1] !== this.tl[1] ||
          vtiles.br[0] !== this.br[0] || vtiles.br[1] !== this.br[1]) {
        // Visible tiles changed, update the canvas
        this.tl = vtiles.tl;
        this.br = vtiles.br;
        this.offset = vtiles.offset;
        this.upscaleFromParent([x, y]);
        needsupdate = true;

        // Get rough terrain from parent to use as a base

        //console.log('get images between', this.tl, this.br);
        this.loading = 0;
        for (var row = this.tl[1]; row <= this.br[1]; row++) {
          var ny = row - this.tl[1];
          for (var col = this.tl[0]; col <= this.br[0]; col++) {
            var nx = col - this.tl[0];
            if (!this.tiles[nx]) this.tiles[nx] = {};
if (row >= 0 && col >= 0) {
            this.loading++;
            (function(self, x, y) {
              self.tiles[x][y] = self.img.getTileImage(self.level, row, col, function(img) { 
                self.addTile(img, [x, y]);
              }); 
            })(this, nx, ny);
}
            //console.log(this.img.tilesrc, [x, y], [row, col], this.tiles[x][y]);
          }
        }
      } else {
        this.offset = vtiles.offset;
        //console.log('set offset for ' + this.level + ' to ' + this.offset);
      }
      elation.events.fire({type: "deepzoom_canvas_update", element: this.img, fn: this.img, data: {level: this.level, offset: this.offset, needsupdate: needsupdate}});
    }
  }
  this.addTile = function(tile, pos) {
    //console.log('add tile image to canvas', tile, pos);
    var size = this.img.tilesize;
    var overlap = this.img.overlap;
    var canvas = this.getCanvas();

    var ctx = canvas.getContext("2d");
    var realsize = [tile.width - overlap, tile.height - overlap]; // FIXME - need to account for border tiles
    var tilepos = [size * pos[0], size * pos[1]];
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
//console.log(this.level, realsize,tilepos);
    ctx.drawImage(tile, overlap, overlap, realsize[0],realsize[1],tilepos[0],tilepos[1],realsize[0],realsize[1]);
    //this.textures[k].needsUpdate = true;
    //if (--this.loading == 0) {
      elation.events.fire({type: "deepzoom_canvas_update", element: this.img, fn: this.img, data: {level: this.level, offset: this.offset, needsupdate: true}});
    //}
  }
  this.upscaleFromParent = function(pos) {
    if (this.level > this.img.minlevel + 1) {
      var parentlevel = this.img.getLevel(this.level-1);
      if (parentlevel && parentlevel.offset[0] > 0 && parentlevel.offset[1] > 0) {
        var parentcanvas = parentlevel.getCanvas(),
            parentctx = parentcanvas.getContext('2d'),
            canvas = this.getCanvas(),
            ctx = canvas.getContext('2d'),
            offset = [this.offset[0] * canvas.width, this.offset[1] * canvas.height],
            viewport = this.img.viewport,
            parentviewport = [this.img.viewport[0] / 2, this.img.viewport[1] / 2],
            parentoffset = [(parentlevel.offset[0] * parentcanvas.width) + viewport[0] / 2, (parentlevel.offset[1] * parentcanvas.height) + viewport[1] / 2];

        // Clear canvas
        canvas.width = canvas.width;

        // Clone as much as we can from the parent level to fill this level's canvas
        ctx.drawImage(
            parentcanvas, 
            Math.max(parentoffset[0] - viewport[0] / 2, 0), Math.max(parentoffset[1] - viewport[1] / 2, 0),
            viewport[0], viewport[1],
            offset[0] - viewport[0] / 2, offset[1] - viewport[1] / 2,
            viewport[0] * 2, viewport[1] * 2
        );
      }
    }
  }
  this.init();
});
