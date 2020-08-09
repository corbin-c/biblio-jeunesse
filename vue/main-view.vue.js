import { mainList } from "./list.vue.js";
import { toggleView } from "./toggle-view.vue.js";
const maxItemsOnPage = 16;
let mainView = {
  data: function() {
    return {
      collection: this.$root.collection,
      maxItems: maxItemsOnPage,
      currentView: (localStorage.getItem("preferredView") || "list")
    }
  },
  components: {
    "main-list": mainList,
    "toggle-view": toggleView
  },
  methods: {
    scroll () {
      window.onscroll = () => {
        let bottomOfWindow = Math.max(
          window.pageYOffset,
          document.documentElement.scrollTop,
          document.body.scrollTop)
          + window.innerHeight;
        if (bottomOfWindow 
          >= document.documentElement.offsetHeight-window.innerHeight*0.075) {
         this.maxItems += maxItemsOnPage;
        }
      }
    },
    search (params) {
      let normalize = (text) => {
        return text.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      }
      let scopes = {
        title: (book,term) => {
          return normalize(book.title).includes(term);
        },
        author: (book,term) => {
          return term.includes(book.id);
        },
        summary: (book,term) => {
          return book.summary.some(abstr => normalize(abstr).includes(term));
        },
        publisher: (book,term) => {
          return normalize(book.publisher.name).includes(term);
        },
        tag: (book,term) => {
          return book.tags.some(tag => normalize(tag).includes(term));
        }
      }
      params.term = normalize(params.term);
      if (params.term.length == 0) {
        this.collection = this.$root.collection;
      } else {
        let contribs = [];
        if ((params.scope == "all") || (params.scope == "author")) {
          let matchingAuthors = this.$root.authors.searchByName(params.term);
          contribs = matchingAuthors.map(e => 
            e.contributions.map(contribution => contribution.bookId)).flat();
        }
        this.collection = this.$root.collection.filter(book => {
          try {
            if (params.scope == "all") {
              return Object.keys(scopes).map(e => {
                if (e == "author") {
                  return scopes[e](book,contribs);
                } else {
                  return scopes[e](book,params.term);
                }
              }).includes(true);
            } else if (params.scope == "author") {
              return scopes[params.scope](book,contribs);
            } else {
              return scopes[params.scope](book,params.term);
            }
          }
          catch {
            return false;
          }
        });
      }
      this.maxItems = maxItemsOnPage;
    },
    changeView (view) {
      this.currentView = view;
    }
  },
  computed: {
    toDisplay () {
      return (typeof this.selection !== "undefined")
        ? this.selection
        : this.collection;
    }
  },
  props: ["selection"],
  mounted () {
    window.document.title = this.$root.appName;
    this.scroll();
    this.$nextTick(function () {
      this.$refs.viewToggle.$on("changeView", this.changeView);
    });
  },
  created () {
    this.$root.$on("search", this.search);
  },
  template: `<section>
    <toggle-view ref="viewToggle"></toggle-view>
    <main-list
      v-bind:collection="toDisplay.slice(0,maxItems)" v-bind:view="currentView">
    </main-list>
  </section>`
};
export { mainView }
