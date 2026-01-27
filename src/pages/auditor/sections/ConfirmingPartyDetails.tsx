import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Globe, CheckCircle, AlertTriangle, XCircle, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";

interface ConfirmingParty {
  id: string;
  area: string;
  name: string;
  recipientEmail: string;
  recipientName: string;
  recipientOrg: string;
  domainTestStatus: "not-run" | "running" | "passed" | "failed" | "general-domain";
  domainInfo?: {
    domain: string;
    creationDate: string;
    expiryDate: string;
    status: string;
    registrar: string;
  };
}


export const ConfirmingPartyDetails = () => {
  const { toast } = useToast();
  const [parties, setParties] = useState<ConfirmingParty[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [isLoadingParties, setIsLoadingParties] = useState(true);

  // Fetch confirming parties and domain test data from SharePoint on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingParties(true);
      await fetchConfirmingParties();
      // Fetch domain test data after parties are loaded so we can match them
      await fetchDomainTestData();
      setIsLoadingParties(false);
    };
    loadData();
  }, []);

  const fetchConfirmingParties = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/get-people-data');
      if (!response.ok) {
        throw new Error('Failed to fetch people data');
      }
      const result = await response.json();
      const peopleData = result.data || { confirming_parties: [] };
      
      console.log('📥 Fetched confirming parties from SharePoint:', peopleData);
      
      // Convert SharePoint data to local format
      if (peopleData.confirming_parties && peopleData.confirming_parties.length > 0) {
        const convertedParties = peopleData.confirming_parties.map((party: any, index: number) => ({
          id: `CP-${String(index + 1).padStart(3, '0')}`,
          area: party.area || "",
          name: party.organization || "",
          recipientEmail: party.email || party.recipient_email || "",
          recipientName: party.recipient_name || "",
          recipientOrg: party.organization || "",
          domainTestStatus: "not-run" as const
        }));
        setParties(convertedParties);
      }
    } catch (error: any) {
      console.error('Error fetching confirming parties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch confirming parties from SharePoint",
        variant: "destructive",
      });
    }
  };

  const fetchDomainTestData = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/get-domain-info');
      if (!response.ok) {
        throw new Error('Failed to fetch domain test data');
      }
      const result = await response.json();
      const domainData = result.data || { domain_records: [] };
      
      console.log('📥 Fetched domain_info.json from SharePoint:', domainData);
      
      // Update parties with domain test results from SharePoint
      setParties(prevParties => {
        if (prevParties.length === 0) {
          return prevParties; // No parties loaded yet, skip
        }
        
        if (domainData.domain_records && domainData.domain_records.length > 0) {
          return prevParties.map(party => {
            // Find matching domain record by email (case-insensitive)
            const matchingRecord = domainData.domain_records.find((record: any) => {
              const recordEmail = record.confirming_party_info?.email_address?.toLowerCase() || "";
              const partyEmail = party.recipientEmail?.toLowerCase() || "";
              return recordEmail === partyEmail;
            });
            
            if (matchingRecord) {
              const domainInfo = matchingRecord.domain_info;
              const status = domainInfo.status;
              
              let testStatus: "not-run" | "running" | "passed" | "failed" | "general-domain" = "passed";
              if (status === "General Domain") {
                testStatus = "general-domain";
              } else if (status === "Not Found" || status === "Inactive/Not Found") {
                testStatus = "failed";
              }
              
              console.log(`✅ Found saved domain test for ${party.recipientEmail}: ${testStatus}`);
              
              return {
                ...party,
                domainTestStatus: testStatus,
                domainInfo: {
                  domain: domainInfo.domain,
                  creationDate: domainInfo.creation_date || "",
                  expiryDate: domainInfo.expiry_date || "",
                  status: domainInfo.status,
                  registrar: domainInfo.registrar || ""
                }
              };
            }
            return party;
          });
        }
        return prevParties;
      });
    } catch (error: any) {
      console.error('Error fetching domain test data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch domain test data from SharePoint",
        variant: "destructive",
      });
    }
  };

  const runDomainTest = async (id: string) => {
    const party = parties.find(p => p.id === id);
    if (!party) return;

    // Set status to running
    setParties(parties.map(p => 
      p.id === id ? { ...p, domainTestStatus: "running" as const } : p
    ));

    try {
      const email = party.recipientEmail;
      const domain = email.split('@')[1];

      const response = await fetch('http://localhost:3002/api/run-domain-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain,
          organization: party.recipientOrg || "",
          recipient_name: party.recipientName || "",
          area: party.area || "",
          email: email
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh domain test data from SharePoint to ensure persistence
        await fetchDomainTestData();

        toast({
          title: "Success",
          description: `Domain test completed for ${domain}`,
        });
      } else {
        throw new Error(result.message || 'Failed to run domain test');
      }
    } catch (error: any) {
      console.error('Error running domain test:', error);
      setParties(parties.map(p => 
        p.id === id ? { ...p, domainTestStatus: "failed" as const } : p
      ));
      toast({
        title: "Error",
        description: `Failed to run domain test: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, partyId: string, isClickable: boolean = false) => {
    switch (status) {
      case "passed":
        if (isClickable && parties.find(p => p.id === partyId)?.domainInfo) {
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                  <Badge className="bg-success text-success-foreground cursor-pointer hover:bg-success/90">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Passed
                  </Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Domain Test Results</DialogTitle>
                  <DialogDescription>
                    Domain verification details for {parties.find(p => p.id === partyId)?.recipientEmail}
                  </DialogDescription>
                </DialogHeader>
                {(() => {
                  const party = parties.find(p => p.id === partyId);
                  if (!party?.domainInfo) return null;
                  
                  return (
                    <div className="space-y-6 py-4">
                      <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-semibold text-success">Domain Test Passed</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            The domain has been successfully verified and is valid for confirmation requests.
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Domain</p>
                          <p className="font-semibold text-lg">{party.domainInfo.domain}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Status</p>
                          <p className="font-semibold text-success">{party.domainInfo.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Creation Date</p>
                          <p className="font-semibold">{party.domainInfo.creationDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Expiry Date</p>
                          <p className="font-semibold">{party.domainInfo.expiryDate}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground mb-1">Registrar</p>
                          <p className="font-semibold">{party.domainInfo.registrar}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Confirming Party Details</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Organization</p>
                              <p className="font-medium">{party.recipientOrg}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Recipient Name</p>
                              <p className="font-medium">{party.recipientName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Area</p>
                              <p className="font-medium">{party.area}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Email Address</p>
                              <p className="font-medium">{party.recipientEmail}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
          );
        }
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Passed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "general-domain":
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            General Domain
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-info text-info-foreground">
            <Globe className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Not Run
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Details of Confirming Party</h2>
        <p className="text-muted-foreground">
          Verify email domains and validate confirming party information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domain Testing</CardTitle>
          <CardDescription>
            Automated domain verification for confirming party email addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confirming Party</TableHead>
                  <TableHead>Recipient Email</TableHead>
                  <TableHead>Recipient Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Test Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingParties ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <LoadingSpinner size="lg" text="Loading confirming parties and domain test data..." />
                    </TableCell>
                  </TableRow>
                ) : parties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No confirming parties found
                    </TableCell>
                  </TableRow>
                ) : (
                  parties.map((party) => (
                    <TableRow key={party.id}>
                    <TableCell>{party.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {party.recipientEmail}
                      </code>
                    </TableCell>
                    <TableCell>{party.recipientName}</TableCell>
                    <TableCell>{party.recipientOrg}</TableCell>
                    <TableCell>
                      {getStatusBadge(party.domainTestStatus, party.id, party.domainTestStatus === "passed")}
                    </TableCell>
                    <TableCell className="text-right">
                      {party.domainTestStatus === "not-run" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runDomainTest(party.id)}
                          disabled={party.domainTestStatus === "running"}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run Test
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Test completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Remove lines 291-345 - the Domain Test Results cards section */}
    </div>
  );
};
