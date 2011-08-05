{dependency type="component" name="ui.button"}
{dependency type="component" name="deepzoom.imagescale"}
{dependency type="component" name="deepzoom.multizoom"}

<div id="multizoom">
</div>

<script type="text/javascript">
//var multi = new MultiZoom('multizoom', {jsonencode var=$img});
elation.zoom.replace("multizoom", {jsonencode var=$img});
</script>
{set var="page.title"}Elation DeepZoom Explorer - {$imgname|escape:html} ({$img.size.0}x{$img.size.1}){/set}
