const fetch = require("node-fetch");
const cheerio = require("cheerio");
const FormData = require("form-data");
const Utils = require("./utils.js");

let decitre = {
  getFeatures: (e) => {
    let features = [
      "date",
      "présentation",
      "collection",
      "dimensions",
      "editeur",
      "format",
      "poids"
    ];
    let output = {}
    e = e("li.information").map((i,node) => {
      node = cheerio.load(node);
      let key = Utils.normalize(node(".name").text());
      let value = Utils.normalize(node(".value").text());
      let feature = features.find(f => key.toLowerCase().indexOf(f) >= 0);
      if (typeof feature !== "undefined") {
        output[feature] = value;
      }
    });
    return output;
  },
  enrichedData: {
    cover: (e) => e("picture.lozad").attr("data-iesrc"),
    extra_resume: (e) => Utils.normalize(e("#resume .content").text()),
  },
  getBook: async (ean) => {
    let html = await fetch("https://www.decitre.fr/livres/"+ean+".html");
    html = await html.text();
    html = cheerio.load(html);
    if (html("title").text() == "Whoops ! Page non trouvée...") {
      throw new Error("404");
    }
    return html;
  },
  enrich: async (ean) => { //update this
    // discard covers not found
    let book;
    let features;
    console.info("Requesting Decitre for EAN "+ean);
    try {
      book = await decitre.getBook(ean);
    } catch {
      return { featuresFound: 0 };
    }
    features = decitre.getFeatures(book);
    Object.keys(decitre.enrichedData).map(e => {
      try {
        let value = decitre.enrichedData[e](book);
        if ((typeof value !== "undefined") && (value.length > 0)) {
          features[e] = value;
        }
      } catch {}
    });
    features.featuresFound = Object.keys(features).length;
    return features;
  }
};

module.exports = decitre;
