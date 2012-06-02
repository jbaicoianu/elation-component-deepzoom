elation.extend("deepzoom.image", function(src) {
  this.src = src;
  this.tilesrc = '';
  this.levelinfo = [];
  this.tilecache = {};
  this.size = [0, 0];

  this.init = function() {
    elation.events.add([this], "deepzoom_image_descriptorload", this);
    if (this.src) {
      this.loaded = false;
      (function(self) {
        elation.ajax.Get(self.src, null, {
          callback: function(xml) { 
            elation.events.fire({type: "deepzoom_image_descriptorload", element: self, fn: self, data: elation.utils.parseXML(xml)});
          }
        });
      })(this);
    }
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      return this[ev.type](ev);
    }
  }
  this.deepzoom_image_descriptorload = function(ev) {
    if (ev.data && ev.data.Image) {
      var img = ev.data.Image;
      this.tilesrc = this.src.replace(/\.xml$/, '_files');
      this.format = img.Format;
      this.overlap = parseInt(img.Overlap);
      this.tilesize = parseInt(img.TileSize);

      if (img._children && img._children.Size) {
        this.size = [parseInt(img._children.Size.Width), parseInt(img._children.Size.Height)];
      }
      this.loaded = true;
      this.getMaximumLevel();
      elation.events.fire({type: "deepzoom_image_load", element: this, fn: this, data: this.offset});
      console.log("Loaded DeepZoom descriptor", this.src, ev.data);
    } else {
      console.log("Received an unknown XML format for DeepZoom descriptor", this.src, ev.data);
    }
  }
  this.getMaximumLevel = function() {
    if (this.loaded && !this.maxlevel) {
      this.minlevel = Math.ceil(Math.log(this.tilesize) / Math.LN2);
      this.maxlevel = Math.ceil(Math.log(Math.max(this.size[0], this.size[1])) / Math.LN2)
    }
    return this.maxlevel;
  }
  this.getLevelInfo = function(level) {
    if (this.loaded && !this.levelinfo[level]) {
      var ret = {
        maxlevel: this.getMaximumLevel(),
      };
      ret.scale = 1 / Math.pow(2, ret.maxlevel - level);
      ret.width = Math.ceil(this.size[0] / Math.pow(2, ret.maxlevel - level)),
      ret.height = Math.ceil(this.size[1] / Math.pow(2, ret.maxlevel - level)),
      ret.columns = Math.ceil(ret.width / this.tilesize),
      ret.rows = Math.ceil(ret.height / this.tilesize)
      this.levelinfo[level] = ret;
    }
    return this.levelinfo[level];
  }
  this.getVisibleTiles = function(pos, viewport, level, adjustoverflow) {
    var levelinfo = this.getLevelInfo(level);
    if (!levelinfo) {
      return {offset: [0, 0], tl: [0, 0], br: [0, 0]};
    }
    var levelpos = [pos[0] * levelinfo.width, pos[1] * levelinfo.height];
    var halfviewport = [viewport[0] / 2, viewport[1] / 2];
    var tl = [levelpos[0] - halfviewport[0], levelpos[1] - halfviewport[1]];
    var br = [levelpos[0] + halfviewport[0], levelpos[1] + halfviewport[1]];
    if (adjustoverflow) {
      if (tl[0] < 0) {
        br[0] -= tl[0];
        tl[0] = 0;
      }
      if (tl[1] < 0) {
        br[1] -= tl[1];
        tl[1] = 0;
      }
      if (br[0] > levelinfo.width) {
        tl[0] = (br[0] - levelinfo.width > tl[0] ? 0 : tl[0] - (br[0] - levelinfo.width));
        br[0] = levelinfo.width;
      }
      if (br[1] > levelinfo.height) {
        tl[1] = (br[1] - levelinfo.height > tl[1] ? 0 : tl[1] - (br[1] - levelinfo.height));
        br[1] = levelinfo.height;
      }
    }
    var tilerange = {
      tl: [Math.floor(tl[0] / this.tilesize), Math.floor(tl[1] / this.tilesize)],
      br: [Math.floor(br[0] / this.tilesize), Math.floor(br[1] / this.tilesize)]
    };
    //console.log(tl, br, tilerange, levelinfo);


    var scaledpos = [levelpos[0] / this.tilesize, levelpos[1] / this.tilesize];
    var currtile = [Math.floor(scaledpos[0]), Math.floor(scaledpos[1])];
    tilerange.offset = [
      (scaledpos[0] - tilerange.tl[0] - halfviewport[0] / this.tilesize) / (viewport[0] / this.tilesize),
      (scaledpos[1] - tilerange.tl[1] - halfviewport[1] / this.tilesize) / (viewport[1] / this.tilesize)
    ];

    return tilerange;
  }
  this.getTileURL = function(level, row, col) {
    return this.tilesrc + '/' + level + '/' + col + '_' + row + '.' + this.format;
  }
  this.getTileImage = function(level, row, col, callback) {
    var tileid = [this.tilesrc, level, row, col].join('.');
    var tile = elation.utils.arrayget(this.tilecache, tileid, false);
    if (!tile) {
      tile = new Image();
      elation.utils.arrayset(this.tilecache, tileid, tile);
      tile.src = this.getTileURL(level, row, col);
      if (callback) {
        elation.events.add(tile, "load", function(ev) { callback(this); });
      }
    } else if (callback) {
      callback(tile);
    }
    return tile;
  }
  this.init();
});
