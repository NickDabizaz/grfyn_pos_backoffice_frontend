import { useState } from 'react';

/**
 * Custom hook to manage tab view state between Grid and Form
 * @param {string} defaultTab - Default active tab ('grid' or 'form')
 * @returns {object} Tab view state and controls
 */
export function useTabView(defaultTab = 'grid') {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const showGrid = () => {
    setActiveTab('grid');
    setSelectedRecord(null);
  };

  const showForm = (record = null) => {
    setActiveTab('form');
    setSelectedRecord(record);
  };

  const isGrid = activeTab === 'grid';
  const isForm = activeTab === 'form';

  return {
    activeTab,
    setActiveTab,
    selectedRecord,
    setSelectedRecord,
    showGrid,
    showForm,
    isGrid,
    isForm,
  };
}
