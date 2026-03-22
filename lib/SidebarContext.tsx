'use client'
import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
}>({ isOpen: true, toggle: () => {} });

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen(!isOpen) }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);