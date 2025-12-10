
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { Header } from '@/components/layout/Header';
import { User } from '@/pages/Index';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onRoleSwitch: (role: 'customer' | 'product_manager' | 'administrator') => void;
  availableRoles: string[];
}

export const AdminDashboard = ({ user, onLogout, onRoleSwitch, availableRoles }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');

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
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            User Management
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('settings')}
          >
            System Settings
          </Button>
        </div>

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
    </div>
  );
};
