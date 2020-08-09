import { listItem } from "./list-item.vue.js";
let mainList = {
  data: () => {
    return {
    }
  },
  components: {
    "list-item": listItem,
  },
  methods: {
  },
  props: ["collection","view"],
  template: `
  <ul id="mainView" v-bind:class="(view == 'grid') ? 'row p-0':'p-0'">
    <list-item
      v-for="(book,index) in this.collection"
      v-bind:key="book.id"
      v-bind:book="book"
      v-bind:view="view"
      v-bind:index="index"
      ref="book.id">
    </list-item>
  </ul>`,
};
export { mainList }
