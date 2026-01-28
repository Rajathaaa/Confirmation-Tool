import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, FileCheck, Shield, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get user role from URL parameter or localStorage
  useEffect(() => {
    const roleFromUrl = searchParams.get("role");
    const roleFromStorage = localStorage.getItem("userRole");
    
    if (roleFromUrl) {
      setUserRole(roleFromUrl);
      localStorage.setItem("userRole", roleFromUrl);
    } else if (roleFromStorage) {
      setUserRole(roleFromStorage);
    }
  }, [searchParams]);

  // Define all roles
  const allRoles = [
    {
      id: "auditor",
      title: "Auditor",
      icon: FileCheck,
      description: "Access full engagement management, sample generation, and working papers",
      color: "primary",
      route: "/auditor/engagements"
    },
    {
      id: "client",
      title: "Client",
      icon: Shield,
      description: "Review and authorize confirmation letters for your organization",
      color: "accent",
      route: "/client/dashboard"
    },
    {
      id: "confirming-party",
      title: "Confirming Party",
      icon: Users,
      description: "Respond to confirmation requests from auditors",
      color: "success",
      route: "/confirming-party/confirmations"
    }
  ];

  // Filter roles based on current user type
  const getAvailableRoles = () => {
    if (!userRole) {
      // If no user role is set, show all roles (default/landing state)
      return allRoles;
    }
    
    switch (userRole) {
      case "auditor":
        // Auditor sees all 3 roles
        return allRoles;
      case "client":
        // Client sees Client and Confirming Party
        return allRoles.filter(role => role.id === "client" || role.id === "confirming-party");
      case "confirming-party":
        // Confirming Party sees Client and Confirming Party
        return allRoles.filter(role => role.id === "client" || role.id === "confirming-party");
      default:
        return allRoles;
    }
  };

  const availableRoles = getAvailableRoles();

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
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Verity AI" className="h-12" />
            <h1 className="text-3xl font-bold text-foreground">Confirmation Tool</h1>
          </div>
          {userRole && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Logged in as: <span className="font-semibold capitalize">{userRole.replace("-", " ")}</span>
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem("userRole");
                  setUserRole(null);
                  navigate("/");
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section with Role Selection */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <img src="/logo_name.png" alt="Verity AI" className="h-16" />
            </div>
            <h2 className="text-5xl font-bold text-foreground leading-tight">
              Professional Audit Confirmation Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your audit confirmation process with automated sample generation, 
              digital authorization, and comprehensive working papers. Built for modern audit teams.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {userRole ? "Select Role to Access" : "Select Your Role"}
              </h3>
              <p className="text-muted-foreground">
                {userRole 
                  ? "Choose how you want to access the Confirmation Tool"
                  : "Choose your role to get started"}
              </p>
            </div>

            <div className={`grid gap-6 ${availableRoles.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} max-w-5xl mx-auto`}>
              {availableRoles.map((role, index) => {
                const Icon = role.icon;
                return (
                  <Card 
                    key={role.id}
                    className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => navigate(role.route)}
                  >
                    <div className={`bg-${role.color}/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-8 w-8 text-${role.color}`} />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground text-center mb-3">
                      {role.title}
                    </h3>
                    <p className="text-muted-foreground text-center mb-6">
                      {role.description}
                    </p>
                    <Button 
                      className="w-full"
                      variant={role.id === "auditor" ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(role.route);
                      }}
                    >
                      Continue as {role.title}
                    </Button>
                  </Card>
                );
              })}
            </div>

            {!userRole && (
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Don't have an account? Contact your administrator to set up access.
                </p>
              </div>
            )}
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

      {/* Three Roles Section - Keep this for informational purposes */}
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
          {!userRole && (
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              size="lg" 
              variant="secondary"
              className="h-12 px-8"
            >
              Get Started Now
            </Button>
          )}
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Verity Audit Solutions. Professional audit confirmation platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
