import { createRouter, createWebHashHistory, RouteLocationNormalized } from "vue-router";
import { useStore } from "src/store";
import ElementView from "src/views/ElementView.vue";
import PageNotFound from "src/views/PageNotFound.vue";
import OpenView from "src/views/OpenView.vue";

const routes = [
  {
    name: "open",
    path: "/open",
    component: OpenView,
  },
  {
    name: "element",
    path: "/root/:elementId*",
    alias: ["/reg/:elementId*", "/:elementId*"],
    component: ElementView,
    props: true,
  },
  {
    name: "404",
    path: "/:catchAll(.*)",
    component: PageNotFound,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const store = useStore();

  // If the store hasn't been loaded try to load a file or reroute to the open page
  if (to.path != "/open" && !store.loaded) {
    if (to.query?.data) {
      // Load the data file from the query
      const result = await store.loadUrl(to.query.data as string);
      if (result != "") {
        store.loadError = result;
        return { name: "open" };
      }
    } else {
      // Otherwise try to load data.json
      const result = await store.loadUrl("data.json");
      if (result != "") {
        return { name: "open" };
      }
    }
  }

  // Check if the data query has changed and the store needs to be reloaded
  if (to.query?.data && store.url != to.query.data) {
    try {
      await store.loadUrl(to.query.data as string);
      return {
        name: "element",
        query: { data: store.url },
      };
    } catch {
      return { name: "open" };
    }
  }

  return true;
});

function hasQueryParam(route: RouteLocationNormalized, param: string): boolean {
  return Object.hasOwn(route.query, param);
}

router.beforeEach(async (to, from) => {
  const store = useStore();

  const adapter = from.query.adapter || to.query.adapter;

  if (adapter) {
    if (!store.hwClient.isLoaded) {
      await store.hwClient.load(adapter as string);
    }
  } else {
    store.hwClient.unload();
  }

  // Preserve adapter query param
  if (hasQueryParam(from, "adapter") && !hasQueryParam(to, "adapter")) {
    return {...to, query: {...to.query, adapter: from.query.adapter}};
  }

  return true;
});

export default router;
