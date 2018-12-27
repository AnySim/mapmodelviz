import * as util from '../../util/util.js';
import * as details from '../details/details.js';
import L from 'leaflet';
import 'leaflet-easyprint';
// import { basemapLayer } from 'esri-leaflet';

var geoJSONLayer,
  selectedFeature = null,
  legend = null;

function baseStyle(feature) {
  return {
    "color": "#000000",
    fillColor: "#ffffff",
    "weight": 2,
    "opacity": 0
  }
};

function choroStyle(feature) {
  var style = getFillColor(feature);

  return {
    fillColor: style.fillColor,
    weight: style.weight,
    opacity: style.opacity,
    color: '#000000',
    fillOpacity: style.fillOpacity
  };
};
var getFillColor = function(feature) {
  if (config.choropleth !== null && config.activePolicy !== null && config.activePolicy.data !== null) {
    var choroplethNum = -1;
    var id = feature.properties[config.geoAreaId];
    for (var key in config.activePolicy.data) {
      if (config.activePolicy.data[key][config.geoAreaId] == id) {
        choroplethNum = config.activePolicy.data[key]['choroplethNum'];
        break;
      }
    }

    // choroplethNum = choroplethNum ? choroplethNum : -1;
    if (choroplethNum == -1) {
      return {
        fillColor: "#ffffff",
        weight:0,
        opacity:0,
        fillOpacity: 0
      }
    } else {
      return {
        fillColor: config.choropleth[choroplethNum],
        opacity:1,
        weight:1,
        fillOpacity: 0.4
      };
    }
  } else {
    return {
      fillColor: "#ffffff",
      weight:1,
      opacity:1,
      fillOpacity: 0
    }
  }
};

var mouse_lat, mouse_lng, map_zoom, map_center;

export function loadMap(lat, lng, zoom) {
  // A new map here
  var map = L.map('map', {
    zoomSnap: 0.25
  }).setView([lat, lng], zoom);
  // basemapLayer("Gray").addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    // maxZoom: 18
  }).addTo(map);
  
	config.map = map;

  L.easyPrint({
  	title: 'Print Map',
  	// position: 'topleft',
  	sizeModes: ['Current', 'A4Portrait', 'A4Landscape'],
    exportOnly: true,
    filename: 'mapmodelviz_choroplethMap'
  }).addTo(map);

  
  map.addEventListener('click', function(ev) {
    mouse_lat = ev.latlng.lat;
    mouse_lat = mouse_lat.toFixed(7);
    mouse_lng = ev.latlng.lng;
    mouse_lng = mouse_lng.toFixed(7);
    map_zoom = map.getZoom();
    // map_center = map.getCenter();
    $(".mouseLat").text(mouse_lat);
    $(".mouseLng").text(mouse_lng);
    $(".mapZoom").text(map_zoom);
  });
  
  $(".mouseLat").text(lat.toFixed(7));
  $(".mouseLng").text(lng.toFixed(7));
  $(".mapZoom").text(zoom);
};

export function updateMap() {
  // Update map
  config.map.setView([config.activePolicy.mapSettings.lat, config.activePolicy.mapSettings.lng], config.activePolicy.mapSettings.zoom);

  var choropleth = findChoroplethNum(config.activePolicy.choroplethString);
  if(choropleth <= 1) {
    $("#run-playback").css("visibility","hidden");
    $("#current-time").css("visibility","hidden");
    $("#slider").css("visibility","hidden");
    $(".info").css("visibility","hidden");
  } else {
    $("#run-playback").css("visibility","visible");
    $("#current-time").css("visibility","visible");
    $("#slider").css("visibility","visible");
    $(".info").css("visibility","visible");
  }

  // basemapLayer("Gray").addTo(map);
  // config.map = map;

  // L.easyPrint({
  // 	title: 'Print Map',
  // 	// position: 'topleft',
  // 	sizeModes: ['Current', 'A4Portrait', 'A4Landscape'],
  //   exportOnly: true,
  //   filename: 'mapmodelviz_choroplethMap'
  // }).addTo(map);
};

export function updateMapData(throughPlayback=false) {
  var invalid = false;
  if (config.activePolicy.data === null) {
    invalid = true;
  } else {
    for (var key in config.activePolicy.data) {
      if (config.activePolicy.data[key][config.mappedProperty] === undefined) {
        util.displayMessage('Invalid mapped property specified, or not specified for all data elements. Data will not display properly.');
        invalid = true;
      }
      break;
    }
  }

  if (!invalid) {
    // ORDER MATTERS HERE!!
    if (throughPlayback == false) {
      util.findChoroplethMinMaxOverall();
      util.setChoroplethRanges();
    }
    util.setChoroplethBuckets();
    if (throughPlayback == false) {
      var choropleth = findChoroplethNum(config.activePolicy.choroplethString);
      if(choropleth > 1) {
        buildChoroplethLegend();
        displayPropertyTitle();
        configureSlider();
        configurePlayer();
      // } else {
      //   displayPropertyTitle();
      }
    }
    // if (throughPlayback == false) {
    //   buildChoroplethLegend();
    //   displayPropertyTitle();
    //   configureSlider();
    //   configurePlayer();
    // }
    updateSlider();
  }

  if (throughPlayback == false) {
    addGeoJSONLayer();
  } else {
    updateGeoJSONLayer();
  }
};

function highlightFeature(e) {
  var layer = e.target;

  if (layer.options.opacity > 0) {
    layer.setStyle({
      weight: 2,
      fillOpacity: 0.9
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }
};
function resetHighlight(e) {
  if (e.target !== selectedFeature) {
    geoJSONLayer.resetStyle(e.target);
  }
};
function selectFeature(e) {
  var layer = e.target;
  if (layer.options.opacity > 0) {

    if (layer === selectedFeature) {
      geoJSONLayer.resetStyle(e.target);
      selectedFeature = null;
      details.hideFeatureDetails();
    } else {
      if (selectedFeature !== null) {
        geoJSONLayer.resetStyle(selectedFeature)
      }
      layer.setStyle({
        weight: 2,
        fillOpacity: 0.9
      });
      selectedFeature = layer;
      details.showFeatureDetails(selectedFeature.feature);
    }

  }
};
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: selectFeature
  });
};

function updateGeoJSONLayer() {
  geoJSONLayer.setStyle(function(feature) {
      if (selectedFeature && feature == selectedFeature.feature) {
        style = choroStyle(feature);
        style.weight = 2;
        style.fillOpacity = 0.9;
        return style;
      }
      else {
        return choroStyle(feature);
      }
  });
  // config.map.fitBounds(geoJSONLayer.getBounds());
};

function getFeatureName() {
  var featureName = config.activePolicy.geoJSON.text;
  if (!featureName) {
    featureName = '';
  }
  return featureName
}
function tooltipFunc(layer) {
  var text = layer.feature.properties[getFeatureName()];
  if (text === undefined) {
    text = '';
  }
  return String(text);
};

export function addGeoJSONLayer() {
  if (config.activePolicy === null) {
    return;
  }

  if (geoJSONLayer) {
    config.map.removeLayer(geoJSONLayer);
  }

  geoJSONLayer = L.geoJSON(false, {
    style: choroStyle,
    onEachFeature: onEachFeature
  });

  var url = config.activePolicy.geoJSON.file.url;
  if (!url || url === '') {
    url = URL.createObjectURL(config.activePolicy.geoJSON.file);
  }
  $.getJSON(url, function(json) {
    // console.log('successfully loaded GeoJSON');
  })
  .done(function(json) {
    details.showJsonLoaded();
    geoJSONLayer.addData(json);
    try {
      var featureText = json['features'][0]['properties'][getFeatureName()]
      if (featureText) {
        geoJSONLayer.bindTooltip(tooltipFunc, {});
      }
    } catch(err){
      // geoJSONLayer.unbindTooltip();
    }
    config.map.addLayer(geoJSONLayer);
    // config.map.fitBounds(geoJSONLayer.getBounds());
    // map.setZoom(1);
    $('#loading-overlay').hide();
  }).fail(function(err) {
    console.error("Error rendering geojson map layer: " + err);
    $('#loading-overlay').hide();
  });
  // }

};

function buildNumString(num) {
  if (num > 10**12) {
    // num = util.numberWithCommas(Math.round(num/10**12)) + 't';
    num = util.numberWithCommas(Math.round(num));
  } else if (num > 10**9) {
    // num = util.numberWithCommas(Math.round(num/10**9)) + 'b';
    num = util.numberWithCommas(Math.round(num));
  } else if (num > 10**6) {
    // num = util.numberWithCommas(Math.round(num/10**6)) + 'm';
    num = util.numberWithCommas(Math.round(num));
  } else if (num > 10**3) {
    num = util.numberWithCommas(Math.round(num));
  } else if (num > 10) {
    num = util.numberWithCommas(Math.round(num * 100) / 100);
  } else if (num > 1) {
    num = util.numberWithCommas(Math.round(num * 100) / 100);
  } else {
    num = util.numberWithCommas(Math.round(num * 10000) / 10000);
  }
  return num
};

function buildChoroplethLegend() {
  if (legend !== null) {
    legend.remove();
  }

  if (config.activePolicy === null || config.activePolicy.choropleth === null) {
    return;
  }

  legend = L.control({
    position: 'bottomleft'
  });

  legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend');

    for (var i = 0; i < config.choropleth.length; i++) {
      var lower = config.choroplethRanges[i];
      var upper = config.choroplethRanges[i + 1];
      var lowerStr = lower.toExponential(2);
      var upperStr = upper.toExponential(2);

      if (upper > 10 && lower <=1) {
        lowerStr = util.numberWithCommas(Math.round(lower * 100) / 100);
      }
      div.innerHTML +=
        '<i style="background:' + config.choropleth[i] + '"></i> ' +
        lowerStr + ' to ' + upperStr + '<br>';
    }

    return div;
  };
  legend.addTo(config.map);
};

export function displayPropertyTitle() {
  showMapContent();

  var name = '';
  if (config === null || config.activePolicy === null || config.activePolicy.name === null) {
    name = '';
  } else {
    name = config.activePolicy.name;
  }

  var viewportWidth = $("[id=map-viewport]").width();
  var propTitle = $("#mapped-property-title");
  propTitle.css('width', viewportWidth - 50 * 2);
  propTitle.css('left', 50);
  propTitle.html('<h3>' + name + '</h3>');
  propTitle.show();
};

export function configureSlider() {

  if (config.timeSeries == null || config.timeSeries.length == 0) {
    return;
  }

  showMapContent();

  var slider = $("#slider");
  if (legend) {
    // var legendRight = parseInt($( ".legend" )[0].css('right').slice(0, -2));
    var thelegend = $( ".legend" );
    var legendWidth = thelegend.outerWidth();
    var viewportWidth = $("[id=map-viewport]").width();
    var sliderLeft = legendWidth + 15;
    var sliderWidth = viewportWidth - sliderLeft - 15;
    slider.css('width', sliderWidth + 'px');
    slider.css('left', sliderLeft + 'px');

    var currentTime = $("#current-time");
    var legendHeight = thelegend.outerHeight();
    currentTime.css('width', legendWidth);
    currentTime.css('left', thelegend.css('margin-left'));
    currentTime.css('bottom', legendHeight + 5 + 10 );
    currentTime.height('auto');
  } else {
    var currentTime = $("#current-time");
    // currentTime.css('width', 160);
    currentTime.css('width', 120);
    currentTime.css('left', 10);
    // currentTime.css('bottom', 10 + 2 + 10);
    currentTime.css('bottom', 54);
    currentTime.height('auto');

    var viewportWidth = $("[id=map-viewport]").width();
    var sliderLeft = 15
    var sliderWidth = viewportWidth - sliderLeft * 2;
    slider.css('width', sliderWidth + 'px');
    slider.css('left', sliderLeft + 'px');
  }

  var numPoints = config.timeSeries.length;
  var min = config.timeSeries[0];
  var max = config.timeSeries[numPoints-1];
  $("[id=the-slider]").attr('min', min);
  $("[id=the-slider]").attr('max', max);

  $("[id=slider]").show();
  $("#current-time").show();

};
export function updateSlider() {
  if ($("[id=slider]").is(":visible") ) {
    document.getElementById('the-slider').value = config.timeSeries[config.currentIndex]
    $('#current-time-val').html(config.timeSeries[config.currentIndex]);
    var thelegend = $( ".legend" );
    if(thelegend.length)
    {
      $("#playback-div").css('bottom', $( ".legend" ).outerHeight(true) + 5 + $("#current-time").outerHeight(true) + 5); // +10+2 is the padding and border for elements. +5 is margin between
    } else {
      $("#playback-div").css('bottom', 50 + 5 + $("#current-time").outerHeight(true) + 5); // +10+2 is the padding and border for elements. +5 is margin between
    }
  }
};

var currentlyPlaying = false;
var playerConfigured = false;
var timer = null;
function configurePlayer() {  
  if (playerConfigured) {
    if (currentlyPlaying) {
      clearInterval(timer);   // stop the animation by clearing the interval
      $('#run-playback').html('Play');   // change the button label to play
      currentlyPlaying = false;   // change the status again
    } else {
      var thelegend = $( ".legend" );
      if(thelegend.length)
      {
        var thelegend = $( ".legend" );
        var currentTime = $("#current-time");
        var playback = $("#playback-div");
        // console.log(currentTime.outerHeight(true))
        playback.css('width', thelegend.outerWidth());
        playback.css('left', thelegend.css('margin-left'));
        playback.css('bottom', thelegend.outerHeight(true) + 5 + currentTime.outerHeight(true) + 5); // +10+2 is the padding and border for elements. +5 is margin between
      } else {
        var currentTime = $("#current-time");
        var playback = $("#playback-div");
        // console.log(currentTime.outerWidth(true))
        playback.css('width', currentTime.outerWidth());
        playback.css('left', currentTime.css('left'));
        playback.css('bottom', 0 + 5 + currentTime.outerHeight(true) + 5); // +10+2 is the padding and border for elements. +5 is margin between
      }
      playback.show();
    }
  } else {
    showMapContent();

    var thelegend = $( ".legend" );
    if(thelegend.length)
    {
      var thelegend = $( ".legend" );
      var currentTime = $("#current-time");
      var playback = $("#playback-div");
      playback.css('width', thelegend.outerWidth());
      playback.css('left', thelegend.css('margin-left'));
      playback.css('bottom', thelegend.outerHeight(true) + 5 + currentTime.outerHeight(true) + 5); // +10+2 is the padding and border for elements. +5 is margin between
    } else {
      var currentTime = $("#current-time");
      var playback = $("#playback-div");
      playback.css('width', currentTime.outerWidth());
      playback.css('left', currentTime.css('left'));
      playback.css('bottom', 0 + 5 + currentTime.outerHeight(true) + 5); // +10+2 is the padding and border for elements. +5 is margin between
    }
    playback.show();

    $('#run-playback').on("click", function(event) {
      if (currentlyPlaying == false) {
        $("#show-settings").removeClass('active');
        $("#show-settings").addClass('disabled');
        // $("#the-slider").attr("disabled", true);

        timer = setInterval(function(){   // set a JS interval
          if(config.currentIndex < config.timeSeries.length - 1) {
            config.currentIndex +=1;  // increment the current attribute counter
          } else {
            config.currentIndex = 0;  // or reset it to zero
          }
          updateMapData(true);  // update the representation of the map
        }, config.playbackSpeed);

        $('#run-playback').text('Stop');  // change the button label to stop
        $('#run-playback').addClass('btn-dark');
        $('#run-playback').removeClass('btn-primary');
        currentlyPlaying = true;   // change the status of the animation
      } else {    // else if is currently playing
        clearInterval(timer);   // stop the animation by clearing the interval
        $('#run-playback').text('Play');   // change the button label to play
        $('#run-playback').removeClass('btn-dark');
        $('#run-playback').addClass('btn-primary');
        currentlyPlaying = false;   // change the status again

        // $("#the-slider").attr("disabled", false);
        $("#show-settings").addClass('active');
        $("#show-settings").removeClass('disabled');
      }
    });
    playerConfigured = true;
  }
};

var showMapContent = function(show=true) {
  var mapContent = $('.map-content');
  if (show) {
    mapContent.show();
  } else {
    mapContent.hide()
  }
}

var findChoroplethNum = function(choroplethString) {
  if (choroplethString && choroplethString != "") {
    var bracket = choroplethString.indexOf("[")
    var base = choroplethString.substring(0,bracket);
    var numColors = parseInt(choroplethString.substring(bracket+1, bracket+2));
    return numColors;
  }
  return 0;
}