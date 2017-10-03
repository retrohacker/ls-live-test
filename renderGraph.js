/* All logic for rendering the graph to the canvas */
module.exports = require('lodash.throttle')(function (state) {
  var canvas = document.getElementById('graph')
  var w = canvas.width = canvas.scrollWidth
  var h = canvas.height = canvas.scrollHeight
  var ctx = canvas.getContext('2d')
  var data = convertOthers(convertTimes(state.pluginStates))
  if(data.length === 0) { return }
  // Update legend
  module.exports.legend = {}
  var keys = Object.keys(data[0])
  for(var i = 0; i < keys.length; i++) {
    var k = keys[i]
    if(module.exports.filter.indexOf(k) != -1) { continue }
    if(k === 'time') { continue }
    ctx.strokeStyle = module.exports.colors[i]
    module.exports.legend[k] = module.exports.colors[i]
    ctx.beginPath()
    for(var j = 0; j < data.length; j++) {
      var x = data[j]['time'] * w
      var y = (1 - data[j][k]) * h
      if(j === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}, 1000/30)

// Configuration
module.exports.filter = []
module.exports.colors = [
  'green',
  'blue',
  'gray',
  'red',
  'purple'
]
module.exports.legend = {}
module.exports.timeWindow = 30 * 1000 // Number of ms to view in the historical data

// Creates a copy of the pluginData array with
// 1) All timestamps converted to [0,1] based on where they are between
//    min/max time
// 2) All timestamps outside of min/max time are filtered out
// Only returns:
// limit, max, cpu, ewma, reject, time
function convertTimes(pluginData) {
  var now = Date.now()
  var then = now - module.exports.timeWindow
  return pluginData
    .filter((v) => v.time >= then && v.time <= now)
    .map(function(v) { return {
      limit: v.limit,
      max: v.max,
      cpu: v.cpu,
      ewma: v.ewma,
      reject: v.reject < 0 ? 0 : v.reject,
      time: (now - v.time) / module.exports.timeWindow
    }})
}

// This function converts all data points plotted against the y axis
function convertOthers(data) {
  // Get max value to plot
  var maxX = 0
  for(var i = 0; i < data.length; i++) {
    var d = data[i]
    if(d.limit > maxX) maxX = d.limit
    if(d.max > maxX) maxX = d.max
    if(d.cpu > maxX) maxX = d.cpu
    if(d.ewma > maxX) maxX = d.ewma
    if(d.reject > maxX) maxX = d.reject
  }
  // Convert all values to a [0,1] range
  for(var i = 0; i < data.length; i++) {
    var d = data[i]
    d.limit /= maxX
    d.max /= maxX
    d.cpu /= maxX
    d.ewma /= maxX
    d.reject /= maxX
  }
  return data
}
