import { mainView } from "/biblio-jeunesse/vue/main-view.vue.js";
import { publisherView } from "/biblio-jeunesse/vue/publisher.vue.js";
import { bookView } from "/biblio-jeunesse/vue/book.vue.js";
import { authorView } from "/biblio-jeunesse/vue/author.vue.js";
import { allTags } from "/biblio-jeunesse/vue/all-tags.vue.js";
import { tagView } from "/biblio-jeunesse/vue/tag.vue.js";
import { notFound } from "/biblio-jeunesse/vue/404.vue.js";
const routes = {
    "/": mainView,
    "/index.html": mainView,
    "/book/$id": bookView,
    "/author/$name": authorView,
    "/publisher/$name": publisherView,
    "/tags/": allTags,
    "/tag/$tag": tagView,
    "/404": notFound
  };
export { routes };
