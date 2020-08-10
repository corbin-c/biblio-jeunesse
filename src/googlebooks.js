const fetch = require("node-fetch");
const natural = require("natural");
const Utils = require("./utils.js");

let GB = {
  features: {
    extra_resume: (e) => {
      let out = [];
      let descriptions = [
        element => element.volumeInfo.description,
        element => element.searchInfo.textSnippet
      ]
      descriptions.map(d => {
        try {
          out.push(d(e));
        } catch {
        }        
      });
      return out;
    },
    pages: (e) => e.volumeInfo.pageCount,
    isbn: (e) => {
      e = e.volumeInfo.industryIdentifiers;
      return (e.find(e => e.type == "ISBN_13")
        || e.find(e => e.type == "EAN")
        || e.find(e => e.type == "ISBN_10")).identifier;
    },
    editeur: (e) => e.volumeInfo.publisher,
    date: (e) => e.volumeInfo.publishedDate,
    couverture: (e) => e.volumeInfo.imageLinks.thumbnail
  },
  search: async (titre,auteurs) => {
    let books = "https://www.googleapis.com/books/v1/volumes?printType=books&q="
    +"intitle:"+titre
    +"+inauthor:"+auteurs;
    books = await fetch(new URL(books).href);
    books = await books.json();
    return books;
  },
  requester: async (auteurs,titre) => {
    await Utils.wait();
    let results;
    results = await GB.search(titre,auteurs.join(" "));
    let count = 0;
    while ((results.totalItems == 0)
      && (auteurs.length > 1)
      && (count < auteurs.length)) {
      console.warn("no result found... retrying with author '"
        +auteurs[count]+"' only");
      await Utils.wait();
      results = await GB.search(titre,auteurs[count]);
      count++;
    }
    return (results.items || []);
  },
  enrich: async (livre) => {
    let enriched = { featuresFound: 0 };
    console.info("Requesting Google Books for book "
      +livre.titre+" by "+livre.auteurs.join(" & "));
    let books = await GB.requester(livre.auteurs,livre.titre);
    if (books.length == 0) {
      console.error("no book found");
      return enriched;
    }
    books = books.map(e => {
      e.title = e.volumeInfo.title;
      return e;
    });
    let book = Utils.findMoreSimilar(livre.titre,books,"title")[0];
    if (natural.JaroWinklerDistance(livre.titre,book.title) < 0.85) {
      console.error("no book found");
      return enriched;
    }
    Object.keys(GB.features).map(key => {
      let value;
      try {
        value = (GB.features[key](book) || "");
      } catch(e) {
        value = "";
      }
      if (value.length > 0) {
        enriched.featuresFound += 
          (typeof value == "string") ? 1 : value.length;
        enriched[key] = value;
      }
    });
    return enriched;
  }
}
module.exports = GB;
