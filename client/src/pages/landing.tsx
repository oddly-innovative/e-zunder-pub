import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuthDialog from "@/components/auth/auth-dialog";
import { PenTool, Edit, Globe, Folder, FileText, Bot, Check } from "lucide-react";

export default function Landing() {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const handleGetStarted = () => {
    setAuthMode('register');
    setShowAuthDialog(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthDialog(true);
  };

  const features = [
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "AI Content Generation",
      description: "Generate high-quality articles, books, reports, and more with customizable prompts and tone settings.",
      details: [
        "Context-aware content creation",
        "Multiple content types supported", 
        "Customizable tone and style"
      ],
      gradient: "from-blue-100 to-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: <Edit className="w-6 h-6" />,
      title: "Content Improvement",
      description: "Enhance existing content for grammar, style, clarity, engagement, and SEO optimization.",
      details: [
        "Grammar and style correction",
        "SEO optimization suggestions",
        "Engagement enhancement"
      ],
      gradient: "from-purple-100 to-purple-50",
      iconColor: "text-purple-600"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-language Translation",
      description: "Translate content while preserving formatting and context across multiple languages.",
      details: [
        "Format preservation",
        "Context-aware translation",
        "50+ languages supported"
      ],
      gradient: "from-orange-100 to-orange-50",
      iconColor: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 ezunder-gradient-primary rounded-lg flex items-center justify-center">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">eZunder</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button onClick={handleGetStarted} className="ezunder-button-primary">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="responsive-heading font-bold text-gray-900 mb-6 leading-tight">
              Revolutionary <span className="ezunder-text-primary">ePublishing</span> Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create, edit, and publish content with AI-powered assistance. Leverage Google Vertex AI Gemini for intelligent content generation, improvement, and multi-language translation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleGetStarted} className="ezunder-button-primary">
                Start Creating Free
              </Button>
              <Button variant="outline" className="ezunder-button-secondary">
                Watch Demo
              </Button>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16">
            <div className="relative max-w-4xl mx-auto">
              <Card className="shadow-2xl">
                <CardContent className="p-0">
                  <img 
                    src="https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600" 
                    alt="Modern digital workspace with AI writing tools"
                    className="w-full rounded-xl"
                  />
                </CardContent>
              </Card>
              
              {/* Floating Feature Cards */}
              <Card className="absolute -top-4 -left-4 hidden md:block animate-slide-up">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">AI Content Generation</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="absolute -bottom-4 -right-4 hidden md:block animate-slide-up">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium">Multi-language Translation</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered by Advanced AI Technology</h2>
            <p className="text-lg text-gray-600">Google Vertex AI Gemini integration for intelligent content creation</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`bg-gradient-to-br ${feature.gradient} ezunder-card-hover animate-fade-in`}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 ${feature.iconColor}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center space-x-2">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold ezunder-text-primary mb-2">50+</div>
              <div className="text-gray-600">Languages Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold ezunder-text-secondary mb-2">10k+</div>
              <div className="text-gray-600">Documents Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold ezunder-text-accent mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">AI Assistant</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Writing?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of content creators who are already using eZunder to produce better content faster.
          </p>
          <Button onClick={handleGetStarted} size="lg" className="ezunder-button-primary">
            Start Your Free Trial
          </Button>
          <p className="text-sm text-gray-500 mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 ezunder-gradient-primary rounded-lg flex items-center justify-center">
                  <PenTool className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">eZunder</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Revolutionary ePublishing platform powered by AI. Create, edit, and publish content with intelligent assistance.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Tools</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 eZunder. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
