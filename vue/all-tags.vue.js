import { vLink } from "/biblio-jeunesse/vue/vlink.vue.js";
import { excludedTags } from "/biblio-jeunesse/vue/excluded-tags.js";
const maxSizes = 12;
const maxScale = 3;
let allTags = {
  data: function() {
    let tags = [];
    this.$root.collection.map(e => {
      e.tags.map(tag => {
        let foundTag = tags.find(f => f.name.toLowerCase() == tag.toLowerCase());
        /*let foundTag = tags.find(f =>
          ((f.name.toLowerCase().includes(tag.toLowerCase()))
          || (tag.toLowerCase().includes(f.name.toLowerCase()))));*/
        if (typeof foundTag === "undefined") {
          tags.push({name:tag,count:1});
        } else {
          foundTag.count++;
        }
      });
    });
    tags = tags
      .filter(e => ((e.count > 9) && (!excludedTags.includes(e.name))))
    return {
      tags: tags.sort((a,b) => a.name.localeCompare(b.name)),
      sizes: []
    }
  },
  components: {
    "v-link": vLink
  },
  mounted: function() {
    window.document.title = this.$root.appName+" - Mots-clés";
    this.sizes = this.getSizes();
  },
  methods: {
    getSizes() {
      let sizes = [...(new Array(maxSizes)).fill([0,0])];
      let threshold = [...this.tags]
        .sort((a,b) => b.count-a.count)[0]
        .count/maxSizes;
      sizes = sizes.map((e,i) => 
        [Math.floor(threshold*i),Math.ceil(threshold*(i+1))]
      );
      return sizes;
    },
    getSize(count) {
      return this.sizes
        .indexOf(this.sizes
          .find(e => ((count >= e[0]) && (count <= e[1]))));
    },
    getClass() {
      let colors = ["primary", "secondary", "success", "danger", "info", "warning","dark"];
      return "mx-2 my-1 btn btn-"
        +colors[Math.floor(Math.random()*colors.length)];
    },
    getStyle(count) {
      let size = this.getSize(count);
      let style = { "font-size": ((maxScale/(maxSizes)*size)+1)+"em" };
      return style;
    }
  },
  template: `
  <section class="p-3">
    <ul class="inline p-0 d-flex flex-wrap justify-content-center align-items-center">
      <li v-for="tag in tags">
        <v-link
          v-bind:href="'tag/'+tag.name.replace(/ /g,'_')"
          v-bind:title="'Consulter les livres associés à ce mot-clé : '+tag.name"
          v-bind:class="getClass()"
          v-bind:style="getStyle(tag.count)">
          {{ tag.name }}
        </v-link>
      </li>
    </ul>
  </section>
  `
};
export { allTags }
