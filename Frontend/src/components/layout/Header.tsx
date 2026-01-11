
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User } from '@/pages/Index';
import { ChevronDown } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onRoleSwitch?: (role: 'customer' | 'product_manager' | 'administrator') => void;
  availableRoles: string[];
}

export const Header = ({ user, onLogout, onRoleSwitch, availableRoles }: HeaderProps) => {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'customer': return 'Customer';
      case 'product_manager': return 'Product Manager';
      case 'administrator': return 'Administrator';
      default: return role;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-blue-900">AIMS</h1>
          <span className="text-gray-500">|</span>
          <span className="text-gray-700">E-commerce Management System</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Welcome, <span className="font-semibold">{user.name}</span>
          </div>
          
          {onRoleSwitch && availableRoles.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
                  Switch Role <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white z-50">
                {availableRoles.map((role) => (
                  <DropdownMenuItem 
                    key={role} 
                    onClick={() => onRoleSwitch(role as any)}
                    className="hover:bg-gray-100"
                  >
                    {getRoleDisplayName(role)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLogout}
            className="bg-white hover:bg-gray-50"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
