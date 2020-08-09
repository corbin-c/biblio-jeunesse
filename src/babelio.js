const fetch = require("node-fetch");
const cheerio = require("cheerio");
const natural = require("natural");
const FormData = require("form-data");
const Utils = require("./utils.js");

const enrichedFunctions = {
  couverture: (e) => Babelio.prependURL(e(".livre_con img").slice(0,1).attr("src")),
  extra_resume: async (e) => {
    let resume = e(".livre_resume");
    let more = resume.find("a").slice(-1);
    if (more.length == 0) {
      return Utils.winDecoder(Utils.normalize(resume.text()));
    } else {
      let params = more.attr("onclick");
      params = params.split("(")[1].split(")")[0].split(",");
      let form = new FormData();
      form.append("type",params[1]);
      form.append("id_obj",params[2]);
      await Utils.wait();
      let results = await fetch("https://www.babelio.com/aj_voir_plus_a.php", {
        method: "POST",
        body: form
      });
      results = Utils.normalize(await results.textConverted());
      return (results.length > resume.length) ? results : resume;
    }
  },
  enrichedAuthors: (e) => {
    let output = [];
    e(".livre_auteurs").map((i,node) => {
      node = cheerio(node,e);
      output.push({
        name: Utils.normalize(node.text()),
        role: "main_author",
        babelioLink: Babelio.prependURL(node.attr("href"))
      });
    });
    e(".livre_collabs").map((i,node) => {
      node = cheerio(node,e);
      let name = node.text();
      let role = node.find("span").text();
      name = Utils.normalize(name.slice(0,name.length-role.length));
      role = Utils.normalize(role.split("(")[1].split(")")[0]);
      output.push({
        name,
        role,
        babelioLink: Babelio.prependURL(node.attr("href"))
      });      
    }); 
    return output;
  },
  pages: (e) => {
    e = e(".livre_refs").html().split("<br>");
    return Utils.normalize(e
      .find(ligne => ligne.indexOf("page") > 0)
      .split("page")[0]);
  },
  isbn: (e) => {
    e = e(".livre_refs").html().split("<br>");
    return Utils.normalize(e
      .find(ligne => ["EAN","ISBN"].some(code => ligne.indexOf(code) >= 0))
      .split(":")[1]);
  },
  editeurName: (e) => Utils.normalize(e(".livre_refs a").text()),
  editeurLink: (e) => Babelio.prependURL(e(".livre_refs a").attr("href")),
  extra_tags: (e) => {
    let tags = [];
    e(".side_l_content .tags a").map((i,node) => {
      node = cheerio(node,e);
      tags.push(Utils.normalize(node.text()));
    });
    return tags;
  }
};
const Babelio = {
  prependURL: (string) => {
    return (string.slice(0,4) == "http")
      ?string
      :"https://www.babelio.com"+string;
  },
  requester: async (auteurs,titre,isbn="") => {
    await Utils.wait();
    let results;
    if (isbn.length > 0) {
      results = await Babelio.search(isbn);
      if (results.length == 0) {
        return Babelio.requester(auteurs,titre);
      }
    } else {
      results = await Babelio.search(titre+" "+auteurs.join(" "));
      let count = 0;
      while ((results.length == 0)
        && (auteurs.length > 1)
        && (count < auteurs.length)) {
        console.warn("no result found... retrying with author '"
          +auteurs[count]+"' only");
        await Utils.wait();
        results = await Babelio.search(titre+" "+auteurs[count]);
        count++;
      }
      if ((results.length == 0) && (titre.indexOf("&") >= 0)) {
        return Babelio.requester(auteurs,titre.replace(/&/g,""));
      }
    }
    return results;
  },
  search: async (string,retry=0) => {
    let url = "https://www.babelio.com/resrecherche.php?Recherche="
      +escape(string.replace(/œ/g,"oe").replace(/Œ/g,"OE"));
    let rows = [];
    let results;
    try {
      results = await fetch(url);
    } catch {
      if (retry <= 3) {
        await Utils.wait();
        return Babelio.search(string,retry++);
      } else {
        return [];
      }
    }
    results = await results.textConverted();
    results = cheerio.load(results);
    results = results(".side_l table").find("tr").map((i,e) => {
      rows.push(cheerio.load(e));
    });
    rows = rows.slice(1).map(e => {
      let jsonRow = {};
      jsonRow.title = Utils.normalize(e(".titre_livre a").slice(0,1).text());
      jsonRow.link = Babelio.prependURL(
        Utils.normalize(e(".titre_livre a").slice(0,1).attr("href")));
      return jsonRow;
    });
    return rows;
  },
  getBook: async (livre) => {
    console.info("Requesting Babelio for book "
      +livre.titre+" by "+livre.auteurs.join(" & "));
    let search = await Babelio.requester(livre.auteurs,livre.titre,(livre.isbn || ""))
    if (search.length == 0) {
      throw new Error("No record found");
    } else {
      if (typeof livre.isbn !== "undefined") {
        foundBook = search[0];
      } else {
        foundBook = Utils.findMoreSimilar(livre.titre,search,"title")[0];        
        delete foundBook.score;
      }
      return foundBook;
    }
  },
  enrich: async (livre) => {
    let record;
    try {
      record = await Babelio.getBook(livre);
    } catch (err) {
      console.error(err+"\n");
      return { featuresFound: 0 };
    }
    let enrichedData = { featuresFound:0 };
    console.log("Analyzing record "+record.link);
    enrichedData.babelioLink = record.link;
    record = await fetch(record.link);
    record = await record.textConverted();
    record = cheerio.load(record);
    await Promise.all(Object.keys(enrichedFunctions).map(async key => {
      let value;
      try {
        value = await enrichedFunctions[key](record);
      } catch {
        value = "";
      }
      if (value.length > 0) {
        enrichedData.featuresFound += 
          (typeof value == "string") ? 1 : value.length;
        enrichedData[key] = value;
      }
    }));
    if (typeof enrichedData.editeurName !== "undefined") {
      enrichedData.editeur = [ { name: enrichedData.editeurName } ];
      delete enrichedData.editeurName;
      if (typeof enrichedData.editeurLink !== "undefined") {
        enrichedData.editeur[0].babelioLink = enrichedData.editeurLink;
        delete enrichedData.editeurLink;
      }
    }
    console.info(enrichedData.featuresFound+" enriched features found\n");
    return enrichedData;
  }
};
module.exports = Babelio;
