import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Trash2, Shield, Users, Building2 } from "lucide-react";
import { useState } from "react";

interface AuditorUser {
  id: string;
  email: string;
  name: string;
  designation: string;
  role: "Engagement Partner" | "Engagement Team" | "Engagement Owner";
}

interface ClientUser {
  id: string;
  name: string;
  designation: string;
  email: string;
  role: "Authorizer" | "Viewer";
  areas: string[];
}

interface ConfirmingPartyContact {
  id: string;
  organization: string;
  recipientEmail: string;
  recipientName: string;
  recipientDesignation?: string;
}

const mockAuditors: AuditorUser[] = [
  {
    id: "AU-001",
    email: "james.anderson@auditfirm.com",
    name: "James Anderson",
    designation: "Partner",
    role: "Engagement Partner"
  },
  {
    id: "AU-002",
    email: "sarah.mitchell@auditfirm.com",
    name: "Sarah Mitchell",
    designation: "Senior Manager",
    role: "Engagement Owner"
  },
  {
    id: "AU-003",
    email: "david.lee@auditfirm.com",
    name: "David Lee",
    designation: "Senior Associate",
    role: "Engagement Team"
  }
];

const mockClients: ClientUser[] = [
  {
    id: "CL-001",
    name: "Sarah Johnson",
    designation: "CFO",
    email: "sarah.j@techcorp.com",
    role: "Authorizer",
    areas: ["Trade Receivables", "Trade Payables", "Cash & Cash Equivalents"]
  },
  {
    id: "CL-002",
    name: "Robert Chen",
    designation: "Finance Manager",
    email: "r.chen@techcorp.com",
    role: "Viewer",
    areas: ["Trade Receivables"]
  }
];

const mockConfirmingParties: ConfirmingPartyContact[] = [
  {
    id: "CP-001",
    organization: "ABC Corporation Ltd.",
    recipientEmail: "john.smith@abccorp.com",
    recipientName: "John Smith",
    recipientDesignation: "Accounts Manager"
  },
  {
    id: "CP-002",
    organization: "XYZ Industries",
    recipientEmail: "e.chen@xyzind.com",
    recipientName: "Emily Chen"
  }
];

export const AccessRoles = () => {
  const [auditors, setAuditors] = useState(mockAuditors);
  const [clients, setClients] = useState(mockClients);
  const [confirmingParties, setConfirmingParties] = useState(mockConfirmingParties);

  const getRoleBadge = (role: string) => {
    if (role === "Engagement Partner") {
      return <Badge className="bg-primary">Partner</Badge>;
    } else if (role === "Engagement Owner") {
      return <Badge className="bg-accent text-accent-foreground">Owner</Badge>;
    } else if (role === "Authorizer") {
      return <Badge className="bg-success text-success-foreground">Authorizer</Badge>;
    } else if (role === "Viewer") {
      return <Badge variant="secondary">Viewer</Badge>;
    }
    return <Badge variant="outline">{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Access & Roles</h2>
        <p className="text-muted-foreground">
          Manage user access permissions for auditors, clients, and confirming parties
        </p>
      </div>

      <Tabs defaultValue="auditors" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="auditors" className="gap-2">
            <Shield className="h-4 w-4" />
            Auditor Roles
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Client Roles
          </TabsTrigger>
          <TabsTrigger value="confirming" className="gap-2">
            <Building2 className="h-4 w-4" />
            Confirming Party
          </TabsTrigger>
        </TabsList>

        {/* Auditor Roles */}
        <TabsContent value="auditors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Auditor Team Members</CardTitle>
                  <CardDescription>
                    Manage engagement partner, owner, and team members
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Auditor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Auditor</DialogTitle>
                      <DialogDescription>
                        Add a new team member to this engagement
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Email</Label>
                        <Input placeholder="email@auditfirm.com" className="mt-2" />
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input placeholder="Full Name" className="mt-2" />
                      </div>
                      <div>
                        <Label>Designation</Label>
                        <Input placeholder="e.g., Senior Manager" className="mt-2" />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="partner">Engagement Partner</SelectItem>
                            <SelectItem value="owner">Engagement Owner</SelectItem>
                            <SelectItem value="team">Engagement Team</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full">Add Auditor</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditors.map((auditor) => (
                      <TableRow key={auditor.id}>
                        <TableCell className="font-medium">{auditor.name}</TableCell>
                        <TableCell>{auditor.email}</TableCell>
                        <TableCell>{auditor.designation}</TableCell>
                        <TableCell>{getRoleBadge(auditor.role)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Roles */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Users</CardTitle>
                  <CardDescription>
                    Manage client authorizers and viewers
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Client User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Client User</DialogTitle>
                      <DialogDescription>
                        Add a new client user with specific permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Name</Label>
                        <Input placeholder="Full Name" className="mt-2" />
                      </div>
                      <div>
                        <Label>Designation</Label>
                        <Input placeholder="e.g., CFO" className="mt-2" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input placeholder="email@company.com" className="mt-2" />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="authorizer">Authorizer</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Areas (Multiple Selection)</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select areas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="receivables">Trade Receivables</SelectItem>
                            <SelectItem value="payables">Trade Payables</SelectItem>
                            <SelectItem value="cash">Cash & Cash Equivalents</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full">Add Client User</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Areas</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.designation}</TableCell>
                        <TableCell>{getRoleBadge(client.role)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {client.areas.map((area, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confirming Party */}
        <TabsContent value="confirming">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Confirming Party Contacts</CardTitle>
                  <CardDescription>
                    Manage external confirming party contacts
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Confirming Party</DialogTitle>
                      <DialogDescription>
                        Add a new confirming party contact
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Organization</Label>
                        <Input placeholder="Company Name" className="mt-2" />
                      </div>
                      <div>
                        <Label>Recipient Email</Label>
                        <Input placeholder="email@company.com" className="mt-2" />
                      </div>
                      <div>
                        <Label>Recipient Name</Label>
                        <Input placeholder="Full Name" className="mt-2" />
                      </div>
                      <div>
                        <Label>Recipient Designation (Optional)</Label>
                        <Input placeholder="e.g., Accounts Manager" className="mt-2" />
                      </div>
                      <Button className="w-full">Add Contact</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Recipient Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmingParties.map((party) => (
                      <TableRow key={party.id}>
                        <TableCell className="font-medium">{party.organization}</TableCell>
                        <TableCell>{party.recipientName}</TableCell>
                        <TableCell>{party.recipientEmail}</TableCell>
                        <TableCell>{party.recipientDesignation || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
