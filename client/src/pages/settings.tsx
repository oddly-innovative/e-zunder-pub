import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  SettingsIcon, 
  PaletteIcon, 
  KeyIcon, 
  ShieldIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  GlobeIcon,
  UserIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and application settings</p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    defaultValue={user?.email?.split('@')[0] || ''} 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    defaultValue={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()} 
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input 
                  id="bio" 
                  placeholder="Tell us a little about yourself..." 
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PaletteIcon className="w-5 h-5 mr-2" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <div className="text-sm text-gray-500">
                    Toggle between light and dark themes
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <SunIcon className="w-4 h-4" />
                  <Switch 
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                  />
                  <MoonIcon className="w-4 h-4" />
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                      <SelectItem value="CET">Central European Time</SelectItem>
                      <SelectItem value="JST">Japan Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Receive notifications about your projects and documents
                  </div>
                </div>
                <Switch 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Get instant notifications in your browser
                  </div>
                </div>
                <Switch 
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Marketing Emails</Label>
                  <div className="text-sm text-gray-500">
                    Receive updates about new features and promotions
                  </div>
                </div>
                <Switch 
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldIcon className="w-5 h-5 mr-2" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-base">Two-Factor Authentication</Label>
                <div className="text-sm text-gray-500 mb-3">
                  Add an extra layer of security to your account
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Not Enabled
                  </Badge>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-base">API Access</Label>
                <div className="text-sm text-gray-500 mb-3">
                  Manage API keys for third-party integrations
                </div>
                <Button variant="outline" size="sm">
                  <KeyIcon className="w-4 h-4 mr-2" />
                  Manage API Keys
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-base">Data Export</Label>
                <div className="text-sm text-gray-500 mb-3">
                  Download a copy of your data
                </div>
                <Button variant="outline" size="sm">
                  Request Data Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="w-5 h-5 mr-2" />
                AI Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aiModel">Preferred AI Model</Label>
                <Select defaultValue="gemini-pro">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="defaultTone">Default Writing Tone</Label>
                <Select defaultValue="professional">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} className="px-8">
              Save All Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}