import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Plus, FileText, Search, Users, Send, FileCheck, Archive, Globe, UserCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

const EngagementDashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for engagements
  const engagements = [
    {
      id: "ENG-2025-001",
      clientName: "TechCorp Industries Ltd.",
      periodEnd: "2024-12-31",
      status: "In Progress",
      createdDate: "2025-01-15",
      confirmationsCount: 24
    },
    {
      id: "ENG-2025-002",
      clientName: "Global Finance Solutions",
      periodEnd: "2024-12-31",
      status: "Draft",
      createdDate: "2025-01-20",
      confirmationsCount: 0
    },
    {
      id: "ENG-2024-089",
      clientName: "Manufacturing Co.",
      periodEnd: "2024-12-31",
      status: "Completed",
      createdDate: "2024-12-01",
      confirmationsCount: 45
    }
  ];

  const currentEngagement = engagements.find(eng => eng.id === id) || engagements[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-info text-info-foreground";
      case "Draft":
        return "bg-warning text-warning-foreground";
      case "Completed":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredEngagements = engagements.filter(eng =>
    eng.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eng.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex">
      {/* Left Panel - Engagements List */}
      <div className="w-80 border-r bg-card/50 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Engagements</h2>
          </div>
          <Button 
            onClick={() => navigate("/auditor/create-engagement")} 
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Engagement
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredEngagements.map((engagement) => (
            <Card
              key={engagement.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                engagement.id === id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => navigate(`/auditor/engagement/${engagement.id}`)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                    {engagement.clientName}
                  </h3>
                  <Badge className={`${getStatusColor(engagement.status)} text-xs shrink-0`}>
                    {engagement.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{engagement.id}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{engagement.confirmationsCount} confirmations</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">{currentEngagement.clientName}</h1>
                <p className="text-sm text-muted-foreground">{currentEngagement.id} • Period End: {currentEngagement.periodEnd}</p>
              </div>
            </div>
            <Badge className={getStatusColor(currentEngagement.status)}>
              {currentEngagement.status}
            </Badge>
          </div>
        </header>

        {/* Main Content - Section Cards */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 animate-fade-in">
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
    </div>
  );
};

export default EngagementDashboard;
