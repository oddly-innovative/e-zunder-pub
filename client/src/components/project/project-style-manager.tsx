import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PaletteIcon, BookOpenIcon, DownloadIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectStyleManagerProps {
  project: {
    id: string;
    name: string;
    settings?: {
      headingFont?: string;
      bodyFont?: string;
      fontSize?: string;
      lineHeight?: string;
      marginSize?: string;
      pageSize?: string;
    };
  };
}

const kdpFonts = [
  { name: 'Times New Roman', value: 'Times' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Garamond', value: 'Garamond' },
  { name: 'Baskerville', value: 'Baskerville' },
  { name: 'Crimson Text', value: 'Crimson Text' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville' },
  { name: 'Lora', value: 'Lora' },
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'Source Serif Pro', value: 'Source Serif Pro' },
];

const pageSizes = [
  { name: '5" x 8"', value: '5x8' },
  { name: '6" x 9"', value: '6x9' },
  { name: '6.14" x 9.21"', value: '6.14x9.21' },
  { name: '7" x 10"', value: '7x10' },
  { name: '8.5" x 11"', value: '8.5x11' },
];

export default function ProjectStyleManager({ project }: ProjectStyleManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [styles, setStyles] = useState({
    headingFont: project.settings?.headingFont || 'Georgia',
    bodyFont: project.settings?.bodyFont || 'Georgia',
    fontSize: project.settings?.fontSize || '12pt',
    lineHeight: project.settings?.lineHeight || '1.5',
    marginSize: project.settings?.marginSize || '1in',
    pageSize: project.settings?.pageSize || '6x9',
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (newSettings: typeof styles) => {
      return await apiRequest(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Styles Updated",
        description: "Project formatting styles have been saved for KDP publishing.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProjectMutation.mutate(styles);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <PaletteIcon className="w-5 h-5" />
          KDP Publishing Styles
          <Badge variant="outline" className="ml-auto">
            <BookOpenIcon className="w-3 h-3 mr-1" />
            Amazon KDP Ready
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Typography Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Typography</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="headingFont">Heading Font</Label>
              <Select value={styles.headingFont} onValueChange={(value) => setStyles({...styles, headingFont: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kdpFonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyFont">Body Font</Label>
              <Select value={styles.bodyFont} onValueChange={(value) => setStyles({...styles, bodyFont: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kdpFonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Layout Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Layout & Formatting</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select value={styles.fontSize} onValueChange={(value) => setStyles({...styles, fontSize: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10pt">10pt</SelectItem>
                  <SelectItem value="11pt">11pt</SelectItem>
                  <SelectItem value="12pt">12pt</SelectItem>
                  <SelectItem value="13pt">13pt</SelectItem>
                  <SelectItem value="14pt">14pt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lineHeight">Spacing</Label>
              <Select value={styles.lineHeight} onValueChange={(value) => setStyles({...styles, lineHeight: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.3">1.3</SelectItem>
                  <SelectItem value="1.5">1.5</SelectItem>
                  <SelectItem value="1.6">1.6</SelectItem>
                  <SelectItem value="2.0">2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="pageSize">Page Size</Label>
              <Select value={styles.pageSize} onValueChange={(value) => setStyles({...styles, pageSize: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Preview</h3>
          <div 
            className="p-3 sm:p-4 border rounded-lg bg-white"
            style={{
              fontFamily: styles.bodyFont,
              fontSize: styles.fontSize,
              lineHeight: styles.lineHeight,
            }}
          >
            <h4 
              className="text-base sm:text-lg font-semibold mb-2"
              style={{ fontFamily: styles.headingFont }}
            >
              Chapter Title Example
            </h4>
            <p className="text-gray-700 text-sm sm:text-base">
              This is how your body text will appear with the selected formatting. 
              The fonts chosen are optimized for readability and KDP publishing standards.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
          <Button 
            onClick={handleSave} 
            disabled={updateProjectMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateProjectMutation.isPending ? "Saving..." : "Save Styles"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}