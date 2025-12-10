
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProductManagement } from '@/components/products/ProductManagement';
import { OrderManagement } from '@/components/orders/OrderManagement';
import { Header } from '@/components/layout/Header';
import { User } from '@/pages/Index';

interface ProductManagerDashboardProps {
  user: User;
  onLogout: () => void;
  onRoleSwitch: (role: 'customer' | 'product_manager' | 'administrator') => void;
  availableRoles: string[];
}

export const ProductManagerDashboard = ({ user, onLogout, onRoleSwitch, availableRoles }: ProductManagerDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLogout={onLogout}
        onRoleSwitch={onRoleSwitch}
        availableRoles={availableRoles}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === 'products' ? 'default' : 'outline'}
            onClick={() => setActiveTab('products')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Product Management
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('orders')}
          >
            Order Management
          </Button>
        </div>

        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'orders' && <OrderManagement />}
      </div>
    </div>
  );
};
