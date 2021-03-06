import choroplethColors from '../util/colors.js';
import { loadOptionalConfigAndSettings } from './components/settings/settings.js';
// import { loadMap, updateMapData } from './components/mapview/map.js';
import { loadMap, updateMapData, configureSlider, displayPropertyTitle } from '../components/mapview/map.js';

import "bootstrap/js/dist/util";
import "bootstrap/js/dist/modal";
import "bootstrap/js/dist/button";
import "bootstrap/js/dist/alert";
import "bootstrap/js/dist/collapse";
import "bootstrap/js/dist/dropdown";

import '../style/index.scss';
import '../../node_modules/leaflet/dist/leaflet.css';

var throttled = false;
var delay = 250;
// var lat = 52.0024612;
// var lng = 4.3668409;
// var zoom_level = 3;

$(".mapInfo").css("display","none");

document.addEventListener('DOMContentLoaded', () => {

  loadMap(config.latProperty, config.lngProperty, config.zoomProperty);
  // loadMap(lat,lng,zoom_level);
  loadOptionalConfigAndSettings();
  configureSlider();

  var slider = document.getElementById("the-slider");
  slider.oninput = function() {
      config.currentIndex = config.timeSeries.indexOf(this.value);
      $('#current-time-val').html(this.value);
      updateMapData(true);
  };

});

window.addEventListener('resize', function() {
  if (!throttled) {
    configureSlider();
    displayPropertyTitle();

    throttled = true;
    setTimeout(function() {
      throttled = false;
    }, delay);
  }
});
