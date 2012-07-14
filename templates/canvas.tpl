{dependency name="deepzoom"}
{dependency name="deepzoom.image"}
{dependency name="deepzoom.canvas"}

<div class="container">
  {component name="deepzoom.imagelist" deepzoompath="/deepzoom/canvas"}

  <div elation:component="deepzoom.viewer.canvas" elation:args.src="/images/deepzoom/{$img}.xml" class=""></div>
</div>
