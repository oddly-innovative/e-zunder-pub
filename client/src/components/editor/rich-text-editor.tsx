import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  LinkIcon,
  ImageIcon,
  TypeIcon,
  UndoIcon,
  RedoIcon,
  ChevronDownIcon,
  PaletteIcon,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  projectStyles?: ProjectStyles;
}

interface ProjectStyles {
  fontFamily: string;
  headingFont: string;
  bodyFont: string;
  fontSize: string;
  lineHeight: string;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...", 
  projectStyles 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = content || '';
      setIsInitialized(true);
    }
  }, [content, isInitialized]);

  // Load Google Fonts
  useEffect(() => {
    if (projectStyles?.headingFont || projectStyles?.bodyFont) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${projectStyles.headingFont?.replace(/\s+/g, '+')}:wght@400;600;700&family=${projectStyles.bodyFont?.replace(/\s+/g, '+')}:wght@300;400;500&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [projectStyles]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  };

  // Handle key events for shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold');
    }
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      document.execCommand('italic');
    }
    // Ctrl/Cmd + U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      document.execCommand('underline');
    }
    // Ctrl/Cmd + Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('undo');
    }
    // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      document.execCommand('redo');
    }
  };

  // Format commands
  const formatCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const formatHeading = (level: number) => {
    formatCommand('formatBlock', `h${level}`);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      formatCommand('insertImage', url);
    }
  };

  const commonTools = [
    { icon: BoldIcon, command: () => formatCommand('bold'), title: 'Bold' },
    { icon: ItalicIcon, command: () => formatCommand('italic'), title: 'Italic' },
    { icon: UnderlineIcon, command: () => formatCommand('underline'), title: 'Underline' },
    { icon: ListIcon, command: () => formatCommand('insertUnorderedList'), title: 'Bullet List' },
    { icon: ListOrderedIcon, command: () => formatCommand('insertOrderedList'), title: 'Numbered List' },
  ];

  const advancedTools = [
    { icon: StrikethroughIcon, command: () => formatCommand('strikeThrough'), title: 'Strikethrough' },
    { icon: AlignLeftIcon, command: () => formatCommand('justifyLeft'), title: 'Align Left' },
    { icon: AlignCenterIcon, command: () => formatCommand('justifyCenter'), title: 'Align Center' },
    { icon: AlignRightIcon, command: () => formatCommand('justifyRight'), title: 'Align Right' },
    { icon: QuoteIcon, command: () => formatCommand('formatBlock', 'blockquote'), title: 'Quote' },
    { icon: LinkIcon, command: insertLink, title: 'Insert Link' },
    { icon: ImageIcon, command: insertImage, title: 'Insert Image' },
    { icon: UndoIcon, command: () => formatCommand('undo'), title: 'Undo' },
    { icon: RedoIcon, command: () => formatCommand('redo'), title: 'Redo' },
  ];

  const kdpFonts = [
    { name: 'Times New Roman', value: 'Times' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Garamond', value: 'Garamond' },
    { name: 'Baskerville', value: 'Baskerville' },
    { name: 'Minion Pro', value: 'Minion Pro' },
    { name: 'Crimson Text', value: 'Crimson Text' },
    { name: 'Libre Baskerville', value: 'Libre Baskerville' },
    { name: 'Lora', value: 'Lora' },
    { name: 'Merriweather', value: 'Merriweather' },
    { name: 'Source Serif Pro', value: 'Source Serif Pro' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Mobile-First Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200">
        {/* Primary Toolbar - Always Visible */}
        <div className="flex items-center justify-between p-2 gap-2">
          {/* Quick Format Controls */}
          <div className="flex items-center gap-1">
            {commonTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={tool.command}
                  title={tool.title}
                >
                  <IconComponent className="w-4 h-4" />
                </Button>
              );
            })}
          </div>

          {/* Format & Style Toggle */}
          <Collapsible open={isFormatMenuOpen} onOpenChange={setIsFormatMenuOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <PaletteIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Format</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isFormatMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="border-t border-gray-200 p-3 space-y-3">
                {/* Heading Styles */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Text Style</label>
                  <select
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'p') {
                        formatCommand('formatBlock', 'p');
                      } else {
                        formatHeading(parseInt(value));
                      }
                    }}
                    defaultValue="p"
                  >
                    <option value="p">Paragraph</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                    <option value="4">Heading 4</option>
                    <option value="5">Heading 5</option>
                    <option value="6">Heading 6</option>
                  </select>
                </div>

                {/* KDP Font Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">KDP Font</label>
                  <select
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
                    onChange={(e) => {
                      const fontFamily = e.target.value;
                      formatCommand('fontName', fontFamily);
                    }}
                  >
                    <option value="">Default</option>
                    {kdpFonts.map((font) => (
                      <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Advanced Tools */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Advanced</label>
                  <div className="grid grid-cols-5 gap-1">
                    {advancedTools.map((tool, index) => {
                      const IconComponent = tool.icon;
                      return (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={tool.command}
                          title={tool.title}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        className="prose-editor min-h-96 p-4 sm:p-6 focus:outline-none"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ 
          minHeight: '500px',
          fontFamily: projectStyles?.bodyFont || 'Georgia, serif',
          fontSize: projectStyles?.fontSize || '16px',
          lineHeight: projectStyles?.lineHeight || '1.6'
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .prose-editor h1 {
          font-family: ${projectStyles?.headingFont || 'Georgia, serif'};
          font-size: 2em;
          font-weight: 600;
          margin: 0.83em 0;
        }
        
        .prose-editor h2 {
          font-family: ${projectStyles?.headingFont || 'Georgia, serif'};
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.83em 0;
        }
        
        .prose-editor h3 {
          font-family: ${projectStyles?.headingFont || 'Georgia, serif'};
          font-size: 1.17em;
          font-weight: 600;
          margin: 1em 0;
        }
        
        .prose-editor p {
          margin: 1em 0;
        }
        
        .prose-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
