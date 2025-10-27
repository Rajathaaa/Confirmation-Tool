import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, Eye, Download } from "lucide-react";

interface AuthorizationLetter {
  id: string;
  area: string;
  confirmingParty: string;
  amount: string;
  recipientName: string;
  recipientOrg: string;
  recipientEmail: string;
  clientName: string;
  clientEmail: string;
  status: "pending" | "authorized" | "rejected";
  authorizedBy?: string;
  authorizedDate?: string;
  authorizedIP?: string;
}

const mockLetters: AuthorizationLetter[] = [
  {
    id: "AL-001",
    area: "Trade Receivables",
    confirmingParty: "ABC Corporation Ltd.",
    amount: "$125,450.00",
    recipientName: "John Smith",
    recipientOrg: "ABC Corporation Ltd.",
    recipientEmail: "john.smith@abccorp.com",
    clientName: "Sarah Johnson",
    clientEmail: "sarah.j@techcorp.com",
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-20 14:35:22",
    authorizedIP: "192.168.1.105"
  },
  {
    id: "AL-002",
    area: "Trade Receivables",
    confirmingParty: "XYZ Industries",
    amount: "$89,230.50",
    recipientName: "Emily Chen",
    recipientOrg: "XYZ Industries",
    recipientEmail: "e.chen@xyzind.com",
    clientName: "Sarah Johnson",
    clientEmail: "sarah.j@techcorp.com",
    status: "pending"
  },
  {
    id: "AL-003",
    area: "Trade Payables",
    confirmingParty: "Global Supplies Inc.",
    amount: "$45,890.00",
    recipientName: "Michael Brown",
    recipientOrg: "Global Supplies Inc.",
    recipientEmail: "m.brown@globalsupplies.com",
    clientName: "Sarah Johnson",
    clientEmail: "sarah.j@techcorp.com",
    status: "pending"
  }
];

export const ClientAuthorization = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "authorized":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Authorized
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Client Authorization</h2>
        <p className="text-muted-foreground">
          Review and track authorization letters generated from confirmation samples
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authorization Letters</CardTitle>
          <CardDescription>
            Client authorization workflow for confirmation requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Letter ID</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Confirming Party</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLetters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell className="font-medium">{letter.id}</TableCell>
                    <TableCell>{letter.area}</TableCell>
                    <TableCell>{letter.confirmingParty}</TableCell>
                    <TableCell className="font-semibold">{letter.amount}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{letter.recipientName}</p>
                        <p className="text-xs text-muted-foreground">{letter.recipientEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{letter.clientName}</p>
                        <p className="text-xs text-muted-foreground">{letter.clientEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(letter.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Authorization Log */}
      <Card>
        <CardHeader>
          <CardTitle>Authorization Audit Log</CardTitle>
          <CardDescription>Detailed log of all authorization activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockLetters
              .filter(l => l.status === "authorized")
              .map((letter) => (
                <div key={letter.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{letter.id} - {letter.confirmingParty}</p>
                      <p className="text-sm text-muted-foreground">
                        Authorized by: <span className="font-medium">{letter.authorizedBy}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Date & Time: {letter.authorizedDate}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        IP Address: {letter.authorizedIP}
                      </p>
                    </div>
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Authorized
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
