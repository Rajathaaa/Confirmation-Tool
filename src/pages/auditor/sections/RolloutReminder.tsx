import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Send, Bell, Lock, CheckCircle, Clock, Upload, Eye, FileText } from "lucide-react";
import { useState } from "react";

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
    remarks: "Balance confirmed as accurate. All transactions verified against our records.",
    attachments: ["confirmation_letter_ABC.pdf", "supporting_schedule.xlsx"]
  },
  {
    id: "CNF-002",
    area: "Trade Receivables",
    confirmingParty: "XYZ Industries",
    recipientEmail: "e.chen@xyzind.com",
    recipientName: "Emily Chen",
    recipientOrg: "XYZ Industries",
    status: "sent",
    sentDate: "2025-01-20 09:15:00"
  },
  {
    id: "CNF-003",
    area: "Trade Payables",
    confirmingParty: "Global Supplies Inc.",
    recipientEmail: "m.brown@globalsupplies.com",
    recipientName: "Michael Brown",
    recipientOrg: "Global Supplies Inc.",
    status: "not-sent"
  }
];

export const RolloutReminder = () => {
  const [confirmations, setConfirmations] = useState(mockConfirmations);
  const [selectedConfirmation, setSelectedConfirmation] = useState<Confirmation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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

  const lockConfirmation = (id: string) => {
    setConfirmations(confirmations.map(c =>
      c.id === id ? { ...c, status: "locked" as const, lockedDate: new Date().toISOString() } : c
    ));
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedConfirmation(confirmation);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {confirmation.status === "not-sent" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => setSelectedConfirmation(confirmation)}>
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Send Confirmation Request</DialogTitle>
                                <DialogDescription>
                                  Add remarks or attachments before sending to {confirmation.recipientName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label>Remarks (Optional)</Label>
                                  <Textarea
                                    placeholder="Add any additional notes or instructions..."
                                    className="mt-2"
                                  />
                                </div>
                                <div>
                                  <Label>Attachment (Optional)</Label>
                                  <Button variant="outline" className="w-full mt-2">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose File
                                  </Button>
                                </div>
                                <Button className="w-full">
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Confirmation Request
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {confirmation.status === "sent" && (
                          <Button size="sm" variant="outline">
                            <Bell className="h-4 w-4 mr-1" />
                            Reminder
                          </Button>
                        )}
                        {confirmation.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => lockConfirmation(confirmation.id)}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Lock
                          </Button>
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

      {/* Confirmation Log */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Activity Log</CardTitle>
          <CardDescription>Detailed tracking of confirmation responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {confirmations
              .filter(c => c.status === "confirmed" || c.status === "locked")
              .map((confirmation) => (
                <div key={confirmation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{confirmation.id} - {confirmation.confirmingParty}</p>
                      <p className="text-sm text-muted-foreground">{confirmation.area}</p>
                    </div>
                    {getStatusBadge(confirmation.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Confirming Party Name</p>
                      <p className="font-medium">{confirmation.confirmingParty}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Point of Contact</p>
                      <p className="font-medium">{confirmation.recipientName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact Email</p>
                      <p className="font-medium">{confirmation.recipientEmail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confirmed Date & Time</p>
                      <p className="font-medium">{confirmation.confirmedDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confirmed By</p>
                      <p className="font-medium">{confirmation.confirmedBy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IP Address</p>
                      <p className="font-medium">{confirmation.confirmedIP}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* View Confirmation Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmation Details</DialogTitle>
            <DialogDescription>
              View complete confirmation information and response
            </DialogDescription>
          </DialogHeader>
          {selectedConfirmation && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Confirmation ID</Label>
                  <p className="font-medium mt-1">{selectedConfirmation.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedConfirmation.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Area</Label>
                  <p className="font-medium mt-1">{selectedConfirmation.area}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Confirming Party</Label>
                  <p className="font-medium mt-1">{selectedConfirmation.confirmingParty}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Recipient Name</Label>
                  <p className="font-medium mt-1">{selectedConfirmation.recipientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Recipient Email</Label>
                  <p className="font-medium mt-1">{selectedConfirmation.recipientEmail}</p>
                </div>
                {selectedConfirmation.sentDate && (
                  <div>
                    <Label className="text-muted-foreground">Sent Date</Label>
                    <p className="font-medium mt-1">{selectedConfirmation.sentDate}</p>
                  </div>
                )}
                {selectedConfirmation.confirmedDate && (
                  <div>
                    <Label className="text-muted-foreground">Confirmed Date</Label>
                    <p className="font-medium mt-1">{selectedConfirmation.confirmedDate}</p>
                  </div>
                )}
                {selectedConfirmation.confirmedBy && (
                  <div>
                    <Label className="text-muted-foreground">Confirmed By</Label>
                    <p className="font-medium mt-1">{selectedConfirmation.confirmedBy}</p>
                  </div>
                )}
                {selectedConfirmation.confirmedIP && (
                  <div>
                    <Label className="text-muted-foreground">IP Address</Label>
                    <p className="font-medium mt-1">{selectedConfirmation.confirmedIP}</p>
                  </div>
                )}
              </div>

              {selectedConfirmation.remarks && (
                <div>
                  <Label className="text-muted-foreground">Remarks from Confirming Party</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedConfirmation.remarks}</p>
                  </div>
                </div>
              )}

              {selectedConfirmation.attachments && selectedConfirmation.attachments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Attachments from Confirming Party</Label>
                  <div className="mt-2 space-y-2">
                    {selectedConfirmation.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium flex-1">{attachment}</span>
                        <Button size="sm" variant="ghost">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!selectedConfirmation.remarks && !selectedConfirmation.attachments && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No remarks or attachments from confirming party yet.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
