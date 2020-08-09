const winChars = require("./winchars.js");
const DELAY = 500;
const natural = require("natural");
const Utils = {
  normalize: (text) => {
    text = text.replace(/(^\s+|\s+$)/g,"");
    text = text.replace(/\s{2,}/g," ");
    return text;
  },
  deltaLength: (text1,text2) => {
    return Math.abs((text1.length-text2.length)/text2.length);
  },
  findMoreSimilar: (needle,haystack,attribute,results=1) => {
    return haystack.map(e => {
      try {
        e.score = natural.JaroWinklerDistance(needle,e[attribute]);
        e.score -= Utils.deltaLength(needle,e[attribute]);
      } catch {
        e.score = 0;
      }
      return e;
    }).sort((a,b) => {return b.score - a.score}).slice(0,results);
  },
  wait: (t=DELAY) => {
    return new Promise((resolve,reject) => {
      setTimeout(() => { resolve(); },t);
    })
  },
  winDecoder: (string) => {
    Object.keys(winChars).map(e => {
      string = string.replace(new RegExp(e,"g"),winChars[e]);
    });
    return string;
  }
}
module.exports = Utils;
