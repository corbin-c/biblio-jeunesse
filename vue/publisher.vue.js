import { mainView } from "./main-view.vue.js";
function distance(s1, s2) {
    if (typeof(s1) !== "string" || typeof(s2) !== "string") {
        return 0;
    }

    if (s1.length === 0 || s2.length === 0) {
        return 0;
    }

    var matchWindow = (Math.floor(Math.max(s1.length, s2.length) / 2.0)) - 1;
    var matches1 = new Array(s1.length);
    var matches2 = new Array(s2.length);
    var m = 0; // number of matches
    var t = 0; // number of transpositions
    var i = 0; // index for string 1
    var k = 0; // index for string 2

    //debug helpers
    //console.log("s1: " + s1 + "; s2: " + s2);
    //console.log(" - matchWindow: " + matchWindow);

    for (i = 0; i < s1.length; i++) { // loop to find matched characters
        var start = Math.max(0, (i - matchWindow)); // use the higher of the window diff
        var end = Math.min((i + matchWindow + 1), s2.length); // use the min of the window and string 2 length

        for (k = start; k < end; k++) { // iterate second string index
            if (matches2[k]) { // if second string character already matched
                continue;
            }
            if (s1[i] !== s2[k]) { // characters don't match
                continue;
            }

            // assume match if the above 2 checks don't continue
            matches1[i] = true;
            matches2[k] = true;
            m++;
            break;
        }
    }

    // nothing matched
    if (m === 0) {
        return 0.0;
    }

    k = 0; // reset string 2 index
    for(i = 0; i < s1.length; i++) { // loop to find transpositions
        if (!matches1[i]) { // non-matching character
            continue;
        }
        while(!matches2[k]) { // move k index to the next match
            k++;
        }
        if (s1[i] !== s2[k]) { // if the characters don't match, increase transposition
          // HtD: t is always less than the number of matches m, because transpositions are a subset of matches
            t++;
        }
        k++; // iterate k index normally
    }

    // transpositions divided by 2
    t = t / 2.0;

    return ((m / s1.length) + (m / s2.length) + ((m - t) / m)) / 3.0; // HtD: therefore, m - t > 0, and m - t < m
    // HtD: => return value is between 0 and 1
}

// Computes the Winkler distance between two string -- intrepreted from:
// http://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
// s1 is the first string to compare
// s2 is the second string to compare
// dj is the Jaro Distance (if you've already computed it), leave blank and the method handles it
// ignoreCase: if true strings are first converted to lower case before comparison
function JaroWinklerDistance(s1, s2, dj, ignoreCase) {
    if (s1 === s2) {
        return 1;
    } else {
        if (ignoreCase) {
          s1 = s1.toLowerCase();
          s2 = s2.toLowerCase();
        }

        //console.log(news1);
        //console.log(news2);

        var jaro = (typeof(dj) === 'undefined') ? distance(s1, s2) : dj;
        var p = 0.1; // default scaling factor
        var l = 0 // length of the matching prefix
        while(s1[l] === s2[l] && l < 4) {
            l++;
        }

        // HtD: 1 - jaro >= 0
        return jaro + l * p * (1 - jaro);
    }
}
let publisherView = {
  data: function() {
    return {
    }
  },
  components: {
    "main-view": mainView,
  },
  computed: {
    //Discarded / too slow
    /*allPublisherNames () {
      return [... new Set(this.$root.collection
        .filter(e => 
          e.allPublishers.includes(decodeURI(this.name).replace(/\_/g," ")))
        .map(e => e.allPublishers)
        .flat())];
    },
    publications () {
      return this.$root.collection.filter(e => 
        e.allPublishers.some(name => this.allPublisherNames.includes(name)));
    },*/
    publisher () {
      let name = decodeURI(this.name)
        .replace(/\_/g," ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/(e|é)dit(ion|eur)(s*)(\s*)/gi, "")
        .replace(/(\s*)jeunesse(\s*)/gi, "")
        .replace(/(ed\.*|éd\.*)(\s*)/gi,"")
        .toLowerCase();
      let pub = { name: "", link: "", publications: [] };
      pub.publications = this.$root.collection.filter(e => {
        let allPubNames = e.allPublishers;
        return allPubNames.some(pubName => {
          let normalizedPubName = pubName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/(e|é)dit(ion|eur)(s*)(\s*)/gi, "")
            .replace(/(\s*)jeunesse(\s*)/gi, "")
            .replace(/(ed\.*|éd\.*)(\s*)/gi,"")
            .toLowerCase();
          return (JaroWinklerDistance(name,normalizedPubName) > 0.9);
        });
      });
      for (let e of pub.publications) {
        try {
          if ((e.publisher.name.length > 0) && (pub.name.length == 0)) {
            pub.name = e.publisher.name;
          }
          if ((e.publisher.babelioLink.length > 0) && (pub.link.length == 0)) {
            pub.link = e.publisher.babelioLink;
          }
        } catch {}
        if ((pub.name.length > 0) && (pub.link.length > 0)) {
          break;
        }
      }
      console.log(pub.publications.map(e => e.allPublishers));
      return pub;
    }
  },
  mounted: function() {
    window.document.title = this.$root.appName+" - "+this.publisher.name;
  },
  props: ["name"],
  template: `<article class="p-3">
    <h2 class="alert alert-primary mb-2 col-lg-5">{{publisher.name}}
    <a v-if="publisher.link.length > 0"
      v-bind:href="publisher.link"
      class="btn btn-warning mx-1 ml-5"
      title="Voir la fiche de l'éditeur sur Babelio"
      role="button" target="_blank">
      Babelio
    </a>
    </h2>
    <main-view v-bind:selection="publisher.publications"></main-view>
  </article>
  `
};
export { publisherView }
