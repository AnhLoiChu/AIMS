
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export const SystemSettings = () => {
  const [settings, setSettings] = useState({
    maxConcurrentUsers: 1000,
    maxOperationHours: 300,
    maxResponseTime: 2,
    peakResponseTime: 5,
    maxProductDeletions: 10,
    maxDailyProductUpdates: 30,
    priceUpdateLimit: 2,
    minPricePercent: 30,
    maxPricePercent: 150,
    vatRate: 10,
    freeShippingThreshold: 100000,
    maxFreeShipping: 25000,
    rushDeliveryFee: 10000,
    enableRushDelivery: true,
    enableEmailNotifications: true
  });

  const handleSave = () => {
    // In real app, save to backend
    alert('Settings saved successfully');
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxUsers">Max Concurrent Users</Label>
              <Input
                id="maxUsers"
                type="number"
                value={settings.maxConcurrentUsers}
                onChange={(e) => updateSetting('maxConcurrentUsers', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxHours">Max Operation Hours</Label>
              <Input
                id="maxHours"
                type="number"
                value={settings.maxOperationHours}
                onChange={(e) => updateSetting('maxOperationHours', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxResponse">Max Response Time (seconds)</Label>
              <Input
                id="maxResponse"
                type="number"
                value={settings.maxResponseTime}
                onChange={(e) => updateSetting('maxResponseTime', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="peakResponse">Peak Hours Response Time (seconds)</Label>
              <Input
                id="peakResponse"
                type="number"
                value={settings.peakResponseTime}
                onChange={(e) => updateSetting('peakResponseTime', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxDeletions">Max Products Deleted at Once</Label>
              <Input
                id="maxDeletions"
                type="number"
                value={settings.maxProductDeletions}
                onChange={(e) => updateSetting('maxProductDeletions', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxUpdates">Max Daily Product Updates</Label>
              <Input
                id="maxUpdates"
                type="number"
                value={settings.maxDailyProductUpdates}
                onChange={(e) => updateSetting('maxDailyProductUpdates', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="priceUpdates">Daily Price Update Limit</Label>
              <Input
                id="priceUpdates"
                type="number"
                value={settings.priceUpdateLimit}
                onChange={(e) => updateSetting('priceUpdateLimit', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="minPrice">Minimum Price (% of value)</Label>
              <Input
                id="minPrice"
                type="number"
                value={settings.minPricePercent}
                onChange={(e) => updateSetting('minPricePercent', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxPrice">Maximum Price (% of value)</Label>
              <Input
                id="maxPrice"
                type="number"
                value={settings.maxPricePercent}
                onChange={(e) => updateSetting('maxPricePercent', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="vatRate">VAT Rate (%)</Label>
              <Input
                id="vatRate"
                type="number"
                value={settings.vatRate}
                onChange={(e) => updateSetting('vatRate', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="freeShipping">Free Shipping Threshold (VND)</Label>
              <Input
                id="freeShipping"
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => updateSetting('freeShippingThreshold', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxFreeShipping">Max Free Shipping Amount (VND)</Label>
              <Input
                id="maxFreeShipping"
                type="number"
                value={settings.maxFreeShipping}
                onChange={(e) => updateSetting('maxFreeShipping', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="rushFee">Rush Delivery Fee (VND)</Label>
              <Input
                id="rushFee"
                type="number"
                value={settings.rushDeliveryFee}
                onChange={(e) => updateSetting('rushDeliveryFee', parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="rushDelivery"
                checked={settings.enableRushDelivery}
                onCheckedChange={(checked) => updateSetting('enableRushDelivery', checked)}
              />
              <Label htmlFor="rushDelivery">Enable Rush Delivery</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="emailNotifications"
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) => updateSetting('enableEmailNotifications', checked)}
            />
            <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Save Settings
        </Button>
      </div>
    </div>
  );
};
