let vLink = {
  props: {
    href: {
      type:String,
      required: true 
    }
  },
  methods: {
    go (event) {
      event.preventDefault()
      this.$root.currentRoute = this.href.slice(20)
      window.history.pushState(
        null,
        this.href,
        this.href
      )
    }
  },
  template: `<a
    v-bind:href="href"
    v-on:click="go">
  <slot></slot>
  </a>`
};
export { vLink }
