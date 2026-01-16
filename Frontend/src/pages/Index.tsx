
import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { CustomerDashboard } from '@/components/dashboards/CustomerDashboard';
import { ProductManagerDashboard } from '@/components/dashboards/ProductManagerDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { apiService } from '@/services/api';
import { useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<'customer' | 'manager' | 'admin'>('customer');

  useEffect(() => {
    const storedUser = apiService.getUser();
    if (storedUser) {
      handleLogin(storedUser);
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    if (userData.roles.includes("admin")) {
      setCurrentRole('admin');
    }
    else if (userData.roles.includes("manager")) {
      setCurrentRole('manager');
    }
    else {
      setCurrentRole('customer');
    }
    console.log("User logged in:", userData);
    console.log("Current role set to:", currentRole);
    console.log("Available roles:", userData.roles);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentRole('customer');
    apiService.clearToken();
  };

  const handleRoleSwitch = (role: 'customer' | 'manager' | 'admin') => {
    setCurrentRole(role);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentRole === 'customer' && (
        <CustomerDashboard
          user={user}
          onLogout={handleLogout}
          onRoleSwitch={
            user.roles.length > 1
              ? (role =>
                handleRoleSwitch(
                  role === 'product_manager'
                    ? 'manager'
                    : role === 'administrator'
                      ? 'admin'
                      : 'customer'
                )
              )
              : undefined
          }
          availableRoles={user.roles}
        />
      )}
      {currentRole === 'manager' && (
        <ProductManagerDashboard
          user={user}
          onLogout={handleLogout}
          onRoleSwitch={role => {
            if (role === 'product_manager') {
              handleRoleSwitch('manager');
            } else if (role === 'administrator') {
              handleRoleSwitch('admin');
            } else {
              handleRoleSwitch('customer');
            }
          }}
          availableRoles={user.roles}
        />
      )}
      {currentRole === 'admin' && (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          onRoleSwitch={role => {
            if (role === 'product_manager') {
              handleRoleSwitch('manager');
            } else if (role === 'administrator') {
              handleRoleSwitch('admin');
            } else {
              handleRoleSwitch('customer');
            }
          }}
          availableRoles={user.roles}
        />
      )}
    </div>
  );
};

export default Index;
