import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const mockConfirmations: ConfirmationRequest[] = [
  {
    id: "CNF-001",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Cash & Cash Equivalents",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-15"
  },
  {
    id: "CNF-002",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Trade Receivables",
    status: "draft",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-16"
  },
  {
    id: "CNF-003",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Litigations & Claims",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-17"
  },
  {
    id: "CNF-004",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Related Party Disclosure",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-18"
  },
  {
    id: "CNF-005",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Borrowings",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-19"
  },
  {
    id: "CNF-006",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Inventory",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-20"
  },
  {
    id: "CNF-007",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Assets - Security Deposits",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-21"
  },
  {
    id: "CNF-008",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Liabilities - Security Deposits",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-22"
  },
  {
    id: "CNF-009",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Receivables - Advance to Supplier",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-23"
  },
  {
    id: "CNF-010",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Receivables - Capital Advances",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-24"
  },
  {
    id: "CNF-011",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Liabilities - Advance from Customer",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-25"
  },
  {
    id: "CNF-012",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Liabilities - Capex Vendors",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-26"
  },
  {
    id: "CNF-013",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Plan Assets",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-27"
  },
  {
    id: "CNF-014",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Trustee",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-28"
  },
  {
    id: "CNF-015",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Trade Payables",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-29"
  }
];

const ConfirmingPartyConfirmations = () => {
  const navigate = useNavigate();

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
                  {mockConfirmations.map((confirmation) => (
                    <TableRow key={confirmation.id}>
                      <TableCell className="font-medium">
                        {confirmation.confirmationFor}
                      </TableCell>
                      <TableCell>{confirmation.auditFirm}</TableCell>
                      <TableCell>{confirmation.auditorName}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {confirmation.auditorEmail}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{confirmation.area}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(confirmation.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNavigate(confirmation)}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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