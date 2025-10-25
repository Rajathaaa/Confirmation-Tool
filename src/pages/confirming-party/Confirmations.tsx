import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ConfirmingPartyConfirmations = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Confirming Party Portal</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <Card className="p-12 text-center max-w-2xl mx-auto animate-fade-in">
          <div className="bg-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Confirmation Response Portal</h2>
          <p className="text-lg text-muted-foreground mb-8">
            This section will display confirmation requests from auditors that require your response. 
            Multiple confirmation types including Trade Receivables, Cash & Cash Equivalents, and more 
            will be implemented in the next iteration.
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

export default ConfirmingPartyConfirmations;
