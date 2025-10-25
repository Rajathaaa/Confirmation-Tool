import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileCheck, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ClientDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Client Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <Card className="p-12 text-center max-w-2xl mx-auto animate-fade-in">
          <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Client Authorization Portal</h2>
          <p className="text-lg text-muted-foreground mb-8">
            This section will display authorization letters from auditors for your review and approval. 
            The full client authorization workflow will be implemented in the next iteration.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/")}>
              Return to Home
            </Button>
            <Button variant="outline" onClick={() => navigate("/role-selection")}>
              Switch Role
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
