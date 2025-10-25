import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileCheck, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Confirmation Tool</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground">Select Your Role</h2>
            <p className="text-lg text-muted-foreground">
              Choose how you want to access the Confirmation Tool
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            {roles.map((role, index) => (
              <Card 
                key={role.id}
                className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(role.route)}
              >
                <div className={`bg-${role.color}/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <role.icon className={`h-8 w-8 text-${role.color}`} />
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
                  onClick={() => navigate(role.route)}
                >
                  Continue as {role.title}
                </Button>
              </Card>
            ))}
          </div>

          <div className="text-center pt-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-muted-foreground"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
