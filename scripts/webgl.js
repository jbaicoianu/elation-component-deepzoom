elation.component.add("deepzoom.viewer.webgl", function() {
  this.init = function() {
    this.zoomfactor = 1;
    this.imageposition = [.5, .5];
    this.debug = false;
    this.maxvisiblelevels = 1;
    this.levels = [];
    this.viewport = [0,0];
    this.buffersize = [0, 0];
    this.bufferfactor = 2;
    this.minlevel = 0;
    this.maxlevel = 0;

    elation.html.addclass(this.container, "deepzoom_viewer");
    this.canvas = elation.html.create('canvas');
    this.container.appendChild(this.canvas);

    this.viewport = this.args.viewport;
    if (!this.viewport) {
      this.setViewport(this.container.offsetWidth, this.container.offsetHeight);
    }
    this.gl = this.args.gl || this.canvas.getContext('experimental-webgl');
    this.material = this.createTileMaterial();
    this.geometry = new elation.webgl.plane(this.gl, [1, 1], this.material);
    this.src = this.args.src || this.container.src;

var plopargs = {
  size: this.viewport,
  geometry: this.geometry,
  material: this.material,
  context: this.gl,
  color: [1,0,0],
  flipy: true,
  scale: 1,
  texscale: this.bufferfactor,
  tilesize: this.viewport[0],
};
this.shit = elation.graphics.tiles(null, elation.html.create('div'), plopargs);
//this.shit.createTileLayer("main", this.viewport[0], {opacitystart: 1});

this.plop = new elation.graphics.tiles.layer(this.gl, plopargs);

    if (this.src) {
      this.deepzoom = new elation.deepzoom.image(this.src, this.imageposition, this.container);
      elation.events.add(this.deepzoom, "deepzoom_image_load", this);

      if (this.container.tagName == 'IMG') {
        this.container.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
      }
    }
    this.setDebug(elation.html.hasclass(this.container, "debug"));
    if (!this.args.hide) {
      elation.events.add(this.container, "mousewheel,mousedown,dblclick,touchstart", this);
    }
    this.fuh();
  }
  this.fuh = function() {
    if (this.args.hidden) {
      return;
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    var oldviewport = this.gl.getParameter(this.gl.VIEWPORT);

    this.gl.viewport(0, 0, this.viewport[0], this.viewport[1]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.activeTexture(this.gl.TEXTURE0);
    if (this.levels[this.activelevel]) {
      //this.gl.bindTexture(this.gl.TEXTURE_2D, this.levels[this.activelevel].texture);

var newoffset = [
  this.levels[this.activelevel].offset[0],
  this.levels[this.activelevel].offset[1]
];
if (0) {
      this.shit.setTileLayerImages("main", [[this.levels[this.activelevel].texture]], true);
      this.shit.setTileLayerTextureOffset("main", newoffset);
      this.shit.render();
} else {

var aspect = this.levels[this.activelevel].size[0] / this.levels[this.activelevel].size[1];
var levelsize = this.levels[this.activelevel].size;
var foo = [Math.min(levelsize[0], this.viewport[0]), Math.min(levelsize[1], this.viewport[1])];
//var foo = [169, 169/aspect];
this.levels[this.activelevel].texture.size = foo;
//this.plop.size = foo;
//console.log(levelsize, this.levels[this.activelevel].texture.size);

      this.plop.setTileImages([[this.levels[this.activelevel].texture]], true);
//newoffset[0] /= this.bufferfactor;
//newoffset[1] /= this.bufferfactor;
var tileoffset = [(this.viewport[0] - foo[0]) / 2, (this.viewport[1] - foo[1]) / 2];
//console.log('aspect is', aspect, foo, tileoffset);
      this.plop.setTextureOffset(newoffset);
      this.plop.setTileOffset(tileoffset);
      if (this.levels[this.activelevel-1]) {
        this.plop.setBackground(this.levels[this.activelevel-1].texture/*, this.levels[this.activelevel-1].offset*/);
      }
      this.plop.render();
}
    }
    this.gl.viewport(oldviewport[0], oldviewport[1], oldviewport[2], oldviewport[3]);
  }
  this.setDebug = function(debug) {
  }
  this.setViewport = function(width, height, zoom) {
    this.viewport = [width, height];
    this.canvas.width = width;
    this.canvas.height = height;

    if (this.deepzoom && this.deepzoom.loaded) {
      this.buffersize = [
        Math.ceil((this.viewport[0] * this.bufferfactor) / this.deepzoom.tilesize) * this.deepzoom.tilesize,
        Math.ceil((this.viewport[1] * this.bufferfactor) / this.deepzoom.tilesize) * this.deepzoom.tilesize
      ];
    } else {
      this.buffersize = [Math.ceil(this.viewport[0] * this.bufferfactor), Math.ceil(this.viewport[1] * this.bufferfactor)];
    }
    if (zoom) {
      this.setZoom(zoom);
    }
  }
  this.getLevel = function(level) {
    if (!this.levels[level]) {
      this.createLevel(level);
    }
    return this.levels[level];
  }
  this.createLevel = function(level) {
    var levelargs = {
      level: level,
      size: this.buffersize,
      deepzoom: this.deepzoom,
      context: this.gl,
      geometry: this.geometry,
      material: this.material,
      useframebuffer: true
    };
var levelinfo = this.deepzoom.getLevelInfo(level);
console.log(level, levelinfo, levelargs);
if (levelinfo) {
  if (levelargs.size[0] > levelinfo.width || levelargs.size[1] > levelinfo.height) {
    levelargs.size = [Math.floor(Math.min(levelinfo.width, levelargs.size[0])), Math.min(levelinfo.height, levelargs.size[1])];
  //levelargs.size = [(this.viewport[0] + levelinfo.width), this.viewport[1] + levelinfo.height];
  }
    if (this.levels[level-1]) {
      levelargs.background = this.levels[level-1].texture;
      levelargs.bgoffset = this.levels[level-1].offset;
    }
console.log('create new level', levelargs);
    this.levels[level] = elation.deepzoom.viewer.level(null, elation.html.create('div'), levelargs);
    elation.events.add(this.levels[level], "tiles_changed,deepzoom_level_update", this);
}
  }
  this.getCanvas = function(level) {
    var levelobj = this.getLevel(level);
    return levelobj.container;
  }
  this.getLevelTexture = function(level) {
    var levelobj = this.getLevel(level);
    return levelobj.texture;
  }
  this.setZoom = function(zoom) {
    var newlevel = this.minlevel + Math.floor((Math.log(zoom) / Math.LN2));
    if (this.deepzoom && newlevel > this.maxlevel)
      newlevel = this.maxlevel;

    if (newlevel != this.activelevel) {
      this.setActiveLevel(newlevel);
    }
    var newscale = zoom / Math.pow(2, this.activelevel-this.minlevel);
    //this.shit.setScale(newscale);
var aspect = 1;//this.levels[newlevel].size[0] / this.levels[newlevel].size[1];
    this.plop.setScale([newscale, newscale / aspect]);
    this.fuh();
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
        this.showLevel(i);
      } else {
        this.hideLevel(i);
      }
    }

  }
  this.showLevel = function(level) {
    //console.log('show thing', level);
    var levelobj = this.getLevel(level);
    levelobj.setPosition(this.imageposition[0], this.imageposition[1]);
    this.container.appendChild(levelobj.container);
  }
  this.hideLevel = function(level) {
    if (this.levels[level]) {
      if (this.levels[level].container.parentNode == this.container) {
        this.container.removeChild(this.levels[level].container);
      }
      //console.log('go away thing', level);
    }
  }
  this.setPosition = function(x, y, force) {
    if (this.loaded) {
      if (!this.imageposition || force || this.imageposition[0] != x || this.imageposition[1] != y) {
        this.imageposition = [x, y];
        for (var i = this.minlevel; i <= this.activelevel; i++) {
          if (this.levels[i]) {
            this.levels[i].setPosition(x, y, force);
          }
          if (this.levels[i - 1]) {
            this.levels[i].tilelayers['tiles'].setBackgroundOffset(this.levels[i-1].offset);
          }
        }
      }
    } else {
      (function(self, x, y) {
        elation.events.add([self], "deepzoom_image_load", function() { self.setPosition(x, y, force); });
      })(this, x, y, force);
    }
  }
  this.createShader = function(type, src) {
    var shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);

    var compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!compiled) {
      console.log("Shader error:", shader, this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return;
    }
    return shader;
  }
  this.createProgram = function(shaders, attribs) {
    var program = this.gl.createProgram();
    for (var k in shaders) {
      this.gl.attachShader(program, shaders[k]);
    }
    if (attribs) {
      for (var k in attribs) {
        this.gl.bindAttribLocation(program, k, attribs[k]);
      }
    }
    this.gl.linkProgram(program);
    var linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (!linked) {
      console.log("Program error:", program, this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return;
    }
    return program;
  }
  this.createTileMaterial = function() {
    var shaders = [
      this.createShader(this.gl.VERTEX_SHADER, [
          "attribute vec2 position;",
          "attribute vec2 uv;",

          "uniform vec2 dims;",       // size of canvas

          "uniform vec2 offset;",     // offset for all tiles
          "uniform vec2 tileoffset;", // texture offset for tiles
          "uniform vec2 bgoffset;",   // offset for previous level (background)

          "uniform vec2 tilepos;",    // grid position of this tile
          "uniform float tilesize;",  // size of tile
          "uniform vec2 tilescale;",  // the scale for this tile, adjusted for partial tiles
          "uniform float texscale;",  // multiplier for tile texture

          "uniform vec2 scale;",      // scale for tiles

          "varying vec2 vPosition;",
          "varying vec2 vUv;",
          "varying vec2 vBackgroundUv;",

          "void main() {",
            "vec2 imagepos = ((position * tilescale) + (tilepos * tilesize) + offset) / dims;",
            "gl_Position = vec4((imagepos * 2.0 - 1.0) * vec2(scale.x, scale.y) * texscale, 0, 1);",
            "vec2 texoffset = tileoffset / (dims*texscale);",
            "vUv = uv - texoffset;",
            //"vBackgroundUv = (imagepos * scale / 2.0) - (bgoffset / dims);",
            //"vBackgroundUv = (imagepos - bgoffset / (dims / scale)) / 2.0;",
            //"vBackgroundUv = ((((position * tilescale) + (tilepos * tilesize)) / 2.0) + bgoffset / 2.0) / (dims * scale * texscale);",
"vBackgroundUv = ((uv / 2.0 + vec2(.25)) - (bgoffset / (dims * texscale)));",
//"vBackgroundUv -= bgoffset / dims;",
            "vPosition = position;",
          "}"
        ].join("\n")),
      this.createShader(this.gl.FRAGMENT_SHADER, [
          "precision mediump float;",

          "uniform vec3 color;",
          "uniform float opacity;",
          "uniform sampler2D tile;",
          "uniform sampler2D background;",
          "uniform vec2 tilepos;",
          "uniform vec2 tilescale;",
          "uniform float tilesize;",
          "uniform float texscale;",

          "varying vec2 vPosition;",
          "varying vec2 vUv;",
          "varying vec2 vBackgroundUv;",

          "void main() {",
            //"gl_FragColor = mix(texture2D(background, vBackgroundUv), texture2D(tile, vUv), 1.0);",
            "vec4 bg = texture2D(background, vBackgroundUv);",
            "vec4 fg = texture2D(tile, vUv);",
            "gl_FragColor.rgb = ((bg.rgb * (1.0 - fg.a)) + (fg.rgb * fg.a)) * opacity;",
            "gl_FragColor.a = 1.0 * opacity;",

            /* debug grid */
//"#define DEBUG",

            "#ifdef DEBUG",
            "if (vUv.x < .005 || vUv.x > .995 || vUv.y < .005 || vUv.y > .995) {",
              "gl_FragColor = mix(gl_FragColor, vec4(color, .5), .4);",
            "}",
            "#endif",
            "vec2 maxuv = vec2(1.0);",//tilescale / tilesize / texscale;",
            "if (vUv.x < 0.0 || vUv.x > maxuv.x || vUv.y < 0.0 || vUv.y > maxuv.y) {",
              "gl_FragColor = vec4(0,0,0,0);",
            "}",
          "}"
        ].join("\n"))
    ]; 
    var program = this.createProgram(shaders);
    return program;
  }

  /* events */
  this.deepzoom_image_load = function(ev) {
    this.loaded = true;
    this.minlevel = this.deepzoom.minlevel + 4;
    this.maxlevel = this.deepzoom.maxlevel;
    this.setViewport(this.viewport[0], this.viewport[1], this.zoomfactor);
console.log('min!', this.minlevel, this.deepzoom.minlevel);
    this.minlevel = Math.ceil(Math.log(Math.max(this.viewport[0], this.viewport[1])) / Math.LN2) - 1;
    elation.events.fire({type: 'deepzoom_image_load', element: this});
  }
  this.deepzoom_level_update = function(ev) {
    if (ev.target.level == this.activelevel) {
      this.fuh();
    }
    elation.events.fire({type: "deepzoom_canvas_update", element: this, fn: this, data: ev.data});
  }
  this.tiles_changed = function(ev) {
    this.fuh();
    elation.events.fire({type: 'deepzoom_canvas_update', element: this});
  }
  this.mousewheel = function(ev) {
    var move = (ev.wheelDeltaY || ev.wheelDelta) / 120 || -ev.detail;
    this.zoomfactor *= (move < 0 ? 9/10 : 10/9)
    if (this.zoomfactor < 1) this.zoomfactor = 1;
    this.setZoom(this.zoomfactor);
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
    //console.log(this.zoomfactor, this.deepzoom.size, this.viewport, this.deepzoom);
    //diff[0] /= this.zoomfactor * this.viewport[0] / 3.65;
    //diff[1] /= this.zoomfactor * this.viewport[1] / 3.65; // FIXME - why?
    diff[0] /= this.zoomfactor * (this.deepzoom.size[0] / this.buffersize[0]) * (this.buffersize[0] / this.deepzoom.tilesize);
    diff[1] /= this.zoomfactor * (this.deepzoom.size[1] / this.buffersize[1]) * (this.buffersize[1] / this.deepzoom.tilesize);
    // Clamp to [0..1]
    // FIXME - should actually allow for a half-tile border around the edges
    var newpos = [
      Math.max(Math.min(this.imageposition[0] + diff[0], 1), 0),
      Math.max(Math.min(this.imageposition[1] + diff[1], 1), 0),
      //this.imageposition[0] + diff[0],
      //this.imageposition[1] + diff[1]
    ];

    this.setPosition(newpos[0], newpos[1]);
    //this.imageposition = newpos;
    this.lastpos = pos;
  }
  this.mouseup = function(ev) {
    //console.log('up');
    this.setPosition(this.imageposition[0], this.imageposition[1]);
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
      this.setZoom(this.zoomfactor);
    }
    ev.preventDefault();
  }
  this.touchend = function(ev) {
    this.mouseup(ev);
  }
}, elation.webgl.object);

elation.component.add("deepzoom.viewer.level", function() {
  this.init = function() {
    this.initTiles();
    this.level = this.args.level;
    this.size = this.args.size;
    this.offset = [0, 0];
    this.deepzoom = this.args.deepzoom;
    this.createTileLayer("tiles", this.deepzoom.tilesize);
  }
  this.setPosition = function(x, y, force) {
    if (!this.deepzoom || this.hidden) return;

    var realpos = [x * this.deepzoom.size[0], y * this.deepzoom.size[1]];
    var vtiles = this.deepzoom.getVisibleTiles([x, y], this.size, this.level, true);
    //console.log(realpos, vtiles, this.level, this.size, this.tl, this.br);

    if (force || !vtiles.offset[0] != this.offset[0] || vtiles.offset[1] != this.offset[1]) {
      var needsupdate = this.needsupdate;
      this.offset = [-vtiles.offset[0] * this.size[0], -vtiles.offset[1] * this.size[1]];;
      if (force !== false && (force || !this.tl || !this.br ||
          vtiles.tl[0] !== this.tl[0] || vtiles.tl[1] !== this.tl[1] ||
          vtiles.br[0] !== this.br[0] || vtiles.br[1] !== this.br[1])) {
        //console.log('tiles changed for level', this.level, [this.tl, this.br], [vtiles.tl, vtiles.br]);
        // Visible tiles changed, update the canvas
        this.tl = vtiles.tl;
        this.br = vtiles.br;
        var tileurls = this.deepzoom.getTileURLs(this.level, vtiles.tl, vtiles.br);
        this.setTileLayerImages("tiles", tileurls);
        this.render();
      }
      //this.setTileLayerOffset("tiles", this.offset);
      elation.events.fire({type: "deepzoom_level_update", element: this, data: {level: this.level, offset: this.offset, needsupdate: needsupdate}});
      this.needsupdate = false;
    }
  }
}, elation.graphics.tiles);
