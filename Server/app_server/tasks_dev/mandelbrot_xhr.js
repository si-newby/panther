const p = require('../tasks_dev/panther.new');

let panther = new p.PantherXHR();

const mandelIter = function(cx, cy, maxIter)
{

  let x = 0.0;
  let y = 0.0;
  let xx = 0;
  let yy = 0;
  let xy = 0;
 
  let i = maxIter;
  while (i-- && xx + yy <= 4) {
    xy = x * y;
    xx = x * x;
    yy = y * y;
    x = xx - yy + cx;
    y = xy + xy + cy;
  }
  return maxIter - i;

};

const mandelbrot = function(task)
{   
    for(; task.ix < task.width; ++task.ix) {
     for(; task.iy < task.height; ++task.iy) {
        
        var x = task.xmin + (task.xmax - task.xmin) * task.ix / (task.width - 1);
        var y = task.ymin + (task.ymax - task.ymin) * task.iy / (task.height - 1);
        var i = mandelIter(x, y, task.iterations);
        var ppos = 4 * (task.width * task.iy + task.ix);
   
        if (i > task.iterations) {
            task.pix[ppos] = 0;
            task.pix[ppos + 1] = 0;
            task.pix[ppos + 2] = 0;
        } else {
          var c = 3 * Math.log(i) / Math.log(task.iterations - 1.0);
   
          if (c < 1) {
            task.pix[ppos] = 255 * c;
            task.pix[ppos + 1] = 0;
            task.pix[ppos + 2] = 0;
          }
          else if ( c < 2 ) {
            task.pix[ppos] = 255;
            task.pix[ppos + 1] = 255 * (c - 1);
            task.pix[ppos + 2] = 0;
          } else {
            task.pix[ppos] = 255;
            task.pix[ppos + 1] = 255;
            task.pix[ppos + 2] = 255 * (c - 2);
          }
        }
        task.pix[ppos + 3] = 255;
      
      }

      task.iy = 0;
    }

    postMessage(['mandelbrot', panther.SessionID, panther.TaskID, panther.TaskNumber, task.width, task.height, task.pix]);

};

panther.SessionURL = "http://www.wbpfserv.xyz/task/session";
panther.GetURL = "http://www.wbpfserv.xyz/task/get";
panther.PostURL = "http://www.wbpfserv.xyz/task/post";
panther.ReceiveTaskFunction = mandelbrot; 
panther.Begin();