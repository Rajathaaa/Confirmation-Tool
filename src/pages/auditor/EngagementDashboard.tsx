import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  ArrowLeft, 
  FileCheck, 
  UserCheck, 
  Globe, 
  Send, 
  FileText, 
  Users, 
  Archive 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const EngagementDashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock engagement data
  const engagement = {
    id: id || "ENG-2025-001",
    clientName: "TechCorp Industries Ltd.",
    periodEnd: "2024-12-31",
    status: "In Progress"
  };

  const sections = [
    {
      id: "sample-generation",
      title: "Confirmation Sample Generation",
      description: "Generate confirmation samples using random or monetary unit basis",
      icon: FileCheck,
      color: "primary",
      route: `/auditor/engagement/${id}/sample-generation`,
      count: 5
    },
    {
      id: "client-authorization",
      title: "Client Authorization",
      description: "Manage client authorization letters and approval workflow",
      icon: UserCheck,
      color: "accent",
      route: `/auditor/engagement/${id}/client-authorization`,
      count: 12
    },
    {
      id: "confirming-party",
      title: "Details of Confirming Party",
      description: "Automated domain testing and party verification",
      icon: Globe,
      color: "info",
      route: `/auditor/engagement/${id}/confirming-party`,
      count: 8
    },
    {
      id: "rollout",
      title: "Confirmation Rollout & Reminder",
      description: "Send confirmations and manage reminders to confirming parties",
      icon: Send,
      color: "success",
      route: `/auditor/engagement/${id}/rollout`,
      count: 15
    },
    {
      id: "working-paper",
      title: "Confirmation Working Paper",
      description: "Review and organize confirmation responses by area",
      icon: FileText,
      color: "warning",
      route: `/auditor/engagement/${id}/working-paper`,
      count: 10
    },
    {
      id: "access-roles",
      title: "Access & Roles",
      description: "Manage user access and role assignments",
      icon: Users,
      color: "primary",
      route: `/auditor/engagement/${id}/access-roles`,
      count: 6
    },
    {
      id: "archival",
      title: "Archival",
      description: "Archive completed engagement data",
      icon: Archive,
      color: "muted",
      route: `/auditor/engagement/${id}/archival`,
      count: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/auditor/engagements")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{engagement.clientName}</h1>
                  <Badge className="bg-info text-info-foreground">{engagement.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Engagement: {engagement.id} • Period End: {engagement.periodEnd}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-2">Engagement Sections</h2>
          <p className="text-muted-foreground">
            Select a section to manage your audit confirmation workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <Card 
              key={section.id}
              className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(section.route)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`bg-${section.color}/10 p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <section.icon className={`h-6 w-6 text-${section.color}`} />
                </div>
                {section.count !== null && (
                  <Badge variant="secondary" className="text-xs">
                    {section.count} items
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EngagementDashboard;
