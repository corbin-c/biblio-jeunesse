let vLink = {
  props: {
    href: {
      type:String,
      required: true 
    },
    title: {
      type:String,
      required: false
    }
  },
  methods: {
    go (event) {
      event.preventDefault()
      this.$root.currentRoute = "/"+this.href
      window.history.pushState(
        null,
        this.href,
        this.href
      )
    }
  },
  template: `<a
    v-bind:href="'/biblio-jeunesse/vue/'+href"
    v-bind:title="title"
    v-on:click="go">
  <slot></slot>
  </a>`
};
export { vLink }
