import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, FileCheck, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileCheck,
      title: "Sample Generation",
      description: "Generate confirmation samples on random or monetary unit basis with comprehensive logging"
    },
    {
      icon: Shield,
      title: "Domain Testing",
      description: "Automated validation of confirming party email domains for enhanced verification"
    },
    {
      icon: Users,
      title: "Multi-Role Access",
      description: "Seamless collaboration between auditors, clients, and confirming parties"
    },
    {
      icon: CheckCircle,
      title: "Digital Workflow",
      description: "Complete digital confirmation process from rollout to working paper"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Confirmation Tool</h1>
          </div>
          <Button onClick={() => navigate("/role-selection")} size="lg">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <h2 className="text-5xl font-bold text-foreground leading-tight">
            Professional Audit Confirmation Platform
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your audit confirmation process with automated sample generation, 
            digital authorization, and comprehensive working papers. Built for modern audit teams.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button onClick={() => navigate("/role-selection")} size="lg" className="h-12 px-8">
              Start New Engagement
            </Button>
            <Button onClick={() => navigate("/role-selection")} variant="outline" size="lg" className="h-12 px-8">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Three Roles Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Three Integrated Roles</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete confirmation workflow designed for all stakeholders in the audit process
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-xl font-semibold text-foreground mb-3">Auditor</h4>
            <p className="text-muted-foreground mb-4">
              Complete audit management with sample generation, domain testing, rollout control, and working papers
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Generate confirmation samples</li>
              <li>• Manage client authorization</li>
              <li>• Control confirmation rollout</li>
              <li>• Access comprehensive working papers</li>
            </ul>
          </Card>

          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h4 className="text-xl font-semibold text-foreground mb-3">Client</h4>
            <p className="text-muted-foreground mb-4">
              Review and authorize confirmation letters digitally with full audit trail
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Review authorization letters</li>
              <li>• Authorize confirmations</li>
              <li>• View confirmation status</li>
              <li>• Complete audit trail logging</li>
            </ul>
          </Card>

          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300">
            <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-success" />
            </div>
            <h4 className="text-xl font-semibold text-foreground mb-3">Confirming Party</h4>
            <p className="text-muted-foreground mb-4">
              Provide confirmation responses through structured digital forms for various audit areas
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Respond to confirmations</li>
              <li>• Multiple confirmation types</li>
              <li>• Save drafts and attachments</li>
              <li>• Secure digital signatures</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Audit Process?</h3>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join leading audit firms using our platform to streamline confirmations and enhance audit quality
          </p>
          <Button 
            onClick={() => navigate("/role-selection")}
            size="lg" 
            variant="secondary"
            className="h-12 px-8"
          >
            Get Started Now
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Confirmation Tool. Professional audit confirmation platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
