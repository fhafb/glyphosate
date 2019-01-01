function to_rgb(color) {
	let rgb=[];
	rgb[0]=Math.trunc(color/0x1000000);
	color=color % 0x1000000;
	rgb[1]=Math.trunc(color/0x10000);
	color=color % 0x10000;
	rgb[2]=Math.trunc(color/0x100);
	rgb[3]=color % 0x100;
	return rgb;
}

function colorscale(scale,min,max,cur) {
	if (cur<=min) return to_rgb(scale[0][1]);
	if (cur>=max) return to_rgb(scale[scale.length-1][1]);
	let p=(cur-min)/(max-min);
	let i=0;
	while (i<scale.length-1 && scale[i+1][0]<p) ++i;
	let rgbmin=to_rgb(scale[i][1]);
	let rgbmax=to_rgb(scale[i+1][1]);
	let rgbcur=[];
	for (let j=0;j<4;++j) {
		rgbcur[j]=Math.trunc((p-scale[i][0])*(rgbmax[j]-rgbmin[j])/(scale[i+1][0]-scale[i][0]))+rgbmin[j];
	}
	return rgbcur;
}

function get_selected_param() {
	let btns=document.getElementsByName('radioparam');
	for (let btn of btns) if (btn.checked==true) return parseInt(btn.value,10);
}

function make_tooltip(event) {
	let point=event.target;
	let svg=point.parentNode;
	let tooltip=document.createElementNS('http://www.w3.org/2000/svg','g');
	tooltip.id='svgtooltip';
	let rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
	rect.setAttribute('width','60%');
	rect.setAttribute('height','15%');
	let cx=point.getAttribute('cx');
	let x=cx.substring(0,cx.length-1)-30;
	let cy=point.getAttribute('cy');
	let y=cy.substring(0,cy.length-1)-20;
	if (x>40) x=40;
	if (x<0) x=0;
	if (y<0) y=y+30;
	rect.setAttribute('x',x+'%');
	rect.setAttribute('y',y+'%');
	rect.setAttribute('rx',10);
	rect.setAttribute('ry',10);
	rect.classList.add('tooltipframe');
	let text=document.createElementNS('http://www.w3.org/2000/svg','text');
	text.setAttribute('x',(x+30)+'%');
	text.setAttribute('y',(y+8)+'%');
	if ("year" in point.dataset) {
		text.textContent=point.dataset["year"]+" : "+Number(point.dataset["value"]).toLocaleString("fr-FR",{maximumFractionDigits:0})+" kg";
	} else {
		text.textContent=new Date(point.dataset["date"]).toLocaleDateString('fr-FR')+" : "+Number(point.dataset["value"]).toLocaleString("fr-FR",{maximumFractionDigits:3})+" µg/L "+point.dataset['type'];
	}
	text.classList.add('tooltiptext');
	tooltip.appendChild(rect);
	tooltip.appendChild(text);
	svg.appendChild(tooltip);
}

function remove_tooltip(event) {
	let tooltip=event.target.parentNode.getElementById('svgtooltip');
	tooltip.parentNode.removeChild(tooltip);
}

function draw_graph_bnvd(feature) {
	let div=document.createElement('div');
	let title=document.createElement('h2');
	title.innerHTML=feature.properties["NOM_DEP"];
	div.appendChild(title);
	let svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
	div.appendChild(svg);
	svg.style.width="300px";
	svg.style.height="150px";
	//svg.setAttribute('viewBox',"0 0 600 400");
	values=[];
	for (let j=2008;j<=2017;++j) values.push([j,feature.properties["V"+j]]);
	let range=[2008,1e20,2017,0];
	for (let val of values) if (val[1]!==null) {
		if (val[1]<range[1]) range[1]=val[1];
		else if (val[1]>range[3]) range[3]=val[1];
	}
	let gtick=Math.round(Math.exp(Math.floor(Math.log10(range[3]-range[1]))*Math.log(10)));
	range[3]=(Math.floor(range[3]/gtick)+1)*gtick;
	range[1]=(Math.floor(range[1]/gtick))*gtick;
	margins=[10,9];
	let transx=x => ((x-range[0])/(range[2]-range[0])*(100-margins[0])+margins[0]);
	let transy=y => (100-margins[1]-(y-range[1])/(range[3]-range[1])*(99-margins[1]));
	let el=document.createElementNS("http://www.w3.org/2000/svg",'text');
	el.setAttribute('x','1%');
	el.setAttribute('y','50%');
	el.setAttribute('style','transform-origin: 1% 50%;transform: rotate(-90deg); text-anchor: middle; dominant-baseline: middle; font-size: 0.8em');
	el.textContent="tonnes de glyphosate vendues";
	svg.appendChild(el);
	for (let i=0;i<2;++i) {
		let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
		let x=(i==0)?(margins[0]+"%"):"100%";
		line.setAttribute('x1',x);
		line.setAttribute('y1','1%');
		line.setAttribute('x2',x);
		line.setAttribute('y2',101-margins[1]+'%');
		line.classList.add('stroke_d');
		svg.appendChild(line);
	}
	for (let i=0;i<values.length;++i) {
		let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
		let x=transx(values[i][0])+'%';
		line.setAttribute('x1',x);
		line.setAttribute('y1',100-margins[1]+'%');
		line.setAttribute('x2',x);
		line.setAttribute('y2',101-margins[1]+'%');
		line.classList.add('stroke_d');
		svg.appendChild(line);
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		text.setAttribute('x',x);
		text.setAttribute('y','94%');
		text.setAttribute('style','transform-origin: '+x+' 94%; text-anchor: middle; dominant-baseline: middle; font-size: 0.6em');
		text.textContent=values[i][0];
		svg.appendChild(text);
	}
	for (let i=range[1];i<=range[3];i=i+gtick) {
		let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
		let y=transy(i)+'%';
		line.setAttribute('x1',margins[0]-1+'%');
		line.setAttribute('y1',y);
		line.setAttribute('x2','100%');
		line.setAttribute('y2',y);
		line.classList.add('stroke_d');
		svg.appendChild(line);
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		text.setAttribute('x',margins[0]-1.5+'%');
		text.setAttribute('y',y);
		text.setAttribute('style','text-anchor: end; dominant-baseline: middle; font-size: 0.8em');
		text.textContent=Number(Math.floor(i/1000)).toFixed(0);
		svg.appendChild(text);
	}
	for (let i=0;i<values.length-1;++i) {
		if (values[i][1]!==null && values[i+1][1]!==null) {
			let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
			line.setAttribute('x1',transx(values[i][0])+'%');
			line.setAttribute('y1',transy(values[i][1])+'%');
			line.setAttribute('x2',transx(values[i+1][0])+'%');
			line.setAttribute('y2',transy(values[i+1][1])+'%');
			line.classList.add('stroke_a');
			line.setAttribute('stroke-width','3');
			svg.appendChild(line);
		}
	}
	for (let i=0;i<values.length;++i) {
		let circle=document.createElementNS("http://www.w3.org/2000/svg",'circle');
		circle.setAttribute('cx',transx(values[i][0])+'%');
		circle.setAttribute('cy',transy(values[i][1])+'%');
		circle.setAttribute('r','2%');
		circle.dataset['year']=values[i][0];
		circle.dataset['value']=values[i][1];
		circle.classList.add('fill_a');
		circle.addEventListener('mouseenter',make_tooltip);
		circle.addEventListener('mouseleave',remove_tooltip);
		let tooltip=document.createElementNS("http://www.w3.org/2000/svg",'title');
		tooltip.textContent="Vente de glyphosate en "+values[i][0]+" : "+Number(values[i][1]).toLocaleString("fr-FR",{maximumFractionDigits:0})+" kg";
		circle.appendChild(tooltip);
		svg.appendChild(circle);
	}
	return div;
}

function create_tooltip_bnvd(feature) {
	let year=document.getElementById('year').value;
	let content=document.createElement("div");
	content.classList.add('tooltip');
	let title=document.createElement('h1');
	title.textContent=feature.properties["NOM_DEP"];
	content.appendChild(title);
	let p=document.createElement("p");
	p.textContent="Vente de glyphosate en "+year+" : "+Number(feature["properties"]["V"+year]).toLocaleString("fr-FR",{maximumFractionDigits:0})+" kg";
	content.appendChild(p);
	return content;
}

function updateBnvd(depjson,year) {
	document.getElementById('currentyear').innerText=year;
	let maxvalue=0;
	for (let feat of depjson["features"]) {
		if (feat["properties"]["V"+year]!==null && feat["properties"]["V"+year]>maxvalue) maxvalue=feat["properties"]["V"+year];
	}
	bnvd.setStyle(function(feature) {
		rgbcur=colorscale([[0,0xFFFFFF00],[0.333,0xFFFF0000],[0.667,0xFF000000],[1,0x80000000]],0,maxvalue,feature.properties["V"+year]);
		return {
			weight: 1,
			color: "#000",
			fillColor: "rgb("+rgbcur[0]+","+rgbcur[1]+","+rgbcur[2]+")",
			fillOpacity: 0.5
		}
	});
	let legend=document.getElementById('bnvdlegend');
	Array.from(legend.getElementsByTagName('text')).forEach(function(element) {
		element.parentNode.removeChild(element);
	});
	for (let i=0;i<=4;++i) {
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		text.setAttribute('x',''+(10+80*i/4)+'%');
		text.setAttribute('y','25');
		text.setAttribute('style','text-anchor: middle; dominant-baseline: hanging; font-size: 1em');
		text.textContent=Number(Math.floor(maxvalue*i/4000)).toFixed(0);
		legend.appendChild(text);
	}
}

function updateNaiades(stationjson,year,param) {
	document.getElementById('currentyear').innerText=year;
	let maxvalue=0;
	let maxdate=(year+1)+'-01-01';
	for (let feat of stationjson["features"]) {
		for (let data of feat['properties']['data']) {
			if (data[0]>=maxdate) break;
			if (data[1]==param && data[2]>maxvalue) maxvalue=data[2];
		}
	}
	maxvalue=1;
	if (stationlayer!=null) map.removeLayer(stationlayer);
	stationlayer=L.geoJSON(stationjson,{onEachFeature:function(feature,layer) {
		//layer.bindPopup(draw_graph_naiades(feature),{maxWidth:400});
		layer.bindPopup("Chargement...",{maxWidth:400});
		layer.on('click',function(e) {
			var popup=e.target.getPopup();
			popup.setContent(draw_graph_naiades(feature));
			popup.update();
		});
	},pointToLayer:function(feature,latlng) {
		let i=0;
		while (i<feature['properties']['data'].length && feature['properties']['data'][i][0]<maxdate) ++i;
		--i;
		while (i>=0 && feature['properties']['data'][i][1]!=param) --i;
		if (i<0) return null;
		rgbcur=colorscale([[0,0x40e0d000],[0.5,0xff8c0000],[1,0xff008000]],0,maxvalue,feature['properties']['data'][i][2]);
		return L.marker(latlng,{
			icon: L.divIcon({
				iconAnchor: [0, 24],
				labelAnchor: [-6, 0],
				popupAnchor: [0, -36],
				html: '<span style="width: 2em; height: 2em; display: block; left: -1em; top: -1em; position: relative; border-radius: 2em 2em 0; transform: rotate(45deg); border: 1px solid #000; background-color: rgb('+rgbcur[0]+','+rgbcur[1]+','+rgbcur[2]+')" />'
			})
		})
	},attribution : '<a href="http://www.naiades.eaufrance.fr">Naïades</a>'});
	if (map.getZoom()>8) stationlayer.addTo(map);
	let legend=document.getElementById('naiadeslegend');
	Array.from(legend.getElementsByTagName('text')).forEach(function(element) {
		element.parentNode.removeChild(element);
	});
	for (let i=0;i<=4;++i) {
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		text.setAttribute('x',''+(10+80*i/4)+'%');
		text.setAttribute('y','25');
		text.setAttribute('style','text-anchor: middle; dominant-baseline: hanging; font-size: 1em');
		if (i==4) text.textContent='≥';
		text.textContent+=maxvalue*i/4;
		legend.appendChild(text);
	}
}

function draw_graph_naiades(feature) {
	let div=document.createElement('div');
	let title=document.createElement('h2');
	title.innerHTML=feature.properties["nom"];
	div.appendChild(title);
	let legend=document.createElementNS('http://www.w3.org/2000/svg','svg');
	div.appendChild(legend);
	legend.style.width="300px";
	legend.style.height="20px";
	for (let j=0;j<2;++j) {
		let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		let x=0;
		if (j==0) {
			x=10;
			line.classList.add('stroke_a');
			text.textContent='Glyphosate';
		} else {
			x=50;
			line.classList.add('stroke_b');
			text.textContent='AMPA';
		}
		line.setAttribute('x1',x+'%');
		line.setAttribute('x2',(x+10)+'%');
		line.setAttribute('y1','50%');
		line.setAttribute('y2','50%');
		legend.appendChild(line);
		text.setAttribute('x',(x+15)+'%');
		text.setAttribute('y','50%');
		text.setAttribute('style','text-anchor: start; dominant-baseline: middle; font-size: 0.8em');
		legend.appendChild(text);
	}
	let svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
	div.appendChild(svg);
	svg.style.width="400px";
	svg.style.height="150px";
	values=[[],[]];
	for (let dat of feature.properties.data) {
		if (dat[1]==1506) values[0].push([new Date(dat[0]),dat[2]]);
		if (dat[1]==1907) values[1].push([new Date(dat[0]),dat[2]]);
	}
	let range=[new Date("2050-01-01"),20000,new Date("1900-01-01"),0];
	for (let i=0;i<2;++i) {
		for (let val of values[i]) {
			if (val[0]<range[0]) range[0]=val[0];
			if (val[0]>range[2]) range[2]=val[0];
			if (val[1]<range[1]) range[1]=val[1];
			if (val[1]>range[3]) range[3]=val[1];
		}
	}
	let pow=Math.floor(Math.log10(range[3]-range[1]));
	let ytick=1;
	if (pow>0) {
		for (let i=0;i<pow;++i) ytick*=10;
	} else {
		for (let i=-pow;i<0;++i) ytick/=10;
	}
	range[3]=(Math.floor(range[3]/ytick)+1)*ytick;
	range[1]=(Math.floor(range[1]/ytick))*ytick;
	let xtick=1;
	range[0]=new Date(range[0].getFullYear(),0,1);
	range[2]=new Date(range[2].getFullYear()+1,0,1);
	if (range[2]-range[0]<1000*3600*24*365.25*10) {
		xtick=1;
	} else {
		xtick=5;
	}
	margins=[10,9];
	let transx=x => ((x-range[0])/(range[2]-range[0])*(100-margins[0])+margins[0]);
	let transy=y => (100-margins[1]-(y-range[1])/(range[3]-range[1])*(99-margins[1]));
	let el=document.createElementNS("http://www.w3.org/2000/svg",'text');
	el.setAttribute('x','1%');
	el.setAttribute('y','50%');
	el.setAttribute('style','transform-origin: 1% 50%;transform: rotate(-90deg); text-anchor: middle; dominant-baseline: middle; font-size: 0.8em');
	el.textContent="µg/L";
	svg.appendChild(el);
	for (let i=0;i<2;++i) {
		let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
		let x=(i==0)?(margins[0]+"%"):"100%";
		line.setAttribute('x1',x);
		line.setAttribute('y1','1%');
		line.setAttribute('x2',x);
		line.setAttribute('y2',101-margins[1]+'%');
		line.classList.add('stroke_d');
		svg.appendChild(line);
	}
	for (let i=range[0];i<=range[2];i=new Date(i.getFullYear()+xtick,0,1)) {
		let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
		let x=transx(i)+'%';
		line.setAttribute('x1',x);
		line.setAttribute('y1',100-margins[1]+'%');
		line.setAttribute('x2',x);
		line.setAttribute('y2',101-margins[1]+'%');
		line.classList.add('stroke_d');
		svg.appendChild(line);
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		text.setAttribute('x',x);
		text.setAttribute('y','94%');
		text.setAttribute('style','transform-origin: '+x+' 94%; text-anchor: middle; dominant-baseline: middle; font-size: 0.6em');
		text.textContent=i.getFullYear();
		svg.appendChild(text);
	}
	for (let i=range[1];i<=range[3];i=i+ytick) {
		let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
		let y=transy(i)+'%';
		line.setAttribute('x1',margins[0]-1+'%');
		line.setAttribute('y1',y);
		line.setAttribute('x2','100%');
		line.setAttribute('y2',y);
		line.classList.add('stroke_d');
		svg.appendChild(line);
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		text.setAttribute('x',margins[0]-1.5+'%');
		text.setAttribute('y',y);
		text.setAttribute('style','text-anchor: end; dominant-baseline: middle; font-size: 0.8em');
		text.textContent=i;
		svg.appendChild(text);
	}
	for (let j=0;j<2;++j) {
		for (let i=0;i<values[j].length-1;++i) {
			let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
			line.setAttribute('x1',transx(values[j][i][0])+'%');
			line.setAttribute('y1',transy(values[j][i][1])+'%');
			line.setAttribute('x2',transx(values[j][i+1][0])+'%');
			line.setAttribute('y2',transy(values[j][i+1][1])+'%');
			if (j==0) line.classList.add('stroke_a'); else line.classList.add('stroke_b');
			line.setAttribute('stroke-width','3');
			svg.appendChild(line);
		}
		for (let i=0;i<values[j].length;++i) {
			let circle=document.createElementNS("http://www.w3.org/2000/svg",'circle');
			circle.setAttribute('cx',transx(values[j][i][0])+'%');
			circle.setAttribute('cy',transy(values[j][i][1])+'%');
			circle.setAttribute('r','2%');
			circle.dataset['date']=values[j][i][0];
			circle.dataset['type']=(j==0)?'Glyphosate':'AMPA';
			circle.dataset['value']=values[j][i][1];
			if (j==0) circle.classList.add('fill_a'); else circle.classList.add('fill_b');
			circle.addEventListener('mouseenter',make_tooltip);
			circle.addEventListener('mouseleave',remove_tooltip);
			//let tooltip=document.createElementNS("http://www.w3.org/2000/svg",'title');
			//tooltip.textContent="Vente de glyphosate en "+values[i][0]+" : "+Number(values[i][1]).toLocaleString("fr-FR",{maximumFractionDigits:0})+" kg";
			//circle.appendChild(tooltip);
			svg.appendChild(circle);
		}
	}
	return div;
}

// Perform some actions to prepare the page
let ylist=document.getElementById('years');
for (let i=2008;i<=2017;++i) {
	let opt=document.createElement('option');
	opt.setAttribute('value',i);
	opt.setAttribute('label',i);
	ylist.appendChild(opt);
}
// Global variables
let depjson=null;
let bnvd=null;
let stationjson=null;
let stationlayer=null;
// Create Leaflet map and base layer
let map=L.map('map', {zoomSnap:0});
//let base= L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',maxZoom: 8});
let base= L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC', maxZoom: 16 })
//let base = new L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community' });
//let base = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 2, maxZoom: 12, attribution: 'Données © Contributeurs <a href="http://openstreetmap.org">OpenStreetMap</a>'});
//let base= L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {maxZoom: 20,attribution: '&copy; Openstreetmap France | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' });
//let labels= L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.{ext}', {attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', pane: 'labels', subdomains: 'abcd', minZoom: 0, maxZoom: 20, ext: 'png' });
map.setView(new L.LatLng(46.1,2.5),5.5);
map.createPane('labels');
map.getPane('labels').style.zIndex=500;
map.getPane('labels').style.pointerEvents='none';
map.addLayer(base);
map.on('zoomend',function() {
	let zoom=map.getZoom();
	if (zoom>8) {
		if (stationlayer!==null && !map.hasLayer(stationlayer)) map.addLayer(stationlayer);
		if (bnvd.getTooltip) {
			let tooltip=bnvd.getTooltip();
			if (tooltip) map.closeTooltip(tooltip);
		}
	} else {
		if (map.hasLayer(stationlayer)) map.removeLayer(stationlayer);
		if (bnvd.getTooltip) {
			let tooltip=bnvd.getTooltip();
			if (tooltip) map.addLayer(tooltip);
		}
	}
});
// Load sales data from GeoJSON file
let promise=new Promise(function(resolve,reject) {
	let xhttp=new XMLHttpRequest();
	xhttp.open('GET','dep_values.json',true);
	xhttp.onreadystatechange=function() {
		if (this.readyState==XMLHttpRequest.DONE && this.status==200) {
			depjson=JSON.parse(this.responseText);
			bnvd=L.geoJSON(depjson,{onEachFeature:function(feature,layer) {
				//layer.bindPopup(draw_graph_bnvd(feature),{maxWidth:400});
				layer.bindPopup("Chargement...",{maxWidth:400});
				layer.on('click',function(e) {
					var popup=e.target.getPopup();
					popup.setContent(draw_graph_bnvd(feature));
					popup.update();
				});
				layer.bindTooltip(create_tooltip_bnvd(feature));
			},attribution : '<a href="http://www.data.eaufrance.fr/jdd/660d6c71-6ae3-4d51-be4d-faf73567643e">BNVD</a>'});
			bnvd.addTo(map);
			updateBnvd(depjson,2016);
			resolve();
		}
	}
	xhttp.send();
});
// Load station data from GeoJSON file
promise.then(function() {
	let xhttp=new XMLHttpRequest();
	xhttp.open('GET','stations_esu.json',true);
	xhttp.onreadystatechange=function() {
		if (this.readyState==XMLHttpRequest.DONE && this.status==200) {
			stationjson=JSON.parse(this.responseText);
			updateNaiades(stationjson,2016,1506);
			//map.addLayer(labels);
		}
	}
	xhttp.send();
});
