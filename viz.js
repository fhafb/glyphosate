/***********************
 *  Utility functions  *
 ***********************/
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

function get_selected_param(id) {
	let btns=document.getElementsByName(id);
	for (let btn of btns) if (btn.checked==true) return parseInt(btn.value,10);
}

function get_last_element_before(tab,element) {
	let i=0;
	while (i<tab.length && tab[i][0]<=element) ++i;
	return i-1;
}

/***********************
 *   Layers tooltips   *
 ***********************/
function create_tooltip_bnvd(feature) {
	let year=document.getElementById('year').value+'';
	let i=get_last_element_before(feature['properties']['data'],year);
	let content=document.createElement("div");
	content.classList.add('tooltip');
	let title=document.createElement('h1');
	title.textContent=feature.properties["nom"];
	content.appendChild(title);
	let p=document.createElement("p");
	p.textContent="Vente de glyphosate en "+year+" : "+Number(feature["properties"]['data'][i][1]).toLocaleString("fr-FR",{maximumFractionDigits:0})+" kg";
	content.appendChild(p);
	return content;
}

function create_tooltip_stations(feature) {
	let year=document.getElementById('year').value;
	let maxdate=(year+1)+'-01-01';
	let i=get_last_element_before(feature['properties']['data'],maxdate);
	let j=i;
	while (i>=0 && feature['properties']['data'][i][1]!=1506) --i;
	while (j>=0 && feature['properties']['data'][j][1]!=1907) --j;
	if (i<0 && j<0) return;
	let content=document.createElement("div");
	content.classList.add('tooltip');
	let title=document.createElement('h1');
	title.textContent=feature.properties["nom"];
	if (title.textContent.length>40) title.textContent=title.textContent.substring(0,40)+'...';
	content.appendChild(title);
	let p=document.createElement("p");
	if (i>=0) {
		p.innerHTML+="Glyphosate : "+(([7,10].includes(feature['properties']['data'][i][3]))?'≤':'')+feature['properties']['data'][i][2]+"µg/L le "+new Date(feature['properties']['data'][i][0]).toLocaleDateString('fr-FR');
		if (j>=0) p.innerHTML+='<br />';
	}
	if (j>=0) p.innerHTML+="AMPA : "+(([7,10].includes(feature['properties']['data'][j][3]))?'≤':'')+feature['properties']['data'][j][2]+"µg/L le "+new Date(feature['properties']['data'][j][0]).toLocaleDateString('fr-FR');
	content.appendChild(p);
	return content;
}

/***********************
 *   Layers markers    *
 ***********************/
function updateBnvd(depjson,year) {
	document.getElementById('currentyear').innerText=year;
	let maxvalue=0;
	year=year+'';
	for (let feat of depjson["features"]) {
		let i=get_last_element_before(feat['properties']['data'],year);
		if (i<0) continue;
		if (feat["properties"]['data'][i][1]>maxvalue) maxvalue=feat["properties"]['data'][i][1];
	}
	bnvd.setStyle(function(feature) {
		let num=0;
		for (num=0;num<feature['properties']['data'].length;++num) if (feature['properties']['data'][num][0]>year) break;
		--num;
		if (num<0) return;
		rgbcur=colorscale([[0,0xFFFFFF00],[0.333,0xFFFF0000],[0.667,0xFF000000],[1,0x80000000]],0,maxvalue,feature['properties']['data'][num][1]);
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
		text.setAttribute('y','75%');
		text.setAttribute('style','text-anchor: middle; dominant-baseline: hanging');
		text.textContent=Number(Math.floor(maxvalue*i/4000)).toFixed(0);
		legend.appendChild(text);
	}
}

function update_stations(json,num,year,param,force_add) {
	if (json[num]===null) return;
	let config=[{'legendid':'naiadeslegend','attribution':'<a href="http://www.naiades.eaufrance.fr">Naïades</a>','markcolor':'#3333cc','urltemplate':"http://www.sandre.eaufrance.fr/urn.php?urn=urn:sandre:donnees:STQ:FRA:code:{code}:::referentiel:3.1:html"},
		{'legendid':'adeslegend','attribution':'<a href="http://www.ades.eaufrance.fr">Ades</a>','markcolor':'#cc3300','urltemplate':"http://www.ades.eaufrance.fr/Fiche/PtEau?Code={code}"}];
	let haslayer=map.hasLayer(stationlayer[num]);
	document.getElementById('currentyear').innerText=year;
	let maxvalue=0;
	let maxdate=(year+1)+'-01-01';
	/*for (let feat of json[num]["features"]) {
		for (let data of feat['properties']['data']) {
			if (data[0]>=maxdate) break;
			if (data[1]==param && data[2]>maxvalue) maxvalue=data[2];
		}
	}*/
	maxvalue=1;
	if (stationlayer[num]!=null) map.removeLayer(stationlayer[num]);
	loadedbounds=map.getBounds().pad(1);
	stationlayer[num]=L.geoJSON(json[num],{filter:function(feature) {
		let coords=feature['geometry']['coordinates'];
		return loadedbounds.contains(L.latLng(coords[1],coords[0]));
	},onEachFeature:function(feature,layer) {
		layer.bindPopup("Chargement...",{maxWidth:400});
		layer.on('click',function(e) {
			let popup=e.target.getPopup();
			popup.setContent(draw_graph_stations(feature,{
				'size':["400px","150px"],
				'viewbox':[400,150],
				'titletemplate':'<a target="_blank" rel="noreferrer" href="'+config[num]['urltemplate']+'">{nom}</a>',
				'series':[{"id":1506,"stroke_style":"stroke_a","fill_style":"fill_a","name":"Glyphosate"},{"id":1907,"stroke_style":"stroke_b","fill_style":"fill_b","name":"AMPA"}],
				'ytitle':'µg/L',
				'ytickmultiplier':1,
				'tooltip':{'function':(event)=>{make_tooltip_generic(event,{'template':'{date} : {rem}{value} µg/L {name}','size':[220,23]})}},
				'date_year_only':false,
				'fieldmap':{'date':[0,'Date'],'id':[1,'CdParam'],'value':[2,"Résultat (µg/L)"],'rem':[3,'CdRemarque']},
				'link_to_full':true,
				'link_to_download':true
			}));
			popup.update();
		});
		layer.bindTooltip("Chargement...");
		layer.on('mouseover',function (e) {
			layer.setTooltipContent(create_tooltip_stations(feature));
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
				html: '<span class="marker" style="color: '+config[num]['markcolor']+'; background-color: rgb('+rgbcur[0]+','+rgbcur[1]+','+rgbcur[2]+')">⬤</span>'
			})
		})
	},attribution : config[num]['attribution']});
	if (haslayer || force_add) stationlayer[num].addTo(map);
	if (layerscontrol!=null) {
		map.removeControl(layerscontrol);
		overlays[stationlayerparams[num]['name']]=stationlayer[num];
		layerscontrol=L.control.layers(baselayers,overlays);
		layerscontrol.addTo(map);
	}
	let legend=document.getElementById(config[num]['legendid']);
	Array.from(legend.getElementsByTagName('text')).forEach(function(element) {
		element.parentNode.removeChild(element);
	});
	for (let i=0;i<=4;++i) {
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		text.setAttribute('x',''+(10+80*i/4)+'%');
		text.setAttribute('y','75%');
		text.setAttribute('style','text-anchor: middle; dominant-baseline: hanging');
		if (i==4) text.textContent='≥';
		text.textContent+=maxvalue*i/4;
		legend.appendChild(text);
	}
}

/***********************
 *    Screen popup     *
 ***********************/
function open_screen_popup(content) {
	let cover=document.createElement('div');
	cover.id='overlay';
	document.body.insertAdjacentElement('afterbegin',cover);
	setTimeout(function() {
		cover.style.opacity=0.5;
	},20);
	let popup=document.createElement('div');
	popup.id='popup';
	cover.insertAdjacentElement('afterend',popup);
	popup.addEventListener('transitionend',function(e) {
		let cbutton=document.createElement('div');
		cbutton.classList.add('closebutton');
		cbutton.addEventListener('click',function(e) {
			let popup=document.getElementById('popup');
			popup.addEventListener('transitionend',()=> {popup.parentNode.removeChild(popup);});
			setTimeout(() => {popup.style.height='0px';},20);
			let cover=document.getElementById('overlay');
			cover.addEventListener('transitionend',()=> {cover.parentNode.removeChild(cover);});
			setTimeout(() => {cover.style.opacity='0';},20);
		});
		popup.appendChild(cbutton);
		popup.appendChild(content);
	},{once:true});
	setTimeout(function() {
		popup.style.height='90vh';
	},20);
}


/***********************
 *     Line charts     *
 ***********************/
function make_link_to_full_graph(draw_function,values,config) {
	let linka=document.createElement('a');
	linka.setAttribute('href','#');
	linka.textContent='Afficher en plein écran';
	linka.addEventListener('click',function(e) {
		config['size']=['100%','100%'];
		config['viewbox']=[document.documentElement.clientWidth*0.86,document.documentElement.clientHeight*0.86-140];
		config['link_to_full']=false;
		let content=draw_function(values,config);
		open_screen_popup(content);
		return false;
	});
	return linka;
}

function make_link_to_download(values,config) {
	let linka=document.createElement('a');
	linka.textContent='Télécharger les données';
	let csv=config['fieldmap']['date'][1];
	if ('id' in config['fieldmap']) csv+='\t'+config['fieldmap']['id'][1];
	csv+='\t'+config['fieldmap']['value'][1];
	if ('rem' in config['fieldmap']) csv+='\t'+config['fieldmap']['rem'][1];
	csv+='\n';
	csv=csv.substring(0,csv.length-1)+'\n';
	for (let i=0;i<values.length;++i) 
		for (vals of values[i]) {
			if (config['date_year_only']) csv+=vals[0].getFullYear(); else csv+=vals[0].toISOString().substring(0,10);
			if ('id' in config['fieldmap']) csv+='\t'+config['series'][i]['id'];
			csv+='\t'+vals[1];
			if ('rem' in config['fieldmap']) csv+='\t'+vals[2];
			csv+='\n';
		}
	linka.setAttribute('href','data:text/csv,'+encodeURIComponent(csv));
	linka.setAttribute('download','valeurs.csv');
	return linka;
}

function make_tooltip_generic(event,config) {
	let point=event.target;
	let svg=point.parentNode;
	let tooltip=document.createElementNS('http://www.w3.org/2000/svg','g');
	tooltip.id='svgtooltip';
	let rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
	rect.setAttribute('width',config['size'][0]+'px');
	rect.setAttribute('height',config['size'][1]+'px');
	let cx=point.getAttribute('cx');
	let x=cx.substring(0,cx.length-1)*svg.getBBox().width/100-config['size'][0]/2;
	let cy=point.getAttribute('cy');
	let y=cy.substring(0,cy.length-1)*svg.getBBox().height/100-config['size'][1]/2-20;
	if (x>svg.getBBox().width-config['size'][0]) x=svg.getBBox().width-config['size'][0];
	if (x<0) x=0;
	if (y<0) y=y+30+config['size'][1]/2;
	rect.setAttribute('x',x+'px');
	rect.setAttribute('y',y+'px');
	rect.setAttribute('rx',10);
	rect.setAttribute('ry',10);
	rect.classList.add('tooltipframe');
	let text=document.createElementNS('http://www.w3.org/2000/svg','text');
	text.setAttribute('x',(x+config['size'][0]/2)+'px');
	text.setAttribute('y',(y+config['size'][1]/2)+'px');
	let re=/\{([^}]*)\}/g;
	let texttemplate=config['template'];
	let texthtml='';
	let pos=0;
	while ((match=re.exec(texttemplate))!=null) {
		texthtml+=texttemplate.substring(pos,match.index)+point.dataset[match[1]];
		pos=match.index+match[0].length;
	}
	texthtml+=texttemplate.substring(pos);
	text.innerHTML=texthtml;
	text.classList.add('tooltiptext');
	tooltip.appendChild(rect);
	tooltip.appendChild(text);
	svg.appendChild(tooltip);
}

/**
 * Create a div with line charts
 * @param {object} values - Array of values, one item array per chart line, then each item array holds triplets (date, value, remark)
 * @param {object} config - Configuration of the div
 */
function draw_graph(values,config) {
	let div=document.createElement('div');
	div.style.display='flex';
	div.style.flexFlow='column nowrap';
	div.style.height='100%';
	// Create the title from the template
	let title=document.createElement('h2');
	title.innerHTML=config['title'];
	title.style.flex='initial';
	div.appendChild(title);
	// If there are more than one data series, add a legend
	if (config['series'].length>1) {
		let legend=document.createElement('div');
		legend.classList.add('svglegend');
		for (let j=0;j<config['series'].length;++j) {
			let entry=document.createElement('div');
			let symbol=document.createElementNS('http://www.w3.org/2000/svg','svg');
			symbol.style.width='2em';
			symbol.style.height='1em';
			let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
			line.classList.add(config['series'][j]['stroke_style']);
			line.setAttribute('x1','0');
			line.setAttribute('y1','50%');
			line.setAttribute('x2','100%');
			line.setAttribute('y2','50%');
			symbol.appendChild(line);
			let mark=document.createElementNS("http://www.w3.org/2000/svg",'circle');
			line.classList.add(config['series'][j]['stroke_style']);
			mark.classList.add(config['series'][j]['fill_style']);
			mark.setAttribute('cx','50%');
			mark.setAttribute('cy','50%');
			mark.setAttribute('r','5px');
			symbol.appendChild(mark);
			entry.appendChild(symbol);
			let text=document.createElement('span');
			text.textContent=config['series'][j]['name'];
			entry.appendChild(text);
			legend.appendChild(entry);
		}
		div.appendChild(legend);
	}
	// Create the SVG chart
	let svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
	div.appendChild(svg);
	svg.style.width=config['size'][0];
	svg.style.height=config['size'][1];
	svg.setAttribute('preserveAspectRatio','xMidYMid');
	svg.setAttribute('viewBox','0 0 '+config['viewbox'][0]+' '+config['viewbox'][1]);
	svg.style.flex='auto';
	// Calculates the range of data for the x- and y- axis
	let range=[new Date("2050-01-01"),20000,new Date("1900-01-01"),0];
	for (let j=0;j<config['series'].length;++j) {
		for (let val of values[j]) {
			if (val[0]<range[0]) range[0]=val[0];
			if (val[0]>range[2]) range[2]=val[0];
			if (val[1]<range[1]) range[1]=val[1];
			if (val[1]>range[3]) range[3]=val[1];
		}
	}
	if (range[1]>=range[3]) {
		range[3]=range[1]+0.1;
		range[1]=range[3]-0.2;
	}
	// Calculate reasonable intervals between x- and y-ticks to make them fall on "round" numbers, adjust ranges if needed
	let pow=Math.floor(Math.log10(range[3]-range[1]));
	let ytick=1;
	if (pow>0) {
		for (let i=0;i<pow;++i) ytick*=10;
	} else {
		for (let i=pow;i<0;++i) ytick/=10;
	}
	range[3]=(Math.floor(range[3]/ytick)+1)*ytick;
	range[1]=(Math.floor(range[1]/ytick))*ytick;
	let xtick=1;
	range[0]=new Date(range[0].getFullYear(),0,1);
	range[2]=new Date(range[2].getFullYear()+1,0,1);
	if (range[2]-range[0]<1000*3600*24*365.25*12) {
		xtick=1;
	} else {
		xtick=5;
	}
	// Draw the charts
	margins=[10,9,2,2];
	let transx=x => ((x-range[0])/(range[2]-range[0])*(100-margins[2]-margins[0])+margins[0]);
	let transy=y => (100-margins[1]-(y-range[1])/(range[3]-range[1])*(100-margins[3]-margins[1]));
	let transxa=x => transx(x)*config['viewbox'][0]/100;
	let transya=y => transy(y)*config['viewbox'][1]/100;
	let el=document.createElementNS("http://www.w3.org/2000/svg",'text');
	el.setAttribute('x','1%');
	el.setAttribute('y','50%');
	el.setAttribute('style','transform-origin: 1% 50%;transform: rotate(-90deg); text-anchor: middle; dominant-baseline: middle; font-size: 0.8em');
	el.textContent=config['ytitle'];
	svg.appendChild(el);
	for (let i=0;i<2;++i) {
		let line=document.createElementNS("http://www.w3.org/2000/svg",'line');
		let x=(i==0)?(margins[0]+"%"):(100-margins[2])+"%";
		line.setAttribute('x1',x);
		line.setAttribute('y1',margins[3]+'%');
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
		line.setAttribute('x2',(100-margins[2])+'%');
		line.setAttribute('y2',y);
		line.classList.add('stroke_d');
		svg.appendChild(line);
		let text=document.createElementNS("http://www.w3.org/2000/svg",'text');
		text.setAttribute('x',margins[0]-1.5+'%');
		text.setAttribute('y',y);
		text.setAttribute('style','text-anchor: end; dominant-baseline: middle; font-size: 0.8em');
		text.textContent=Number(i*config['ytickmultiplier']).toLocaleString('fr-FR',{maximumFractionDigits:3});
		svg.appendChild(text);
	}
	for (let j=0;j<config['series'].length;++j) {
		let pathd='M '+transxa(values[j][0][0])+','+transya(values[j][0][1]);
		let pathl=[0];
		let lx=0;
		let ly=0;
		for (let i=1;i<values[j].length;++i) {
			let x=transxa(values[j][i][0]);
			let y=transya(values[j][i][1])
			pathd+=' L '+x+','+y;
			pathl.push(pathl[pathl.length-1]+Math.sqrt((x-lx)*(x-lx)+(y-ly)*(y-ly)));
			lx=x;
			ly=y;
		}
		let path=document.createElementNS("http://www.w3.org/2000/svg",'path');
		path.setAttribute('d',pathd);
		path.classList.add('chart-line');
		path.classList.add(config['series'][j]['stroke_style']);
		path.setAttribute('stroke-dasharray',pathl[pathl.length-1]);
		path.setAttribute('stroke-dashoffset',pathl[pathl.length-1]);
		svg.appendChild(path);
		for (let i=0;i<values[j].length;++i) {
			let circle=document.createElementNS("http://www.w3.org/2000/svg",'circle');
			circle.style.animationDelay=3*pathl[i]/pathl[pathl.length-1]+'s';
			circle.classList.add('chart-marker');
			circle.setAttribute('cx',transx(values[j][i][0])+'%');
			circle.setAttribute('cy',transy(values[j][i][1])+'%');
			circle.setAttribute('r','6px');
			if (config['date_year_only']) {
				circle.dataset['date']=values[j][i][0].getFullYear();
			} else {
				circle.dataset['date']=values[j][i][0].toLocaleDateString('fr-FR');
			}
			circle.dataset['name']=config['series'][j]['name'];
			circle.dataset['value']=values[j][i][1].toLocaleString('fr-FR',{maximumFractionDigits:3});
			if (values[j][i].length>=3) circle.dataset['rem']=(([7,10].includes(values[j][i][2]))?'≤':'');
			circle.classList.add(config['series'][j]['fill_style']);
			circle.addEventListener('mouseenter',config['tooltip']['function']);
			circle.addEventListener('mouseleave',function(event) {
				let tooltip=event.target.parentNode.getElementById('svgtooltip');
				tooltip.parentNode.removeChild(tooltip);
			});
			svg.appendChild(circle);
		}
	}
	if (config['link_to_full'] || config['link_to_download']) {
		let linkp=document.createElement('p');
		if (config['link_to_full']) {
			linkp.appendChild(make_link_to_full_graph(draw_graph,values,config));
			if (config['link_to_download']) linkp.insertAdjacentHTML('beforeend',' - ');
		}
		if (config['link_to_download']) linkp.appendChild(make_link_to_download(values,config));
		div.appendChild(linkp);
	}
	return div;
}

function draw_graph_stations(feature,config) {
	// Create the title from the template
	let re=/\{([^}]*)\}/g;
	let titletemplate=config['titletemplate'];
	let titlehtml='';
	let pos=0;
	while ((match=re.exec(titletemplate))!=null) {
		titlehtml+=titletemplate.substring(pos,match.index)+feature.properties[match[1]];
		pos=match.index+match[0].length;
	}
	titlehtml+=titletemplate.substring(pos);
	config['title']=titlehtml;
	// Prepare the array of values
	let values=[];
	for (let j=0;j<config['series'].length;++j) {
		values[j]=[];
		for (let dat of feature.properties.data) if (!('id' in config['fieldmap']) || dat[config['fieldmap']['id'][0]]==config['series'][j]['id']) values[j].push([new Date(dat[config['fieldmap']['date'][0]]),dat[config['fieldmap']['value'][0]],('rem' in config['fieldmap'])?(dat[config['fieldmap']['rem'][0]]):0]);
	}
	config['feature']=feature;
	// Draw the graph
	return draw_graph(values,config);
}

function draw_graph_france(geojson,config) {
	// Prepare the array of values
	values=[];
	for (let j=0;j<config['series'].length;++j) {
		pvalues={};
		for (let feat of geojson['features'])
			for (let dat of feat['properties']['data'])
				if (!('id' in config['fieldmap']) || dat[1]==config['series'][j]['id']) {
					let year=dat[config['fieldmap']['date'][0]].substring(0,4);
					let val=0;
					if ('rem' in config['fieldmap'] && [7,10].includes(dat[config['fieldmap']['rem'][0]])) val=dat[config['fieldmap']['value'][0]]/2; else val=dat[config['fieldmap']['value'][0]];
					if (year in pvalues) {
						pvalues[year]=[pvalues[year][0]+val,pvalues[year][1]+1];
					} else {
						pvalues[year]=[val,1];
					}
				}
		values[j]=[];
		if (config['aggregate']=='mean') for (let year in pvalues) values[j].push([new Date(''+year),pvalues[year][0]/pvalues[year][1],0]);
		else for (let year in pvalues) values[j].push([new Date(''+year),pvalues[year][0],0]);
		values[j].sort((a,b)=>{return a[0]-b[0]});
	}
	// Draw the graph
	return draw_graph(values,config);
}

function draw_graph_france_bnvd() {
	let content=draw_graph_france(depjson,{
		'size':["100%","100%"],
		'viewbox':[document.documentElement.clientWidth*0.86,document.documentElement.clientHeight*0.86-140],
		'title':'Ventes de glyphosate en France',
		'series':[{"id":0,"stroke_style":"stroke_a","fill_style":"fill_a","name":"Glyphosate"}],
		'ytitle':'t de glyphosate vendues',
		'ytickmultiplier':0.001,
		'tooltip':{'function':(event)=>{make_tooltip_generic(event,{'template':'{date} : {value} t.','size':[180,23]});}},
		'date_year_only':true,
		'fieldmap':{'date':[0,'Année'],'value':[1,"Ventes (kg)"]},
		'aggregate':'sum',
		'link_to_full':false,
		'link_to_download':true
	});
	open_screen_popup(content);
}

function draw_graph_france_stations(i) {
	let content=draw_graph_france(stationjson[i],{
		'size':["100%","100%"],
		'viewbox':[document.documentElement.clientWidth*0.86,document.documentElement.clientHeight*0.86-140],
		'title':(i==0)?"Présence dans les cours d'eau français":"Présence dans les nappas françaises",
		'series':[{"id":1506,"stroke_style":"stroke_a","fill_style":"fill_a","name":"Glyphosate"},{"id":1907,"stroke_style":"stroke_b","fill_style":"fill_b","name":"AMPA"}],
		'ytitle':'µg/L',
		'ytickmultiplier':1,
		'tooltip':{'function':(event)=>{make_tooltip_generic(event,{'template':'{date} : {value} µg/L {name}','size':[220,23]})}},
		'date_year_only':true,
		'fieldmap':{'date':[0,'Date'],'id':[1,'CdParam'],'value':[2,"Résultat (µg/L)"],'rem':[3,'CdRemarque']},
		'aggregate':'mean',
		'link_to_full':false,
		'link_to_download':true
	});
	open_screen_popup(content);
}

/***********************
 *     Geocoding       *
 ***********************/
function on_geocoder_keydown(e) {
	let key=e.which || e.keyCode;
	let input=e.target;
	if (key==13) {
		let list=document.getElementById('geocoder').getElementsByClassName('autocomplete-items');
		if (list.length>0 && geocoder_index>=0) {
			let item=list[0].childNodes[geocoder_index];
			let evobj=document.createEvent('Events');
			evobj.initEvent('click',true,false);
			item.dispatchEvent(evobj);
			close_suggests();
		} else {
			let address=encodeURIComponent(input.value);
			let xhttp=new XMLHttpRequest();
			xhttp.open('POST','http://www.mapquestapi.com/geocoding/v1/address?key=685I9GsrmcJUheKtoaupOcjGKodCGGzr');
			xhttp.setRequestHeader('Content-Type','application/json');
			xhttp.onreadystatechange=function() {
				if (this.readyState==XMLHttpRequest.DONE && this.status==200) {
					let rep=JSON.parse(this.responseText);
					if (rep['results'].length==0 || rep['results'][0]['locations'].length==0) return;
					let coords=rep['results'][0]['locations'][0]['latLng'];
					map.setView(new L.LatLng(coords['lat'],coords['lng']),11.5);
				}
				close_suggests();
			}
			xhttp.send(JSON.stringify({'location':address,'options':{'maxResults':'1','thumbMaps':false,'boundingBox':{'ul':{'lng':-5,'lat':51.2},'lr':{'lng':9.8,'lat':41.311}}}}));
		}
	} else if (key==40 || key==38) {
		let list=document.getElementById('geocoder').getElementsByClassName('autocomplete-items');
		if (list.length>0) {
			if (geocoder_index>=0) list[0].childNodes[geocoder_index].classList.remove('active');
			if (key==40) {
				geocoder_index++;
				if (geocoder_index>=geocoder_number) geocoder_index=0;
			} else {
				geocoder_index--;
				if (geocoder_index<0) geocoder_index=geocoder_number-1;
			}
			list[0].childNodes[geocoder_index].classList.add('active');
		}
	}
}

function get_suggestions(text,num,resolve,reject) {
	let suggest=[];
	let re=RegExp(text,'i');
	for (let i=0;i<2;++i) if (stationjson[i]!==null) {
		for (let feat of stationjson[i]['features']) {
			let index=feat['properties']['nom'].search(re);
			if (index>=0) suggest.push({'name':feat['properties']['nom'],'coords':feat['geometry']['coordinates'],'index':index});
		}
	}
	let center=map.getCenter();
	suggest.sort(function(a,b){
		let ax=a['coords'][0]-center['lng'];
		let ay=a['coords'][1]-center['lat'];
		let bx=b['coords'][0]-center['lng'];
		let by=b['coords'][1]-center['lat'];
		return (ax*ax+ay+ay)-(bx*bx+by*by);
	});
	if (suggest.length>num) suggest=suggest.slice(0,5);
	if (suggest.length<num) {
		let address=encodeURIComponent(text);
		let xhttp=new XMLHttpRequest();
		xhttp.open('POST','http://www.mapquestapi.com/geocoding/v1/address?key=685I9GsrmcJUheKtoaupOcjGKodCGGzr');
		xhttp.setRequestHeader('Content-Type','application/json');
		xhttp.onreadystatechange=function() {
			if (this.readyState==XMLHttpRequest.DONE && this.status==200) {
				let rep=JSON.parse(this.responseText);
				if (rep['results'].length>0) for (let loc of rep['results'][0]['locations']) if (loc['adminArea1']=='FR') {
					let name='';
					if (loc['street']!='') name+=loc['street']+', ';
					if (loc['postalCode']!='') name+=loc['postalCode']+' ';
					name+=loc['adminArea5'];
					if (loc['adminArea4']!='' || loc['adminArea3']!='') {
						name+=', ';
						if (loc['adminArea4']!='') name+=loc['adminArea4']; else name+=loc['adminArea3'];
					}
					let index=name.search(re);
					let nsug={'name':name,'coords':[loc['latLng']['lng'],loc['latLng']['lat']]};
					if (index>=0) nsug['index']=index;
					suggest.push(nsug);
				}
				resolve(suggest);
			}
		}
		xhttp.send(JSON.stringify({'location':address,'options':{'maxResults':num-suggest.length,'thumbMaps':false,'boundingBox':{'ul':{'lng':-5,'lat':51.2},'lr':{'lng':9.8,'lat':41.311}}}}));
	} else resolve(suggest);
}

function close_suggests() {
	let geocoder=document.getElementById('geocoder');
	let list=geocoder.getElementsByClassName('autocomplete-items');
	Array.from(list).forEach(function(div){div.parentNode.removeChild(div)});
	geocoder_index=-1;
}

function on_geocoder_input(e) {
	let text=e.target.value;
	let geocoder=document.getElementById('geocoder');
	let list=geocoder.getElementsByClassName('autocomplete-items');
	if (text.length<=3) {
		Array.from(list).forEach(function(div){div.parentNode.removeChild(div)});
		return;
	}
	let suggestp=new Promise((resolve,reject)=>{get_suggestions(text,geocoder_number,resolve,reject);});
	suggestp.then(function(suggest) {
		Array.from(list).forEach(function(div){div.parentNode.removeChild(div)});
		let div=document.createElement('div');
		geocoder.appendChild(div);
		div.classList.add('autocomplete-items');
		for (item of suggest) {
			let divit=document.createElement('div');
			if (item['index']!==null && item['index']>=0) divit.innerHTML=item['name'].substring(0,item['index'])+'<strong>'+item['name'].substring(item['index'],item['index']+text.length)+'</strong>'+item['name'].substring(item['index']+text.length);
				else divit.innerHTML=item['name'];
			divit.dataset['lng']=item['coords'][0];
			divit.dataset['lat']=item['coords'][1];
			divit.setAttribute('title',item['name']);
			div.appendChild(divit);
			divit.addEventListener('click',function(e) {
				let item=e.target;
				map.setView(new L.LatLng(item.dataset['lat'],item.dataset['lng']),11.5);
				close_suggests();
			},{capture:true});
		}
	});
}

/***********************
 *    Main program     *
 ***********************/
// Perform some actions to prepare the page
let ylist=document.getElementById('years');
for (let i=2008;i<=2017;++i) {
	let opt=document.createElement('option');
	opt.setAttribute('value',i);
	opt.setAttribute('label',i);
	opt.textContent=i;
	ylist.appendChild(opt);
}
// Global variables
let depjson=null;
let bnvd=null;
let carthage=null;
let stationjson=[null,null];
let stationlayerparams=[{'file':'stations_esu.json','name':'Rivières'},{'file':'stations_eso.json','name':'Eaux souterraines'}];
let stationlayer=[null,null];
let layerscontrol=null;
let baselayers=null;
let overlays=null;
let loadedbounds=null;
let lastzoom=5.5;
// Create Leaflet map and base layer
let map=L.map('map', {zoomSnap:0});
//let base= L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',maxZoom: 8});
//let base= L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC', maxZoom: 16 })
//let base = new L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community' });
//let base = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 2, maxZoom: 12, attribution: 'Données © Contributeurs <a href="http://openstreetmap.org">OpenStreetMap</a>'});
let base= L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {maxZoom: 20,attribution: '&copy; Openstreetmap France | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' });
//let labels= L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.{ext}', {attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', pane: 'labels', subdomains: 'abcd', minZoom: 0, maxZoom: 20, ext: 'png' });
map.setView(new L.LatLng(46.1,2.5),lastzoom);
// Create a pane to display tile layers above the surface layers
map.createPane('labels');
map.getPane('labels').style.zIndex=500;
map.getPane('labels').style.pointerEvents='none';
map.addLayer(base);
// Create a geocoding control
let geocoder=document.getElementById('geocoder').getElementsByTagName('input')[0];
geocoder.addEventListener('keydown',on_geocoder_keydown);
geocoder.addEventListener('input',on_geocoder_input);
document.addEventListener('click',(e) => close_suggests());
//geocoder.addEventListener('focusout',on_geocoder_focusout);
let geocoder_index=-1;
const geocoder_number=5;
// Update layers when the user changes the zoom level
map.on('zoomend',function() {
	let zoom=map.getZoom();
	for (let i=0;i<2;++i) {
		if (zoom>9 && lastzoom<=9) {
			if (!map.hasLayer(carthage)) map.addLayer(carthage);
			let param=(i==0)?get_selected_param('radioparam'):get_selected_param('radioparameso');
			update_stations(stationjson,i,document.getElementById('year').value,param,true)
		} else if (zoom<=9 && lastzoom>9) {
			if (map.hasLayer(stationlayer[i])) map.removeLayer(stationlayer[i]);
		}
	}
	lastzoom=zoom;
});
// Load neighbouring features when the user moves on the map
map.on('moveend',function() {
	let zoom=map.getZoom();
	if (zoom<=9) return;
	if (!loadedbounds.contains(map.getBounds())) {
		for (let i=0;i<2;++i) {
			let param=(i==0)?get_selected_param('radioparam'):get_selected_param('radioparameso');
			update_stations(stationjson,i,document.getElementById('year').value,param,true)
			delete overlays[stationlayerparams[i]];
		}
		map.removeControl(layerscontrol);
		layerscontrol=L.control.layers(baselayers,overlays);
		layerscontrol.addTo(map);
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
				layer.bindPopup("Chargement...",{maxWidth:400});
				layer.on('click',function(e) {
					var popup=e.target.getPopup();
					popup.setContent(draw_graph_stations(feature,{
						'size':["400px","150px"],
						'viewbox':[400,150],
						'titletemplate':'{nom}',
						'series':[{"id":0,"stroke_style":"stroke_a","fill_style":"fill_a","name":"Glyphosate"}],
						'ytitle':'t de glyphosate vendues',
						'ytickmultiplier':0.001,
						'tooltip':{'function':(event)=>{make_tooltip_generic(event,{'template':'{date} : {value} kg.','size':[180,23]});}},
						'date_year_only':true,
						'fieldmap':{'date':[0,'Année'],'value':[1,"Ventes (kg)"]},
						'link_to_full':true,
						'link_to_download':true
					}));
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
	carthage=L.tileLayer.wms('http://services.sandre.eaufrance.fr/geo/eth_FXX?',{layers:'CoursEau',format:'image/png',transparent:true,pane:'labels',attribution:'<a href="http://www.sandre.eaufrance.fr/atlas/srv/fre/catalog.search#/metadata/0a0977fa-746b-441d-b4c1-4bf5e36998b0">BD Carthage</a>'});
	let layerpromises=[];
	baselayers={"OpenStreetMap":base};
	overlays=[];
	overlays["Ventes"]=bnvd;
	overlays["Cours d'eau"]=carthage;
	for (let i=0;i<stationlayerparams.length;++i) {
		layerpromises.push(new Promise(function(resolve,reject) {
			let xhttp=new XMLHttpRequest();
			xhttp.open('GET',stationlayerparams[i]['file'],true);
			xhttp.onreadystatechange=function() {
				if (this.readyState==XMLHttpRequest.DONE && this.status==200) {
					stationjson[i]=JSON.parse(this.responseText);
					resolve();
				}
			}
			xhttp.send();
		}));
	}
	Promise.all(layerpromises).then(function() {
		layerscontrol=L.control.layers(baselayers,overlays);
		layerscontrol.addTo(map);
	});
});
