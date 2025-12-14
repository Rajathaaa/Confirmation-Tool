import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Trash2, Shield, Users, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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
  const { toast } = useToast();
  const [auditors, setAuditors] = useState(mockAuditors);
  const [clients, setClients] = useState(mockClients);
  const [confirmingParties, setConfirmingParties] = useState(mockConfirmingParties);
  const [expandedClientAreas, setExpandedClientAreas] = useState<Set<string>>(new Set());
  
  // Fetch people data from SharePoint on component mount
  useEffect(() => {
    fetchPeopleData();
  }, []);

  const fetchPeopleData = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/get-people-data');
      if (!response.ok) {
        throw new Error('Failed to fetch people data');
      }
      const result = await response.json();
      const peopleData = result.data || { auditors: [], clients: [], confirming_parties: [] };
      
      console.log('📥 Fetched people_data.json from SharePoint:', peopleData);
      
      // Convert SharePoint data to local format
      if (peopleData.auditors && peopleData.auditors.length > 0) {
        const convertedAuditors = peopleData.auditors.map((auditor: any, index: number) => ({
          id: `AU-${String(index + 1).padStart(3, '0')}`,
          email: auditor.email || "",
          name: auditor.name || "",
          designation: auditor.designation || "",
          role: auditor.role === "Engagement Partner" ? "Engagement Partner" as const
            : auditor.role === "Engagement Owner" ? "Engagement Owner" as const
            : "Engagement Team" as const
        }));
        setAuditors(convertedAuditors);
      }
      
      if (peopleData.clients && peopleData.clients.length > 0) {
        const convertedClients = peopleData.clients.map((client: any, index: number) => ({
          id: `CL-${String(index + 1).padStart(3, '0')}`,
          name: client.name || "",
          designation: client.designation || "",
          email: client.email || "",
          role: client.role === "Authorizer" ? "Authorizer" as const : "Viewer" as const,
          areas: client.areas || []
        }));
        setClients(convertedClients);
      }
      
      if (peopleData.confirming_parties && peopleData.confirming_parties.length > 0) {
        const convertedParties = peopleData.confirming_parties.map((party: any, index: number) => ({
          id: `CP-${String(index + 1).padStart(3, '0')}`,
          organization: party.organization || "",
          recipientEmail: party.email || party.recipient_email || "",
          recipientName: party.recipient_name || "",
          recipientDesignation: party.designation || undefined
        }));
        setConfirmingParties(convertedParties);
      }
      
    } catch (error: any) {
      console.error('Error fetching people data:', error);
      // Keep using mock data if fetch fails
    }
  };
  
  // Form states for Add Auditor
  const [auditorDialogOpen, setAuditorDialogOpen] = useState(false);
  const [auditorForm, setAuditorForm] = useState({
    email: "",
    name: "",
    designation: "",
    role: "" as "" | "partner" | "owner" | "team"
  });
  
  // Form states for Add Client User
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "",
    designation: "",
    email: "",
    role: "" as "" | "authorizer" | "viewer",
    areas: [] as string[]
  });
  
  // Form states for Add Contact
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    organization: "",
    recipientEmail: "",
    recipientName: "",
    recipientDesignation: ""
  });
  
  const availableAreas = [
    "Trade Receivables",
    "Trade Payables",
    "Cash & Cash Equivalents",
    "Inventory",
    "Fixed Assets",
    "Investments",
    "Loans & Advances",
    "Other Current Assets"
  ];

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

  const toggleClientAreas = (clientId: string) => {
    setExpandedClientAreas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleAddAuditor = async () => {
    if (!auditorForm.email || !auditorForm.name || !auditorForm.designation || !auditorForm.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const roleMap: Record<string, string> = {
      partner: "Engagement Partner",
      owner: "Engagement Owner",
      team: "Engagement Team"
    };

    const auditorData = {
      name: auditorForm.name,
      email: auditorForm.email,
      designation: auditorForm.designation,
      role: roleMap[auditorForm.role]
    };

    try {
      const response = await fetch('http://localhost:3002/api/add-auditor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auditor: auditorData
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        const newAuditor: AuditorUser = {
          id: `AU-${String(auditors.length + 1).padStart(3, '0')}`,
          email: auditorForm.email,
          name: auditorForm.name,
          designation: auditorForm.designation,
          role: roleMap[auditorForm.role] as "Engagement Partner" | "Engagement Owner" | "Engagement Team"
        };

        setAuditors([...auditors, newAuditor]);
        setAuditorForm({ email: "", name: "", designation: "", role: "" });
        setAuditorDialogOpen(false);
        toast({
          title: "Success",
          description: "Auditor added successfully and saved to SharePoint",
        });
      } else {
        throw new Error(result.message || 'Failed to add auditor');
      }
    } catch (error: any) {
      console.error('Error adding auditor:', error);
      toast({
        title: "Error",
        description: `Failed to add auditor: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async () => {
    if (!clientForm.name || !clientForm.email || !clientForm.designation || !clientForm.role || clientForm.areas.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select at least one area",
        variant: "destructive",
      });
      return;
    }

    const roleMap: Record<string, string> = {
      authorizer: "Authorizer",
      viewer: "Viewer"
    };

    const clientData = {
      name: clientForm.name,
      email: clientForm.email,
      designation: clientForm.designation,
      role: roleMap[clientForm.role],
      areas: clientForm.areas
    };

    try {
      const response = await fetch('http://localhost:3002/api/add-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client: clientData
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        const newClient: ClientUser = {
          id: `CL-${String(clients.length + 1).padStart(3, '0')}`,
          name: clientForm.name,
          designation: clientForm.designation,
          email: clientForm.email,
          role: roleMap[clientForm.role] as "Authorizer" | "Viewer",
          areas: clientForm.areas
        };

        setClients([...clients, newClient]);
        setClientForm({ name: "", designation: "", email: "", role: "", areas: [] });
        setClientDialogOpen(false);
        toast({
          title: "Success",
          description: "Client user added successfully and saved to SharePoint",
        });
      } else {
        throw new Error(result.message || 'Failed to add client');
      }
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: `Failed to add client: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAddContact = async () => {
    if (!contactForm.organization || !contactForm.recipientEmail || !contactForm.recipientName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const confirmingPartyData = {
      organization: contactForm.organization,
      recipient_name: contactForm.recipientName,
      email: contactForm.recipientEmail,
      designation: contactForm.recipientDesignation || ""
    };

    try {
      const response = await fetch('http://localhost:3002/api/add-confirming-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmingParty: confirmingPartyData
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        const newContact: ConfirmingPartyContact = {
          id: `CP-${String(confirmingParties.length + 1).padStart(3, '0')}`,
          organization: contactForm.organization,
          recipientEmail: contactForm.recipientEmail,
          recipientName: contactForm.recipientName,
          recipientDesignation: contactForm.recipientDesignation || undefined
        };

        setConfirmingParties([...confirmingParties, newContact]);
        setContactForm({ organization: "", recipientEmail: "", recipientName: "", recipientDesignation: "" });
        setContactDialogOpen(false);
        toast({
          title: "Success",
          description: "Contact added successfully and saved to SharePoint",
        });
      } else {
        throw new Error(result.message || 'Failed to add contact');
      }
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: `Failed to add contact: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const toggleClientArea = (area: string) => {
    setClientForm(prev => {
      const newAreas = prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area];
      return { ...prev, areas: newAreas };
    });
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
                <Dialog open={auditorDialogOpen} onOpenChange={setAuditorDialogOpen}>
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
                        <Input 
                          placeholder="email@auditfirm.com" 
                          className="mt-2"
                          value={auditorForm.email}
                          onChange={(e) => setAuditorForm({ ...auditorForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input 
                          placeholder="Full Name" 
                          className="mt-2"
                          value={auditorForm.name}
                          onChange={(e) => setAuditorForm({ ...auditorForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Designation</Label>
                        <Input 
                          placeholder="e.g., Senior Manager" 
                          className="mt-2"
                          value={auditorForm.designation}
                          onChange={(e) => setAuditorForm({ ...auditorForm, designation: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select 
                          value={auditorForm.role}
                          onValueChange={(value: "partner" | "owner" | "team") => setAuditorForm({ ...auditorForm, role: value })}
                        >
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
                      <Button className="w-full" onClick={handleAddAuditor}>Add Auditor</Button>
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
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete ${auditor.name}?`)) {
                                try {
                                  const response = await fetch('http://localhost:3002/api/delete-auditor', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      email: auditor.email
                                    }),
                                  });

                                  const result = await response.json();

                                  if (result.success) {
                                    setAuditors(auditors.filter(a => a.email !== auditor.email));
                                    toast({
                                      title: "Success",
                                      description: "Auditor deleted successfully",
                                    });
                                  } else {
                                    throw new Error(result.message || 'Failed to delete auditor');
                                  }
                                } catch (error: any) {
                                  console.error('Error deleting auditor:', error);
                                  toast({
                                    title: "Error",
                                    description: `Failed to delete auditor: ${error.message}`,
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
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
                <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
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
                        <Input 
                          placeholder="Full Name" 
                          className="mt-2"
                          value={clientForm.name}
                          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Designation</Label>
                        <Input 
                          placeholder="e.g., CFO" 
                          className="mt-2"
                          value={clientForm.designation}
                          onChange={(e) => setClientForm({ ...clientForm, designation: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input 
                          placeholder="email@company.com" 
                          className="mt-2"
                          value={clientForm.email}
                          onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select 
                          value={clientForm.role}
                          onValueChange={(value: "authorizer" | "viewer") => setClientForm({ ...clientForm, role: value })}
                        >
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
                        <div className="mt-2 space-y-2 border rounded-md p-3">
                          {availableAreas.map((area) => (
                            <div key={area} className="flex items-center space-x-2">
                              <Checkbox
                                id={`area-${area}`}
                                checked={clientForm.areas.includes(area)}
                                onCheckedChange={() => toggleClientArea(area)}
                              />
                              <label
                                htmlFor={`area-${area}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {area}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleAddClient}>Add Client User</Button>
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
                    {clients.map((client) => {
                      const isExpanded = expandedClientAreas.has(client.id);
                      const firstArea = client.areas[0] || "";
                      const remainingCount = client.areas.length - 1;

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.designation}</TableCell>
                          <TableCell>{getRoleBadge(client.role)}</TableCell>
                          <TableCell>
                            {client.areas.length > 0 ? (
                              <div className="space-y-2">
                                {/* Collapsed view */}
                                {!isExpanded && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 text-left justify-start hover:bg-muted"
                                    onClick={() => toggleClientAreas(client.id)}
                                  >
                                    <span className="text-sm font-medium">
                                      {firstArea}
                                      {remainingCount > 0 && (
                                        <span className="text-muted-foreground font-normal ml-1">
                                          +{remainingCount}
                                        </span>
                                      )}
                                    </span>
                                    <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
                                  </Button>
                                )}

                                {/* Expanded view */}
                                {isExpanded && (
                                  <div className="space-y-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-1 text-left justify-start hover:bg-muted mb-1"
                                      onClick={() => toggleClientAreas(client.id)}
                                    >
                                      <ChevronUp className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">Hide areas</span>
                                    </Button>
                                    <div className="flex flex-col gap-1 pl-6">
                                      {client.areas.map((area, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs w-fit">
                                          {area}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No areas</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
                                  try {
                                    const response = await fetch('http://localhost:3002/api/delete-client', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        email: client.email
                                      }),
                                    });

                                    const result = await response.json();

                                    if (result.success) {
                                      setClients(clients.filter(c => c.email !== client.email));
                                      toast({
                                        title: "Success",
                                        description: "Client deleted successfully",
                                      });
                                    } else {
                                      throw new Error(result.message || 'Failed to delete client');
                                    }
                                  } catch (error: any) {
                                    console.error('Error deleting client:', error);
                                    toast({
                                      title: "Error",
                                      description: `Failed to delete client: ${error.message}`,
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
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
                        <Input 
                          placeholder="Company Name" 
                          className="mt-2"
                          value={contactForm.organization}
                          onChange={(e) => setContactForm({ ...contactForm, organization: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Recipient Email</Label>
                        <Input 
                          placeholder="email@company.com" 
                          className="mt-2"
                          value={contactForm.recipientEmail}
                          onChange={(e) => setContactForm({ ...contactForm, recipientEmail: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Recipient Name</Label>
                        <Input 
                          placeholder="Full Name" 
                          className="mt-2"
                          value={contactForm.recipientName}
                          onChange={(e) => setContactForm({ ...contactForm, recipientName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Recipient Designation (Optional)</Label>
                        <Input 
                          placeholder="e.g., Accounts Manager" 
                          className="mt-2"
                          value={contactForm.recipientDesignation}
                          onChange={(e) => setContactForm({ ...contactForm, recipientDesignation: e.target.value })}
                        />
                      </div>
                      <Button className="w-full" onClick={handleAddContact}>Add Contact</Button>
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
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete ${party.recipientName} from ${party.organization}?`)) {
                                try {
                                  const response = await fetch('http://localhost:3002/api/delete-confirming-party', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      email: party.recipientEmail
                                    }),
                                  });

                                  const result = await response.json();

                                  if (result.success) {
                                    setConfirmingParties(confirmingParties.filter(cp => cp.recipientEmail !== party.recipientEmail));
                                    toast({
                                      title: "Success",
                                      description: "Confirming party deleted successfully",
                                    });
                                  } else {
                                    throw new Error(result.message || 'Failed to delete confirming party');
                                  }
                                } catch (error: any) {
                                  console.error('Error deleting confirming party:', error);
                                  toast({
                                    title: "Error",
                                    description: `Failed to delete confirming party: ${error.message}`,
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
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
