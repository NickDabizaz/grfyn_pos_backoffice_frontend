import { Component, Suspense } from 'react';
import useTabStore from '../store/tabStore';

function TabSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
        <p className="text-sm text-dark-300">Memuat halaman…</p>
      </div>
    </div>
  );
}

export default function TabContent() {
  const { tabs, activeTabId, updateTabState } = useTabStore();

  return (
    <div className="flex-1 overflow-auto">
      {tabs.map(tab => {
        const isActive     = tab.id === activeTabId;
        const TabComponent = tab.component;

        return (
          <div
            key={tab.id}
            style={{ display: isActive ? 'flex' : 'none' }}
            className="h-full flex-col"
          >
            <ErrorBoundary tab={tab}>
              <Suspense fallback={<TabSkeleton />}>
                <TabComponent
                  {...tab.props}
                  tabId={tab.id}
                  isActive={isActive}
                  tabState={tab.state}
                  updateTabState={(partial) => updateTabState(tab.id, partial)}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        );
      })}
      {tabs.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">+</span>
            </div>
            <p className="text-dark-400 text-sm font-medium">Belum ada tab terbuka</p>
            <p className="text-dark-200 text-xs mt-1">Klik menu di sidebar untuk memulai</p>
          </div>
        </div>
      )}
    </div>
  );
}

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-danger-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-dark-500 font-medium text-sm">Tab mengalami error</p>
            <p className="text-dark-300 text-xs mt-1">{this.state.error?.message || 'Unknown error'}</p>
            <button
              onClick={() => useTabStore.getState().closeTab(this.props.tab?.id)}
              className="mt-3 px-4 py-2 rounded-lg bg-danger-500 text-white text-xs font-medium hover:bg-danger-600"
            >
              Tutup Tab
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
