let toggleView = {
  data: function() {
    let state = (localStorage.getItem("preferredView") || "list");
    return {
      grid: {
        active: (state == "grid"),
        focus: false
      },
      list: {
        active: (state == "list"),
        focus: false
      }
    }
  },
  components: {
  },
  methods: {
    wait(t) {
      return new Promise((resolve,reject) => {
        setTimeout(() => { resolve(); },t);
      })
    },
    changeView(e) {
      if (e.target.nodeName == "INPUT") {
        ["grid","list"].map(async state => {
          this[state].active = (state == e.target.id);
          this[state].focus = (state == e.target.id);
          if (state == e.target.id) {
            localStorage.setItem("preferredView", state);
            this.$emit("changeView",state);
          }
          await this.wait(500);
          this[state].focus = false;
        });
      }
    },
    getClasses(id) {
      return {
        btn: true,
        'btn-outline-primary': true,
        active: this[id].active,
        focus: this[id].focus
      }
    }
  },
  template: `
<form class="d-flex my-2 justify-content-end">
<fieldset class="btn-group btn-group-toggle" v-on:click="changeView">
  <label v-bind:class="getClasses('list')">
    <input type="radio" name="options" id="list" autocomplete="off" checked>
    <svg width="24px" height="24px">
      <use xlink:href="/octicons-sprite/octicons-sprite.svg#list-unordered-24"></use>
    </svg>
  </label>
  <label v-bind:class="getClasses('grid')">
    <input type="radio" name="options" id="grid" autocomplete="off">
    <svg width="24px" height="24px">
      <use transform="translate(-0.5 -1)" xlink:href="/octicons-sprite/octicons-sprite.svg#square-16"></use>
      <use transform="translate(9 -1)" xlink:href="/octicons-sprite/octicons-sprite.svg#square-16"></use>
      <use transform="translate(-0.5 8.5)" xlink:href="/octicons-sprite/octicons-sprite.svg#square-16"></use>
      <use transform="translate(9 8.5)" xlink:href="/octicons-sprite/octicons-sprite.svg#square-16"></use>
    </svg>
  </label>
</fieldset>
</form>
  `
};
export { toggleView }
