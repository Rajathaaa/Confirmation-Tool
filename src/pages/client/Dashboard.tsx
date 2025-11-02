import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Download, XCircle, AlertCircle, Eye, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatIndianDateTime, formatIndianNumber, formatIndianDate } from "@/lib/utils";

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
  confirmationStatus?: "pending" | "confirmed" | "not-confirmed"; // New field
  confirmedDate?: string; // New field
  formData?: any; // New field - stores filled confirmation form data
  remarks?: string; // Remarks from confirming party
  attachments?: string[]; // Attachments from confirming party
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
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-20 14:35:22",
    confirmationStatus: "confirmed",
    confirmedDate: "2025-01-22 10:30:00",
    formData: {
      amounts: [
        { amount: "125450.00", currency: "USD" },
        { amount: "89500.00", currency: "EUR" }
      ],
      organizationName: "ABC Corporation Ltd.",
      name: "John Smith",
      designation: "Finance Director",
      isCertified: true
    },
    remarks: "We confirm the outstanding balance as of December 31, 2024.",
    attachments: ["confirmation_response_001.pdf"]
  },
  {
    id: "AUTH-002",
    area: "Trade Payables",
    confirmingParty: "Global Supplies Inc.",
    recipientEmail: "m.brown@globalsupplies.com",
    recipientName: "Michael Brown",
    remarksByAuditor: "Kindly review and authorize this confirmation request.",
    attachmentByAuditor: ["authorization_letter_002.pdf"],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-19 15:00:00",
    confirmationStatus: "pending",
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
    authorizedDate: "2025-01-20 14:35:22",
    confirmationStatus: "not-confirmed",
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
    authorizedDate: "2025-01-21 10:15:00",
    confirmationStatus: "not-confirmed",
  }
];

// Component to render confirmation form template in read-only mode (for client view)
const ConfirmationFormView = ({ request }: { request: AuthorizationRequest }) => {
  if (!request.formData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No confirmation data submitted yet.</p>
      </div>
    );
  }

  const renderFormByArea = () => {
    switch (request.area) {
      case "Trade Receivables":
      case "Trade Payables":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Kindly confirm to us the following information in respect of amounts {request.area === "Trade Receivables" ? "receivable from" : "payable to"} you as on [Period-end Date]:
            </p>
            {request.formData.amounts && request.formData.amounts.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.formData.amounts.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {row.amount ? formatIndianNumber(row.amount) : "-"}
                        </TableCell>
                        <TableCell>{row.currency || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );

      case "Cash & Cash Equivalents":
      case "Borrowings":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-6">
              Kindly confirm the below balances to us pertaining to the account balances of [Client Organization] as are held with you as on [Period-end Date]:
            </p>
            
            {request.formData.currentAccounts && request.formData.currentAccounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">1. Current Accounts</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Designation of Account</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Balance [Credit/(Debit)]</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {request.formData.currentAccounts.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{row.designation || "-"}</TableCell>
                          <TableCell>{row.currency || "-"}</TableCell>
                          <TableCell>
                            {row.balance ? formatIndianNumber(row.balance) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Add other sections as needed */}
            {request.formData.interestAccrued && (
              <div className="space-y-2 pt-4 border-t">
                <Label>11. Interest Accrued</Label>
                <p className="font-medium">
                  {request.formData.interestAccrued ? formatIndianNumber(request.formData.interestAccrued) : "-"}
                </p>
              </div>
            )}
          </div>
        );

      case "Litigations & Claims":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Kindly furnish a list that describes and evaluates pending or threatened litigations, claims, and assessments...
            </p>
            {request.formData.mattersDetails && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{request.formData.mattersDetails}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Form template for {request.area}
            </p>
            {request.formData && Object.keys(request.formData).length > 0 && (
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(request.formData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b pb-4">
        <p className="text-sm text-muted-foreground">
          Dear {request.recipientName},
        </p>
        {renderFormByArea()}
      </div>

      {request.formData.isCertified && (
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-success mt-0.5" />
            <p className="text-sm">
              We certify that the above particulars (read alongwith the attachments if any) are full and correct.
            </p>
          </div>
        </div>
      )}

      {request.formData.name && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {request.formData.organizationName && (
            <div>
              <p className="text-sm text-muted-foreground">Organization Name</p>
              <p className="font-medium">{request.formData.organizationName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{request.formData.name}</p>
          </div>
          {request.formData.designation && (
            <div>
              <p className="text-sm text-muted-foreground">Designation</p>
              <p className="font-medium">{request.formData.designation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

  const getConfirmationStatusBadge = (status?: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "not-confirmed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Not Confirmed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
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
                    <TableHead>Confirmation Status</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getConfirmationStatusBadge(request.confirmationStatus)}
                          {request.formData && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Confirmation Response - {request.id}</DialogTitle>
                                  <DialogDescription>
                                    View confirmation details submitted by {request.confirmingParty}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                  {/* Confirmation Metadata */}
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Area</p>
                                      <p className="font-medium">{request.area}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Confirming Party</p>
                                      <p className="font-medium">{request.confirmingParty}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Recipient Name</p>
                                      <p className="font-medium">{request.recipientName}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Recipient Email</p>
                                      <p className="font-medium">{request.recipientEmail}</p>
                                    </div>
                                    {request.confirmedDate && (
                                      <div>
                                        <p className="text-muted-foreground">Confirmed Date</p>
                                        <p className="font-medium">{formatIndianDateTime(request.confirmedDate)}</p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-muted-foreground">Status</p>
                                      {getConfirmationStatusBadge(request.confirmationStatus)}
                                    </div>
                                  </div>

                                  {/* Confirmation Form Template Section */}
                                  <div className="pt-4 border-t">
                                    <h3 className="text-lg font-semibold mb-4">Confirmation Form Template & Response</h3>
                                    <Card>
                                      <CardContent className="pt-6">
                                        <ConfirmationFormView request={request} />
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Remarks from Confirming Party */}
                                  {request.remarks && (
                                    <div className="pt-4 border-t">
                                      <p className="text-sm font-medium mb-2">Remarks from Confirming Party</p>
                                      <div className="bg-muted p-3 rounded-md">
                                        <p className="text-sm">{request.remarks}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Attachments from Confirming Party */}
                                  {request.attachments && request.attachments.length > 0 ? (
                                    <div className="pt-4 border-t">
                                      <p className="text-sm font-medium mb-2">Attachments from Confirming Party</p>
                                      <div className="space-y-2">
                                        {request.attachments.map((file, index) => (
                                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm flex-1">{file}</span>
                                            <Button size="sm" variant="ghost">
                                              <Download className="h-4 w-4 mr-1" />
                                              Download
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="pt-4 border-t">
                                      <p className="text-sm font-medium mb-2">Attachments from Confirming Party</p>
                                      <p className="text-sm text-muted-foreground">No attachments provided</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* For Authorizer: Show buttons for pending, status for completed */}
                        {userRole === "Authorizer" ? (
                          request.status === "pending" ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                className="bg-success text-success-foreground hover:bg-success/90 min-w-[100px]"
                                onClick={() => handleAuthorize(request.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1.5" />
                                Authorize
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="min-w-[100px]"
                                onClick={() => handleReject(request.id)}
                              >
                                <XCircle className="h-3 w-3 mr-1.5" />
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
                                  {formatIndianDateTime(request.authorizedDate)}
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
                                {formatIndianDateTime(request.authorizedDate)}
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
