let log = true;
let _console = {...console};
let colors = { info: 31, warn: 172, error: 124 };
["log","info","warn","error"].map(e => {
  console[e] = function(...args) {
    if (log) {
//      args.unshift((new Date()).toISOString()+" |");
      if (typeof colors[e] !== "undefined") {
        args[0] = "[38;5;"+colors[e]+"m"+args[0];
        args.push("[0m");
      }
      _console[e].apply(this,args);
    }
  };
});
module.exports = (bool) => {
  log = (bool === true)
};
