/**
 * Admin Data Context
 * 
 * Admin panel ke liye centralized data management
 * - Products, Orders, Users, Reviews ko ek jagah store karta hai
 * - Duplicate API calls prevent karta hai
 * - Data tabs ke beech share hota hai
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth helper
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// Create Context
const AdminDataContext = createContext();

// Provider Component
export const AdminDataProvider = ({ children }) => {
  // State for all admin data
  const [adminData, setAdminData] = useState({
    products: [],
    orders: [],
    users: [],
    reviews: [],
    coupons: [],
    banners: [],
    categories: [],
    bulkOrders: [],
    offers: [],
    announcements: []
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    products: false,
    orders: false,
    users: false,
    reviews: false,
    coupons: false,
    banners: false,
    categories: false,
    bulkOrders: false,
    offers: false,
    announcements: false
  });

  // Track which data has been fetched (prevent duplicate calls)
  const [dataFetched, setDataFetched] = useState({
    products: false,
    orders: false,
    users: false,
    reviews: false,
    coupons: false,
    banners: false,
    categories: false,
    bulkOrders: false,
    offers: false,
    announcements: false
  });

  // Generic fetch function
  const fetchData = useCallback(async (dataType, endpoint, requiresAuth = true) => {
    // Agar already fetched hai, toh skip karo
    if (dataFetched[dataType]) {
      console.log(`✅ ${dataType} already fetched, using cached data`);
      return adminData[dataType];
    }

    setLoadingStates(prev => ({ ...prev, [dataType]: true }));
    
    try {
      const config = requiresAuth ? { headers: getAuthHeaders() } : {};
      const response = await axios.get(`${API}${endpoint}`, config);
      
      setAdminData(prev => ({
        ...prev,
        [dataType]: response.data
      }));
      
      setDataFetched(prev => ({ ...prev, [dataType]: true }));
      
      console.log(`✅ ${dataType} fetched successfully`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error);
      toast.error(`Failed to fetch ${dataType}`);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [dataType]: false }));
    }
  }, [dataFetched, adminData]);

  // Specific fetch functions
  const fetchProducts = useCallback(() => fetchData('products', '/products', false), [fetchData]);
  const fetchOrders = useCallback(() => fetchData('orders', '/orders', true), [fetchData]);
  const fetchUsers = useCallback(() => fetchData('users', '/users', true), [fetchData]);
  const fetchReviews = useCallback(() => fetchData('reviews', '/reviews', true), [fetchData]);
  const fetchCoupons = useCallback(() => fetchData('coupons', '/coupons', true), [fetchData]);
  const fetchBanners = useCallback(() => fetchData('banners', '/banners?active_only=false', false), [fetchData]);
  const fetchCategories = useCallback(() => fetchData('categories', '/categories?active_only=false', false), [fetchData]);
  const fetchBulkOrders = useCallback(() => fetchData('bulkOrders', '/bulk-orders', true), [fetchData]);
  const fetchOffers = useCallback(() => fetchData('offers', '/offers?active_only=false', true), [fetchData]);
  const fetchAnnouncements = useCallback(() => fetchData('announcements', '/announcements?active_only=false', true), [fetchData]);

  // Force refresh function (clear cache and refetch)
  const refreshData = useCallback((dataType) => {
    setDataFetched(prev => ({ ...prev, [dataType]: false }));
    console.log(`🔄 Refreshing ${dataType}...`);
    
    const fetchFunctions = {
      products: fetchProducts,
      orders: fetchOrders,
      users: fetchUsers,
      reviews: fetchReviews,
      coupons: fetchCoupons,
      banners: fetchBanners,
      categories: fetchCategories,
      bulkOrders: fetchBulkOrders,
      offers: fetchOffers,
      announcements: fetchAnnouncements
    };
    
    return fetchFunctions[dataType]?.();
  }, [fetchProducts, fetchOrders, fetchUsers, fetchReviews, fetchCoupons, fetchBanners, fetchCategories, fetchBulkOrders, fetchOffers, fetchAnnouncements]);

  // Clear all cached data
  const clearCache = useCallback(() => {
    setDataFetched({
      products: false,
      orders: false,
      users: false,
      reviews: false,
      coupons: false,
      banners: false,
      categories: false,
      bulkOrders: false,
      offers: false,
      announcements: false
    });
    console.log('🗑️ Admin data cache cleared');
  }, []);

  // Update specific data (after create/update/delete operations)
  const updateDataItem = useCallback((dataType, itemId, updatedItem) => {
    setAdminData(prev => ({
      ...prev,
      [dataType]: prev[dataType].map(item => 
        item.id === itemId ? { ...item, ...updatedItem } : item
      )
    }));
  }, []);

  // Add new item to data
  const addDataItem = useCallback((dataType, newItem) => {
    setAdminData(prev => ({
      ...prev,
      [dataType]: [...prev[dataType], newItem]
    }));
  }, []);

  // Remove item from data
  const removeDataItem = useCallback((dataType, itemId) => {
    setAdminData(prev => ({
      ...prev,
      [dataType]: prev[dataType].filter(item => item.id !== itemId)
    }));
  }, []);

  const value = {
    // Data
    ...adminData,
    
    // Loading states
    loading: loadingStates,
    
    // Fetch functions
    fetchProducts,
    fetchOrders,
    fetchUsers,
    fetchReviews,
    fetchCoupons,
    fetchBanners,
    fetchCategories,
    fetchBulkOrders,
    fetchOffers,
    fetchAnnouncements,
    
    // Utility functions
    refreshData,
    clearCache,
    updateDataItem,
    addDataItem,
    removeDataItem,
    
    // Fetch status
    dataFetched
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

// Custom hook to use admin data context
export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};

export default AdminDataContext;
