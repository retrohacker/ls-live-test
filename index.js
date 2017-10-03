/* Render the html and wire it up to the simulation and canvas */
var simulation = require('./simulation.js');
var renderGraph = require('./renderGraph.js')
var choo = require('choo')
var html = require('choo/html')
var app = choo()

// Create a renderCanvas event
app.state.events.RENDER_CANVAS = 'renderCanvas'
app.use(function (state, emitter) {
  emitter.on(state.events.RENDER_CANVAS, function () {
    renderGraph(state)
  });
})

var main = function main(state, emit) {
  state.pluginStates = []
  simulation.on('state', function (value) {
    state.pluginStates.push(value)
    emit(state.events.RENDER_CANVAS)
  })
  var limit = simulation.plugin.state.limit
  var max = simulation.plugin.state.max
  var interval = simulation.plugin.state.interval
  var halfLife = simulation.plugin.state.halfLife
  var window = renderGraph.timeWindow
  return html`
    <div>
      <canvas id="graph" style="
        border-left: 3px solid black;
        border-bottom: 3px solid black;
        width: 100%;
        height: 50%;">
      </canvas>
      <h3>Legend</h3>
      <div id="legend"></div>
      <h3>Config</h3>
      <div>limit (%): <input id="limit" type="text" value="${limit}"/></div>
      <div>max (%): <input id="max" type="text" value="${max}"/></div>
      <div>interval (ms): <input id="interval" type="text" value="${interval}"/></div>
      <div>halfLife (ms): <input id="halfLife" type="text" value="${halfLife}"/></div>
      <div>Graph Time Window (ms): <input id="window" type="text" value="${window}"/></div>
      <div>CPU Generator:
        min (%): <input id="rmin" type="text" value="0"/>
        max (%): <input id="rmax" type="text" value="1"/>
      </div>
      <div id="status" style="
        color: red;
      "></div>

      <h3>Description</h3>
      To change the simulation in realtime, update the values under config.<br><br>
      The configuration values are:
      <ul>
        <li>Limit: When load shedding will kick in</li>
        <li>Max: When load shedding will shed 100% of load</li>
        <li>Interval: How often to check the average CPU utilization</li>
        <li>HalfLife: <a href="http://github.com/reactivesocket/ewma">EWMA half life</a></li>
        <li>Graph time window: How many ms worth of data do you want to render?</li>
        <li>CPU Generator: We use Math.random() to immitate the check for average cpu utilization, this sets the lower and upper limit you would like the average cpu utilization to return. You can use this to simulate spikes in CPU.</li>
      </ul><br>
      The legend values are:
      <ul>
        <li>Limit: The value of the limit config at the time of the reading</li>
        <li>Max: The value of the max config value at the time of the reading</li>
        <li>CPU: The value from the CPU Generator</li>
        <li>EWMA: The EWMA updated with the new CPU value</li>
        <li>Reject: The % of traffic being rejected</li>
      </ul>
    </div>
  `
}

setInterval(update, 500)

function err(msg) {
  document.getElementById('status').innerText = msg || ""
}

function update() {
  var opts = {
    limit: Number(document.getElementById('limit').value),
    max: Number(document.getElementById('max').value),
    interval: Number(document.getElementById('interval').value),
    halfLife: Number(document.getElementById('halfLife').value),
  }
  if(opts.limit >= opts.max) {
    return err("Limit must be less than max")
  }
  if(Number.isNaN(opts.limit)) {
    return err("Limit must be a number")
  }
  if(Number.isNaN(opts.max)) {
    return err("Max must be a number")
  }
  if(Number.isNaN(opts.interval)) {
    return err("Interval must be a number")
  }
  if(Number.isNaN(opts.halfLife)) {
    return err("halfLife must be a number")
  }
  simulation.plugin.update(opts)
  var timeWindow = Number(document.getElementById('window').value)
  if(isNaN(timeWindow)) {
    return err("Window must be a number")
  }
  renderGraph.timeWindow = timeWindow
  var rmin = Number(document.getElementById('rmin').value)
  var rmax = Number(document.getElementById('rmax').value)
  if(isNaN(rmin)) {
    return err('Minimum random value must be a number')
  }
  if(isNaN(rmax)) {
    return err('Maximum random value must be a number')
  }
  if(rmin >= rmax) {
    return err('Minimum random value must be less than maximum')
  }
  simulation.randomMin = rmin
  simulation.randomMax = rmax
  var legend = document.getElementById('legend')
  legend.parentNode.replaceChild(html`
    <div id="legend">
      ${Object.keys(renderGraph.legend).map(function(name) {
        return renderLegend(name, renderGraph.legend[name])
      })}
    </div>
  `,legend)
  return err()
}

function renderLegend(name, color) {
  return html`
    <span style="
      border-left: 20px solid ${color};
      padding-left: 10px;
      margin: 10px;
    ">${name}</span>
  `
}

app.route('*', main)
app.mount('div')
