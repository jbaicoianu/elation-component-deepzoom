{dependency name="graphics.webgl"}
{dependency name="graphics.tiles"}
{dependency name="deepzoom"}
{dependency name="deepzoom.image"}
{dependency name="deepzoom.webgl"}

<div class="container">
  {component name="deepzoom.imagelist" deepzoompath="/deepzoom/webgl"}

  <div elation:component="deepzoom.viewer.webgl" elation:args.src="/images/deepzoom/{$img}.xml" class=""></div>
</div>

