import { vLink } from "./vlink.vue.js";

let bookView = {
  data: function() {
    return {
      book: this.$root.collection.find(e => e.id == this.id),
      zoom: false,
      summaryShown: 0,
      contributors: this.$root.authors.findByContributions(this.id),
      maxImg: {}
    }
  },
  components: {
    "v-link": vLink
  },
  methods: {
    getRole(contributor) {
      return this.$root.authors
        .getRole(contributor.contributions.find(e => e.bookId == this.id).role);
    },
    renderHTML (string) {
      let p = document.createElement("p");
      p.innerHTML = string;
      let output = p.innerText;
      p.remove();
      return output;
    },
    changeSummary() {
      this.summaryShown = (this.summaryShown+1)%this.book.summary.length
    },
    enlarge(e) {
      if (this.zoom) {
        this.zoom = false;
      } else {
        if (e.target.id == "thumbnail") {
        this.zoom = true;          
        }
      }
    },
    getTagClass() {
      let colors = ["primary", "secondary", "success", "danger", "info", "warning","dark"];
      return "mx-2 my-1 btn btn-outline-"
        +colors[Math.floor(Math.random()*colors.length)];
    },
    getLinkData(url) {
      return [
        {
          name:"Babelio",
          classes:"card-link btn mx-1 btn-warning",
          url:"babelio.com"
        },
        {
          name:"la BnF",
          classes:"card-link btn mx-1 btn-info",
          url:"catalogue.bnf.fr"
        }
      ].find(link => url.includes(link.url));
    },
    getImageSize() {
      let img = document.querySelector("#thumbnail");
      if (window.innerHeight*0.8*(img.naturalWidth/img.naturalHeight) >= window.innerWidth) {
        this.maxImg = { width: "80vw" };
      } else {
        this.maxImg = { height: "80vh" };
      } 
    },
    getClass(element) {
      let classes;
      if (this.zoom) {
        classes = {
          imgContainer: "img-container",
          content: "card d-md-flex flex-md-row m-3 blur"
        };
      } else {
        classes = {
          imgContainer: "d-none",
          content: "card d-md-flex flex-md-row m-3",
        };
      }
      return classes[element];
    }
  },
  mounted: function() {
    window.document.title = this.$root.appName+" - "+this.book.title;
    this.getImageSize();
  },
  props: ["id"],
  template: `
  <section v-on:click="enlarge" v-bind:class="getClass('section')">
    <article v-bind:class="getClass('imgContainer')">
      <div class="img-thumbnail p-3 mx-auto">
        <img
          v-if="typeof book.cover !== 'undefined'"
          v-bind:src="book.cover"
          class="rounded"
          v-bind:style="maxImg">
      </div>
    </article>
    <article v-bind:class="getClass('content')">
      <img
        class="rounded col-md-3 col-lg-2 col-xl-1 p-0"
        v-if="typeof book.cover !== 'undefined'"
        v-bind:src="book.cover"
        id="thumbnail" style="cursor: zoom-in;">
      <div class="col-md-9 col-lg-10 col-xl-11 p-0">
        <h3 class="card-header text-secondary">{{ book.title }}</h3>
        <h5 class="mt-4">
          <ul class="inline mb-0">
            <li v-for="(author,index) in book.authors.raw" v-bind:key="author">
              <v-link 
                v-bind:href="'author/'+author.replace(/ /g,'_')"
                v-bind:title="'Consulter la fiche de '+author">
                {{ author }}
              </v-link><span v-if="index+1 < book.authors.raw.length"> & </span>
            </li>
          </ul>
        </h5>
        <div class="card-body border-bottom">
          <button
            title="Afficher un autre résumé"
            class="mx-2 mb-2 mt-0 btn btn-outline-primary svg-btn float-right"
            v-on:click="changeSummary">
            <svg class="d-inline">
              <use xlink:href="/octicons-sprite/octicons-sprite.svg#sync-24"></use>
            </svg>
          </button>
          <p class="card-text">{{ renderHTML(book.summary[summaryShown]) }}</p>
        </div>
        <ul class="list-group list-group-flush">
          <li
            v-if="contributors.length > 0"
            class="list-group-item"><strong>Les auteurs :</strong></li>
          <li v-for="contributor in contributors" class="list-group-item pl-5">
              <v-link 
                v-bind:href="'author/'+contributor.preferredName.replace(/ /g,'_')"
                v-bind:title="'Consulter la fiche de '+contributor.preferredName">
                {{ contributor.preferredName }}
              </v-link><span class="text-secondary">({{ getRole(contributor) }})</span>
          </li>
          <li
            v-if="book.description.length > 0"
            class="list-group-item"><strong>Format :</strong>
              {{ book.description.join(", ") }}
          </li>
          <li
            v-if="book.pages.length > 0"
            class="list-group-item"><strong>Nombre de pages :</strong>
              {{ book.pages.sort((a,b) => b.length - a.length)[0] }}
          </li>
          <li
            v-if="book.publisher.name.length > 0"
            class="list-group-item"><strong>Éditeur :</strong>
              <v-link 
                v-bind:href="'publisher/'+book.publisher.name.replace(/ /g,'_')"
                v-bind:title="'Consulter la fiche éditeur '+book.publisher.name">
                {{ book.publisher.name }}
              </v-link>
          </li>
          <li
            v-if="book.collection.length > 0"
            class="list-group-item"><strong>Collection :</strong>
              {{ book.collection.sort((a,b) => a.length - b.length)[0] }}
          </li>
          <li
            v-if="book.price.length > 0"
            class="list-group-item"><strong>Prix :</strong>
              {{ book.price[0] }}
          </li>
          <li
            v-if="book.tags.length > 0"
            class="list-group-item"><strong>Mots-clés :</strong>
              <ul class="d-inline inline p-0">
                <li v-for="tag in book.tags">
                  <v-link
                    v-bind:href="'tag/'+tag.replace(/ /g,'_')"
                    v-bind:title="'Consulter les livres associés à ce mot-clé : '+tag"
                    v-bind:class="getTagClass()">
                    {{ tag }}
                  </v-link>
                </li>
              </ul>
          </li>
          <li
            v-if="book.links.length > 0"
            class="list-group-item"><strong>En savoir plus :</strong>
                <a
                  v-for="link in book.links"
                  v-bind:href="link"
                  v-bind:title="'En savoir plus sur le site '+getLinkData(link).name"
                  v-bind:class="getLinkData(link).classes"
                  role="button" target="_blank">
                  {{ getLinkData(link).name }}
                </a>
          </li>
        </ul>
      </div>
    </article>
  </section>`
};
export { bookView }
