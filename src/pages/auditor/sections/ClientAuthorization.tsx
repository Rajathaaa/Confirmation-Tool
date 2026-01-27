import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, Eye, Download, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { formatIndianDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";

interface ClientUser {
  id: string;
  name: string;
  designation: string;
  email: string;
  role: "Authorizer" | "Viewer";
  areas: string[];
}


interface ActivityLogEntry {
  timestamp: string;
  stage: string;
  action: string;
  performedBy: string;
  details: string;
  status: "completed" | "in-progress" | "pending";
  ip_address?: string;
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
  status: "draft" | "pending" | "authorized" | "rejected";
  authorizedBy?: string;
  authorizedDate?: string;
  authorizedIP?: string;
  activityLog: ActivityLogEntry[];
}


export const ClientAuthorization = () => {
  const { toast } = useToast();
  const [letters, setLetters] = useState<AuthorizationLetter[]>([]);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [isLoadingLetters, setIsLoadingLetters] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [processingLetterId, setProcessingLetterId] = useState<string | null>(null);

  // Fetch authorization letters, activity logs, and client users from SharePoint on component mount
  useEffect(() => {
    fetchAuthorizationLetters();
    fetchClientUsers();
  }, []);

  const fetchClientUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('http://localhost:3002/api/get-people-data');
      if (!response.ok) {
        throw new Error('Failed to fetch people data');
      }
      const result = await response.json();
      const peopleData = result.data || { clients: [] };
      
      console.log('📥 Fetched client users from SharePoint:', peopleData);
      
      // Convert SharePoint data to local format
      if (peopleData.clients && peopleData.clients.length > 0) {
        const convertedClients = peopleData.clients.map((client: any, index: number) => ({
          id: `CL-${String(index + 1).padStart(3, '0')}`,
          name: client.name || "",
          designation: client.designation || "",
          email: client.email || "",
          role: (client.role === "Authorizer" ? "Authorizer" : "Viewer") as "Authorizer" | "Viewer",
          areas: client.areas || []
        }));
        setClientUsers(convertedClients);
        console.log(`✅ Loaded ${convertedClients.length} client users for dropdown`);
      }
    } catch (error: any) {
      console.error('Error fetching client users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch client users from SharePoint",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchAuthorizationLetters = async (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoadingLetters(true);
    }
    try {
      const response = await fetch('http://localhost:3002/api/get-authorization-letters');
      if (!response.ok) {
        throw new Error('Failed to fetch authorization letters');
      }
      const result = await response.json();
      const lettersData = result.data || { letters: [] };
      
      console.log('📥 Fetched authorization_letters.json from SharePoint:', lettersData);
      
      // Fetch activity logs
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
      
      // Convert SharePoint data to local format
      if (lettersData.letters && lettersData.letters.length > 0) {
        const convertedLetters = lettersData.letters.map((letter: any) => {
          const letterId = letter.id || `AL-${Date.now()}`;
          // Normalize letter ID for activity log matching (remove AL- prefix if present)
          const normalizedLetterId = letterId.replace(/^AL-/, '');
          // Try matching with both the original ID and normalized ID
          const matchedActivityLog = activityLogs[letterId] || activityLogs[normalizedLetterId] || letter.activityLog || [];
          
          return {
            id: letterId,
            area: letter.area || "",
            confirmingParty: letter.confirmingParty || "",
            amount: letter.amount || "",
            recipientName: letter.recipientName || "",
            recipientOrg: letter.recipientOrg || letter.confirmingParty || "",
            recipientEmail: letter.recipientEmail || "",
            clientName: letter.clientName || "",
            clientEmail: letter.clientEmail || "",
            status: (letter.status || "draft") as "draft" | "pending" | "authorized" | "rejected",
            authorizedBy: letter.authorizedBy,
            authorizedDate: letter.authorizedDate,
            authorizedIP: letter.authorizedIP,
            // Merge activity logs from both sources (letter.activityLog and activity_log.json)
            activityLog: matchedActivityLog
          };
        });
        setLetters(convertedLetters);
      } else {
        // Clear letters if no data
        setLetters([]);
      }
    } catch (error: any) {
      console.error('Error fetching authorization letters:', error);
      // Keep using mock data if fetch fails
    } finally {
      setIsLoadingLetters(false);
    }
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
                {isLoadingLetters ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <LoadingSpinner size="lg" text="Loading authorization letters..." />
                    </TableCell>
                  </TableRow>
                ) : letters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No authorization letters found
                    </TableCell>
                  </TableRow>
                ) : (
                  letters.map((letter) => (
                    <TableRow key={letter.id} className={processingLetterId === letter.id ? "opacity-50" : ""}>
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
                      <Select
                        value={letter.clientEmail && clientUsers.some(c => c.email === letter.clientEmail) ? letter.clientEmail : ""}
                        onValueChange={(email) => {
                          const selectedClient = clientUsers.find(client => client.email === email);
                          if (selectedClient) {
                            // Update local state
                            setLetters(letters.map(l => 
                              l.id === letter.id 
                                ? { ...l, clientName: selectedClient.name, clientEmail: selectedClient.email }
                                : l
                            ));
                            
                            // Update in SharePoint
                            fetch(`http://localhost:3002/api/update-authorization-letter-client`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                letterId: letter.id,
                                clientName: selectedClient.name,
                                clientEmail: selectedClient.email
                              }),
                            }).catch(error => {
                              console.error('Error updating client in SharePoint:', error);
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[220px] h-auto py-2">
                          <SelectValue placeholder="Select a client">
                            {letter.clientEmail && clientUsers.some(c => c.email === letter.clientEmail) ? (
                              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                                <span className="font-medium text-sm truncate w-full">{letter.clientName}</span>
                                <span className="text-xs text-muted-foreground truncate w-full">{letter.clientEmail}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Select a client</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {clientUsers.length > 0 ? (
                            clientUsers.map((client) => (
                              <SelectItem key={client.id} value={client.email}>
                                <div className="flex flex-col py-1">
                                  <span className="font-medium">{client.name}</span>
                                  <span className="text-xs text-muted-foreground">{client.email}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>No clients available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {letter.status === "draft" ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={async () => {
                            if (processingLetterId) return; // Prevent multiple simultaneous operations
                            
                            setProcessingLetterId(letter.id);
                            try {
                              // Validate that a client is selected
                              if (!letter.clientEmail || !letter.clientName) {
                                toast({
                                  title: "Error",
                                  description: "Please select a client before sending the authorization letter",
                                  variant: "destructive",
                                });
                                return;
                              }

                              // 1. Update letter status to "pending" in SharePoint
                              const statusResponse = await fetch('http://localhost:3002/api/update-authorization-letter-status', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  letterId: letter.id,
                                  status: "pending"
                                }),
                              });

                              if (!statusResponse.ok) {
                                const errorData = await statusResponse.json().catch(() => ({}));
                                throw new Error(errorData.message || 'Failed to update letter status');
                              }

                              const statusResult = await statusResponse.json();
                              console.log('✅ Status update response:', statusResult);

                              // 2. Create authorization request
                              const requestId = `AUTH-${letter.id.replace('AL-', '')}`;
                              const authorizationRequest = {
                                id: requestId,
                                area: letter.area,
                                confirmingParty: letter.confirmingParty,
                                recipientEmail: letter.recipientEmail,
                                recipientName: letter.recipientName,
                                remarksByAuditor: `Please review and authorize this confirmation request for ${letter.area} - ${letter.confirmingParty}`,
                                attachmentByAuditor: [],
                                status: "pending",
                                confirmationStatus: "pending",
                                periodEndDate: "",
                                clientOrganization: letter.clientName
                              };

                              const requestResponse = await fetch('http://localhost:3002/api/create-authorization-request', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  request: authorizationRequest
                                }),
                              });

                              if (!requestResponse.ok) {
                                throw new Error('Failed to create authorization request');
                              }

                              // 3. Add Stage 2 activity log entry
                              const performedBy = "Auditor"; // TODO: Get actual auditor name from auth context
                              // Normalize letter ID (remove AL- prefix if present) for activity log matching
                              const normalizedLetterId = letter.id?.replace(/^AL-/, '') || letter.id;
                              const activityLogResponse = await fetch('http://localhost:3002/api/add-activity-log', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  letterId: normalizedLetterId,
                                  stage: "Send to Client",
                                  action: "Sent to client for authorization",
                                  performedBy: performedBy,
                                  details: `Authorization request sent to ${letter.clientName} (${letter.clientEmail}) for approval`,
                                  status: "completed"
                                }),
                              });

                              if (!activityLogResponse.ok) {
                                console.error('Failed to add activity log, but continuing...');
                              }

                              toast({
                                title: "Success",
                                description: `Authorization letter sent to ${letter.clientName}`,
                              });

                              // Refresh authorization letters to get updated status and activity logs
                              // Wait a bit to ensure SharePoint update has propagated
                              setTimeout(() => {
                                fetchAuthorizationLetters(false);
                              }, 500);
                            } catch (error: any) {
                              console.error('Error sending authorization letter:', error);
                              toast({
                                title: "Error",
                                description: `Failed to send authorization letter: ${error.message}`,
                                variant: "destructive",
                              });
                            } finally {
                              setProcessingLetterId(null);
                            }
                          }}
                          disabled={processingLetterId === letter.id}
                        >
                          {processingLetterId === letter.id ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-1" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </>
                          )}
                        </Button>
                      ) : letter.status === "rejected" ? (
                        <div className="flex items-center gap-2">
                          {getStatusBadge(letter.status)}
                          <Button
                            size="sm"
                            variant="default"
                            onClick={async () => {
                              try {
                                // Validate that a client is selected
                                if (!letter.clientEmail || !letter.clientName) {
                                  toast({
                                    title: "Error",
                                    description: "Please select a client before resending the authorization letter",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                // 1. Update letter status to "pending" in SharePoint
                                const statusResponse = await fetch('http://localhost:3002/api/update-authorization-letter-status', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    letterId: letter.id,
                                    status: "pending"
                                  }),
                                });

                                if (!statusResponse.ok) {
                                  throw new Error('Failed to update letter status');
                                }

                                // 2. Create/update authorization request (resend)
                                const requestId = `AUTH-${letter.id.replace('AL-', '')}`;
                                const authorizationRequest = {
                                  id: requestId,
                                  area: letter.area,
                                  confirmingParty: letter.confirmingParty,
                                  recipientEmail: letter.recipientEmail,
                                  recipientName: letter.recipientName,
                                  remarksByAuditor: `Please review and authorize this confirmation request for ${letter.area} - ${letter.confirmingParty}`,
                                  attachmentByAuditor: [],
                                  status: "pending",
                                  confirmationStatus: "pending",
                                  periodEndDate: "",
                                  clientOrganization: letter.clientName
                                };

                                const requestResponse = await fetch('http://localhost:3002/api/create-authorization-request', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    request: authorizationRequest
                                  }),
                                });

                                if (!requestResponse.ok) {
                                  throw new Error('Failed to create authorization request');
                                }

                                // 3. Add Stage 2 activity log entry (resend)
                                const performedBy = "Auditor"; // TODO: Get actual auditor name from auth context
                                // Normalize letter ID (remove AL- prefix if present) for activity log matching
                                const normalizedLetterId = letter.id?.replace(/^AL-/, '') || letter.id;
                                const activityLogResponse = await fetch('http://localhost:3002/api/add-activity-log', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    letterId: normalizedLetterId,
                                    stage: "Send to Client",
                                    action: "Sent to client for authorization",
                                    performedBy: performedBy,
                                    details: `Authorization request resent to ${letter.clientName} (${letter.clientEmail}) for approval`,
                                    status: "completed"
                                  }),
                                });

                                if (!activityLogResponse.ok) {
                                  console.error('Failed to add activity log, but continuing...');
                                }

                                toast({
                                  title: "Success",
                                  description: `Authorization letter resent to ${letter.clientName}`,
                                });

                                // Refresh authorization letters to get updated status and activity logs
                                // Wait a bit to ensure SharePoint update has propagated
                                setTimeout(() => {
                                  fetchAuthorizationLetters(false);
                                }, 500);
                              } catch (error: any) {
                                console.error('Error resending authorization letter:', error);
                                toast({
                                  title: "Error",
                                  description: `Failed to resend authorization letter: ${error.message}`,
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Resend
                          </Button>
                      </div>
                      ) : (
                        getStatusBadge(letter.status)
                      )}
                    </TableCell>
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
                                View activity log for confirmation: {letter.confirmingParty}
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

                              {/* Activity Log Table - Read Only */}
                              <div className="pt-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold">Activity Log</h3>
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
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {letter.activityLog && letter.activityLog.length > 0 ? (
                                        letter.activityLog.map((log, logIndex) => (
                                          <TableRow key={logIndex}>
                                            <TableCell className="font-mono text-xs">
                                              {formatIndianDateTime(log.timestamp)}
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
                                            <TableCell>{getLogStatusBadge(log.status)}</TableCell>
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
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
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
  );
};
