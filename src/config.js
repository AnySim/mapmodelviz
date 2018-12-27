var modelConfig =  {
  modelName: '',
  allowFileUpload: true,

  jsonData: [],

  activePolicy: null,
  activePolicyName: '',
  geoAreaId: '',
  geoTextProperty: '',
  mappedProperty: '',
  timeSeries: [],
  currentIndex: 0,

  latProperty: 52.0024612,
  lngProperty: 4.3668409,
  zoomProperty: 2,

  choropleth: null,
  choroplethDetails: {
    min: -Infinity,
    max: Infinity
  },
  choroplethRanges: [],
  playbackSpeed: 1000,

  map: null
};

export default modelConfig;
