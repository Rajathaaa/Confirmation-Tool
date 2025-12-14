import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Send, Bell, Lock, CheckCircle, Clock, Upload, Eye, FileText, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { formatIndianDate, formatIndianDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ActivityLogEntry {
  timestamp: string;
  stage: string;
  action: string;
  performedBy: string;
  details: string;
  status: "completed" | "in-progress" | "pending";
  ip_address?: string;
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
  formData?: any; // Stores the filled form data from confirming party
  periodEndDate?: string; // Add this
}

const mockConfirmations: Confirmation[] = [
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
    remarks: "We confirm the outstanding balance as of December 31, 2024. All invoices have been reviewed and verified.",
    attachments: ["invoice_summary.pdf", "payment_schedule.xlsx"],
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
    id: "CNF-002",
    area: "Trade Receivables",
    confirmingParty: "XYZ Industries",
    recipientEmail: "e.chen@xyzind.com",
    recipientName: "Emily Chen",
    recipientOrg: "XYZ Industries",
    status: "sent",
    sentDate: "2025-01-20 09:15:00",
    periodEndDate: "2024-12-31", // Add this
    activityLog: [
      {
        timestamp: "2025-01-18 10:00:00",
        stage: "Creation",
        action: "Confirmation request created",
        performedBy: "Sarah Johnson (Auditor)",
        details: "Initial confirmation request generated for Trade Receivables",
        status: "completed"
      },
      {
        timestamp: "2025-01-19 15:45:00",
        stage: "Client Authorization",
        action: "Client authorization received",
        performedBy: "David Miller (Client Finance Director)",
        details: "Client approved sending confirmation to XYZ Industries",
        status: "completed"
      },
      {
        timestamp: "2025-01-20 08:30:00",
        stage: "Domain Testing",
        action: "Email domain verified",
        performedBy: "System",
        details: "Domain xyzind.com verified and email deliverability confirmed",
        status: "completed"
      },
      {
        timestamp: "2025-01-20 09:15:00",
        stage: "Rollout",
        action: "Confirmation request sent",
        performedBy: "Sarah Johnson (Auditor)",
        details: "Email sent to e.chen@xyzind.com with confirmation request",
        status: "completed"
      },
      {
        timestamp: "2025-01-20 09:15:00",
        stage: "Response",
        action: "Awaiting confirmation",
        performedBy: "System",
        details: "Waiting for confirming party response",
        status: "in-progress"
      }
    ]
  },
  {
    id: "CNF-003",
    area: "Trade Payables",
    confirmingParty: "Global Supplies Inc.",
    recipientEmail: "m.brown@globalsupplies.com",
    recipientName: "Michael Brown",
    recipientOrg: "Global Supplies Inc.",
    status: "not-sent",
    periodEndDate: "2024-12-31", // Add this
    activityLog: [
      {
        timestamp: "2025-01-22 11:00:00",
        stage: "Creation",
        action: "Confirmation request created",
        performedBy: "Sarah Johnson (Auditor)",
        details: "Initial confirmation request generated for Trade Payables",
        status: "completed"
      },
      {
        timestamp: "2025-01-22 11:00:00",
        stage: "Client Authorization",
        action: "Pending client approval",
        performedBy: "System",
        details: "Awaiting client authorization to proceed",
        status: "pending"
      },
      {
        timestamp: "2025-01-22 11:00:00",
        stage: "Domain Testing",
        action: "Not started",
        performedBy: "System",
        details: "Domain testing will begin after client authorization",
        status: "pending"
      },
      {
        timestamp: "2025-01-22 11:00:00",
        stage: "Rollout",
        action: "Not started",
        performedBy: "System",
        details: "Confirmation will be sent after all validations complete",
        status: "pending"
      },
      {
        timestamp: "2025-01-22 11:00:00",
        stage: "Response",
        action: "Not started",
        performedBy: "System",
        details: "Awaiting confirmation rollout",
        status: "pending"
      }
    ]
  }
];

// Component to render confirmation form template in read-only mode
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
            {confirmation.formData && confirmation.formData.amounts && Array.isArray(confirmation.formData.amounts) && confirmation.formData.amounts.length > 0 ? (
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
                        <TableCell className="font-medium">
                          {row.amount ? (typeof row.amount === 'number' ? row.amount.toLocaleString() : row.amount) : "-"}
                        </TableCell>
                        <TableCell>{row.currency || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No amount details provided yet.</p>
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

            {confirmation.formData.overdrawnAccounts && confirmation.formData.overdrawnAccounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">2. Overdrawn Current Accounts</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Designation of Account</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Balance (Debit)</TableHead>
                        <TableHead>Security Held</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmation.formData.overdrawnAccounts.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{row.designation || "-"}</TableCell>
                          <TableCell>{row.currency || "-"}</TableCell>
                          <TableCell>{row.balance || "-"}</TableCell>
                          <TableCell>{row.security || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Add similar sections for other account types if needed */}
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

      case "Litigations & Claims":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Kindly furnish a list that describes and evaluates pending or threatened litigations, claims, and assessments with respect to which you have been engaged and to which you have devoted substantive attention on behalf of [Client Organization] in the form of legal consultation or representation.
            </p>
            {/* Note: We might not have client organization in confirmation object, so keeping placeholder */}
            {confirmation.formData.details && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{confirmation.formData.details}</p>
              </div>
            )}
          </div>
        );

      case "Related Party Disclosure":
        return (
          <div className="space-y-6">
            {confirmation.formData.relationshipType && (
              <div className="space-y-2">
                <Label>Nature of Relationship</Label>
                <p className="font-medium">{confirmation.formData.relationshipType}</p>
              </div>
            )}
            {confirmation.formData.transactions && confirmation.formData.transactions.length > 0 && (
              <div className="space-y-2">
                <Label>Details of Transactions</Label>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nature of Transaction</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Amount Involved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmation.formData.transactions.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{row.nature || "-"}</TableCell>
                          <TableCell>{row.currency || "-"}</TableCell>
                          <TableCell>{row.amount || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
      {/* Letter Header */}
      <div className="space-y-2 border-b pb-4">
        <p className="text-sm text-muted-foreground">
          Dear {confirmation.recipientName},
        </p>
        {renderFormByArea()}
      </div>

      {/* Certification */}
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

      {/* Signatory Information */}
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

export const RolloutReminder = () => {
  const { toast } = useToast();
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [selectedConfirmation, setSelectedConfirmation] = useState<Confirmation | null>(null);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendRemarks, setResendRemarks] = useState("");
  const [sendRemarks, setSendRemarks] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  // Fetch confirmation requests from authorization letters on component mount
  useEffect(() => {
    fetchConfirmationRequests();
  }, []);

  const fetchConfirmationRequests = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/get-authorization-letters');
      if (!response.ok) {
        throw new Error('Failed to fetch authorization letters');
      }
      const result = await response.json();
      const lettersData = result.data || { letters: [] };
      
      console.log('📥 Fetched authorization letters from SharePoint:', lettersData);
      
      // Fetch activity logs from activity_log.json (same as ClientAuthorization)
      let activityLogs: Record<string, ActivityLogEntry[]> = {};
      try {
        const activityResponse = await fetch('http://localhost:3002/api/get-activity-log');
        if (activityResponse.ok) {
          const activityResult = await activityResponse.json();
          const activityData = activityResult.data || { timeline: [] };
          
          console.log('📥 Fetched activity_log.json from SharePoint:', activityData);
          
          // Group activity logs by letter_id
          if (activityData.timeline && Array.isArray(activityData.timeline)) {
            activityData.timeline.forEach((entry: any) => {
              const letterId = entry.letter_id;
              if (letterId) {
                if (!activityLogs[letterId]) {
                  activityLogs[letterId] = [];
                }
                activityLogs[letterId].push({
                  timestamp: entry.timestamp || "",
                  stage: entry.stage || "",
                  action: entry.action || "",
                  performedBy: entry.performed_by || "",
                  details: entry.details || "",
                  status: (entry.status || "completed") as "completed" | "in-progress" | "pending",
                  ip_address: entry.ip_address
                });
              }
            });
            
            // Sort each letter's activity log by timestamp
            Object.keys(activityLogs).forEach(letterId => {
              activityLogs[letterId].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });
          }
        }
      } catch (activityError) {
        console.error('Error fetching activity logs:', activityError);
      }
      
      // Convert authorization letters to confirmations (only authorized ones)
      if (lettersData.letters && lettersData.letters.length > 0) {
        const authorizedLetters = lettersData.letters.filter((letter: any) => 
          letter.status === "authorized"
        );
        
        const convertedConfirmations = authorizedLetters.map((letter: any) => ({
          id: letter.id,
          area: letter.area || "",
          confirmingParty: letter.confirmingParty || "",
          recipientEmail: letter.recipientEmail || "",
          recipientName: letter.recipientName || "",
          recipientOrg: letter.recipientOrg || letter.confirmingParty || "",
          status: "not-sent" as const, // Default status, will be updated based on pending confirmations
          sentDate: undefined,
          confirmedDate: undefined,
          confirmedBy: undefined,
          confirmedIP: undefined,
          lockedDate: undefined,
          remarks: undefined,
          attachments: [],
          // Use activity logs from activity_log.json (same source as ClientAuthorization)
          activityLog: activityLogs[letter.id] || [],
          periodEndDate: letter.periodEndDate || ""
        }));
        
        // Check pending confirmations to update status
        const pendingResponse = await fetch('http://localhost:3002/api/get-pending-confirmations');
        if (pendingResponse.ok) {
          const pendingResult = await pendingResponse.json();
          const pendingData = pendingResult.data || { confirmations: [] };
          
          // Update status and form data based on pending confirmations
          convertedConfirmations.forEach((conf: Confirmation) => {
            const pendingConf = pendingData.confirmations?.find((p: any) => 
              p.letterId === conf.id
            );
            if (pendingConf) {
              // Update status
              if (pendingConf.status === "locked") {
                conf.status = "locked" as const;
                conf.lockedDate = pendingConf.lockedAt;
              } else if (pendingConf.status === "submitted") {
                conf.status = "confirmed" as const; // Display as "confirmed" in UI
                conf.confirmedDate = pendingConf.confirmedAt || pendingConf.submittedAt;
                conf.confirmedBy = pendingConf.confirmedBy;
                conf.confirmedIP = pendingConf.confirmedIP;
              } else if (pendingConf.status === "draft") {
                conf.status = "sent" as const; // Keep as sent for draft
              } else {
                conf.status = "sent" as const;
              }
              
              // Update form data and other fields
              conf.sentDate = pendingConf.sentAt;
              conf.remarks = pendingConf.remarks;
              conf.attachments = pendingConf.attachments || [];
              // Ensure formData is properly structured
              if (pendingConf.formData) {
                conf.formData = pendingConf.formData;
              }
            }
          });
        }
        
        setConfirmations(convertedConfirmations);
      }
    } catch (error: any) {
      console.error('Error fetching confirmation requests:', error);
      // Keep using empty array if fetch fails
    }
  };

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

  const lockConfirmation = async (id: string) => {
    try {
      // Find the confirmation to get its confirmation ID (not letter ID)
      const confirmation = confirmations.find(c => c.id === id);
      if (!confirmation) {
        throw new Error('Confirmation not found');
      }

      // Get the confirmation ID from pending_confirmations.json
      // We need to fetch pending confirmations to find the matching confirmation
      const pendingResponse = await fetch('http://localhost:3002/api/get-pending-confirmations');
      if (!pendingResponse.ok) {
        throw new Error('Failed to fetch pending confirmations');
      }
      const pendingResult = await pendingResponse.json();
      const pendingData = pendingResult.data || { confirmations: [] };
      
      // Find the confirmation by matching letter ID or other identifiers
      const pendingConf = pendingData.confirmations.find((c: any) => 
        c.letterId === id || c.id === id
      );
      
      if (!pendingConf) {
        throw new Error('Pending confirmation not found');
      }

      const response = await fetch('http://localhost:3002/api/lock-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationId: pendingConf.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to lock confirmation');
      }

      toast({
        title: "Success",
        description: "Confirmation locked successfully",
      });

      // Refresh confirmations
      await fetchConfirmationRequests();
    } catch (error: any) {
      console.error('Error locking confirmation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to lock confirmation",
        variant: "destructive"
      });
    }
  };

  const handleSendConfirmation = async (id: string) => {
    try {
      const response = await fetch('http://localhost:3002/api/send-confirmation-to-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterId: id,
          isResend: false,
          remarks: sendRemarks
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send confirmation');
      }

      toast({
        title: "Success",
        description: "Confirmation request sent to confirming party",
      });

      // Reset dialog state
      setSendRemarks("");
      setSendDialogOpen(false);
      setSelectedConfirmation(null);

      // Refresh confirmations to get updated activity logs
      await fetchConfirmationRequests();
    } catch (error: any) {
      console.error('Error sending confirmation:', error);
      toast({
        title: "Error",
        description: `Failed to send confirmation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleResendConfirmation = async (id: string) => {
    try {
      const response = await fetch('http://localhost:3002/api/send-confirmation-to-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterId: id,
          isResend: true,
          remarks: resendRemarks
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend confirmation');
      }

      toast({
        title: "Success",
        description: "Confirmation request resent to confirming party",
      });

      // Reset dialog state
      setResendRemarks("");
      setResendDialogOpen(false);
      setSelectedConfirmation(null);

      // Refresh confirmations to get updated activity logs
      await fetchConfirmationRequests();
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      toast({
        title: "Error",
        description: `Failed to resend confirmation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Confirmation Rollout & Reminder</h2>
        <p className="text-muted-foreground">
          Send confirmation requests and manage reminder schedules
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirmation Requests</CardTitle>
          <CardDescription>
            Manage confirmation rollout to confirming parties
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
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmations.map((confirmation) => (
                  <TableRow key={confirmation.id}>
                    <TableCell className="font-medium">{confirmation.area}</TableCell>
                    <TableCell>{confirmation.confirmingParty}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {confirmation.recipientEmail}
                      </code>
                    </TableCell>
                    <TableCell>{confirmation.recipientName}</TableCell>
                    <TableCell>{confirmation.recipientOrg}</TableCell>
                    <TableCell>{getStatusBadge(confirmation.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedConfirmation(confirmation)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
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
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                {getStatusBadge(confirmation.status)}
                              </div>
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
                                {confirmation.periodEndDate && (
                                  <div>
                                    <p className="text-muted-foreground">Period End Date</p>
                                    <p className="font-medium">{formatIndianDate(confirmation.periodEndDate)}</p>
                                  </div>
                                )}
                              </div>
                              
                              {confirmation.remarks && (
                                <div className="pt-4 border-t">
                                  <p className="text-sm font-medium mb-2">Remarks from Confirming Party</p>
                                  <div className="bg-muted p-3 rounded-md">
                                    <p className="text-sm">{confirmation.remarks}</p>
                                  </div>
                                </div>
                              )}
                              
                              {confirmation.attachments && confirmation.attachments.length > 0 && (
                                <div className="pt-4 border-t">
                                  <p className="text-sm font-medium mb-2">Attachments from Confirming Party</p>
                                  <div className="space-y-2">
                                    {confirmation.attachments.map((file, index) => (
                                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm flex-1">{file}</span>
                                        <Button size="sm" variant="ghost">Download</Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Add Confirmation Form Template Section */}
                              <div className="pt-4 border-t">
                                <h3 className="text-lg font-semibold mb-4">Confirmation Form Template & Response</h3>
                                <Card>
                                  <CardContent className="pt-6">
                                    <ConfirmationFormView confirmation={confirmation} />
                                  </CardContent>
                                </Card>
                              </div>

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
                                      {confirmation.activityLog && confirmation.activityLog.length > 0 ? (
                                        confirmation.activityLog.map((log, index) => (
                                          <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">
                                              {log.timestamp ? formatIndianDateTime(log.timestamp) : log.timestamp}
                                            </TableCell>
                                            <TableCell className="font-medium">{log.stage}</TableCell>
                                            <TableCell>{log.action}</TableCell>
                                            <TableCell>{log.performedBy}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-md">
                                              <p className="line-clamp-2" title={log.details}>
                                                {log.details}
                                                {log.ip_address && log.ip_address !== "Unavailable" && (
                                                  <span className="text-xs text-muted-foreground ml-2">
                                                    (IP: {log.ip_address})
                                                  </span>
                                                )}
                                              </p>
                                            </TableCell>
                                            <TableCell>
                                              {log.status === "completed" && (
                                                <Badge className="bg-success text-success-foreground">
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Completed
                                                </Badge>
                                              )}
                                              {log.status === "in-progress" && (
                                                <Badge className="bg-info text-info-foreground">
                                                  <Clock className="h-3 w-3 mr-1" />
                                                  In Progress
                                                </Badge>
                                              )}
                                              {log.status === "pending" && (
                                                <Badge variant="outline">
                                                  <Clock className="h-3 w-3 mr-1" />
                                                  Pending
                                                </Badge>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                            No activity log entries yet.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {(confirmation.status === "not-sent" || confirmation.status === "sent") && (
                          <Dialog open={sendDialogOpen && selectedConfirmation?.id === confirmation.id} onOpenChange={(open) => {
                            setSendDialogOpen(open);
                            if (open) {
                              setSelectedConfirmation(confirmation);
                            } else {
                              setSelectedConfirmation(null);
                              setSendRemarks("");
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedConfirmation(confirmation);
                                  setSendDialogOpen(true);
                                }}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                {confirmation.status === "not-sent" ? "Send" : "Resend"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {confirmation.status === "not-sent" ? "Send" : "Resend"} Confirmation Request
                                </DialogTitle>
                                <DialogDescription>
                                  {confirmation.status === "not-sent" 
                                    ? `Send confirmation request to ${confirmation.recipientName} at ${confirmation.recipientEmail}`
                                    : `Resend the confirmation request to ${confirmation.recipientName} at ${confirmation.recipientEmail}. The previous confirmation will be voided and a new request will be sent.`
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label>Remarks (Optional)</Label>
                                  <Textarea
                                    placeholder={confirmation.status === "not-sent" 
                                      ? "Add any additional notes or instructions..."
                                      : "Please specify the reason for resending (e.g., issues with previous confirmation, missing information, etc.)..."
                                    }
                                    className="mt-2"
                                    value={sendRemarks}
                                    onChange={(e) => setSendRemarks(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                                {confirmation.status === "sent" && (
                                  <div className="bg-warning/10 border border-warning rounded-md p-3">
                                    <p className="text-sm text-warning-foreground">
                                      <strong>Note:</strong> This action will reset the confirmation status and the previous confirmation response will be voided.
                                    </p>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                      setSendDialogOpen(false);
                                      setSelectedConfirmation(null);
                                      setSendRemarks("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="flex-1"
                                    onClick={() => handleSendConfirmation(confirmation.id)}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    {confirmation.status === "not-sent" ? "Send" : "Resend"} Confirmation
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        {confirmation.status === "confirmed" && (
                          <>
                            <Dialog open={resendDialogOpen && selectedConfirmation?.id === confirmation.id} onOpenChange={(open) => {
                              setResendDialogOpen(open);
                              if (open) {
                                setSelectedConfirmation(confirmation);
                              } else {
                                setSelectedConfirmation(null);
                                setResendRemarks("");
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedConfirmation(confirmation);
                                    setResendDialogOpen(true);
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Resend
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
                                      onClick={() => handleResendConfirmation(confirmation.id)}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Resend Confirmation
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => lockConfirmation(confirmation.id)}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Lock
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
