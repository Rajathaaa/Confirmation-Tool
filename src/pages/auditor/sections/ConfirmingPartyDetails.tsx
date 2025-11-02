import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Globe, CheckCircle, AlertTriangle, XCircle, Play } from "lucide-react";
import { useState } from "react";

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

const mockParties: ConfirmingParty[] = [
  {
    id: "CP-001",
    area: "Trade Receivables",
    name: "ABC Corporation Ltd.",
    recipientEmail: "john.smith@abccorp.com",
    recipientName: "John Smith",
    recipientOrg: "ABC Corporation Ltd.",
    domainTestStatus: "passed",
    domainInfo: {
      domain: "abccorp.com",
      creationDate: "2010-05-15",
      expiryDate: "2026-05-15",
      status: "Active",
      registrar: "GoDaddy LLC"
    }
  },
  {
    id: "CP-002",
    area: "Trade Receivables",
    name: "XYZ Industries",
    recipientEmail: "e.chen@xyzind.com",
    recipientName: "Emily Chen",
    recipientOrg: "XYZ Industries",
    domainTestStatus: "not-run"
  },
  {
    id: "CP-003",
    area: "Trade Payables",
    name: "Global Supplies Inc.",
    recipientEmail: "m.brown@gmail.com",
    recipientName: "Michael Brown",
    recipientOrg: "Global Supplies Inc.",
    domainTestStatus: "general-domain"
  }
];

export const ConfirmingPartyDetails = () => {
  const [parties, setParties] = useState(mockParties);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  const runDomainTest = (id: string) => {
    setParties(parties.map(p => 
      p.id === id ? { ...p, domainTestStatus: "running" as const } : p
    ));
    
    // Simulate API call
    setTimeout(() => {
      setParties(parties.map(p => {
        if (p.id === id) {
          const email = p.recipientEmail;
          const domain = email.split('@')[1];
          const generalDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
          
          if (generalDomains.includes(domain)) {
            return { ...p, domainTestStatus: "general-domain" as const };
          }
          
          return {
            ...p,
            domainTestStatus: "passed" as const,
            domainInfo: {
              domain,
              creationDate: "2015-03-20",
              expiryDate: "2027-03-20",
              status: "Active",
              registrar: "Network Solutions LLC"
            }
          };
        }
        return p;
      }));
    }, 2000);
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
                  <TableHead>Area</TableHead>
                  <TableHead>Confirming Party</TableHead>
                  <TableHead>Recipient Email</TableHead>
                  <TableHead>Recipient Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Test Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parties.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell className="font-medium">{party.area}</TableCell>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runDomainTest(party.id)}
                        disabled={party.domainTestStatus === "running"}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run Test
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Remove lines 291-345 - the Domain Test Results cards section */}
    </div>
  );
};
