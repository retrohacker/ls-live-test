/* All logic for running the actual simulation */

// Allow us to wire up events from the simulation to the page (i.e. re-render
// on new data)
var simulation = new (require('events'))()
var pidusage = require('pidusage')
// Plugin will be used inside the stat function to update our knowledge of the
// process' state
var plugin = null
// Mock out the stat function so that we can control the values during the
// simulation
require('pidusage').stat = (pid, cb) => {
  var cpu = (random() * 100) | 0
  cb(null, { cpu: cpu })
  if(plugin) {
    state = plugin.state
    state.time = Date.now()
    simulation.emit('state', state)
  }
}
function random() {
  var delta = module.exports.randomMax - module.exports.randomMin
  return Math.random() * delta + module.exports.randomMin
}
// Kick off the simulation
var cpuUsageThrottle = require('restify/lib/plugins/cpuUsageThrottle')
plugin = cpuUsageThrottle({
  interval: 50,
  halfLife: 2000
})

module.exports = simulation
module.exports.plugin = plugin
module.exports.randomMin = 0
module.exports.randomMax = 1
