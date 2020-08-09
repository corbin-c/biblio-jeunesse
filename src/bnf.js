const fetch = require("node-fetch");
const cheerio = require("cheerio");
const natural = require("natural");
const BASEURL = "https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&recordSchema=intermarcxchange&maximumRecords=20&query=";
const Utils = require("./utils.js");
const enrichedFunctions = {
  prix: (e) => BNF.getField(e,"020","d"),
  pages: (e) => BNF.getField(e,"280","a"),
  description_physique: (e) => [
        BNF.getField(e,"280","c"),
        BNF.getField(e,"280","d"),
  ].filter(d => d.length > 0),
  editeur: (e) => {
    let value = BNF.getField(e,"260","x");
    return [{name: (value != "") ? value:BNF.getField(e,"260","c")}];
  },
  extra_tags: (e) => BNF.getField(e,"689","q",true),
  extra_resume: (e) => [
    ...BNF.getField(e,"830","a",true),
    ...BNF.getField(e,"833","a",true)
  ],
  isbn: (e) => {
    let value = BNF.getField(e,"038","a");
    return (value != "") ? value:BNF.getField(e,"020","a").replace(/-/g,"");
  },
  collection: (e) => {
    let value = BNF.getField(e,"410","t");
    return (value != "") ? value:BNF.getField(e,"295","a");
  },
  enrichedAuthors: (e) => BNF.enrichAuthors(e),
  bnf_ark: (e) => BNF.getArk(e)
}
const BNF = {
  getSRU: async (url,start,results=[]) => {
    let sru = await fetch(new URL(url+"&startRecord="+start).href);
    sru = await sru.text();
    sru = cheerio.load(sru);
    sru("srw\\:records").find("srw\\:record").map((i,e) => {
      results.push(cheerio.load(e).html());
    });
    let next = sru("srw\\:nextRecordPosition").text();
    if (next !== "") {
      return BNF.getSRU(url,next,results);
    } else {
      return results;
    }
  },
  getField: (record,tag,code,all=false) => {
    record = cheerio.load(record);
    record = record("srw\\:recordData").find("mxc\\:datafield[tag="+tag+"]");
    record = record.find("mxc\\:subfield[code="+code+"]"); 
    if (all) {
      let output = [];
      record.map((i,e) => {
        output.push(cheerio.load(e).text());
      });
      return output;
    } else {
      return record.slice(0,1).text(); 
    }
  },
  enrichAuthors: (record) => {
    record = cheerio.load(record);
    let authors = [];
    [100,700].map(tag => {
      node = record("srw\\:recordData")
        .find("mxc\\:datafield[tag="+tag+"]")
        .map((i,e) => {
        e = cheerio.load(e);
          let author = {};
          author.first = e("mxc\\:subfield[code=m]").text();
          author.last = e("mxc\\:subfield[code=a]").text();
          author.isni = e("mxc\\:subfield[code=1]").text();
          author.role = e("mxc\\:subfield[code=4]").text();
          author.dates = e("mxc\\:subfield[code=d]").text();
          author.bnf_id = e("mxc\\:subfield[code=3]").text();
          authors.push(author);
        });
    });
    return authors;
  },
  getArk: (record) => {
    record = cheerio.load(record);
    return record("srw\\:recordData")
      .find("mxc\\:controlfield[tag=003]")
      .text();
  },
  getCover: async (ark,retry=0) => {
    await Utils.wait();
    try {
      let catalogue = await fetch(ark);
      catalogue = await catalogue.text();
      catalogue = cheerio.load(catalogue);
      return catalogue(".visuellarge").find("img").attr("src");
    } catch {
      console.warn("Retrying to get cover...");
      if (retry <= 3) {
        return BNF.getCover(ark,retry+1)
      } else {
        return "";
      }
    }
  },
  requester: async (auteurs,titre) => {
    await Utils.wait();
    let results = await BNF.getSRU(BASEURL
      +'bib.author all "'+auteurs.join(" ")+'" '
      +'and bib.title all "'+titre+'"',1);
    let count = 0;
    while ((results.length == 0)
      && (auteurs.length > 1)
      && (count < auteurs.length)) {
      console.warn("no result found... retrying with author '"
        +auteurs[count]+"' only");
      await Utils.wait();
      results = await BNF.getSRU(BASEURL
      +'bib.author all "'+auteurs[count]+'" '
      +'and bib.title all "'+titre+'"',1);
      count++;
    }
    if ((results.length == 0) && (titre.indexOf(" – ") >= 0)) {
      await Utils.wait();
      results = await BNF.getSRU(BASEURL
      +'bib.author all "'+auteurs[count]+'" '
      +'and bib.title all "'+titre.split(" – ")[0]+'"',1);
    }
    return results;
  },
  enrich: async (livre) => {
    console.info("Requesting BNF SRU for book "
      +livre.titre+" by "+livre.auteurs.join(" & "));
    let results = await BNF.requester(livre.auteurs,livre.titre);
    let enrichments = [];
    let enriched = {};
    if (results.length == 0) {
      console.error("No BNF record found");
    }
    for (let e of results) {
      let titre245 = BNF.getField(e,"245","a");
      if ((natural.JaroWinklerDistance(titre245,livre.titre) > 0.8)
      || (natural.JaroWinklerDistance(titre245+" "+BNF.getField(e,"245","e"),livre.titre) > 0.8)
      || (natural.JaroWinklerDistance(titre245+" "+BNF.getField(e,"245","f"),livre.titre) > 0.8)
      || results.length == 1) {
        let enrichedData = { featuresFound:0 };
        Object.keys(enrichedFunctions).map(key => {
          let value = enrichedFunctions[key](e);
          if (value.length > 0) {
            enrichedData[key] = value
            enrichedData.featuresFound += 
              (typeof value == "string") ? 1 : value.length;
          }
        });
        console.log("Analyzing record "+enrichedData.bnf_ark);
        cover = await BNF.getCover(enrichedData.bnf_ark);
        if (typeof cover !== "undefined")  {
          enrichedData.couverture = cover;
        }
        enrichments.push(enrichedData);
      }
    }
    if (enrichments.length > 0) {
      enriched = enrichments
        .filter(e => typeof e.couverture !== "undefined");
      if (enriched.length == 0) {
        enriched = enrichments;
      }
      enriched = enriched
        .sort((a,b) => b.featuresFound - a.featuresFound)[0];
      console.info(enriched.featuresFound+" enriched features found\n");
    } else {
      console.error("No enriched features found\n");
    }
    return enriched;
  }
}
module.exports = BNF;
