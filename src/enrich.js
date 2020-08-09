let data = require("./bdd.json");
const fs = require("fs");
const BNF = require("./bnf.js");
const Babelio = require("./babelio.js");
const GB = require("./googlebooks.js");
const decitre = require("./decitre.js");
const Utils = require("./utils.js");

/* SCRIPT FOR ENRICHING A NON-ENRICHED JSON BATCH OF BOOKS CONTAINING ONLY TITLES, AUTHORS & SUMMARYS */

require("./logger.js")(true);
let writeErrorLog = (livre) => {
  fs.writeFileSync("errors.log", fs.readFileSync("errors.log","utf8")+"\n"+
    livre.titre+"\t"+livre.auteurs.join(",")); 
}
let enrichments = {
  BNF,
  Babelio,
  decitre,
  GoogleBooks: GB
}
let enrich = async (livre) => {
  livre.enrichments = {};
  livre.enriched = false;
  await Promise.all(Object.keys(enrichments).map(async e => {
    if (e != "decitre") {
      let results = await enrichments[e].module.enrich(livre);
      livre.enrichments[e] = results;
      if (results.featuresFound > 0) {
        enrichments[e].success++;
        livre.enriched = true;
      }
    }
  }));
  if (livre.enriched) {
    let ean = (Object.keys(livre.enrichments)
      .find(e => typeof livre.enrichments[e].isbn !== "undefined"));
    if (typeof ean !== "undefined") {
      ean = (livre.enrichments[ean].isbn);
      livre.enrichments.decitre = await enrichments.decitre.module.enrich(ean);
      if (livre.enrichments.decitre.featuresFound > 0) {
        enrichments.decitre.success++;
      }
    }
  } else if (typeof livre.ean !== "undefined") {
      livre.enrichments.decitre = await enrichments.decitre.module.enrich(livre.ean);
      if (livre.enrichments.decitre.featuresFound > 0) {
        enrichments.decitre.success++;
        livre.enriched = true;
      }
  }
  return livre;
}
(async () => {
  Object.keys(enrichments).map(e => {
    enrichments[e] = { module:enrichments[e], success:0 };
  });
  //~ data = data.filter(e => e.titre.indexOf("Merci à tous") >= 0);
  let processing = 1;
  let success = 0;
  console.clear();
  for (let i of data) {
    i.titre = i.titre.replace(/’/g,"'");
    i.auteurs = i.auteurs.map(e => e.replace(/’/g,"'"));
    if (i.auteurs == ["Collectif"]) { i.auteurs = [] };
    i = await enrich(i);
    if (i.enriched) {
      success++;
    } else {
      writeErrorLog(i);
    }
    if (processing <= data.length) {
      console.clear();
    }
    await Utils.wait();
    console.info("# Books processed: "+processing+"/"+data.length+"... ("+Math.round(processing/data.length*100)+"%)");
    let info = Object.keys(enrichments).map(e => e+": "+enrichments[e].success).join(" | ");
    console.info("# Enrichments: "+info+" | "+success+" globally");
    info = Object.keys(enrichments).map(e => e+": "+Math.round(enrichments[e].success/processing*100)+"%").join(" | ");
    console.info("# Success rate: "+info+" | "+" globally: "+Math.round(success/processing*100)+"%");
    processing++;
  }
  fs.writeFileSync("output.json", JSON.stringify(data));
})();

