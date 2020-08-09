import { intermarcRoles } from "./intermarcRoles.js";
const coverTypes = [
  {
    identity: "catalogue.bnf.fr/couverture",
    treatment: e => e
  },
  {
    identity: "products-images.di-static.com",
    treatment: e => { 
      let matches = e.match(/\d+-(\d+x\d+)/);
      if (matches !== null) {
        matches = matches[1];
        let size = parseInt(matches.split("x")[1]);
        if (size >= 500) {
          return e;
        } else {
          return e.split(matches)[0]+"475x500"+e.split(matches)[1];
        }
      } else {
        throw new Error("couldn't extract image size on url "+e);
      }
    }
  },
  {
    identity: "amazon.com/",
    treatment: e => {
      let matches = e.match(/_[A-z]+(\d+)_/);
      if (matches !== null) {
        matches = parseInt(matches[1]);
        if (matches >= 700) {
          return e;
        } else {
          return e.split(matches)[0]+"700"+e.split(matches)[1];
        }
      } else {
        throw new Error("couldn't extract image size on url "+e);
      }
    }
  },
];
let getBestCover = (covers) => {
  for (let i of coverTypes) {
    let type = covers.find(e => e.includes(i.identity));
    if (typeof type !== "undefined") {
      try {
        return i.treatment(type);
      } catch (e) {
        console.error(e);
        continue;
      }
    }
  }
  return covers[0];
}

let Authors = class {
  constructor(authors) {
    this.list = authors;
  }
  getRole(roleId) {
    return intermarcRoles[roleId];
  }
  getRoles(contributions) {
    return [...new Set(contributions.map(e => {
      if (!isNaN(parseInt(e.role))) {
        e.role = intermarcRoles[e.role];
      }
      return e.role;
    }))];
  } 
  findByName(string) {
    let normalizedA = string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return this.list
      .find(e => (
        (e.preferredName == string)
        || (e.preferredName == normalizedA)
        || e.otherNames.includes(string)
        || e.otherNames.includes(normalizedA)));
  }
  searchByName(string) {
    return this.list
      .filter(e => (
        (e.preferredName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(string))
        || e.otherNames.some(name => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(string))));
  }
  findByContributions(bookId) {
    return this.list
      .filter(e => e.contributions.some(c => c.bookId == bookId));
  }
}
let Book = class {
  constructor(biblioElement) {
    this.raw = biblioElement;
  }
  getFromRaw(...fields) {
    let out = [];
    fields.map(field => {
      if (typeof this.raw[field] !== "undefined") {
        out.push(this.raw[field]);
      }
      if (this.raw.enriched) {
        Object.keys(this.raw.enrichments).map(source => {
          if ((typeof this.raw.enrichments[source][field] !== "undefined")
            && (this.raw.enrichments[source][field] !== null)
            && (this.raw.enrichments[source][field].length > 0)) {
            out.push(this.raw.enrichments[source][field]);
          }
        });
      }
    });
    return [...new Set(out.flat())].flat();
  }
  get id() {
    return this.getFromRaw("id")[0];
  }
  get cover() {
    return getBestCover(this.getFromRaw("couverture","cover"));
  }
  get title() {
    return this.getFromRaw("titre")[0];
  }
  get links () {
    return this.getFromRaw("bnf_ark","babelioLink");
  }
  get authors() {
    let raw = this.getFromRaw("auteurs");
    let enriched = Authors.findByContributions(this.id);
    return {raw,enriched};
  }
  get allPublishers() {
    return this.getFromRaw("editeur").map(e => {
      try {
        return e.name;
      } catch {
        return e;
      }
    }).filter(e => typeof e !== "undefined")
  }
  get publisher() {
    let pub = this.getFromRaw("editeur");
    if (pub.length == 0) {
      return { name: "" }
    } else {
      if (pub.some(e => typeof e.babelioLink !== "undefined")) {
        return pub.find(e => typeof e.babelioLink !== "undefined");
      } else {
        if (typeof pub[0].name !== "undefined") {
          return pub[0];
        } else {
          return { name: pub[0] };
        }
      }
    }
  }
  get collection() {
    return this.getFromRaw("collection");
  }
  get summary() {
    return this.getFromRaw("resume","extra_resume").filter(e => e !== null);
  }
  get tags() {
    return [...Object.values(this.getFromRaw("tags")[0]),
      ...this.getFromRaw("extra_tags")];
  }
  get myTags() {
    return this.getFromRaw("tags");
  }
  get pages() {
    return this.getFromRaw("pages");
  }
  get description() {
    return this.getFromRaw("format","description_physique","presentation","poids","dimension");
  }
  get price() {
    return this.getFromRaw("prix");
  }
}
let Biblio = class {
  constructor(jsonFile) {
    this.isReady = {};
    this.ready = new Promise((resolve,reject) => { this.isReady = resolve; });
    this._raw = {};
    (async () => {
      let list = await fetch(jsonFile);
      list = await list.json();
      list.books = list.books.map(e => new Book(e));
      Authors = new Authors(list.authors);
      this.authors = Authors;
      this.isReady();
      this._raw = list;
    })();
  }
  get books() {
    return new Promise(async (resolve,reject) => {
      await this.ready;
      resolve(this._raw.books);
    });
  }
}
export { Biblio };
