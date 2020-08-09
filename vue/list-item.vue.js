import { vLink } from "./vlink.vue.js";
let listItem = {
  data: function() {
    return {
    }
  },
  components: {
    "v-link": vLink
  },
  props: ["book","view","index"],
  methods: {
    showTile() {
      if (this.view == "grid") {
        if (this.$root.tileShown == this.book.id) {
          this.$root.$emit("tileClicked","");        
        } else {
          this.$root.$emit("tileClicked",this.book.id);
        }
      }
    },
    getViewClass(element) {
      let classes = {
        clicked: {
          container: "card col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 p-0",
          img: "d-none",
          content: "p-0",
          title: "card-header text-secondary",
          body: "card-body",
          authors: "inline p-0",
          summary: "",
          tags: "",
          link: "card-link btn btn-primary"
        },
        grid : {
          container: "col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2",
          img: "img-thumbnail",
          content: "d-none",
          title: "d-none",
          body: "d-none",
          authors: "d-none",
          summary: "d-none",
          tags: "d-none",
          link: "d-none"
        },
        list: {
          container: "card d-md-flex flex-md-row m-3",
          img: "rounded col-md-3 col-lg-2 col-xl-1 p-0",
          content: "col-md-9 col-lg-10 col-xl-11 p-0",
          title: "card-header text-secondary",
          body: "card-body",
          authors: "inline p-0",
          summary: "",
          tags: "",
          link: "card-link btn btn-primary"
        }
      }
      return ((this.view == "grid")
        && (this.book.id == this.$root.tileShown))
       ? classes["clicked"][element]
       : classes[this.view][element]
    }
  },
  template: `<li
    v-bind:class="getViewClass('container')"
    v-on:click="showTile(book.Id)">
  <img
    v-bind:class="getViewClass('img')"
    v-if="typeof book.cover !== 'undefined'"
    v-bind:src="book.cover">
  <div v-bind:class="getViewClass('content')">
  <h3 v-bind:class="getViewClass('title')">{{ book.title }}</h3>
  <div v-bind:class="getViewClass('body')">
  <ul v-bind:class="getViewClass('authors')">
    <li v-for="(author,index) in book.authors.raw" v-bind:key="author">
      <v-link 
        v-bind:href="'author/'+author.replace(/ /g,'_')"
        v-bind:title="'Consulter la fiche de '+author">
        {{ author }}
      </v-link><span v-if="index+1 < book.authors.raw.length"> & </span>
    </li>
  </ul>
  <p v-bind:class="getViewClass('summary')">{{ book.summary[0] }}</p>
  <v-link
    v-bind:class="getViewClass('link')"
    v-bind:title="'Consulter la fiche détaillée pour cet ouvrage'"
    v-bind:href="'book/'+book.id"
    role="button">
    Voir plus !
  </v-link>
  </div>
  </div>
  </li>`
};
/*
  template: `<li class="card d-flex flex-row m-3">
  <img
    class="rounded col-1 p-1"
    v-if="typeof book.cover !== 'undefined'"
    v-bind:src="book.cover">
  <div class="col-11">
*/
export { listItem }
