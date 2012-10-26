<div>
<!-- Templates -->
<script type="text/template" id="resource-list">
  <div data-role="header" class="ui-header ui-bar-b" role="banner">
    <h1 id="pageTitle">{{ this.model.className }}</h1> 
  </div>
  <div  id="sidebarDiv" class="ui-content" data-role="content" data-theme="e" role="main">
    <ul id="sidebar" data-role="listview" class="ui-listview" data-theme="c">
    </ul>
  </div>
  <div id="map"></div>
  
  <div data-role="footer">
     <a target="#welcome" class="icon home">Home</a>
  </div>
</script>  

<script type="text/template" id="resource">
  <div data-role="header"  class="ui-header ui-bar-b" role="banner">
    <a href="#" data-icon="back" class="back ui-btn-left">Back</a>
    <h1 id="pageTitle">{{ davDisplayName }}</h1> 
  </div>
  <div data-role="content" data-theme="e">
    <img align="middle" src="{{ typeof mediumImage == 'undefined' ? 'icons/blank.png' : mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.substring(5) : Lablz.serverName + mediumImage }}"></img> 
    <ul class="ui-listview ui-listview-inset ui-corner-all ui-shadow" data-role="listview" data-theme="c" id="resourceView"></ul>
    <ul id="sidebar" data-role="listview" class="ui-listview" data-inset="true" data-theme="c">
    </ul>
  </div>
  
  <div data-role="footer">
     <a target="#welcome" class="icon home">Home</a>
  </div>
</script>  

<script type="text/template" id="mapTemplate">
  <!--div id="map"></div-->
</script>

<script type="text/template" id="stringTemplate">
    <span>{{ value }}</span>
</script>

<script type="text/template" id="dateTemplate">
    <span>{{ new Date(value / 1000) }}</span>
</script>

<script type="text/template" id="intTemplate">
    <span>{{ value }}</span>
</script>

<script type="text/template" id="moneyTemplate">
  <span>{{ value.currency + value.value }}</span>
</script>

<script type="text/template" id="complexDateTemplate">
  <span>{{ new Date(value.date / 1000) }}</span>
</script>

<script type="text/template" id="uriTemplate">
    <span><a href="{{ value.indexOf('http') == 0 ? value : Lablz.serverName + '/v.html?uri=' + encodeURIComponent(value) }}">{{ value }}</a></span>
</script>

<script type="text/template" id="imageTemplate">
    <span><img src="{{ value.indexOf('http') == 0 ? value : value.indexOf('Image/') == 0 ? Lablz.serverName + value.substring(5) : Lablz.serverName + value }}" /></span>
</script>

<script type="text/template" id="listItemTemplate">
  <a href='#view/{{ encodeURIComponent(_uri) }}'><img align="middle" src="{{ typeof mediumImage == 'undefined' ? 'icons/blank.png' : mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.substring(5) : Lablz.serverName + mediumImage }}" />{{ davDisplayName }}<p>&#160;</p><p>{{ (typeof latinName == 'undefined') ? '' : latinName }}</p></a>
</script>

<script type="text/template" id="propRowTemplate">
    <li class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-li-has-count ui-li-has-thumb ui-btn-up-c">{{ name }}: {{ value }}</li>
</script>

<!--script type="text/template" id="viewTemplate">
	<div>
		{{ for (var name in props) { }} 
			{{ if (props.hasOwnProperty(name)) { }}
				<div class="propRow">{{ name }}: {{ props[name] }}</div>
			{{ } }}
		{{ } }}
	</div>
</script-->

