import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Download, Eye, FileText, Send, Lock, CheckCircle, Clock, RotateCcw } from "lucide-react";
import { useState } from "react";
import { formatIndianDate, formatIndianDateTime, formatIndianNumber } from "@/lib/utils";

// Update interface to match RolloutReminder structure
interface ActivityLogEntry {
  timestamp: string;
  stage: string;
  action: string;
  performedBy: string;
  details: string;
  status: "completed" | "in-progress" | "pending";
}

interface Confirmation {
  id: string;
  area: string;
  confirmingParty: string;
  recipientEmail: string;
  recipientName: string;
  recipientOrg: string;
  status: "not-sent" | "sent" | "confirmed" | "locked";
  sentDate?: string;
  confirmedDate?: string;
  confirmedBy?: string;
  confirmedIP?: string;
  lockedDate?: string;
  remarks?: string;
  attachments?: string[];
  activityLog: ActivityLogEntry[];
  formData?: any;
  balanceType?: string;
  amountConfirmed?: string;
  periodEndDate?: string; // Add this
}

const AUDIT_AREAS = [
  "Trade Receivables",
  "Trade Payables",
  "Cash & Cash Equivalents",
  "Inventory",
  "Fixed Assets",
];

// Convert mockData to Confirmation format
const mockConfirmations: Record<string, Confirmation[]> = {
  "Trade Receivables": [
    {
      id: "CNF-001",
      area: "Trade Receivables",
      confirmingParty: "ABC Corporation Ltd.",
      recipientEmail: "john.smith@abccorp.com",
      recipientName: "John Smith",
      recipientOrg: "ABC Corporation Ltd.",
      status: "confirmed",
      sentDate: "2025-01-15 10:30:00",
      confirmedDate: "2025-01-18 14:22:15",
      confirmedBy: "John Smith",
      confirmedIP: "203.45.67.89",
      periodEndDate: "2024-12-31", // Add this
      balanceType: "Accounts Receivable",
      amountConfirmed: "$125,450.00",
      remarks: "Balance confirmed as of December 31, 2024. All invoices have been reviewed and verified.",
      attachments: ["confirmation_cnf001.pdf", "supporting_docs_cnf001.zip"],
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
      activityLog: [
        {
          timestamp: "2025-01-10 09:00:00",
          stage: "Creation",
          action: "Confirmation request created",
          performedBy: "Sarah Johnson (Auditor)",
          details: "Initial confirmation request generated for Trade Receivables",
          status: "completed"
        },
        {
          timestamp: "2025-01-12 14:30:00",
          stage: "Client Authorization",
          action: "Client authorization received",
          performedBy: "David Miller (Client Finance Director)",
          details: "Client approved sending confirmation to ABC Corporation Ltd.",
          status: "completed"
        },
        {
          timestamp: "2025-01-14 11:20:00",
          stage: "Domain Testing",
          action: "Email domain verified",
          performedBy: "System",
          details: "Domain abccorp.com verified and email deliverability confirmed",
          status: "completed"
        },
        {
          timestamp: "2025-01-15 10:30:00",
          stage: "Rollout",
          action: "Confirmation request sent",
          performedBy: "Sarah Johnson (Auditor)",
          details: "Email sent to john.smith@abccorp.com with confirmation request",
          status: "completed"
        },
        {
          timestamp: "2025-01-18 14:22:15",
          stage: "Response",
          action: "Confirmation received",
          performedBy: "John Smith (ABC Corporation)",
          details: "Confirming party submitted response with 2 attachments. IP: 203.45.67.89",
          status: "completed"
        }
      ]
    },
    {
      id: "CNF-004",
      area: "Trade Receivables",
      confirmingParty: "DEF Solutions Ltd.",
      recipientEmail: "lisa.wong@defsolutions.com",
      recipientName: "Lisa Wong",
      recipientOrg: "DEF Solutions Ltd.",
      status: "confirmed",
      sentDate: "2025-01-17 11:00:00",
      confirmedDate: "2025-01-19 09:15:00",
      confirmedBy: "Lisa Wong",
      confirmedIP: "198.51.100.42",
      periodEndDate: "2024-12-31", // Add this
      balanceType: "Accounts Receivable",
      amountConfirmed: "$87,230.50",
      remarks: "Confirmed with minor variance of $150",
      attachments: [],
      formData: {
        amounts: [
          { amount: "87230.50", currency: "USD" }
        ],
        organizationName: "DEF Solutions Ltd.",
        name: "Lisa Wong",
        designation: "Accounts Manager",
        isCertified: true
      },
      activityLog: [
        {
          timestamp: "2025-01-15 10:00:00",
          stage: "Creation",
          action: "Confirmation request created",
          performedBy: "Sarah Johnson (Auditor)",
          details: "Initial confirmation request generated for Trade Receivables",
          status: "completed"
        },
        {
          timestamp: "2025-01-16 15:20:00",
          stage: "Client Authorization",
          action: "Client authorization received",
          performedBy: "David Miller (Client Finance Director)",
          details: "Client approved sending confirmation to DEF Solutions Ltd.",
          status: "completed"
        },
        {
          timestamp: "2025-01-17 08:45:00",
          stage: "Domain Testing",
          action: "Email domain verified",
          performedBy: "System",
          details: "Domain defsolutions.com verified and email deliverability confirmed",
          status: "completed"
        },
        {
          timestamp: "2025-01-17 11:00:00",
          stage: "Rollout",
          action: "Confirmation request sent",
          performedBy: "Sarah Johnson (Auditor)",
          details: "Email sent to lisa.wong@defsolutions.com with confirmation request",
          status: "completed"
        },
        {
          timestamp: "2025-01-19 09:15:00",
          stage: "Response",
          action: "Confirmation received",
          performedBy: "Lisa Wong (DEF Solutions Ltd.)",
          details: "Confirming party submitted response. IP: 198.51.100.42",
          status: "completed"
        }
      ]
    }
  ],
  "Trade Payables": [
    {
      id: "CNF-003",
      area: "Trade Payables",
      confirmingParty: "Global Supplies Inc.",
      recipientEmail: "m.brown@globalsupplies.com",
      recipientName: "Michael Brown",
      recipientOrg: "Global Supplies Inc.",
      status: "confirmed",
      sentDate: "2025-01-18 14:00:00",
      confirmedDate: "2025-01-20 16:30:00",
      confirmedBy: "Michael Brown",
      confirmedIP: "192.168.1.200",
      periodEndDate: "2024-12-31", // Add this
      balanceType: "Accounts Payable",
      amountConfirmed: "$45,890.00",
      remarks: "Balance confirmed, payment terms 30 days",
      attachments: ["confirmation_cnf003.pdf"],
      formData: {
        amounts: [
          { amount: "45890.00", currency: "USD" }
        ],
        organizationName: "Global Supplies Inc.",
        name: "Michael Brown",
        designation: "Finance Manager",
        isCertified: true
      },
      activityLog: [
        {
          timestamp: "2025-01-16 09:00:00",
          stage: "Creation",
          action: "Confirmation request created",
          performedBy: "Sarah Johnson (Auditor)",
          details: "Initial confirmation request generated for Trade Payables",
          status: "completed"
        },
        {
          timestamp: "2025-01-17 11:15:00",
          stage: "Client Authorization",
          action: "Client authorization received",
          performedBy: "David Miller (Client Finance Director)",
          details: "Client approved sending confirmation to Global Supplies Inc.",
          status: "completed"
        },
        {
          timestamp: "2025-01-18 10:30:00",
          stage: "Domain Testing",
          action: "Email domain verified",
          performedBy: "System",
          details: "Domain globalsupplies.com verified and email deliverability confirmed",
          status: "completed"
        },
        {
          timestamp: "2025-01-18 14:00:00",
          stage: "Rollout",
          action: "Confirmation request sent",
          performedBy: "Sarah Johnson (Auditor)",
          details: "Email sent to m.brown@globalsupplies.com with confirmation request",
          status: "completed"
        },
        {
          timestamp: "2025-01-20 16:30:00",
          stage: "Response",
          action: "Confirmation received",
          performedBy: "Michael Brown (Global Supplies Inc.)",
          details: "Confirming party submitted response with 1 attachment. IP: 192.168.1.200",
          status: "completed"
        }
      ]
    }
  ],
  "Cash & Cash Equivalents": [],
  "Inventory": [],
  "Fixed Assets": []
};

// ConfirmationFormView component (same as RolloutReminder)
const ConfirmationFormView = ({ confirmation }: { confirmation: Confirmation }) => {
  if (!confirmation.formData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No form data submitted yet.</p>
      </div>
    );
  }

  const renderFormByArea = () => {
    switch (confirmation.area) {
      case "Trade Receivables":
      case "Trade Payables":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Kindly confirm to us the following information in respect of amounts {confirmation.area === "Trade Receivables" ? "receivable from" : "payable to"} you as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period-end Date]"}:
            </p>
            {confirmation.formData.amounts && confirmation.formData.amounts.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmation.formData.amounts.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.amount || "-"}</TableCell>
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
              Kindly confirm the below balances to us pertaining to the account balances of [Client Organization] as are held with you as on {confirmation.periodEndDate ? formatIndianDate(confirmation.periodEndDate) : "[Period-end Date]"}:
            </p>
            
            {confirmation.formData.currentAccounts && confirmation.formData.currentAccounts.length > 0 && (
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
                      {confirmation.formData.currentAccounts.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{row.designation || "-"}</TableCell>
                          <TableCell>{row.currency || "-"}</TableCell>
                          <TableCell>{row.balance || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {confirmation.formData.interestAccrued && (
              <div className="space-y-2 pt-4 border-t">
                <Label>11. Interest Accrued</Label>
                <p className="font-medium">{confirmation.formData.interestAccrued}</p>
              </div>
            )}

            {confirmation.formData.isWilfulDefaulter && (
              <div className="space-y-2 pt-4 border-t">
                <Label>13. Wilful Defaulter Status</Label>
                <p className="font-medium">{confirmation.formData.isWilfulDefaulter === "Yes" ? "Yes" : "No"}</p>
                {confirmation.formData.wilfulDefaulterRemarks && (
                  <p className="text-sm text-muted-foreground">{confirmation.formData.wilfulDefaulterRemarks}</p>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Form template for {confirmation.area}
            </p>
            {confirmation.formData && Object.keys(confirmation.formData).length > 0 && (
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(confirmation.formData, null, 2)}
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
          Dear {confirmation.recipientName},
        </p>
        {renderFormByArea()}
      </div>

      {confirmation.formData.isCertified && (
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-success mt-0.5" />
            <p className="text-sm">
              We certify that the above particulars (read alongwith the attachments if any) are full and correct.
            </p>
          </div>
        </div>
      )}

      {confirmation.formData.name && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {confirmation.formData.organizationName && (
            <div>
              <p className="text-sm text-muted-foreground">Organization Name</p>
              <p className="font-medium">{confirmation.formData.organizationName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{confirmation.formData.name}</p>
          </div>
          {confirmation.formData.designation && (
            <div>
              <p className="text-sm text-muted-foreground">Designation</p>
              <p className="font-medium">{confirmation.formData.designation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const WorkingPaper = () => {
  const [selectedArea, setSelectedArea] = useState("Trade Receivables");
  const [selectedConfirmation, setSelectedConfirmation] = useState<Confirmation | null>(null);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendRemarks, setResendRemarks] = useState("");

  const currentData = mockConfirmations[selectedArea] || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "locked":
        return (
          <Badge variant="secondary">
            <Lock className="h-3 w-3 mr-1" />
            Locked
          </Badge>
        );
      case "sent":
        return (
          <Badge className="bg-info text-info-foreground">
            <Send className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Not Sent
          </Badge>
        );
    }
  };

  const getLogStatusBadge = (status: ActivityLogEntry["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-info text-info-foreground">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
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

  const handleResendConfirmation = (id: string, area: string) => {
    const confirmations = mockConfirmations[area];
    const confirmation = confirmations.find(c => c.id === id);
    if (!confirmation) return;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // In a real app, you would update state here
    // For now, we'll just log it
    console.log(`Resending confirmation ${id} with remarks: ${resendRemarks}`);
    
    setResendRemarks("");
    setResendDialogOpen(false);
    setSelectedConfirmation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Confirmation Working Paper</h2>
          <p className="text-muted-foreground">
            Review and organize confirmation responses by audit area
          </p>
        </div>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUDIT_AREAS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedArea}</CardTitle>
              <CardDescription>
                {currentData.length} confirmation{currentData.length !== 1 ? 's' : ''} received
              </CardDescription>
            </div>
            {currentData.length > 0 && (
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Push to Main Software
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Confirming Party</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Balance Type</TableHead>
                    <TableHead>Amount Confirmed</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((confirmation) => (
                    <TableRow key={confirmation.id}>
                      <TableCell className="font-medium">{confirmation.id}</TableCell>
                      <TableCell>{confirmation.confirmingParty}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{confirmation.recipientName}</p>
                          <code className="text-xs text-muted-foreground">
                            {confirmation.recipientEmail}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>{confirmation.balanceType}</TableCell>
                      <TableCell className="font-semibold">{confirmation.amountConfirmed}</TableCell>
                      <TableCell>{confirmation.confirmedDate}</TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate" title={confirmation.remarks}>
                          {confirmation.remarks}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedConfirmation(confirmation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Confirmation Details - {confirmation.id}</DialogTitle>
                                <DialogDescription>
                                  View complete confirmation information, response, and activity log
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Status:</span>
                                  {getStatusBadge(confirmation.status)}
                                </div>

                                {/* Confirmation Metadata */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Area</p>
                                    <p className="font-medium">{confirmation.area}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Confirming Party</p>
                                    <p className="font-medium">{confirmation.confirmingParty}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Recipient Name</p>
                                    <p className="font-medium">{confirmation.recipientName}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Recipient Email</p>
                                    <p className="font-medium">{confirmation.recipientEmail}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Organization</p>
                                    <p className="font-medium">{confirmation.recipientOrg}</p>
                                  </div>
                                  {confirmation.periodEndDate && (
                                    <div>
                                      <p className="text-muted-foreground">Period End Date</p>
                                      <p className="font-medium">{formatIndianDate(confirmation.periodEndDate)}</p>
                                    </div>
                                  )}
                                  {confirmation.sentDate && (
                                    <div>
                                      <p className="text-muted-foreground">Sent Date</p>
                                      <p className="font-medium">{formatIndianDateTime(confirmation.sentDate)}</p>
                                    </div>
                                  )}
                                  {confirmation.confirmedDate && (
                                    <div>
                                      <p className="text-muted-foreground">Confirmed Date</p>
                                      <p className="font-medium">{formatIndianDateTime(confirmation.confirmedDate)}</p>
                                    </div>
                                  )}
                                  {confirmation.confirmedBy && (
                                    <div>
                                      <p className="text-muted-foreground">Confirmed By</p>
                                      <p className="font-medium">{confirmation.confirmedBy}</p>
                                    </div>
                                  )}
                                  {confirmation.confirmedIP && (
                                    <div>
                                      <p className="text-muted-foreground">IP Address</p>
                                      <p className="font-medium">{confirmation.confirmedIP}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Confirmation Form Template Section */}
                                <div className="pt-4 border-t">
                                  <h3 className="text-lg font-semibold mb-4">Confirmation Form Template & Response</h3>
                                  <Card>
                                    <CardContent className="pt-6">
                                      <ConfirmationFormView confirmation={confirmation} />
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Remarks from Confirming Party */}
                                {confirmation.remarks && (
                                  <div className="pt-4 border-t">
                                    <p className="text-sm font-medium mb-2">Remarks from Confirming Party</p>
                                    <div className="bg-muted p-3 rounded-md">
                                      <p className="text-sm">{confirmation.remarks}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Attachments from Confirming Party */}
                                {confirmation.attachments && confirmation.attachments.length > 0 ? (
                                  <div className="pt-4 border-t">
                                    <p className="text-sm font-medium mb-2">Attachments from Confirming Party</p>
                                    <div className="space-y-2">
                                      {confirmation.attachments.map((file, index) => (
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

                                {/* Activity Log Section */}
                                <div className="pt-4 border-t">
                                  <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Timestamp</TableHead>
                                          <TableHead>Stage</TableHead>
                                          <TableHead>Action</TableHead>
                                          <TableHead>Performed By</TableHead>
                                          <TableHead>Details</TableHead>
                                          <TableHead>Status</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {confirmation.activityLog.map((log, index) => (
                                          <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">
                                              {formatIndianDateTime(log.timestamp)}
                                            </TableCell>
                                            <TableCell className="font-medium">{log.stage}</TableCell>
                                            <TableCell>{log.action}</TableCell>
                                            <TableCell>{log.performedBy}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                                            <TableCell>{getLogStatusBadge(log.status)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>

                                {/* Resend Button for Confirmed Status */}
                                {confirmation.status === "confirmed" && (
                                  <div className="pt-4 border-t">
                                    <Dialog 
                                      open={resendDialogOpen && selectedConfirmation?.id === confirmation.id}
                                      onOpenChange={(open) => {
                                        setResendDialogOpen(open);
                                        if (!open) {
                                          setSelectedConfirmation(null);
                                          setResendRemarks("");
                                        }
                                      }}
                                    >
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => {
                                            setSelectedConfirmation(confirmation);
                                            setResendDialogOpen(true);
                                          }}
                                        >
                                          <RotateCcw className="h-4 w-4 mr-2" />
                                          Resend Confirmation Request
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Resend Confirmation Request</DialogTitle>
                                          <DialogDescription>
                                            Resend the confirmation request to {confirmation.recipientName} at {confirmation.recipientEmail}. 
                                            The previous confirmation will be voided and a new request will be sent.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                          <div>
                                            <Label>Reason for Resend (Optional)</Label>
                                            <Textarea
                                              placeholder="Please specify the reason for resending (e.g., issues with previous confirmation, missing information, etc.)..."
                                              className="mt-2"
                                              value={resendRemarks}
                                              onChange={(e) => setResendRemarks(e.target.value)}
                                              rows={4}
                                            />
                                          </div>
                                          <div className="bg-warning/10 border border-warning rounded-md p-3">
                                            <p className="text-sm text-warning-foreground">
                                              <strong>Note:</strong> This action will reset the confirmation status to "Sent" and the previous confirmation response will be voided.
                                            </p>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              className="flex-1"
                                              onClick={() => {
                                                setResendDialogOpen(false);
                                                setSelectedConfirmation(null);
                                                setResendRemarks("");
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              className="flex-1"
                                              onClick={() => handleResendConfirmation(confirmation.id, confirmation.area)}
                                            >
                                              <RotateCcw className="h-4 w-4 mr-2" />
                                              Resend Confirmation
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {confirmation.attachments && confirmation.attachments.length > 0 && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Confirmations</h3>
              <p className="text-muted-foreground">
                No confirmations have been received for {selectedArea} yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {currentData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Confirmations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{currentData.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ₹{formatIndianNumber(
                  currentData.reduce((sum, item) => {
                    const amount = parseFloat(item.amountConfirmed?.replace(/[₹,$]/g, '') || '0');
                    return sum + amount;
                  }, 0)
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {currentData.filter(item => item.attachments && item.attachments.length > 0).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
