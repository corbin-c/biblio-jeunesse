let bookView = {
  data: function() {
    return {
      book: this.$root.collection.find(e => e.id == this.id)
    }
  },
  mounted: function() {
    window.document.title = this.$root.appName+" - "+this.book.title;
  },
  props: ["id"],
  template: `<p>{{ book.title }} {{ book.publisher.name }} {{ book.allPublishers.join(" / ") }}</p>`
};
export { bookView }
