import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

const MAX_TABS_WARNING = 15;

let tabIdCounter = 0;

// Serialise only the data needed to reopen a tab; component refs are omitted
// because React components can't be stored in JSON. On hydration, the component
// field is left undefined — TabContent's <Suspense> guard handles the lazy re-attach.
const tabToPersisted = (tab) => ({
  id         : tab.id,
  label      : tab.label,
  icon       : null,        // functions can't be serialised
  kodemenu   : tab.kodemenu,
  type       : tab.type,
  closable   : tab.closable,
  props      : tab.props,
  state      : tab.state,
  dirty      : tab.dirty,
  parentTabId: tab.parentTabId ?? null,
});

const useTabStore = create(
  devtools(
    persist(
      (set, get) => ({
        tabs       : [],
        activeTabId: null,
        showMemoryWarning: false,
        refreshTokens: {},

        openTab: (config) => {
          const id  = ++tabIdCounter;
          const isFormTab = config.type === 'form_add' || config.type === 'form_edit';
          const tab = {
            id,
            label    : config.label || 'Untitled',
            icon     : config.icon  || null,
            component: config.component,
            props    : config.props || {},
            type     : config.type  || 'list',
            kodemenu : config.kodemenu || null,
            state    : {},
            dirty    : false,
            closable : config.closable !== false,
            parentTabId: isFormTab ? (config.parentTabId ?? get().activeTabId) : null,
          };

          set(state => {
            const newTabs         = [...state.tabs, tab];
            const showMemoryWarning = newTabs.length >= MAX_TABS_WARNING;
            return { tabs: newTabs, activeTabId: id, showMemoryWarning };
          }, false, 'tab/openTab');

          return id;
        },

        openOrFocusTab: (config) => {
          const existing = get().tabs.find(t => t.kodemenu && t.kodemenu === config.kodemenu);
          if (existing) {
            set(state => ({
              tabs: state.tabs.map(t => t.id === existing.id
                ? {
                    ...t,
                    label    : config.label || t.label,
                    icon     : config.icon || t.icon,
                    component: config.component || t.component,
                    props    : config.props || t.props,
                    type     : config.type || t.type,
                    closable : config.closable !== undefined ? config.closable : t.closable,
                  }
                : t
              ),
              activeTabId: existing.id,
            }), false, 'tab/openOrFocusTabUpdate');
            return existing.id;
          }
          return get().openTab(config);
        },

        closeTab: (id) => {
          const targetId = id ?? get().activeTabId;
          const sameId = (a, b) => String(a) === String(b);
          const tab = get().tabs.find(t => sameId(t.id, targetId));
          if (tab && !tab.closable) return;

          set(state => {
            const idx       = state.tabs.findIndex(t => sameId(t.id, targetId));
            if (idx === -1) return state;
            const closingTab = state.tabs[idx];
            const newTabs   = state.tabs.filter(t => !sameId(t.id, targetId));
            let   newActive = state.activeTabId;
            if (sameId(state.activeTabId, targetId)) {
              const parentId = closingTab?.parentTabId;
              const parentExists = parentId && newTabs.some(t => sameId(t.id, parentId));
              if (parentExists) {
                newActive = parentId;
              } else {
                newActive = idx >= newTabs.length
                  ? newTabs[newTabs.length - 1]?.id ?? null
                  : newTabs[idx]?.id ?? null;
              }
            }
            return {
              tabs            : newTabs,
              activeTabId     : newActive,
              showMemoryWarning: newTabs.length >= MAX_TABS_WARNING,
            };
          }, false, 'tab/closeTab');
        },

        dismissMemoryWarning: () => set({ showMemoryWarning: false }, false, 'tab/dismissMemoryWarning'),

        setActiveTab: (id) => set({ activeTabId: id }, false, 'tab/setActiveTab'),

        requestRefresh: (kodemenu) => {
          if (!kodemenu) return;
          set(state => ({
            refreshTokens: {
              ...state.refreshTokens,
              [kodemenu]: Date.now(),
            },
          }), false, 'tab/requestRefresh');
        },

        updateTabState: (id, partialState) => {
          set(state => ({
            tabs: state.tabs.map(t =>
              t.id === id ? { ...t, state: { ...t.state, ...partialState } } : t
            ),
          }), false, 'tab/updateTabState');
        },

        setTabDirty: (id, dirty) => {
          set(state => ({
            tabs: state.tabs.map(t => (t.id === id ? { ...t, dirty } : t)),
          }), false, 'tab/setTabDirty');
        },

        closeAllTabs: () => set(state => {
          const keepTabs = state.tabs.filter(t => !t.closable);
          const active   = keepTabs.length > 0 ? keepTabs[0].id : null;
          return { tabs: keepTabs, activeTabId: active, showMemoryWarning: false };
        }, false, 'tab/closeAllTabs'),
      }),
      {
        name   : 'grfyn-tabs',
        storage: createJSONStorage(() => sessionStorage),
        // Only persist the lightweight descriptor; components are re-attached at runtime
        partialize: (state) => ({
          tabs       : state.tabs.map(tabToPersisted),
          activeTabId: state.activeTabId,
        }),
        // After hydration, re-attach components via pageRegistry
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          // Sync counter so new tabs never collide with persisted ids
          if (state.tabs?.length) {
            const maxId = Math.max(...state.tabs.map(t => t.id || 0));
            if (maxId > tabIdCounter) tabIdCounter = maxId;
          }
          // Dynamic import avoids circular dependency
          import('../lib/pageRegistry.jsx').then(({ getPage }) => {
            useTabStore.setState(s => ({
              tabs: s.tabs
                .filter(t => t.type !== 'report')
                .map(t => {
                  if (t.component) return t;
                  const page = t.kodemenu ? getPage(t.kodemenu) : null;
                  return page ? { ...t, component: page.component, icon: page.icon || null } : t;
                }).filter(t => t.component),
            }));
          });
        },
      }
    ),
    { name: 'TabStore' }
  )
);

export default useTabStore;
