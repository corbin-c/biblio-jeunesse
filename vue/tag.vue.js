import { mainView } from "./main-view.vue.js";
let tagView = {
  data: function() {
    return {
    }
  },
  components: {
    "main-view": mainView,
  },
  computed: {
    decodedTag() {
      return decodeURI(this.tag).replace(/\_/g," ");
    },
    tagged() {
      return this.$root.collection
        .filter(e =>
        (e.tags.includes(this.decodedTag)
        || e.tags.includes(this.decodedTag.toLowerCase())));
    }
  },
  mounted: function() {
    window.document.title = this.$root.appName+" - "+this.decodedTag;
  },
  props: ["tag"],
  template: `<article class="fluid-container p-3">
    <h2 class="alert alert-primary mb-2 col-lg-5">
      {{ decodedTag }}
    </h2>
    <main-view v-bind:selection="tagged"></main-view>
  </article>
  `
};
export { tagView }
