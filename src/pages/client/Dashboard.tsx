import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Download, XCircle, AlertCircle, Eye, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  periodEndDate?: string; // Add this line
  clientOrganization?: string; // Add this line
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
    attachments: ["confirmation_response_001.pdf"],
    periodEndDate: "2024-12-31",
    clientOrganization: "TechCorp Industries Ltd."
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
    confirmationStatus: "confirmed",
    confirmedDate: "2025-01-25 11:20:00",
    formData: {
      amounts: [
        { amount: "85000.00", currency: "USD" }
      ],
      organizationName: "Global Supplies Inc.",
      name: "Michael Brown",
      designation: "Accounts Manager",
      isCertified: true
    },
    remarks: "Payables confirmed as per records.",
    attachments: ["confirmation_response_002.pdf"],
    periodEndDate: "2024-12-31",
    clientOrganization: "TechCorp Industries Ltd."
  },
  {
    id: "AUTH-003",
    area: "Cash & Cash Equivalents",
    confirmingParty: "XYZ Bank",
    recipientEmail: "contact@xyzbank.com",
    recipientName: "Jane Doe",
    remarksByAuditor: "Confirmation request for bank balances.",
    attachmentByAuditor: ["authorization_letter_003.pdf"],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-20 14:35:22",
    confirmationStatus: "confirmed",
    confirmedDate: "2025-01-23 09:15:00",
    formData: {
      currentAccounts: [
        { designation: "Current Account - 1234", currency: "USD", balance: "500000.00" }
      ],
      organizationName: "XYZ Bank",
      name: "Jane Doe",
      designation: "Branch Manager",
      isCertified: true
    },
    remarks: "Bank balances confirmed.",
    attachments: ["confirmation_response_003.pdf"],
    periodEndDate: "2024-12-31",
    clientOrganization: "TechCorp Industries Ltd."
  },
  {
    id: "AUTH-004",
    area: "Borrowings",
    confirmingParty: "Finance Corp. Bank",
    recipientEmail: "loans@financecorp.com",
    recipientName: "Vikram Reddy",
    remarksByAuditor: "Confirm outstanding loan balances and terms as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_004.pdf"],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-21 10:15:00",
    confirmationStatus: "confirmed",
    confirmedDate: "2025-01-24 16:00:00",
    formData: {
      currentAccounts: [
        { designation: "Term Loan A", currency: "USD", balance: "5000000.00" }
      ],
      organizationName: "Finance Corp. Bank",
      name: "Vikram Reddy",
      designation: "Credit Manager",
      isCertified: true
    },
    remarks: "Loan details confirmed.",
    attachments: ["confirmation_response_004.pdf"],
    periodEndDate: "2024-12-31",
    clientOrganization: "TechCorp Industries Ltd."
  },
  {
    id: "AUTH-005",
    area: "Related Party Disclosure",
    confirmingParty: "Subsidiary Co. Ltd.",
    recipientEmail: "contact@subsidiaryco.com",
    recipientName: "Rahul Sharma",
    remarksByAuditor: "Confirm related party transactions and balances for the year.",
    attachmentByAuditor: ["authorization_letter_005.pdf"],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-18 09:45:00",
    confirmationStatus: "confirmed",
    confirmedDate: "2025-01-26 09:45:00",
    formData: {
      organizationName: "Subsidiary Co. Ltd.",
      name: "Rahul Sharma",
      designation: "Finance Head",
      isCertified: true
    },
    remarks: "All related party details confirmed.",
    attachments: ["confirmation_response_005.pdf"],
    periodEndDate: "2024-12-31",
    clientOrganization: "TechCorp Industries Ltd."
  },
  {
    id: "AUTH-006",
    area: "Plan Assets",
    confirmingParty: "Pension Fund Managers",
    recipientEmail: "funds@pension.com",
    recipientName: "Alok Kumar",
    remarksByAuditor: "Confirm details of plan assets held as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_006.pdf"],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-22 11:00:00",
    confirmationStatus: "confirmed",
    confirmedDate: "2025-01-27 10:15:00",
    formData: {
      amount: "2000000.00",
      organizationName: "Pension Fund Managers",
      name: "Alok Kumar",
      designation: "Fund Manager",
      isCertified: true
    },
    remarks: "Plan assets confirmed.",
    attachments: ["confirmation_response_006.pdf"],
    periodEndDate: "2024-12-31",
    clientOrganization: "TechCorp Industries Ltd."
  },
  {
    id: "AUTH-007",
    area: "Other Liabilities - Capex Vendors",
    confirmingParty: "Equipment Suppliers Co.",
    recipientEmail: "capex@equipments.com",
    recipientName: "Sonia Das",
    remarksByAuditor: "Confirm outstanding payables to capex vendors as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_007.pdf"],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-19 14:20:00",
    confirmationStatus: "confirmed",
    confirmedDate: "2025-01-25 10:15:00",
    formData: {
      amounts: [
        { amount: "750000.00", currency: "USD" }
      ],
      organizationName: "Equipment Suppliers Co.",
      name: "Sonia Das",
      designation: "Accounts Head",
      isCertified: true
    },
    remarks: "Capex payables confirmed.",
    attachments: ["confirmation_response_007.pdf"],
    periodEndDate: "2024-12-31",
    clientOrganization: "TechCorp Industries Ltd."
  },
  {
    id: "AUTH-008",
    area: "Inventory",
    confirmingParty: "Warehouse Management Ltd.",
    recipientEmail: "inventory@warehouse.com",
    recipientName: "Rajesh Patel",
    remarksByAuditor: "Please review and authorize this confirmation request for inventory held.",
    attachmentByAuditor: ["authorization_letter_008.pdf"],
    status: "pending",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-009",
    area: "Fixed Assets",
    confirmingParty: "Asset Verification Services",
    recipientEmail: "assets@verification.com",
    recipientName: "Meera Singh",
    remarksByAuditor: "Confirm fixed assets valuation and existence as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_009.pdf"],
    status: "rejected",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-26 10:45:00",
    confirmationStatus: "not-confirmed",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-010",
    area: "Investments",
    confirmingParty: "Investment Advisors Inc.",
    recipientEmail: "investments@advisors.com",
    recipientName: "Amit Verma",
    remarksByAuditor: "Please confirm investment holdings and valuations.",
    attachmentByAuditor: ["authorization_letter_010.pdf"],
    status: "rejected",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-26 10:45:00",
    confirmationStatus: "not-confirmed",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-011",
    area: "Litigations & Claims",
    confirmingParty: "Legal Counsel LLP",
    recipientEmail: "legal@counsel.com",
    recipientName: "Anjali Singh",
    remarksByAuditor: "Provide details of all pending and threatened litigations as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_011.pdf"],
    status: "rejected",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-26 10:45:00",
    confirmationStatus: "not-confirmed",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-012",
    area: "Other Assets - Security Deposits",
    confirmingParty: "Property Management Co.",
    recipientEmail: "security@property.com",
    recipientName: "Kiran Mehta",
    remarksByAuditor: "Confirm security deposits held as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_012.pdf"],
    status: "rejected",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-26 10:45:00",
    confirmationStatus: "not-confirmed",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-013",
    area: "Other Liabilities - Security Deposits",
    confirmingParty: "Tenant Services Ltd.",
    recipientEmail: "deposits@tenant.com",
    recipientName: "Neha Kapoor",
    remarksByAuditor: "Confirm security deposits payable as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_013.pdf"],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-26 10:45:00",
    confirmationStatus: "not-confirmed",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-014",
    area: "Other Receivables - Advance to Supplier",
    confirmingParty: "Supplier Network Inc.",
    recipientEmail: "advances@supplier.com",
    recipientName: "Pradeep Kumar",
    remarksByAuditor: "Confirm advances given to suppliers as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_014.pdf"],
    status: "authorized",
    authorizedBy: "Sarah Johnson",
    authorizedDate: "2025-01-26 10:45:00",
    confirmationStatus: "not-confirmed",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-015",
    area: "Other Receivables - Capital Advances",
    confirmingParty: "Capital Projects Ltd.",
    recipientEmail: "capital@projects.com",
    recipientName: "Sanjay Rao",
    remarksByAuditor: "Confirm capital advances made as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_015.pdf"],
    status: "pending",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-016",
    area: "Other Liabilities - Advance from Customer",
    confirmingParty: "Customer A Pvt. Ltd.",
    recipientEmail: "advances@customerA.com",
    recipientName: "Rohan Gupta",
    remarksByAuditor: "Confirm advance payments received as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_016.pdf"],
    status: "pending",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-017",
    area: "Trustee",
    confirmingParty: "Trust Management Services",
    recipientEmail: "trust@management.com",
    recipientName: "Deepak Joshi",
    remarksByAuditor: "Confirm trust assets and liabilities as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_017.pdf"],
    status: "pending",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-018",
    area: "Trade Receivables",
    confirmingParty: "New Company Ltd.",
    recipientEmail: "contact@newcompany.com",
    recipientName: "John Doe",
    remarksByAuditor: "Please review and authorize this confirmation request.",
    attachmentByAuditor: ["authorization_letter_018.pdf"],
    status: "pending",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-019",
    area: "Related Party Disclosure",
    confirmingParty: "Acme Holdings Pvt. Ltd.",
    recipientEmail: "rpd.contact@acmeholdings.com",
    recipientName: "Priya Nair",
    remarksByAuditor: "Please confirm related party relationships, transactions and balances as per the attached format.",
    attachmentByAuditor: ["authorization_letter_019.pdf"],
    status: "pending",
    periodEndDate: "2024-12-31"
  },
  {
    id: "AUTH-020",
    area: "Cash & Cash Equivalents",
    confirmingParty: "Global Bank Corp.",
    recipientEmail: "corporate@globalbank.com",
    recipientName: "Sarah Chen",
    remarksByAuditor: "Confirm all bank accounts and fixed deposits as of December 31, 2024.",
    attachmentByAuditor: ["authorization_letter_020.pdf"],
    status: "pending",
    periodEndDate: "2024-12-31",
    clientOrganization: "TechCorp Industries Ltd."
  }
];

// Add a new component to render blank confirmation template (for viewing before authorization)
const BlankConfirmationTemplateView = ({ request }: { request: AuthorizationRequest }) => {
  const renderFormByArea = () => {
    switch (request.area) {
      case "Trade Receivables":
      case "Trade Payables":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Kindly confirm to us the following information in respect of amounts {request.area === "Trade Receivables" ? "receivable from" : "payable to"} you as on {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period-end Date]"}:
            </p>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      (Form fields will be filled by confirming party)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case "Cash & Cash Equivalents":
      case "Borrowings":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-6">
              Kindly confirm the below balances to us pertaining to the account balances of {request.clientOrganization || "[Client Organization]"} as are held with you as on {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period-end Date]"}:
            </p>
            
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
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        (Form fields will be filled by confirming party)
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
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
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        (Form fields will be filled by confirming party)
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Add other sections as placeholders */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm font-semibold">Additional sections (if applicable):</Label>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
                <li>Fixed Deposits</li>
                <li>Recurring Deposits</li>
                <li>Loan Accounts</li>
                <li>Derivative Contracts</li>
                <li>Investments</li>
                <li>Interest Accrued</li>
                <li>Wilful Defaulter Status</li>
              </ul>
            </div>
          </div>
        );

      case "Litigations & Claims":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Kindly furnish a list that describes and evaluates pending or threatened litigations, claims, and assessments with respect to which you have been engaged and to which you have devoted substantive attention on behalf of {request.clientOrganization || "[Client Organization]"} in the form of legal consultation or representation.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Kindly also furnish a list of unasserted claims or assessments (considered by management to be probable of assertion and which, if asserted, would have at least a reasonable possibility of an unfavourable outcome).
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground italic">
                (Details will be filled by confirming party)
              </p>
            </div>
          </div>
        );

        case "Related Party Disclosure":
          return (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Kindly confirm to us the following information in respect of related party transactions as on {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period-end Date]"}:
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Sl. No.</TableHead>
                      <TableHead>Nature of Relationship as at {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period end date]"}</TableHead>
                      <TableHead className="w-[340px]">Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      "Wholly Owned Subsidiary",
                      "Subsidiary",
                      "Fellow Subsidiary",
                      "Joint Venture",
                      "Associate",
                      "Key Managerial Personnel [KMP]",
                      "Relative of KMP",
                      "Company in which KMP or his/her relative has significant influence",
                      "Any other relationship (not mentioned above)",
                      "Any change in relationship during the year or subsequent to year-end",
                    ].map((label, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{idx + 1}.</TableCell>
                        <TableCell>{label}</TableCell>
                        <TableCell className="text-muted-foreground italic">
                          (Form fields will be filled by confirming party)
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );

      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirmation form template for {request.area}
            </p>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground italic">
                (Form details will be filled by confirming party)
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Letter Header */}
      <div className="space-y-2 border-b pb-4">
        <p className="text-sm text-muted-foreground">
          Dear {request.recipientName},
        </p>
        {renderFormByArea()}
      </div>

      {/* Certification Section (Placeholder) */}
      <div className="space-y-2 pt-4 border-t">
        <p className="text-sm text-muted-foreground italic">
          (Certification statement and signatory details will be provided by confirming party)
        </p>
      </div>
    </div>
  );
};

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
              Kindly confirm to us the following information in respect of amounts {request.area === "Trade Receivables" ? "receivable from" : "payable to"} you as on {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period-end Date]"}:
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
              Kindly confirm the below balances to us pertaining to the account balances of {request.clientOrganization || "[Client Organization]"} as are held with you as on {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period-end Date]"}:
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
      
        case "Related Party Disclosure":
          return (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground mb-4">
                Kindly confirm to us the following information in respect of related party transactions as on {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period-end Date]"}:
              </p>
              
              {/* Relationship Responses */}
              {request.formData.relationshipResponses && (
                <div className="space-y-2">
                  <Label className="font-semibold">Nature of Relationship</Label>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Sl. No.</TableHead>
                          <TableHead>Nature of Relationship</TableHead>
                          <TableHead>Response</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { key: "whollyOwnedSubsidiary", label: "Wholly Owned Subsidiary" },
                          { key: "subsidiary", label: "Subsidiary" },
                          { key: "fellowSubsidiary", label: "Fellow Subsidiary" },
                          { key: "jointVenture", label: "Joint Venture" },
                          { key: "associate", label: "Associate" },
                          { key: "kmp", label: "Key Managerial Personnel [KMP]" },
                          { key: "relativeOfKmp", label: "Relative of KMP" },
                          { key: "companyWithKmp", label: "Company in which KMP or his/her relative has significant influence" },
                        ].map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{idx + 1}.</TableCell>
                            <TableCell>{item.label}</TableCell>
                            <TableCell>{request.formData.relationshipResponses[item.key] || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
  
              {/* Transactions */}
              {request.formData.transactions && request.formData.transactions.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="font-semibold">Details of Transactions</Label>
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
                        {request.formData.transactions.map((row: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{row.nature || "-"}</TableCell>
                            <TableCell>{row.currency || "-"}</TableCell>
                            <TableCell>{row.amount ? formatIndianNumber(row.amount) : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          );
  
        case "Plan Assets":
          return (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Kindly confirm to us the following information in respect of Plan Assets as on {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period-end Date]"}:
              </p>
              {request.formData.accounts && request.formData.accounts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Currency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {request.formData.accounts.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{row.account || "-"}</TableCell>
                          <TableCell className="font-medium">
                            {row.amount ? formatIndianNumber(row.amount) : "-"}
                          </TableCell>
                          <TableCell>{row.currency || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : request.formData.amount ? (
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <p className="font-medium">{formatIndianNumber(request.formData.amount)}</p>
                </div>
              ) : null}
            </div>
          );
  
        case "Other Liabilities - Capex Vendors":
          return (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Kindly confirm to us the following information in respect of amounts payable to you as on {request.periodEndDate ? formatIndianDate(request.periodEndDate) : "[Period-end Date]"}:
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

  // Fetch authorization requests from SharePoint on component mount
  useEffect(() => {
    fetchAuthorizationRequests();
  }, []);

  const fetchAuthorizationRequests = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/get-authorization-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch authorization requests');
      }
      const result = await response.json();
      const requestsData = result.data || { requests: [] };
      
      console.log('📥 Fetched authorization_requests.json from SharePoint:', requestsData);
      
      // Convert SharePoint data to local format
      if (requestsData.requests && requestsData.requests.length > 0) {
        const convertedRequests = requestsData.requests.map((req: any) => ({
          id: req.id || `AUTH-${Date.now()}`,
          area: req.area || "",
          confirmingParty: req.confirmingParty || "",
          recipientEmail: req.recipientEmail || "",
          recipientName: req.recipientName || "",
          remarksByAuditor: req.remarksByAuditor || "",
          attachmentByAuditor: req.attachmentByAuditor || [],
          status: (req.status || "pending") as "pending" | "authorized" | "rejected",
          authorizedBy: req.authorizedBy,
          authorizedDate: req.authorizedDate,
          confirmationStatus: (req.confirmationStatus || "pending") as "pending" | "confirmed" | "not-confirmed",
          confirmedDate: req.confirmedDate,
          formData: req.formData,
          remarks: req.remarks,
          attachments: req.attachments,
          periodEndDate: req.periodEndDate || "",
          clientOrganization: req.clientOrganization || ""
        }));
        setRequests(convertedRequests);
      }
    } catch (error: any) {
      console.error('Error fetching authorization requests:', error);
      // Keep using mock data if fetch fails
    }
  };

  const handleAuthorize = async (id: string) => {
    if (userRole !== "Authorizer") return; // Safety check
    
    try {
      const currentUser = mockClientUsers.find(u => u.email === currentUserEmail);
      const authorizedBy = currentUser?.name || "Unknown";
      const authorizedDate = new Date().toISOString();

      // Extract letter ID from request ID
      // Request ID format: AUTH-{letterId}
      // Letter ID is the sample ID (e.g., TR_Q4_001 or 721952-001), not AL-prefixed
      const letterId = id.replace('AUTH-', '');

      // 1. Update authorization request status
      const requestResponse = await fetch('http://localhost:3002/api/update-authorization-request-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: id,
          status: "authorized",
          authorizedBy: authorizedBy,
          authorizedDate: authorizedDate
        }),
      });

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update authorization request status');
      }

      const requestResult = await requestResponse.json();
      console.log('✅ Authorization request status update response:', requestResult);

      // 2. Update authorization letter status
      const letterResponse = await fetch('http://localhost:3002/api/update-authorization-letter-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterId: letterId,
          status: "authorized"
        }),
      });

      if (!letterResponse.ok) {
        const errorData = await letterResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update authorization letter status');
      }

      const letterResult = await letterResponse.json();
      console.log('✅ Authorization letter status update response:', letterResult);

      // 3. Add Stage 3 activity log entry
      const activityLogResponse = await fetch('http://localhost:3002/api/add-activity-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterId: letterId,
          stage: "Authorization by Client",
          action: "Client authorization received",
          performedBy: `${authorizedBy} (Client)`,
          details: `Client approved sending confirmation to ${requests.find(r => r.id === id)?.confirmingParty || "Unknown"}`,
          status: "completed"
        }),
      });

      if (!activityLogResponse.ok) {
        console.error('Failed to add activity log, but continuing...');
      }

      // 4. Update local state
      setRequests(requests.map(req => 
        req.id === id 
          ? { 
              ...req, 
              status: "authorized" as const,
              authorizedBy: authorizedBy,
              authorizedDate: authorizedDate
            }
          : req
      ));

      alert("Confirmation authorized successfully!");
      
      // Refresh requests to get updated data after a short delay to ensure SharePoint update has propagated
      setTimeout(() => {
        fetchAuthorizationRequests();
      }, 500);
    } catch (error: any) {
      console.error('Error authorizing request:', error);
      alert(`Failed to authorize: ${error.message}`);
    }
  };

  const handleReject = async (id: string) => {
    if (userRole !== "Authorizer") return; // Safety check
    
    try {
      const currentUser = mockClientUsers.find(u => u.email === currentUserEmail);
      const authorizedBy = currentUser?.name || "Unknown";
      const authorizedDate = new Date().toISOString();

      // Extract letter ID from request ID
      // Request ID format: AUTH-{letterId}
      // Letter ID is the sample ID (e.g., TR_Q4_001 or 721952-001), not AL-prefixed
      const letterId = id.replace('AUTH-', '');

      // 1. Update authorization request status
      const requestResponse = await fetch('http://localhost:3002/api/update-authorization-request-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: id,
          status: "rejected",
          authorizedBy: authorizedBy,
          authorizedDate: authorizedDate
        }),
      });

      if (!requestResponse.ok) {
        throw new Error('Failed to update authorization request status');
      }

      // 2. Update authorization letter status
      const letterResponse = await fetch('http://localhost:3002/api/update-authorization-letter-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterId: letterId,
          status: "rejected",
          authorizedBy: authorizedBy,
          authorizedDate: authorizedDate
        }),
      });

      if (!letterResponse.ok) {
        throw new Error('Failed to update authorization letter status');
      }

      // 3. Add Stage 3 activity log entry
      const activityLogResponse = await fetch('http://localhost:3002/api/add-activity-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letterId: letterId,
          stage: "Authorization by Client",
          action: "Client authorization rejected",
          performedBy: `${authorizedBy} (Client)`,
          details: `Client rejected sending confirmation to ${requests.find(r => r.id === id)?.confirmingParty || "Unknown"}`,
          status: "completed"
        }),
      });

      if (!activityLogResponse.ok) {
        console.error('Failed to add activity log, but continuing...');
      }

      // 4. Update local state
      setRequests(requests.map(req => 
        req.id === id 
          ? { 
              ...req, 
              status: "rejected" as const,
              authorizedBy: authorizedBy,
              authorizedDate: authorizedDate
            }
          : req
      ));

      alert("Confirmation rejected.");
      
      // Refresh requests to get updated data
      fetchAuthorizationRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert(`Failed to reject: ${error.message}`);
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
          <Badge variant="outline">
            Pending
          </Badge>
        );
    }
  };

  const getConfirmationStatusBadge = (status?: string, authorizationStatus?: string) => {
    // If authorization is still pending, show Pending
    if (authorizationStatus === "pending") {
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    
    // If authorization is done (authorized/rejected), only show Confirmed or Not Confirmed
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
        // When authorization is done but confirmation status is not set, show Not Confirmed
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Not Confirmed
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
            <img src="/logo.png" alt="Verity AI" className="h-10" />
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
              <img src="/logo.png" alt="Verity AI" className="h-10" />
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
                        <div className="flex items-center gap-2">
                          {getConfirmationStatusBadge(request.confirmationStatus, request.status)}
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
                                      {getConfirmationStatusBadge(request.confirmationStatus, request.status)}
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
                        {/* For Authorizer: Show buttons only for pending, status badge for completed */}
                        {userRole === "Authorizer" ? (
                          request.status === "pending" ? (
                            <div className="flex gap-3 justify-end items-center">
                              {/* Eye icon button to view template */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="default"
                                    variant="outline"
                                    className="px-3 py-2.5"
                                    title="View Confirmation Template"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Confirmation Template - {request.id}</DialogTitle>
                                    <DialogDescription>
                                      Preview the confirmation template that will be sent to {request.recipientName} at {request.recipientEmail}
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
                                    </div>

                                    {/* Confirmation Form Template Section */}
                                    <div className="pt-4 border-t">
                                      <h3 className="text-lg font-semibold mb-4">Confirmation Form Template</h3>
                                      <Card>
                                        <CardContent className="pt-6">
                                          <BlankConfirmationTemplateView request={request} />
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="default"
                                className="bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 hover:from-emerald-600 hover:via-green-700 hover:to-emerald-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] px-7 py-2.5 rounded-xl border-0 hover:border-green-400/30 border-2"
                                onClick={() => handleAuthorize(request.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 stroke-[2.5]" />
                                Accept
                              </Button>
                              <Button
                                size="default"
                                className="bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 hover:from-rose-600 hover:via-red-700 hover:to-rose-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] px-7 py-2.5 rounded-xl border-0 hover:border-red-400/30 border-2"
                                onClick={() => handleReject(request.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2 stroke-[2.5]" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            /* Show status badge only after action is taken */
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
                          /* For Viewer: Always show only status */
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
