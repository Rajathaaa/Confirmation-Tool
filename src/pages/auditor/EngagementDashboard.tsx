import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Shield, FileText, Users, Send, FileCheck, Archive, Building2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { SampleGeneration } from "./sections/SampleGeneration";
import { ClientAuthorization } from "./sections/ClientAuthorization";
import { ConfirmingPartyDetails } from "./sections/ConfirmingPartyDetails";
import { RolloutReminder } from "./sections/RolloutReminder";
import { WorkingPaper } from "./sections/WorkingPaper";
import { AccessRoles } from "./sections/AccessRoles";
import { Archival } from "./sections/Archival";
import { formatIndianDate } from "@/lib/utils";

const EngagementDashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("sample");

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

  const navItems = [
    { id: "sample", label: "Sample Generation", icon: FileText },
    { id: "authorization", label: "Client Authorization", icon: FileCheck },
    { id: "details", label: "Confirming Party", icon: Building2 },
    { id: "rollout", label: "Rollout & Reminder", icon: Send },
    { id: "workingpaper", label: "Working Paper", icon: FileText },
    { id: "access", label: "Access & Roles", icon: Users },
    { id: "archival", label: "Archival", icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex">
      {/* Left Panel - Navigation */}
      <div className="w-64 border-r bg-card/50 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Verity AI" className="h-6" />
            <h2 className="text-lg font-bold text-foreground">Navigation</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-2 ${
                    isActive ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              );
            })}
          </div>
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
                <p className="text-sm text-muted-foreground">{currentEngagement.id} • Period End: {formatIndianDate(currentEngagement.periodEnd)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="px-3 py-1.5 rounded-md shadow-sm hover:shadow transition-all"
                onClick={() => navigate("/")}
              >
                Return to Home
              </Button>
              <Badge className={getStatusColor(currentEngagement.status)}>
                {currentEngagement.status}
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "sample" && <SampleGeneration />}
          {activeTab === "authorization" && <ClientAuthorization />}
          {activeTab === "details" && <ConfirmingPartyDetails />}
          {activeTab === "rollout" && <RolloutReminder />}
          {activeTab === "workingpaper" && <WorkingPaper />}
          {activeTab === "access" && <AccessRoles />}
          {activeTab === "archival" && <Archival />}
        </div>
      </div>
    </div>
  );
};

export default EngagementDashboard;
