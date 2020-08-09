import { vLink } from "./vlink.vue.js";
let notFound = {
  methods: {
    back() {
      history.back();
    }
  },
  components: {
    "v-link": vLink
  },
  template: `<section class="text-center p-5 m-5">
    <svg height="20vh" width="20vh" style="fill: var(--warning);">
      <use height="100%" width="100%" xlink:href="/octicons-sprite/octicons-sprite.svg#milestone-24"></use>
    </svg>
  <h3 class="text-warning py-3 my-3">Oups !<br>La page demandée n'a pas été trouvée :(</h3>
  <p>Vous pouvez...</p>
  <ul class="d-inline inline p-0 ul404">
    <li class="p-2">
      <button v-on:click="back()" class="btn btn-outline-primary">
        Revenir en arrière
          <svg class="d-inline">
            <use xlink:href="/octicons-sprite/octicons-sprite.svg#arrow-left-24"></use>
          </svg>
      </button>
    </li>
    <li class="p-2">
      <v-link
        v-bind:href="''"
        v-bind:title="'Retour au début !'"
        class="btn btn-outline-success"
        role="button">
      Aller à l'accueil
        <svg class="d-inline">
          <use xlink:href="/octicons-sprite/octicons-sprite.svg#home-24"></use>
        </svg>
      </v-link>
    </li>
  </ul>
  </section>`
};
export { notFound }
