import { routes } from "./routes.js";
const getRoute = (path) => {
  let route = Object.keys(routes).find(e => {
    if (!e.includes("$")) {
      return path == e;
    } else {
      e = e.split("$");
      return (e[0] == path.slice(0,e[0].length));
    }
  });
  if (typeof route === "undefined") {
    return getRoute("/404");
  } else {
    if (!route.includes("$")) {
      return { view: routes[route], parameter: null };
    } else {
      let parameter = {};
      parameter[route.split("$")[1]] = path.slice(route.split("$")[0].length);
      return {
        view: routes[route],
        parameter
      }
    }
  }
}
let appRouter = {
  data: () => {
    return {
    }
  },
  computed: {
    ViewComponent () {
      return getRoute(this.route);
    }
  },
  props: ["route"],
  render (h) {
    window.scrollTo(0,0);
    let component = this.ViewComponent;
    if (component.parameter !== null) {
      return h(component.view, { props: component.parameter });
    }
    return h(component.view);
  }
};
export { appRouter }
