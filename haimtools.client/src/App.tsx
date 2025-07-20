import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostmanApp } from './components/PostmanApp';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PostmanApp />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;