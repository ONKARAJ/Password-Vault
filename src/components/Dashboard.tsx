'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { apiRequest } from '@/lib/clientAuth';
import { encryptVaultItem, decryptVaultItem } from '@/lib/encryption';
import { copyWithAutoClear } from '@/lib/clipboard';
import { VaultItem, EncryptedVaultItem } from '@/types';
import { debounce, formatDate, truncate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Button from './ui/Button';
import Input from './ui/Input';
import PasswordGenerator from './PasswordGenerator';
import { 
  Search, Plus, Eye, EyeOff, Copy, Edit2, Trash2, 
  LogOut, Moon, Sun, Key, Globe, User, StickyNote,
  Check, X, Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { 
    user, logout, isDarkMode, toggleDarkMode, 
    masterPassword, setMasterPassword, clearMasterPassword,
    vaultItems, setVaultItems, addVaultItem, updateVaultItem, removeVaultItem,
    token 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(!masterPassword);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // Form state for add/edit
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: ''
  });

  // Load vault items on mount and when master password is set
  useEffect(() => {
    if (masterPassword) {
      loadVaultItems();
    }
  }, [masterPassword]);

  const loadVaultItems = async () => {
    if (!masterPassword) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('/api/vault', {}, token);
      if (response.success) {
        const decryptedItems: VaultItem[] = [];
        
        for (const encryptedItem of response.data) {
          try {
            const decryptedData = await decryptVaultItem(encryptedItem.encryptedData, masterPassword);
            decryptedItems.push({
              _id: encryptedItem._id,
              userId: encryptedItem.userId,
              ...decryptedData,
              createdAt: encryptedItem.createdAt,
              updatedAt: encryptedItem.updatedAt,
            });
          } catch (err) {
            console.error('Failed to decrypt item:', err);
          }
        }
        
        setVaultItems(decryptedItems);
      }
    } catch (error) {
      console.error('Failed to load vault items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMasterPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterPassword(masterPasswordInput);
    setShowMasterPasswordPrompt(false);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) return;

    setIsLoading(true);
    try {
      const itemData = { ...formData };
      const encryptedData = await encryptVaultItem(itemData, masterPassword);

      if (editingItem) {
        // Update existing item
        const response = await apiRequest(`/api/vault/${editingItem._id}`, {
          method: 'PUT',
          body: JSON.stringify({ encryptedData }),
        }, token);

        if (response.success) {
          const updatedItem = { 
            ...editingItem, 
            ...itemData, 
            updatedAt: new Date() 
          };
          updateVaultItem(updatedItem);
        }
      } else {
        // Create new item
        const response = await apiRequest('/api/vault', {
          method: 'POST',
          body: JSON.stringify({ encryptedData }),
        }, token);

        if (response.success) {
          const newItem: VaultItem = {
            _id: response.data._id,
            userId: response.data.userId,
            ...itemData,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          };
          addVaultItem(newItem);
        }
      }

      resetForm();
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/vault/${id}`, {
        method: 'DELETE',
      }, token);

      if (response.success) {
        removeVaultItem(id);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', username: '', password: '', url: '', notes: '' });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const startEdit = (item: VaultItem) => {
    setFormData({
      title: item.title,
      username: item.username,
      password: item.password,
      url: item.url || '',
      notes: item.notes || '',
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleCopy = async (text: string, itemId: string) => {
    const success = await copyWithAutoClear(text, 15000);
    if (success) {
      setCopiedItems(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Memoize the password generated callback
  const handlePasswordGenerated = useCallback((password: string) => {
    if (showAddForm) {
      setFormData(prev => ({ ...prev, password }));
    }
  }, [showAddForm]);

  // Filter items based on search term
  const filteredItems = vaultItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.url && item.url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Master password prompt
  if (showMasterPasswordPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleMasterPasswordSubmit} className="space-y-4">
            <div className="text-center">
              <Key className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Enter Master Password
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your master password is needed to decrypt your vault items.
              </p>
            </div>
            
            <Input
              type="password"
              placeholder="Master password"
              value={masterPasswordInput}
              onChange={(e) => setMasterPasswordInput(e.target.value)}
              required
              autoFocus
            />
            
            <Button type="submit" className="w-full">
              Unlock Vault
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                logout();
                clearMasterPassword();
              }}
            >
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Password Vault
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </span>
            
            <Button
              onClick={toggleDarkMode}
              variant="ghost"
              size="icon"
              title="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              onClick={logout}
              variant="ghost"
              size="icon"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Password Generator */}
        <div className="space-y-6">
          <PasswordGenerator 
            onPasswordGenerated={handlePasswordGenerated}
          />
        </div>

        {/* Middle Column - Vault Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Add */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Vault ({filteredItems.length})
              </h2>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vault items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <Button onClick={resetForm} variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      placeholder="e.g., Gmail Account"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username/Email
                    </label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    placeholder="Use the generator to create a strong password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website URL
                  </label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full h-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingItem ? 'Update Item' : 'Add Item'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Vault Items List */}
          <div className="space-y-3">
            {isLoading && vaultItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">Loading your vault...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {searchTerm ? 'No items match your search.' : 'Your vault is empty.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Item
                  </Button>
                )}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.title}
                        </h3>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {item.username && (
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                            <User className="h-3 w-3" />
                            <span className="truncate">{item.username}</span>
                            <Button
                              onClick={() => handleCopy(item.username, `${item._id}-username`)}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              {copiedItems.has(`${item._id}-username`) ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Key className="h-3 w-3" />
                          <span className="font-mono">
                            {visiblePasswords.has(item._id!) ? item.password : '••••••••••••'}
                          </span>
                          <Button
                            onClick={() => togglePasswordVisibility(item._id!)}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            {visiblePasswords.has(item._id!) ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleCopy(item.password, `${item._id}-password`)}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            {copiedItems.has(`${item._id}-password`) ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        
                        {item.notes && (
                          <div className="flex items-start space-x-2 text-gray-600 dark:text-gray-400">
                            <StickyNote className="h-3 w-3 mt-0.5" />
                            <span className="text-xs">{truncate(item.notes, 50)}</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Updated {formatDate(item.updatedAt || item.createdAt || new Date())}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-4">
                      <Button
                        onClick={() => startEdit(item)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item._id!)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}