import React from 'react';
import { cn } from '../../lib/utils';

function Tab({ id, active, children }) {
  if (id !== active) return null;
  return <>{children}</>;
}

/**
 * Tab container component for Grid/Form pattern
 */
export default function TabContainer({ activeTab, onTabChange, children }) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-primary-100 bg-white px-6 pt-4">
        <button
          onClick={() => onTabChange('grid')}
          className={cn(
            'px-6 py-3 text-sm font-semibold rounded-t-lg transition-all',
            activeTab === 'grid'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-warm-50 text-dark-400 hover:bg-warm-100'
          )}
        >
          Data
        </button>
        <button
          onClick={() => onTabChange('form')}
          className={cn(
            'px-6 py-3 text-sm font-semibold rounded-t-lg transition-all',
            activeTab === 'form'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-warm-50 text-dark-400 hover:bg-warm-100'
          )}
        >
          Form
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {React.Children.map(children, (child) => {
          if (child?.type === Tab) {
            return <Tab id={child.props.id} active={activeTab}>{child.props.children}</Tab>;
          }
          return child;
        })}
      </div>
    </div>
  );
}

TabContainer.Tab = Tab;
