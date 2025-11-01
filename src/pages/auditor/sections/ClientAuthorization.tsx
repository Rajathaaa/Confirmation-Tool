import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, XCircle, Eye, Download, Edit2, Save, X } from "lucide-react";
import { useState } from "react";

interface ActivityLogEntry {
  timestamp: string;
  stage: string;
  action: string;
  performedBy: string;
  details: string;
  status: "completed" | "in-progress" | "pending";
}

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
  activityLog: ActivityLogEntry[]; // Add activity log
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
    authorizedIP: "192.168.1.105",
    activityLog: [
      {
        timestamp: "2025-01-10 09:00:00",
        stage: "Creation",
        action: "Confirmation request created",
        performedBy: "Sarah Johnson (Auditor)",
        details: "Initial confirmation request generated for Trade Receivables - ABC Corporation Ltd.",
        status: "completed"
      },
      {
        timestamp: "2025-01-20 14:35:22",
        stage: "Authorization by Client",
        action: "Client authorization received",
        performedBy: "Sarah Johnson (Client Finance Director)",
        details: "Client approved sending confirmation to ABC Corporation Ltd.",
        status: "completed"
      },
      {
        timestamp: "2025-01-21 10:15:00",
        stage: "Domain Testing",
        action: "Email domain verified",
        performedBy: "System",
        details: "Domain abccorp.com verified and email deliverability confirmed",
        status: "completed"
      },
      {
        timestamp: "2025-01-22 11:30:00",
        stage: "Confirmation Receipt",
        action: "Confirmation received",
        performedBy: "John Smith (ABC Corporation)",
        details: "Confirming party submitted response with attachments. IP: 203.45.67.89",
        status: "completed"
      }
    ]
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
    status: "pending",
    activityLog: [
      {
        timestamp: "2025-01-18 10:00:00",
        stage: "Creation",
        action: "Confirmation request created",
        performedBy: "Sarah Johnson (Auditor)",
        details: "Initial confirmation request generated for Trade Receivables - XYZ Industries",
        status: "completed"
      },
      {
        timestamp: "2025-01-19 15:45:00",
        stage: "Authorization by Client",
        action: "Pending client approval",
        performedBy: "System",
        details: "Awaiting client authorization to proceed",
        status: "pending"
      },
      {
        timestamp: "2025-01-19 15:45:00",
        stage: "Domain Testing",
        action: "Not started",
        performedBy: "System",
        details: "Domain testing will begin after client authorization",
        status: "pending"
      },
      {
        timestamp: "2025-01-19 15:45:00",
        stage: "Confirmation Receipt",
        action: "Not started",
        performedBy: "System",
        details: "Awaiting confirmation rollout",
        status: "pending"
      }
    ]
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
    status: "pending",
    activityLog: [
      {
        timestamp: "2025-01-22 11:00:00",
        stage: "Creation",
        action: "Confirmation request created",
        performedBy: "Sarah Johnson (Auditor)",
        details: "Initial confirmation request generated for Trade Payables - Global Supplies Inc.",
        status: "completed"
      },
      {
        timestamp: "2025-01-22 11:00:00",
        stage: "Authorization by Client",
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
        stage: "Confirmation Receipt",
        action: "Not started",
        performedBy: "System",
        details: "Awaiting confirmation rollout",
        status: "pending"
      }
    ]
  }
];

export const ClientAuthorization = () => {
  const [letters, setLetters] = useState(mockLetters);
  const [editingLogIndex, setEditingLogIndex] = useState<{ letterId: string; logIndex: number } | null>(null);
  const [editedLog, setEditedLog] = useState<ActivityLogEntry | null>(null);

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
          <Badge className="bg-blue-500 text-white">
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

  const handleEditLog = (letterId: string, logIndex: number) => {
    const letter = letters.find(l => l.id === letterId);
    if (letter && letter.activityLog[logIndex]) {
      setEditingLogIndex({ letterId, logIndex });
      setEditedLog({ ...letter.activityLog[logIndex] });
    }
  };

  const handleSaveLog = (letterId: string, logIndex: number) => {
    if (!editedLog) return;

    setLetters(prevLetters =>
      prevLetters.map(letter => {
        if (letter.id === letterId) {
          const updatedLog = [...letter.activityLog];
          updatedLog[logIndex] = editedLog;
          return { ...letter, activityLog: updatedLog };
        }
        return letter;
      })
    );

    setEditingLogIndex(null);
    setEditedLog(null);
  };

  const handleCancelEdit = () => {
    setEditingLogIndex(null);
    setEditedLog(null);
  };

  const handleLogFieldChange = (field: keyof ActivityLogEntry, value: string) => {
    if (!editedLog) return;
    setEditedLog({ ...editedLog, [field]: value });
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
                {letters.map((letter) => (
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Activity Log - {letter.id}</DialogTitle>
                              <DialogDescription>
                                View and edit activity log for confirmation: {letter.confirmingParty}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {/* Confirmation Details */}
                              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                                <div>
                                  <p className="text-muted-foreground">Letter ID</p>
                                  <p className="font-medium">{letter.id}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Area</p>
                                  <p className="font-medium">{letter.area}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Confirming Party</p>
                                  <p className="font-medium">{letter.confirmingParty}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Amount</p>
                                  <p className="font-semibold">{letter.amount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Recipient</p>
                                  <p className="font-medium">{letter.recipientName}</p>
                                  <p className="text-xs text-muted-foreground">{letter.recipientEmail}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Status</p>
                                  {getStatusBadge(letter.status)}
                                </div>
                              </div>

                              {/* Activity Log Table */}
                              <div className="pt-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold">Activity Log</h3>
                                  <p className="text-sm text-muted-foreground">Auditor Only - Editable</p>
                                </div>
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
                                        <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {letter.activityLog.map((log, logIndex) => {
                                        const isEditing = editingLogIndex?.letterId === letter.id && editingLogIndex?.logIndex === logIndex;
                                        
                                        return (
                                          <TableRow key={logIndex}>
                                            {isEditing ? (
                                              <>
                                                <TableCell>
                                                  <Input
                                                    value={editedLog?.timestamp || ""}
                                                    onChange={(e) => handleLogFieldChange("timestamp", e.target.value)}
                                                    className="h-8 text-xs"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Input
                                                    value={editedLog?.stage || ""}
                                                    onChange={(e) => handleLogFieldChange("stage", e.target.value)}
                                                    className="h-8"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Input
                                                    value={editedLog?.action || ""}
                                                    onChange={(e) => handleLogFieldChange("action", e.target.value)}
                                                    className="h-8"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Input
                                                    value={editedLog?.performedBy || ""}
                                                    onChange={(e) => handleLogFieldChange("performedBy", e.target.value)}
                                                    className="h-8"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Textarea
                                                    value={editedLog?.details || ""}
                                                    onChange={(e) => handleLogFieldChange("details", e.target.value)}
                                                    className="min-h-[60px] text-sm"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <select
                                                    value={editedLog?.status || "pending"}
                                                    onChange={(e) => handleLogFieldChange("status", e.target.value as ActivityLogEntry["status"])}
                                                    className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                                                  >
                                                    <option value="pending">Pending</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                  </select>
                                                </TableCell>
                                                <TableCell>
                                                  <div className="flex gap-1 justify-end">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleSaveLog(letter.id, logIndex)}
                                                      className="h-7"
                                                    >
                                                      <Save className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={handleCancelEdit}
                                                      className="h-7"
                                                    >
                                                      <X className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                              </>
                                            ) : (
                                              <>
                                                <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                                                <TableCell className="font-medium">{log.stage}</TableCell>
                                                <TableCell>{log.action}</TableCell>
                                                <TableCell>{log.performedBy}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground max-w-md">
                                                  <p className="line-clamp-2" title={log.details}>{log.details}</p>
                                                </TableCell>
                                                <TableCell>{getLogStatusBadge(log.status)}</TableCell>
                                                <TableCell>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditLog(letter.id, logIndex)}
                                                    className="h-7"
                                                  >
                                                    <Edit2 className="h-3 w-3" />
                                                  </Button>
                                                </TableCell>
                                              </>
                                            )}
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
    </div>
  );
};
