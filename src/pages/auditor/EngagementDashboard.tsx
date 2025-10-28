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
      {/* Left Panel - Section Navigation */}
      <div className="w-80 border-r bg-card/50 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Sections</h2>
          </div>
        </div>

        <Tabs defaultValue="sample" className="flex-1 flex flex-col" orientation="vertical">
          <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 gap-1">
            <TabsTrigger value="sample" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10">
              <FileText className="h-4 w-4" />
              Sample Generation
            </TabsTrigger>
            <TabsTrigger value="authorization" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10">
              <FileCheck className="h-4 w-4" />
              Client Authorization
            </TabsTrigger>
            <TabsTrigger value="details" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10">
              <Building2 className="h-4 w-4" />
              Confirming Party
            </TabsTrigger>
            <TabsTrigger value="rollout" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10">
              <Send className="h-4 w-4" />
              Rollout & Reminder
            </TabsTrigger>
            <TabsTrigger value="workingpaper" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10">
              <FileText className="h-4 w-4" />
              Working Paper
            </TabsTrigger>
            <TabsTrigger value="access" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10">
              <Users className="h-4 w-4" />
              Access & Roles
            </TabsTrigger>
            <TabsTrigger value="archival" className="w-full justify-start gap-2 data-[state=active]:bg-primary/10">
              <Archive className="h-4 w-4" />
              Archival
            </TabsTrigger>
          </TabsList>

          {/* Main Area */}
          <div className="flex-1 flex flex-col">
            <TabsContent value="sample" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <SampleGeneration />
            </TabsContent>

            <TabsContent value="authorization" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ClientAuthorization />
            </TabsContent>

            <TabsContent value="details" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ConfirmingPartyDetails />
            </TabsContent>

            <TabsContent value="rollout" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <RolloutReminder />
            </TabsContent>

            <TabsContent value="workingpaper" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <WorkingPaper />
            </TabsContent>

            <TabsContent value="access" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <AccessRoles />
            </TabsContent>

            <TabsContent value="archival" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <Archival />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right Panel - Engagements List */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Engagements</h2>
            <Button 
              onClick={() => navigate("/auditor/create-engagement")} 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Engagement
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search engagements..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEngagements.map((engagement) => (
              <Card
                key={engagement.id}
                className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                  engagement.id === id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => navigate(`/auditor/engagement/${engagement.id}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {engagement.clientName}
                    </h3>
                    <Badge className={getStatusColor(engagement.status)}>
                      {engagement.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{engagement.id}</p>
                    <p className="text-sm text-muted-foreground">Period End: {engagement.periodEnd}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <FileText className="h-4 w-4" />
                    <span>{engagement.confirmationsCount} confirmations</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementDashboard;
