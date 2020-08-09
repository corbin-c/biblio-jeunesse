import { mainView } from "./main-view.vue.js";
import { vLink } from "./vlink.vue.js";
let authorView = {
  data: function() {
    return {
    }
  },
  components: {
    "main-view": mainView,
    "v-link": vLink
  },
  computed: {
    author () {
      return this.$root.authors
        .findByName(decodeURI(this.name).replace(/\_/g," "));
    },
    contributions () {
      return this.author.contributions
        .map(contrib => {
            return this.$root.collection.find(e => e.id == contrib.bookId);
        });
    },
    roles () {
      return this.$root.authors.getRoles(this.author.contributions)
    },
    contributors () {
      return [...new Set(this.contributions.map(e =>
        e.authors.enriched
          .filter(author => author.preferredName !== this.author.preferredName)
          .map(author => author.preferredName)
      ).flat())]
    },
    more () {
      let classes = " card-link btn mx-1"
      let sources = {
        BnFId: { name:"la BNF", url: "https://data.bnf.fr/fr/", classes: "btn-info"},
        babelioLink: { name: "Babelio", url: "", classes: "btn-warning" },
        isniId: { name: "ISNI", url: "http://isni.org/isni/", classes: "btn-secondary"}
      }
      return Object.keys(sources).map(source => {
        if (this.author[source].length > 0) {
          let more = sources[source];
          more.url += this.author[source];
          more.classes += classes;
          return more;
        }
      }).filter(e => typeof e !== "undefined");
    },
    publishers () {
      let publist = [];
      [...new Set(this.contributions.map(e => e.publisher.name))].map(e => {
        let normalized = e.replace(/(e|é)dit(ion|eur)(s*)(\s*)/gi, "")
          .replace(/(ed\.*|éd\.*)(\s*)/gi,"")
          .toLowerCase();
        if (!publist.some(pubName => pubName.toLowerCase().includes(normalized))) {
          publist.push(e);
        }
      });
      return publist;
    }
  },
  mounted: function() {
    window.document.title = this.$root.appName+" - "+this.author.preferredName;
  },
  props: ["name"],
  template: `<article class="fluid-container p-3">
    <details open class="card p-0 col-lg-5">
      <summary class="alert alert-primary mb-0 h2">{{ author.preferredName }}</summary>
      <ul class="list-group list-group-flush">
        <li
          v-if="author.otherNames.length > 0"
          class="list-group-item"><strong>Aussi connu sous le nom :</strong>
          <ul class="d-inline inline p-0">
            <li v-for="(name,index) in author.otherNames">
            {{ name }}<span v-if="index+1 < author.otherNames.length">, </span>
            </li>
          </ul>
        </li>
        <li class="list-group-item" v-if="contributors.length > 0">
        <strong>A travaillé avec :</strong>
          <ul class="d-inline inline p-0">
            <li v-for="(name,index) in contributors">
              <v-link 
                v-bind:href="'/biblio-jeunesse/vue/author/'+name.replace(/ /g,'_')">
                {{ name }}
              </v-link>
              <span v-if="index+1 < contributors.length">, </span>
            </li>
          </ul>
        </li>
        <li class="list-group-item" v-if="author.dates.length > 0">
        <strong>Dates :</strong>
        <span
          v-if="(author.dates.split('-..').length > 1 || author.dates.length == 4)">
          naissance en {{ author.dates.split("-")[0] }}
        </span>
        <span
          v-if="author.dates.split('-..').length == 1">
          {{ author.dates }}
        </span>
        </li>
        <li class="list-group-item" v-if="publishers.length > 0">
          <strong>Édité par :</strong>
          <ul class="d-inline inline p-0">
            <li v-for="(name,index) in publishers">
              <v-link 
                v-bind:href="'/biblio-jeunesse/vue/publisher/'+name.replace(/ /g,'_')">
                {{ name }}
              </v-link>
              <span v-if="index+1 < publishers.length">, </span>
            </li>
          </ul>          
        </li>
        <li class="list-group-item"><strong>Rôles :</strong>
          <ul class="d-inline inline p-0">
            <li v-for="(role,index) in roles">
            {{ role }}<span v-if="index+1 < roles.length">, </span>
            </li>
          </ul>
        </li>
        <li class="list-group-item" v-if="more.length > 0">
        <strong>En savoir plus :</strong>
          <ul class="d-inline inline p-0">
            <li v-for="(source,index) in more">
              <a v-bind:href="source.url"
                 v-bind:title="'En savoir plus sur cet auteur sur '+source.name"
                 v-bind:class="source.classes"
                 role="button"
                 target="_blank">
                {{ source.name }}
              </a>
            </li>
          </ul>    
        </li>
      </ul>
    </details>
    <main-view v-bind:selection="contributions"></main-view>
  </article>
  `
};
export { authorView }
