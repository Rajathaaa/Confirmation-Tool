import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Download, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AuthorizationRequest {
  id: string;
  area: string;
  confirmingParty: string;
  recipientEmail: string;
  recipientName: string;
  remarksByAuditor?: string;
  attachmentByAuditor?: string[];
  status: "pending" | "authorized" | "rejected";
  authorizedBy?: string;
  authorizedDate?: string;
}

// Mock client user - in real app, this would come from authentication context
// Change this to "r.chen@techcorp.com" to test Viewer role
const currentUserEmail = "sarah.j@techcorp.com"; // For Authorizer
// const currentUserEmail = "r.chen@techcorp.com"; // For Viewer - uncomment to test

// Mock client users (matching AccessRoles structure)
const mockClientUsers = [
  {
    id: "CL-001",
    name: "Sarah Johnson",
    designation: "CFO",
    email: "sarah.j@techcorp.com",
    role: "Authorizer" as const,
    areas: ["Trade Receivables", "Trade Payables", "Cash & Cash Equivalents"]
  },
  {
    id: "CL-002",
    name: "Robert Chen",
    designation: "Finance Manager",
    email: "r.chen@techcorp.com",
    role: "Viewer" as const,
    areas: ["Trade Receivables"]
  }
];

// Get current user's role
const getCurrentUserRole = () => {
  const currentUser = mockClientUsers.find(user => user.email === currentUserEmail);
  return currentUser?.role || null;
};

// Mock authorization requests
const mockAuthorizationRequests: AuthorizationRequest[] = [
  {
    id: "AUTH-001",
    area: "Trade Receivables",
    confirmingParty: "ABC Corporation Ltd.",
    recipientEmail: "john.smith@abccorp.com",
    recipientName: "John Smith",
    remarksByAuditor: "Please confirm the outstanding balance as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_001.pdf"],
    status: "pending"
  },
  {
    id: "AUTH-002",
    area: "Trade Payables",
    confirmingParty: "Global Supplies Inc.",
    recipientEmail: "m.brown@globalsupplies.com",
    recipientName: "Michael Brown",
    remarksByAuditor: "Kindly review and authorize this confirmation request.",
    attachmentByAuditor: ["authorization_letter_002.pdf"],
    status: "pending"
  },
  {
    id: "AUTH-003",
    area: "Cash & Cash Equivalents",
    confirmingParty: "XYZ Bank",
    recipientEmail: "contact@xyzbank.com",
    recipientName: "Jane Doe",
    remarksByAuditor: "Confirmation request for bank balances.",
    attachmentByAuditor: [],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-20 14:35:22"
  },
  {
    id: "AUTH-004",
    area: "Trade Receivables",
    confirmingParty: "DEF Solutions Ltd.",
    recipientEmail: "lisa.wong@defsolutions.com",
    recipientName: "Lisa Wong",
    remarksByAuditor: "Additional confirmation required.",
    attachmentByAuditor: ["authorization_letter_004.pdf"],
    status: "rejected",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-21 10:15:00"
  }
];

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(mockAuthorizationRequests);
  const userRole = getCurrentUserRole();

  // Check if user has access
  const hasAccess = userRole !== null;

  const handleAuthorize = (id: string) => {
    if (userRole !== "Authorizer") return; // Safety check
    
    setRequests(requests.map(req => 
      req.id === id 
        ? { 
            ...req, 
            status: "authorized" as const,
            authorizedBy: mockClientUsers.find(u => u.email === currentUserEmail)?.name || "Unknown",
            authorizedDate: new Date().toISOString()
          }
        : req
    ));
    alert("Confirmation authorized successfully!");
  };

  const handleReject = (id: string) => {
    if (userRole !== "Authorizer") return; // Safety check
    
    setRequests(requests.map(req => 
      req.id === id 
        ? { 
            ...req, 
            status: "rejected" as const,
            authorizedBy: mockClientUsers.find(u => u.email === currentUserEmail)?.name || "Unknown",
            authorizedDate: new Date().toISOString()
          }
        : req
    ));
    alert("Confirmation rejected.");
  };

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
          <Badge variant="outline">
            Pending
          </Badge>
        );
    }
  };

  // Show access denied if user email is not in client users list
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Client Dashboard</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <Card className="p-12 text-center max-w-2xl mx-auto animate-fade-in">
            <div className="bg-warning/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-warning" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Access Denied</h2>
            <p className="text-lg text-muted-foreground mb-8">
              This page is only accessible to users whose email ID has been added by an Auditor in the Client Role. 
              Please contact your auditor to request access.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/")}>
                Return to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentUser = mockClientUsers.find(u => u.email === currentUserEmail);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Client Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Logged in as: {currentUser?.name} ({userRole})
                </p>
              </div>
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
            <CardTitle>Authorization Requests</CardTitle>
            <CardDescription>
              {userRole === "Authorizer" 
                ? "Review and authorize confirmation requests from auditors"
                : "View confirmation requests (View Only - No actions available)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead>Confirming Party</TableHead>
                    <TableHead>Recipient Email</TableHead>
                    <TableHead>Recipient Name</TableHead>
                    <TableHead>Remarks by Auditor</TableHead>
                    <TableHead>Attachment by Auditor</TableHead>
                    <TableHead className="text-right">Authorize?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.area}</TableCell>
                      <TableCell>{request.confirmingParty}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {request.recipientEmail}
                        </code>
                      </TableCell>
                      <TableCell>{request.recipientName}</TableCell>
                      <TableCell>
                        {request.remarksByAuditor ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-left h-auto p-1"
                                disabled={false}
                              >
                                <span className="text-sm text-muted-foreground line-clamp-1">
                                  {request.remarksByAuditor}
                                </span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Remarks by Auditor</DialogTitle>
                                <DialogDescription>
                                  Additional notes from the auditor
                                </DialogDescription>
                              </DialogHeader>
                              <div className="p-4 bg-muted rounded-md">
                                <p className="text-sm">{request.remarksByAuditor}</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.attachmentByAuditor && request.attachmentByAuditor.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {request.attachmentByAuditor.map((file, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="w-fit"
                                disabled={false}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                {file}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No attachments</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* For Authorizer: Show buttons for pending, status for completed */}
                        {userRole === "Authorizer" ? (
                          request.status === "pending" ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-success text-success-foreground hover:bg-success/90"
                                onClick={() => handleAuthorize(request.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Authorize
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleReject(request.id)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              {getStatusBadge(request.status)}
                              {request.authorizedBy && (
                                <span className="text-xs text-muted-foreground">
                                  By: {request.authorizedBy}
                                </span>
                              )}
                              {request.authorizedDate && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(request.authorizedDate).toLocaleString()}
                                </span>
                              )}
                            </div>
                          )
                        ) : (
                          /* For Viewer: Always show only status - same format as Authorizer's completed status */
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(request.status)}
                            {request.authorizedBy && (
                              <span className="text-xs text-muted-foreground">
                                By: {request.authorizedBy}
                              </span>
                            )}
                            {request.authorizedDate && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(request.authorizedDate).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
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

export default ClientDashboard;
