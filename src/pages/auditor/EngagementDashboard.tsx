import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Plus, FileText, Search, Users, Send, FileCheck, Archive, Globe, UserCheck, Building2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { SampleGeneration } from "./sections/SampleGeneration";
import { ClientAuthorization } from "./sections/ClientAuthorization";
import { ConfirmingPartyDetails } from "./sections/ConfirmingPartyDetails";
import { RolloutReminder } from "./sections/RolloutReminder";
import { WorkingPaper } from "./sections/WorkingPaper";
import { AccessRoles } from "./sections/AccessRoles";
import { Archival } from "./sections/Archival";

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

        {/* Main Content with Tabs */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="sample" className="w-full">
            <TabsList className="w-full justify-start mb-6 flex-wrap h-auto">
              <TabsTrigger value="sample" className="gap-2">
                <FileText className="h-4 w-4" />
                Sample Generation
              </TabsTrigger>
              <TabsTrigger value="authorization" className="gap-2">
                <FileCheck className="h-4 w-4" />
                Client Authorization
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <Building2 className="h-4 w-4" />
                Confirming Party
              </TabsTrigger>
              <TabsTrigger value="rollout" className="gap-2">
                <Send className="h-4 w-4" />
                Rollout & Reminder
              </TabsTrigger>
              <TabsTrigger value="workingpaper" className="gap-2">
                <FileText className="h-4 w-4" />
                Working Paper
              </TabsTrigger>
              <TabsTrigger value="access" className="gap-2">
                <Users className="h-4 w-4" />
                Access & Roles
              </TabsTrigger>
              <TabsTrigger value="archival" className="gap-2">
                <Archive className="h-4 w-4" />
                Archival
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sample" className="mt-0">
              <SampleGeneration />
            </TabsContent>

            <TabsContent value="authorization" className="mt-0">
              <ClientAuthorization />
            </TabsContent>

            <TabsContent value="details" className="mt-0">
              <ConfirmingPartyDetails />
            </TabsContent>

            <TabsContent value="rollout" className="mt-0">
              <RolloutReminder />
            </TabsContent>

            <TabsContent value="workingpaper" className="mt-0">
              <WorkingPaper />
            </TabsContent>

            <TabsContent value="access" className="mt-0">
              <AccessRoles />
            </TabsContent>

            <TabsContent value="archival" className="mt-0">
              <Archival />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EngagementDashboard;
