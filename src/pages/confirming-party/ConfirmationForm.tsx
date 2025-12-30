import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Plus } from "lucide-react";
import CashAndCashEquivalentsForm from "./forms/CashAndCashEquivalentsForm";
import LitigationsAndClaimsForm from "./forms/LitigationsAndClaimsForm";
import RelatedPartyDisclosureForm from "./forms/RelatedPartyDisclosureForm";
import BorrowingsForm from "./forms/BorrowingsForm";
import InventoryForm from "./forms/InventoryForm";
import OtherAssetsSecurityDepositsForm from "./forms/OtherAssetsSecurityDepositsForm";
import OtherLiabilitiesSecurityDepositsForm from "./forms/OtherLiabilitiesSecurityDepositsForm";
import OtherReceivablesAdvanceToSupplierForm from "./forms/OtherReceivablesAdvanceToSupplierForm";
import OtherReceivablesCapitalAdvancesForm from "./forms/OtherReceivablesCapitalAdvancesForm";
import OtherLiabilitiesAdvanceFromCustomerForm from "./forms/OtherLiabilitiesAdvanceFromCustomerForm";
import OtherLiabilitiesCapexVendorsForm from "./forms/OtherLiabilitiesCapexVendorsForm";
import PlanAssetsForm from "./forms/PlanAssetsForm";
import TrusteeForm from "./forms/TrusteeForm";
import TradePayablesForm from "./forms/TradePayablesForm";
import TradeReceivablesForm from "./forms/TradeReceivablesForm";
import { BaseConfirmationForm } from "./forms/BaseConfirmationForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Mock data fallback - in real app, this would come from an API
const mockConfirmations: Record<string, any> = {
  "CNF-001": {
    id: "CNF-001",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Cash & Cash Equivalents",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-15"
  },
  "CNF-002": {
    id: "CNF-002",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Trade Receivables",
    status: "draft",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-16"
  },
  "CNF-003": {
    id: "CNF-003",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Litigations & Claims",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-17"
  },
  "CNF-004": {
    id: "CNF-004",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Related Party Disclosure",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-18"
  },
  "CNF-005": {
    id: "CNF-005",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Borrowings",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-19"
  },
  "CNF-006": {
    id: "CNF-006",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Inventory",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-20"
  },
  "CNF-007": {
    id: "CNF-007",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Assets - Security Deposits",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-21"
  },
  "CNF-008": {
    id: "CNF-008",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Liabilities - Security Deposits",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-22"
  },
  "CNF-009": {
    id: "CNF-009",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Receivables - Advance to Supplier",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-23"
  },
  "CNF-010": {
    id: "CNF-010",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Receivables - Capital Advances",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-24"
  },
  "CNF-011": {
    id: "CNF-011",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Other Liabilities - Advance from Customer",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-25"
  },
  "CNF-012": {
    id: "CNF-012",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Other Liabilities - Capex Vendors",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-26"
  },
  "CNF-013": {
    id: "CNF-013",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Plan Assets",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-27"
  },
  "CNF-014": {
    id: "CNF-014",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "David Lee",
    auditorEmail: "david.lee@auditfirm.com",
    area: "Trustee",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-28"
  },
  "CNF-015": {
    id: "CNF-015",
    confirmationFor: "TechCorp Industries Ltd.",
    auditFirm: "ABC Audit Firm",
    auditorName: "Sarah Johnson",
    auditorEmail: "sarah.j@auditfirm.com",
    area: "Trade Payables",
    status: "pending",
    periodEndDate: "2024-12-31",
    createdAt: "2025-01-29"
  }
};

const ConfirmationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [confirmation, setConfirmation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [customTemplate, setCustomTemplate] = useState<any>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  useEffect(() => {
    const fetchConfirmation = async () => {
      // First, try to get confirmation from location state
      if (location.state?.confirmation) {
        setConfirmation(location.state.confirmation);
        setError(null);
        return;
      }

      // If state is not available, fetch from SharePoint using the ID
      if (id) {
        try {
          const response = await fetch('http://localhost:3002/api/get-pending-confirmations');
          if (response.ok) {
            const result = await response.json();
            const pendingData = result.data || { confirmations: [] };
            
            if (pendingData.confirmations && pendingData.confirmations.length > 0) {
              const foundConfirmation = pendingData.confirmations.find((conf: any) => conf.id === id);
              if (foundConfirmation) {
                setConfirmation(foundConfirmation);
                setError(null);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching confirmation:', error);
        }

        // If not found in SharePoint, try mock data
        if (mockConfirmations[id]) {
          setConfirmation(mockConfirmations[id]);
          setError(null);
          return;
        }

        // If still not found, show error
        setError(`Confirmation with ID ${id} not found.`);
      } else {
        setError("No confirmation ID provided.");
      }
    };

    fetchConfirmation();
  }, [location.state, id]);

  // Fetch custom template if selectedTemplate or area is a custom template
  useEffect(() => {
    const fetchCustomTemplate = async () => {
      if (!confirmation) return;
      
      // List of standard areas
      const standardAreas = [
        "Trade Receivables", "Trade Payables", "Cash & Cash Equivalents",
        "Borrowings", "Inventory", "Litigations & Claims", "Related Party Disclosure",
        "Other Assets - Security Deposits", "Other Liabilities - Security Deposits",
        "Other Receivables - Advance to Supplier", "Other Receivables - Capital Advances",
        "Other Liabilities - Advance from Customer", "Other Liabilities - Capex Vendors",
        "Plan Assets", "Trustee"
      ];

      // Check both selectedTemplate and area for custom template name
      const templateName = confirmation.selectedTemplate || confirmation.area;
      
      if (!templateName || standardAreas.includes(templateName)) {
        // It's a standard area or no template specified, use default form
        return;
      }

      // It's a custom template, fetch it
      setLoadingTemplate(true);
      try {
        const response = await fetch('http://localhost:3002/api/get-custom-template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateName: templateName
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load custom template');
        }

        const result = await response.json();
        setCustomTemplate(result.templateData);
      } catch (error: any) {
        console.error('Error loading custom template:', error);
        setError(`Failed to load custom template: ${error.message}`);
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchCustomTemplate();
  }, [confirmation]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/confirming-party/confirmations")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Error</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => navigate("/confirming-party/confirmations")}>
                Return to Confirmations List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!confirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/confirming-party/confirmations")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Loading...</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Loading confirmation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Custom Template Form Component with state management
  const CustomTemplateForm = ({ templateDetails }: { templateDetails: any }) => {
    const [tableData, setTableData] = useState<Record<string, any[]>>({});
    const [textboxData, setTextboxData] = useState<Record<string, string>>({});

    // Initialize table data from template
    useEffect(() => {
      const initialTableData: Record<string, any[]> = {};
      Object.keys(templateDetails).forEach((key) => {
        if (key.startsWith('table_')) {
          const table = templateDetails[key];
          if (table && table.columns && table.rows) {
            // Initialize with existing rows or one empty row
            initialTableData[key] = table.rows.length > 0 
              ? [...table.rows] 
              : [Object.fromEntries(table.columns.map((col: string) => [col, ""]))];
          }
        }
      });
      setTableData(initialTableData);
    }, [templateDetails]);

    const addTableRow = (tableKey: string, columns: string[]) => {
      setTableData(prev => ({
        ...prev,
        [tableKey]: [
          ...(prev[tableKey] || []),
          Object.fromEntries(columns.map((col: string) => [col, ""]))
        ]
      }));
    };

    const updateTableCell = (tableKey: string, rowIndex: number, column: string, value: string) => {
      setTableData(prev => {
        const newData = { ...prev };
        if (!newData[tableKey]) newData[tableKey] = [];
        newData[tableKey] = [...newData[tableKey]];
        newData[tableKey][rowIndex] = { ...newData[tableKey][rowIndex], [column]: value };
        return newData;
      });
    };

    const handleSubmit = async (baseFormData: any) => {
      // Combine table data and textbox data with base form data
      const formData = {
        ...baseFormData,
        ...textboxData,
        tables: tableData
      };

      try {
        const response = await fetch('http://localhost:3002/api/submit-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            confirmationId: confirmation.id,
            formData: formData,
            remarks: baseFormData.remarks || "",
            attachments: baseFormData.attachments || [],
            name: baseFormData.name || "",
            designation: baseFormData.designation || "",
            organizationName: baseFormData.organizationName || "",
            status: "submitted"
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to submit confirmation');
        }

        alert("Confirmation submitted successfully!");
        navigate("/confirming-party/confirmations");
      } catch (error: any) {
        console.error('Error submitting confirmation:', error);
        alert(`Failed to submit confirmation: ${error.message}`);
      }
    };

    return (
      <BaseConfirmationForm
        confirmation={confirmation}
        onSubmit={handleSubmit}
        certificationText={templateDetails.confirmingpartystatement?.[0]?.statement || "We certify that the above particulars (read alongwith the attachments if any) are full and correct."}
      >
        <div className="space-y-6">
          {/* Render elements in the order they appear in templateDetails (preserves creation order) */}
          {(() => {
            // Get all keys in the order they appear in the object (preserves insertion order)
            const allKeys = Object.keys(templateDetails);
            
            // Filter out non-element keys (remarks, attachments, etc.)
            const elementKeys = allKeys.filter(key => 
              key.startsWith('textbox_') || 
              key.startsWith('table_') || 
              key.startsWith('ConfirmingPartyTextBox_')
            );
            
            return elementKeys.map((key) => {
              // Render textboxes
              if (key.startsWith('textbox_')) {
                const text = templateDetails[key];
                if (typeof text === 'string' && text) {
                  return (
                    <div key={key} className="space-y-2">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {text.replace(/\[Recipientname\]/g, confirmation.recipientName || confirmation.recipientName || "[Recipient Name]")
                              .replace(/\[Period-end Date\]/g, confirmation.periodEndDate || "[Period-end Date]")
                              .replace(/\[Client Organization\]/g, confirmation.confirmationFor || "[Client Organization]")}
                      </p>
                    </div>
                  );
                }
              }
              
              // Render tables
              if (key.startsWith('table_')) {
                const table = templateDetails[key];
                if (table && table.columns && Array.isArray(table.columns)) {
                  const currentRows = tableData[key] || table.rows || [];
                  
                  // If no rows, create one empty row with proper column structure
                  const rowsToDisplay = currentRows.length > 0 ? currentRows : 
                    [Object.fromEntries(table.columns.map((col: string) => [col || `Column ${table.columns.indexOf(col) + 1}`, ""]))];
                  
                  return (
                    <div key={key} className="space-y-2">
                      {table.heading && (
                        <h3 className="font-semibold">{table.heading}</h3>
                      )}
                      {table.subheading && (
                        <p className="text-sm text-muted-foreground">{table.subheading}</p>
                      )}
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {table.columns.map((col: string, idx: number) => (
                                <TableHead key={idx}>{col || `Column ${idx + 1}`}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rowsToDisplay.map((row: any, rowIdx: number) => (
                              <TableRow key={rowIdx}>
                                {table.columns.map((col: string, colIdx: number) => (
                                  <TableCell key={colIdx}>
                                    <Input
                                      value={row[col] || ""}
                                      onChange={(e) => updateTableCell(key, rowIdx, col, e.target.value)}
                                      placeholder={col || `Column ${colIdx + 1}`}
                                    />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTableRow(key, table.columns)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Row
                      </Button>
                      {table.footnote_1 && (
                        <p className="text-xs text-muted-foreground">{table.footnote_1}</p>
                      )}
                    </div>
                  );
                }
              }
              
              // Render confirming party textboxes
              if (key.startsWith('ConfirmingPartyTextBox_')) {
                const textbox = templateDetails[key];
                if (Array.isArray(textbox) && textbox[0]) {
                  const item = textbox[0];
                  return (
                    <div key={key} className="space-y-2">
                      {item.heading && (
                        <h3 className="font-semibold">{item.heading}</h3>
                      )}
                      {item.subheading && (
                        <p className="text-sm text-muted-foreground">{item.subheading}</p>
                      )}
                      <Textarea
                        value={textboxData[key] || item.user_response || ""}
                        onChange={(e) => setTextboxData(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={item.subheading || "Enter your response..."}
                        rows={4}
                      />
                    </div>
                  );
                }
              }
              
              return null;
            });
          })()}
        </div>
      </BaseConfirmationForm>
    );
  };

  // Render custom template form
  const renderCustomTemplate = () => {
    if (loadingTemplate) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading custom template...</p>
          </CardContent>
        </Card>
      );
    }

    if (!customTemplate || !customTemplate.templateDetails) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Custom template not found.</p>
          </CardContent>
        </Card>
      );
    }

    return <CustomTemplateForm templateDetails={customTemplate.templateDetails} />;
  };

  const renderFormByArea = () => {
    // Check if custom template should be used (check both selectedTemplate and area)
    const templateName = confirmation.selectedTemplate || confirmation.area;
    const standardAreas = [
      "Trade Receivables", "Trade Payables", "Cash & Cash Equivalents",
      "Borrowings", "Inventory", "Litigations & Claims", "Related Party Disclosure",
      "Other Assets - Security Deposits", "Other Liabilities - Security Deposits",
      "Other Receivables - Advance to Supplier", "Other Receivables - Capital Advances",
      "Other Liabilities - Advance from Customer", "Other Liabilities - Capex Vendors",
      "Plan Assets", "Trustee"
    ];

    if (templateName && !standardAreas.includes(templateName)) {
      // It's a custom template
      return renderCustomTemplate();
    }

    if (!confirmation.area) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Confirmation area is missing.</p>
          </CardContent>
        </Card>
      );
    }

    switch (confirmation.area) {
      case "Cash & Cash Equivalents":
        return <CashAndCashEquivalentsForm confirmation={confirmation} />;
      case "Litigations & Claims":
        return <LitigationsAndClaimsForm confirmation={confirmation} />;
      case "Related Party Disclosure":
        return <RelatedPartyDisclosureForm confirmation={confirmation} />;
      case "Borrowings":
        return <BorrowingsForm confirmation={confirmation} />;
      case "Inventory":
        return <InventoryForm confirmation={confirmation} />;
      case "Other Assets - Security Deposits":
        return <OtherAssetsSecurityDepositsForm confirmation={confirmation} />;
      case "Other Liabilities - Security Deposits":
        return <OtherLiabilitiesSecurityDepositsForm confirmation={confirmation} />;
      case "Other Receivables - Advance to Supplier":
        return <OtherReceivablesAdvanceToSupplierForm confirmation={confirmation} />;
      case "Other Receivables - Capital Advances":
        return <OtherReceivablesCapitalAdvancesForm confirmation={confirmation} />;
      case "Other Liabilities - Advance from Customer":
        return <OtherLiabilitiesAdvanceFromCustomerForm confirmation={confirmation} />;
      case "Other Liabilities - Capex Vendors":
        return <OtherLiabilitiesCapexVendorsForm confirmation={confirmation} />;
      case "Plan Assets":
        return <PlanAssetsForm confirmation={confirmation} />;
      case "Trustee":
        return <TrusteeForm confirmation={confirmation} />;
      case "Trade Payables":
        return <TradePayablesForm confirmation={confirmation} />;
      case "Trade Receivables":
        return <TradeReceivablesForm confirmation={confirmation} />;
      default:
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">
                Form not found for area: {confirmation.area}
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/confirming-party/confirmations")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {confirmation.area || "Confirmation"} - {confirmation.confirmationFor || "Unknown"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Confirmation ID: {confirmation.id || id || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {renderFormByArea()}
      </div>
    </div>
  );
};

export default ConfirmationForm;
