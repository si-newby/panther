const path = require('path');

module.exports = {
  entry: { 
    pi_ws: './app_server/tasks_dev/pi_ws.js',
    pi_xhr: './app_server/tasks_dev/pi_xhr.js',
    mandelbrot_ws: './app_server/tasks_dev/mandelbrot_ws.js',
    mandelbrot_xhr: './app_server/tasks_dev/mandelbrot_xhr.js',  },
  output: {
    path: path.resolve(__dirname, 'app_server', 'tasks'),
    filename: '[name].js' }
};
