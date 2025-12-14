import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface ConfirmationRequest {
  id: string;
  confirmationFor: string; // Client organization name
  auditFirm: string;
  auditorName: string;
  auditorEmail: string;
  area: string;
  status: "pending" | "draft" | "submitted";
  periodEndDate: string;
  createdAt: string;
}

const ConfirmingPartyConfirmations = () => {
  const navigate = useNavigate();
  const [confirmations, setConfirmations] = useState<ConfirmationRequest[]>([]);

  // Fetch pending confirmations from SharePoint on component mount
  useEffect(() => {
    fetchPendingConfirmations();
  }, []);

  const fetchPendingConfirmations = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/get-pending-confirmations');
      if (!response.ok) {
        throw new Error('Failed to fetch pending confirmations');
      }
      const result = await response.json();
      const pendingData = result.data || { confirmations: [] };
      
      console.log('📥 Fetched pending confirmations from SharePoint:', pendingData);
      
      // Convert SharePoint data to local format
      if (pendingData.confirmations && pendingData.confirmations.length > 0) {
        const convertedConfirmations = pendingData.confirmations.map((conf: any) => ({
          id: conf.id || `CNF-${Date.now()}`,
          confirmationFor: conf.confirmationFor || "",
          auditFirm: conf.auditFirm || "",
          auditorName: conf.auditorName || "",
          auditorEmail: conf.auditorEmail || "",
          area: conf.area || "",
          status: (conf.status || "pending") as "pending" | "draft" | "submitted",
          periodEndDate: conf.periodEndDate || "",
          createdAt: conf.createdAt || conf.sentAt || ""
        }));
        setConfirmations(convertedConfirmations);
      }
    } catch (error: any) {
      console.error('Error fetching pending confirmations:', error);
      // Keep using empty array if fetch fails
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-success text-success-foreground">Submitted</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleNavigate = (confirmation: ConfirmationRequest) => {
    navigate(`/confirming-party/confirmation/${confirmation.id}`, {
      state: { confirmation }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Confirming Party Portal</h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Confirmations</CardTitle>
            <CardDescription>
              List of all confirmations that require your response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Confirmation For</TableHead>
                    <TableHead>Audit Firm</TableHead>
                    <TableHead>Auditor Name</TableHead>
                    <TableHead>Auditor Email</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Navigate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No pending confirmations at this time.
                      </TableCell>
                    </TableRow>
                  ) : (
                    confirmations.map((confirmation) => (
                      <TableRow key={confirmation.id}>
                        <TableCell className="font-medium">{confirmation.confirmationFor}</TableCell>
                        <TableCell>{confirmation.auditFirm}</TableCell>
                        <TableCell>{confirmation.auditorName}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {confirmation.auditorEmail}
                          </code>
                        </TableCell>
                        <TableCell>{confirmation.area}</TableCell>
                        <TableCell>{getStatusBadge(confirmation.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigate(confirmation)}
                          >
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmingPartyConfirmations;