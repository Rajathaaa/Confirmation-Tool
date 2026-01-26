import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Search, FileText, Calendar, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { formatIndianDate } from "@/lib/utils"; // Add this import

const Engagements = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - in real app, this would come from backend
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo_name.png" alt="Verity AI" className="h-10" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Auditor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your audit engagements</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate("/")} 
              size="lg"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 animate-fade-in">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search engagements by client or ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Engagements List */}
        <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Open Engagements ({filteredEngagements.length})
            </h2>
            <Button onClick={() => navigate("/auditor/create-engagement")}>
              <Plus className="h-4 w-4 mr-2" />
              New Engagement
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredEngagements.map((engagement, index) => (
              <Card 
                key={engagement.id}
                className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/auditor/engagement/${engagement.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-lg group-hover:scale-110 transition-transform">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {engagement.clientName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{engagement.id}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Period End: {formatIndianDate(engagement.periodEnd)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Created: {engagement.createdDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{engagement.confirmationsCount} Confirmations</span>
                      </div>
                    </div>
                  </div>

                  <Badge className={getStatusColor(engagement.status)}>
                    {engagement.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {filteredEngagements.length === 0 && (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No engagements found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Try adjusting your search terms" : "Create your first engagement to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/auditor/create-engagement")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Engagement
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Engagements;
