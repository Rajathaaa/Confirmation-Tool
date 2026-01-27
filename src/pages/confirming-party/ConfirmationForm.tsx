import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumberInput, parseIndianNumber } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading";

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
  const [submittedTemplateDetails, setSubmittedTemplateDetails] = useState<any>(null);
  const [loadingSubmittedData, setLoadingSubmittedData] = useState(false);

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

  // Fetch confirmation templateDetails from confirmation file for all confirmations
  useEffect(() => {
    const fetchConfirmationData = async () => {
      if (!confirmation || !confirmation.area) {
        return;
      }

      setLoadingSubmittedData(true);
      try {
        const response = await fetch('http://localhost:3002/api/get-submitted-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            confirmationId: confirmation.id || confirmation.letterId,
            area: confirmation.area
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const templateDetails = result.templateDetails;
          
          console.log('📥 Received templateDetails from API:', templateDetails);
          console.log('📊 templateDetails keys:', templateDetails ? Object.keys(templateDetails) : 'null');
          console.log('📊 templateDetails length:', templateDetails ? Object.keys(templateDetails).length : 0);
          
          // Check if templateDetails is empty object
          if (!templateDetails || (typeof templateDetails === 'object' && Object.keys(templateDetails).length === 0)) {
            console.log('⚠️ templateDetails is empty, fetching blank template...');
            // Fetch blank template instead
            const templateName = confirmation.selectedTemplate || confirmation.area;
            if (templateName) {
              const templateResponse = await fetch('http://localhost:3002/api/get-custom-template', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  templateName: templateName
                }),
              });

              if (templateResponse.ok) {
                const templateResult = await templateResponse.json();
                setSubmittedTemplateDetails(templateResult.templateData?.templateDetails || {});
                console.log('✅ Loaded blank template for confirmation');
              } else {
                setSubmittedTemplateDetails({});
              }
            } else {
              setSubmittedTemplateDetails({});
            }
          } else {
            setSubmittedTemplateDetails(templateDetails);
            console.log('✅ Loaded confirmation templateDetails with data:', {
              hasTextboxes: Object.keys(templateDetails).some(k => k.startsWith('textbox_')),
              hasTables: Object.keys(templateDetails).some(k => k.startsWith('table_')),
              hasQuestions: Object.keys(templateDetails).some(k => k.startsWith('question_')),
              keys: Object.keys(templateDetails)
            });
          }
        } else {
          // If confirmation not found in file or error (400, 404, etc.), try to fetch blank template
          let errorMessage = 'Unknown error';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || 'Unknown error';
            console.warn(`Confirmation API error (${response.status}): ${errorMessage}, fetching blank template...`);
          } catch (e) {
            console.warn(`Confirmation API error (${response.status}): Failed to parse error response, fetching blank template...`);
          }
          
          const templateName = confirmation.selectedTemplate || confirmation.area;
          if (templateName) {
            try {
              const templateResponse = await fetch('http://localhost:3002/api/get-custom-template', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  templateName: templateName
                }),
              });

              if (templateResponse.ok) {
                const templateResult = await templateResponse.json();
                const blankTemplateDetails = templateResult.templateData?.templateDetails || {};
                setSubmittedTemplateDetails(blankTemplateDetails);
                console.log('✅ Loaded blank template as fallback:', {
                  hasData: Object.keys(blankTemplateDetails).length > 0,
                  keys: Object.keys(blankTemplateDetails)
                });
              } else {
                console.warn('Failed to load blank template, setting empty');
                setSubmittedTemplateDetails({});
              }
            } catch (templateError) {
              console.error('Error loading blank template:', templateError);
              setSubmittedTemplateDetails({});
            }
          } else {
            console.warn('No template name available, setting empty');
            setSubmittedTemplateDetails({});
          }
        }
      } catch (error: any) {
        console.error('Error loading confirmation data:', error);
        // Try to fetch blank template as fallback
        const templateName = confirmation.selectedTemplate || confirmation.area;
        if (templateName) {
          try {
            const templateResponse = await fetch('http://localhost:3002/api/get-custom-template', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                templateName: templateName
              }),
            });

            if (templateResponse.ok) {
              const templateResult = await templateResponse.json();
              setSubmittedTemplateDetails(templateResult.templateData?.templateDetails || {});
              console.log('✅ Loaded blank template as fallback after error');
            }
          } catch (templateError) {
            console.error('Error loading blank template:', templateError);
          }
        }
      } finally {
        setLoadingSubmittedData(false);
      }
    };

    fetchConfirmationData();
  }, [confirmation]);

  // Fetch template (standard or custom) from SharePoint (only if confirmation data not loaded)
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!confirmation || submittedTemplateDetails !== null) {
        // Skip template loading if we already have confirmation data or are loading it
        return;
      }
      
      // Check both selectedTemplate and area for template name
      const templateName = confirmation.selectedTemplate || confirmation.area;
      
      if (!templateName) {
        // No template specified, use default form
        return;
      }

      // Fetch template from SharePoint (checks both Confirmation_Template.json and create_template.json)
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
          // If template not found, it might be using a hardcoded form component
          // Don't throw error, just log it and let the default form render
          console.warn(`Template "${templateName}" not found in SharePoint: ${errorData.message}`);
          setLoadingTemplate(false);
          return;
        }

        const result = await response.json();
        setCustomTemplate(result.templateData);
      } catch (error: any) {
        console.error('Error loading template:', error);
        // Don't set error state, just log it and let the default form render
        console.warn(`Failed to load template "${templateName}": ${error.message}`);
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
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
              <img src="/logo.png" alt="Verity AI" className="h-10" />
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
              <img src="/logo.png" alt="Verity AI" className="h-10" />
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
    const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({});

    // Initialize table data from template (including conditional tables)
    useEffect(() => {
      const initialTableData: Record<string, any[]> = {};
      
      // Process all tables (both direct and conditional)
      const processTable = (tableKey: string, table: any) => {
        if (table && table.columns) {
          if (table.rows && table.rows.length > 0) {
            // Handle rows that might be:
            // 1. Empty string array: ["", ""] or ["", ...]
            // 2. Empty objects: [{}]
            // 3. Actual data objects: [{ "col1": "value", "col2": "value" }]
            // 4. Type specifications: [{ "col1": { "type": "number" } }]
            initialTableData[tableKey] = table.rows.map((row: any) => {
              // Check if row is a string (empty string from new template format)
              if (typeof row === 'string') {
                // Empty string, create structure from columns
                return Object.fromEntries(table.columns.map((col: string) => [col, ""]));
              }
              
              // Check if row is an empty object
              if (typeof row === 'object' && row !== null && !Array.isArray(row) && Object.keys(row).length === 0) {
                // Empty object, create structure from columns
                return Object.fromEntries(table.columns.map((col: string) => [col, ""]));
              }
              
              // Process row to extract type information if present
              const processedRow: any = {};
              table.columns.forEach((col: string) => {
                if (row[col] !== undefined) {
                  // Check if the value is a type specification object
                  if (typeof row[col] === 'object' && row[col] !== null && !Array.isArray(row[col]) && row[col].type) {
                    // Store the type info separately and initialize with empty value
                    processedRow[col] = "";
                    processedRow[`${col}_type`] = row[col];
                  } else {
                    processedRow[col] = row[col];
                  }
                } else {
                  processedRow[col] = "";
                }
              });
              return processedRow;
            });
          } else {
            // Table has columns but no rows, create one empty row
            initialTableData[tableKey] = [Object.fromEntries(table.columns.map((col: string) => [col, ""]))];
          }
        }
      };
      
      // Process direct tables
      Object.keys(templateDetails).forEach((key) => {
        if (key.startsWith('table_')) {
          processTable(key, templateDetails[key]);
        }
        
        // Process conditional tables in questions
        if (key.startsWith('question_')) {
          const question = templateDetails[key];
          if (question && question.conditional && question.conditional.showIf) {
            Object.keys(question.conditional).forEach((conditionalKey) => {
              if (conditionalKey !== 'showIf' && conditionalKey.startsWith('table_')) {
                processTable(conditionalKey, question.conditional[conditionalKey]);
              }
            });
          }
        }
      });
      
      setTableData(initialTableData);
    }, [templateDetails]);

    // Initialize textbox data from templateDetails
    useEffect(() => {
      const initialTextboxData: Record<string, string> = {};
      
      Object.keys(templateDetails).forEach((key) => {
        if (key.startsWith('textbox_')) {
          const value = templateDetails[key];
          // Extract actual value if it's a string
          if (typeof value === 'string') {
            initialTextboxData[key] = value;
          }
        }
      });
      
      setTextboxData(initialTextboxData);
    }, [templateDetails]);

    // Initialize ConfirmingPartyTextBox and question responses from templateDetails
    useEffect(() => {
      const initialQuestionResponses: Record<string, string> = {};
      
      Object.keys(templateDetails).forEach((key) => {
        // Handle ConfirmingPartyTextBox
        if (key.startsWith('ConfirmingPartyTextBox_')) {
          const textbox = templateDetails[key];
          if (Array.isArray(textbox) && textbox[0] && textbox[0].user_response) {
            initialQuestionResponses[key] = textbox[0].user_response;
          }
        }
        
        // Handle question responses (question_1, question_2, etc.)
        if (key.startsWith('question_')) {
          const question = templateDetails[key];
          if (question && question.response) {
            initialQuestionResponses[key] = question.response;
          }
        }
      });
      
      setQuestionResponses(initialQuestionResponses);
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

    const updateTableCell = (tableKey: string, rowIndex: number, column: string, value: any, cellType?: any) => {
      setTableData(prev => {
        const newData = { ...prev };
        if (!newData[tableKey]) newData[tableKey] = [];
        newData[tableKey] = [...newData[tableKey]];
        newData[tableKey][rowIndex] = { ...newData[tableKey][rowIndex], [column]: value };
        return newData;
      });
    };

    const renderTableCell = (tableKey: string, rowIndex: number, column: string, cellValue: any, cellType?: any) => {
      // For table_1 in Related Party Disclosure, make "Sl. No." and "Nature of Relationship as at [Period end date]" read-only
      const isReadOnlyColumn = tableKey === 'table_1' && 
        (column === 'Sl. No.' || column === 'Nature of Relationship as at [Period end date]');
      
      // For conditional tables in question_1 and question_2, make "Particulars" column read-only
      const isReadOnlyParticulars = (tableKey === 'table_loans_borrowed' || 
                                      tableKey === 'table_loans_given' || 
                                      tableKey === 'table_loans_borrowed_security' || 
                                      tableKey === 'table_loans_given_security') && 
                                     column === 'Particulars';
      
      if (isReadOnlyColumn || isReadOnlyParticulars) {
        // Render as read-only text with placeholder replacement
        const displayValue = (cellValue || "")
          .replace(/\[Period end date\]/g, confirmation.periodEndDate ? new Date(confirmation.periodEndDate).toLocaleDateString('en-IN') : "[Period end date]")
          .replace(/\[Period End Date\]/g, confirmation.periodEndDate ? new Date(confirmation.periodEndDate).toLocaleDateString('en-IN') : "[Period End Date]")
          .replace(/\[Period-end Date\]/g, confirmation.periodEndDate ? new Date(confirmation.periodEndDate).toLocaleDateString('en-IN') : "[Period-end Date]")
          .replace(/\[Client Organization Name\]/g, confirmation.confirmationFor || "[Client Organization Name]")
          .replace(/\[Client Organization name\]/g, confirmation.confirmationFor || "[Client Organization name]");
        return (
          <span className="text-sm">{displayValue}</span>
        );
      }
      
      // Check if cell has type specification
      if (cellType && typeof cellType === 'object') {
        if (cellType.type === 'dropdown' && cellType.options) {
          return (
            <Select
              value={cellValue || ""}
              onValueChange={(value) => updateTableCell(tableKey, rowIndex, column, value, cellType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {cellType.options.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        } else if (cellType.type === 'number') {
          return (
            <Input
              type="text"
              value={formatNumberInput(cellValue || "")}
              onChange={(e) => {
                const numericValue = parseIndianNumber(e.target.value);
                updateTableCell(tableKey, rowIndex, column, numericValue.toString(), cellType);
              }}
              placeholder={column}
            />
          );
        } else if (cellType.type === 'text') {
          return (
            <Input
              value={cellValue || ""}
              onChange={(e) => updateTableCell(tableKey, rowIndex, column, e.target.value, cellType)}
              placeholder={column}
            />
          );
        }
      }
      
      // Default text input
      return (
        <Input
          value={cellValue || ""}
          onChange={(e) => updateTableCell(tableKey, rowIndex, column, e.target.value, cellType)}
          placeholder={column}
        />
      );
    };

    const handleSubmit = async (baseFormData: any) => {
      console.log('🚀 handleSubmit called - Starting reconstruction');
      // Debug: Log all state data before reconstruction
      console.log('📊 State data before reconstruction:');
      console.log('  textboxData:', textboxData);
      console.log('  tableData:', tableData);
      console.log('  questionResponses:', questionResponses);
      console.log('  baseFormData:', baseFormData);
      console.log('  templateDetails keys:', Object.keys(templateDetails));
      
      // Reconstruct templateDetails structure exactly matching the template
      // This ensures the JSON saved matches the template structure exactly
      const reconstructedTemplateDetails: any = {};
      
      console.log('🔄 Starting reconstruction loop...');
      
      // Check if this template has the Cash & Cash Equivalents / Borrowings structure
      // (textbox_1, table_1-9, table_10a, table_10b, textbox_interest, table_12, question_1)
      const hasStandardBankStructure = 
        templateDetails.textbox_1 && 
        templateDetails.table_1 && 
        templateDetails.table_9 && 
        templateDetails.table_10a && 
        templateDetails.table_10b && 
        templateDetails.textbox_interest && 
        templateDetails.table_12 && 
        templateDetails.question_1;
      
      // Check if this template has the Related Party Disclosure structure
      // (textbox_1, table_1, table_2, question_1, question_2, table_3, table_4)
      const hasRelatedPartyStructure = 
        templateDetails.textbox_1 && 
        templateDetails.table_1 && 
        templateDetails.table_2 && 
        templateDetails.question_1 && 
        templateDetails.question_2 && 
        templateDetails.table_3 && 
        templateDetails.table_4;
      
      // Use the same sorting logic as rendering to ensure correct order
      const getSortOrder = (key: string): number => {
        const systemFields = ['remarks', 'attachments', 'confirmingpartystatement', 'confirmingpartydetails', 'actions'];
        if (systemFields.includes(key)) {
          return 10000 + systemFields.indexOf(key);
        }
        
        // If template has Related Party Disclosure structure
        // apply the specific ordering: textbox_1, table_1, table_2, question_1, question_2, table_3, table_4
        if (hasRelatedPartyStructure) {
          const orderMap: Record<string, number> = {
            'textbox_1': 1,
            'table_1': 2,
            'table_2': 3,
            'question_1': 4,
            'question_2': 5,
            'table_3': 6,
            'table_4': 7
          };
          
          if (orderMap[key] !== undefined) {
            return orderMap[key];
          }
        }
        
        // If template has standard bank structure (Cash & Cash Equivalents, Borrowings, etc.)
        // apply the specific ordering
        if (hasStandardBankStructure) {
          const orderMap: Record<string, number> = {
            'textbox_1': 1,
            'table_1': 2,
            'table_2': 3,
            'table_3': 4,
            'table_4': 5,
            'table_5': 6,
            'table_6': 7,
            'table_7': 8,
            'table_8': 9,
            'table_9': 10,
            'table_10a': 11,
            'table_10b': 12,
            'textbox_interest': 13,
            'table_12': 14,
            'question_1': 15
          };
          
          if (orderMap[key] !== undefined) {
            return orderMap[key];
          }
        }
        
        // Fallback for other keys
        if (key.startsWith('textbox_')) {
          if (key === 'textbox_1') return 1;
          if (key === 'textbox_interest') return 200;
          const match = key.match(/textbox_(\d+)/);
          return match ? 100 + parseInt(match[1], 10) : 300;
        }
        
        if (key.startsWith('table_')) {
          if (key === 'table_10a') return 11;
          if (key === 'table_10b') return 12;
          if (key === 'table_12') return 14;
          const numMatch = key.match(/table_(\d+)/);
          if (numMatch) {
            const num = parseInt(numMatch[1], 10);
            if (num >= 1 && num <= 9) return 1 + num;
          }
          return 400;
        }
        
        if (key.startsWith('question_')) {
          const match = key.match(/question_(\d+)/);
          return match ? 300 + parseInt(match[1], 10) : 350;
        }
        
        return 500;
      };
      
      // Get all keys and sort them in the correct order
      const allKeys = Object.keys(templateDetails);
      const sortedKeys = allKeys.sort((keyA, keyB) => {
        return getSortOrder(keyA) - getSortOrder(keyB);
      });
      
      console.log('📋 Sorted keys for reconstruction:', sortedKeys);
      
      // Process each element in the sorted order to preserve structure
      sortedKeys.forEach((key) => {
        // Skip system fields - these are handled separately
        if (key === 'remarks' || key === 'attachments' || 
            key === 'confirmingpartystatement' || key === 'confirmingpartydetails' ||
            key === 'actions') {
          return;
        }
        
        const templateElement = templateDetails[key];
        
        // Handle textboxes - ALWAYS include, even if read-only
        if (key.startsWith('textbox_')) {
          if (typeof templateElement === 'string') {
            // Simple textbox - ALWAYS include the original text (even if read-only)
            // User can only edit if it was empty in the template
            reconstructedTemplateDetails[key] = templateElement;
          } else if (typeof templateElement === 'object' && templateElement !== null) {
            // Textbox with heading/description - preserve structure, add value if user filled it
            reconstructedTemplateDetails[key] = {
              ...templateElement,
              value: textboxData[key] || templateElement.value || ""
            };
          }
        }
        
        // Handle tables - ALWAYS include, even if empty
        else if (key.startsWith('table_')) {
          console.log(`  🔧 Processing table: ${key}`);
          const userTableRows = tableData[key] || [];
          const originalRows = templateElement.rows || [];
          
          console.log(`    User table rows: ${userTableRows.length}, Original rows: ${originalRows.length}`);
          console.log(`    User table data:`, userTableRows);
          console.log(`    Original rows:`, originalRows);
          
          // Build table structure - ALWAYS include at least one row
          const cleanedRows: any[] = [];
          
          // If user has entered data, use that data
          if (userTableRows.length > 0) {
            console.log(`    Using user table data (${userTableRows.length} rows)`);
            userTableRows.forEach((userRow: any, rowIndex: number) => {
              const cleanedRow: any = {};
              templateElement.columns.forEach((col: string) => {
                // Get user input value
                const userValue = userRow[col];
                // Get original row to check for pre-filled values (like "Sl. No.")
                const originalRow = originalRows[rowIndex] || originalRows[0] || {};
                const originalValue = originalRow && typeof originalRow === 'object' ? originalRow[col] : undefined;
                
                // If user filled a value, use it
                if (userValue !== undefined && userValue !== "" && userValue !== null) {
                  cleanedRow[col] = userValue;
                } 
                // If original had a pre-filled value (not a type spec), keep it
                else if (originalValue !== undefined && 
                         typeof originalValue === 'string' && 
                         originalValue !== "") {
                  cleanedRow[col] = originalValue; // Keep pre-filled values like "Sl. No.": "1."
                }
                // Otherwise, empty string (never save type specs)
                else {
                  cleanedRow[col] = "";
                }
              });
              cleanedRows.push(cleanedRow);
            });
          } 
          // If no user data, create rows from template but strip type specs
          else if (originalRows.length > 0) {
            console.log(`    Using original template rows (${originalRows.length} rows)`);
            originalRows.forEach((origRow: any) => {
              const cleanedRow: any = {};
              templateElement.columns.forEach((col: string) => {
                const cellValue = origRow && typeof origRow === 'object' ? origRow[col] : undefined;
                // If it's a type spec object, replace with empty string
                if (cellValue && typeof cellValue === 'object' && !Array.isArray(cellValue) && cellValue.type) {
                  cleanedRow[col] = "";
                } 
                // If it's a pre-filled string value, keep it
                else if (typeof cellValue === 'string') {
                  cleanedRow[col] = cellValue;
                }
                // Otherwise empty string
                else {
                  cleanedRow[col] = "";
                }
              });
              cleanedRows.push(cleanedRow);
            });
          }
          
          // ALWAYS ensure at least one empty row exists (even if all above conditions failed)
          if (cleanedRows.length === 0) {
            console.log(`    Creating empty row (no data found)`);
            const emptyRow: any = {};
            templateElement.columns.forEach((col: string) => {
              emptyRow[col] = "";
            });
            cleanedRows.push(emptyRow);
          }
          
          console.log(`    Final cleaned rows:`, cleanedRows);
          
          // Build final table structure - ALWAYS include with all metadata
          reconstructedTemplateDetails[key] = {
            heading: templateElement.heading || "",
            subheading: templateElement.subheading || "",
            footnote: templateElement.footnote || "",
            columns: templateElement.columns || [],
            rows: cleanedRows, // Always has at least one row
            addRow: templateElement.addRow !== undefined ? templateElement.addRow : true
          };
          
          console.log(`    ✅ Table ${key} added to reconstructedTemplateDetails with ${cleanedRows.length} rows`);
        }
        
        // Handle questions - preserve structure, update response
        else if (key.startsWith('question_')) {
          const response = questionResponses[key] || "";
          // Always save response as simple string value, never save type specifications
          reconstructedTemplateDetails[key] = {
            ...templateElement,
            response: response // Always save as simple string, never as type object
          };
          
          // If question has conditional tables, preserve them with their structure
          if (templateElement.conditional) {
            reconstructedTemplateDetails[key].conditional = {
              ...templateElement.conditional
            };
            
            // Update conditional table rows if they exist in tableData
            Object.keys(templateElement.conditional).forEach((conditionalKey) => {
              if (conditionalKey !== 'showIf' && conditionalKey.startsWith('table_')) {
                const conditionalTable = templateElement.conditional[conditionalKey];
                const userConditionalRows = tableData[conditionalKey] || [];
                const originalConditionalRows = conditionalTable.rows || [];
                
                // Build cleaned rows - ONLY user inputs, no type specs
                const cleanedConditionalRows: any[] = [];
                
                if (userConditionalRows.length > 0) {
                  // Use user data
                  userConditionalRows.forEach((userRow: any, rowIndex: number) => {
                    const cleanedRow: any = {};
                    conditionalTable.columns.forEach((col: string) => {
                      const userValue = userRow[col];
                      const originalRow = originalConditionalRows[rowIndex] || originalConditionalRows[0] || {};
                      const originalValue = originalRow && typeof originalRow === 'object' ? originalRow[col] : undefined;
                      
                      // If user filled, use it
                      if (userValue !== undefined && userValue !== "" && userValue !== null) {
                        cleanedRow[col] = userValue;
                      }
                      // If original had pre-filled value (not type spec), keep it
                      else if (originalValue !== undefined && 
                               typeof originalValue === 'string' && 
                               originalValue !== "") {
                        cleanedRow[col] = originalValue;
                      }
                      // Otherwise empty string
                      else {
                        cleanedRow[col] = "";
                      }
                    });
                    cleanedConditionalRows.push(cleanedRow);
                  });
                } else if (originalConditionalRows.length > 0) {
                  // No user data, clean original rows
                  originalConditionalRows.forEach((origRow: any) => {
                    const cleanedRow: any = {};
                    conditionalTable.columns.forEach((col: string) => {
                      const cellValue = origRow && typeof origRow === 'object' ? origRow[col] : undefined;
                      // If type spec, replace with empty string
                      if (cellValue && typeof cellValue === 'object' && !Array.isArray(cellValue) && cellValue.type) {
                        cleanedRow[col] = "";
                      }
                      // If pre-filled string, keep it
                      else if (typeof cellValue === 'string') {
                        cleanedRow[col] = cellValue;
                      }
                      // Otherwise empty
                      else {
                        cleanedRow[col] = "";
                      }
                    });
                    cleanedConditionalRows.push(cleanedRow);
                  });
                } else {
                  // Create empty row
                  const emptyRow: any = {};
                  conditionalTable.columns.forEach((col: string) => {
                    emptyRow[col] = "";
                  });
                  cleanedConditionalRows.push(emptyRow);
                }
                
                reconstructedTemplateDetails[key].conditional[conditionalKey] = {
                  heading: conditionalTable.heading || "",
                  columns: conditionalTable.columns || [],
                  rows: cleanedConditionalRows
                };
              }
            });
          }
        }
        
        // Handle any other fields - preserve as-is
        else {
          reconstructedTemplateDetails[key] = templateElement;
        }
      });
      
      // Add remarks and attachments
      reconstructedTemplateDetails.remarks = baseFormData.remarks || "";
      reconstructedTemplateDetails.attachments = baseFormData.attachments || [];
      
      // Handle confirmingpartystatement - preserve structure
      if (templateDetails.confirmingpartystatement) {
        if (Array.isArray(templateDetails.confirmingpartystatement)) {
          reconstructedTemplateDetails.confirmingpartystatement = templateDetails.confirmingpartystatement.map((stmt: any) => ({
            ...stmt,
            response: baseFormData.isCertified ? "Yes" : "",
            checkbox: baseFormData.isCertified ? "Yes" : "" // Also update checkbox field if it exists
          }));
        } else if (typeof templateDetails.confirmingpartystatement === 'object') {
          reconstructedTemplateDetails.confirmingpartystatement = {
            ...templateDetails.confirmingpartystatement,
            response: baseFormData.isCertified ? "Yes" : "",
            checkbox: baseFormData.isCertified ? "Yes" : "" // Also update checkbox field if it exists
          };
        }
      }
      
      // Handle confirmingpartydetails - preserve structure, update values
      if (templateDetails.confirmingpartydetails) {
        reconstructedTemplateDetails.confirmingpartydetails = {
          ...templateDetails.confirmingpartydetails,
          organizationName: baseFormData.organizationName || "",
          name: baseFormData.name || "",
          designation: baseFormData.designation || ""
        };
      }
      
      // Preserve actions if they exist
      if (templateDetails.actions) {
        reconstructedTemplateDetails.actions = templateDetails.actions;
      }
      
      // Debug: Log reconstructed template details
      console.log('📤 Sending reconstructed templateDetails to backend:');
      console.log('  reconstructedTemplateDetails:', reconstructedTemplateDetails);
      console.log('  Keys in reconstructedTemplateDetails:', Object.keys(reconstructedTemplateDetails));
      
      // Verify tables are included
      const tableKeys = Object.keys(reconstructedTemplateDetails).filter(k => k.startsWith('table_'));
      const textboxKeys = Object.keys(reconstructedTemplateDetails).filter(k => k.startsWith('textbox_'));
      console.log('  📊 Table keys found:', tableKeys);
      console.log('  📝 Textbox keys found:', textboxKeys);
      
      // Log each table structure
      tableKeys.forEach(tableKey => {
        console.log(`  📋 ${tableKey}:`, {
          columns: reconstructedTemplateDetails[tableKey]?.columns,
          rowsCount: reconstructedTemplateDetails[tableKey]?.rows?.length,
          rows: reconstructedTemplateDetails[tableKey]?.rows,
          addRow: reconstructedTemplateDetails[tableKey]?.addRow
        });
      });
      
      // Send the full reconstructed templateDetails structure to backend
      // This ensures all tables, textboxes, and questions are preserved
      const requestBody = {
        confirmationId: confirmation.id,
        templateDetails: reconstructedTemplateDetails, // Send full reconstructed templateDetails structure
        formData: {
          textboxData: textboxData,
          tableData: tableData,
          questionResponses: questionResponses
        }, // Also send raw inputs for backward compatibility
        remarks: baseFormData.remarks || "",
        attachments: baseFormData.attachments || [],
        name: baseFormData.name || "",
        designation: baseFormData.designation || "",
        organizationName: baseFormData.organizationName || "",
        status: "submitted"
      };
      
      // Final verification before sending
      console.log('🚀 Final request body being sent:');
      console.log('  Has templateDetails:', !!requestBody.templateDetails);
      console.log('  templateDetails keys:', requestBody.templateDetails ? Object.keys(requestBody.templateDetails) : 'NONE');
      console.log('  templateDetails:', JSON.stringify(requestBody.templateDetails, null, 2));
      
      try {
        const response = await fetch('http://localhost:3002/api/submit-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
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
        throw error; // Re-throw so BaseConfirmationForm knows submission failed
      }
    };

    // Get certification text - handle both object and array formats
    const getCertificationText = () => {
      const statement = templateDetails.confirmingpartystatement;
      if (Array.isArray(statement) && statement[0]?.statement) {
        return statement[0].statement;
      } else if (statement && typeof statement === 'object' && statement.statement) {
        return statement.statement;
      }
      return "We certify that the above particulars (read alongwith the attachments if any) are full and correct.";
    };

    const isCheckboxRequired = () => {
      const statement = templateDetails.confirmingpartystatement;
      if (Array.isArray(statement) && statement[0]?.checkboxRequired !== undefined) {
        return statement[0].checkboxRequired;
      } else if (statement && typeof statement === 'object' && statement.checkboxRequired !== undefined) {
        return statement.checkboxRequired;
      }
      return true; // Default to required
    };

    // Extract initial values from templateDetails
    const initialRemarks = templateDetails.remarks || "";
    const initialName = templateDetails.confirmingpartydetails?.name || "";
    const initialDesignation = templateDetails.confirmingpartydetails?.designation || "";
    const initialOrganizationName = templateDetails.confirmingpartydetails?.organizationName || "";
    
    // Extract attachments from templateDetails
    let initialAttachments: Array<{ name: string; url: string; originalFileName?: string }> = [];
    if (templateDetails.attachments && Array.isArray(templateDetails.attachments)) {
      initialAttachments = templateDetails.attachments.map((att: any) => {
        // Handle both old format (string) and new format (object)
        if (typeof att === 'string') {
          return { name: att, url: '', originalFileName: att };
        } else if (typeof att === 'object' && att !== null) {
          return {
            name: att.name || att,
            url: att.url || '',
            originalFileName: att.originalFileName || att.name || att
          };
        }
        return { name: String(att), url: '', originalFileName: String(att) };
      });
    }
    
    // Extract isCertified from confirmingpartystatement
    let initialIsCertified = false;
    const statement = templateDetails.confirmingpartystatement;
    if (Array.isArray(statement) && statement[0]) {
      initialIsCertified = statement[0].response === "Yes" || statement[0].checkbox === "Yes";
    } else if (statement && typeof statement === 'object') {
      initialIsCertified = statement.response === "Yes" || statement.checkbox === "Yes";
    }

    return (
      <BaseConfirmationForm
        confirmation={confirmation}
        onSubmit={handleSubmit}
        certificationText={getCertificationText()}
        initialRemarks={initialRemarks}
        initialAttachments={initialAttachments}
        initialName={initialName}
        initialDesignation={initialDesignation}
        initialOrganizationName={initialOrganizationName}
        initialIsCertified={initialIsCertified}
      >
        <div className="space-y-6">
          {/* Render elements in the exact order they appear in the JSON template */}
          {(() => {
            // Handle empty templateDetails
            if (!templateDetails || (typeof templateDetails === 'object' && Object.keys(templateDetails).length === 0)) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No template structure available. Please contact support.</p>
                </div>
              );
            }
            
            // Use Object.entries() to preserve order - this maintains insertion order for string keys
            // in modern JavaScript (ES2015+), which matches the order in the JSON template
            // However, to ensure correct ordering especially for table_10a, table_10b, etc., we'll use a custom sort
            const entries = Object.entries(templateDetails);
            
            // Check if this template has the Cash & Cash Equivalents / Borrowings structure
            // (textbox_1, table_1-9, table_10a, table_10b, textbox_interest, table_12, question_1)
            const hasStandardBankStructure = 
              templateDetails.textbox_1 && 
              templateDetails.table_1 && 
              templateDetails.table_9 && 
              templateDetails.table_10a && 
              templateDetails.table_10b && 
              templateDetails.textbox_interest && 
              templateDetails.table_12 && 
              templateDetails.question_1;
            
            // Check if this template has the Related Party Disclosure structure
            // (textbox_1, table_1, table_2, question_1, question_2, table_3, table_4)
            const hasRelatedPartyStructure = 
              templateDetails.textbox_1 && 
              templateDetails.table_1 && 
              templateDetails.table_2 && 
              templateDetails.question_1 && 
              templateDetails.question_2 && 
              templateDetails.table_3 && 
              templateDetails.table_4;
            
            // Define the expected order based on the template structure
            // This ensures tables are in correct numeric order (1, 2, 3, ..., 9, 10a, 10b, 12)
            const getSortOrder = (key: string): number => {
              // System fields go to the end
              const systemFields = ['remarks', 'attachments', 'confirmingpartystatement', 'confirmingpartydetails', 'actions'];
              if (systemFields.includes(key)) {
                return 10000 + systemFields.indexOf(key);
              }
              
              // If template has Related Party Disclosure structure
              // apply the specific ordering: textbox_1, table_1, table_2, question_1, question_2, table_3, table_4
              if (hasRelatedPartyStructure) {
                const orderMap: Record<string, number> = {
                  'textbox_1': 1,
                  'table_1': 2,
                  'table_2': 3,
                  'question_1': 4,
                  'question_2': 5,
                  'table_3': 6,
                  'table_4': 7
                };
                
                // If key is in the order map, use that order
                if (orderMap[key] !== undefined) {
                  return orderMap[key];
                }
              }
              
              // If template has standard bank structure (Cash & Cash Equivalents, Borrowings, etc.)
              // apply the specific ordering
              if (hasStandardBankStructure) {
                const orderMap: Record<string, number> = {
                  'textbox_1': 1,
                  'table_1': 2,
                  'table_2': 3,
                  'table_3': 4,
                  'table_4': 5,
                  'table_5': 6,
                  'table_6': 7,
                  'table_7': 8,
                  'table_8': 9,
                  'table_9': 10,
                  'table_10a': 11,
                  'table_10b': 12,
                  'textbox_interest': 13,
                  'table_12': 14,
                  'question_1': 15
                };
                
                // If key is in the order map, use that order
                if (orderMap[key] !== undefined) {
                  return orderMap[key];
                }
              }
              
              // Fallback for other keys - try to extract numeric order
              if (key.startsWith('textbox_')) {
                if (key === 'textbox_1') return 1;
                if (key === 'textbox_interest') return 200;
                const match = key.match(/textbox_(\d+)/);
                return match ? 100 + parseInt(match[1], 10) : 300;
              }
              
              if (key.startsWith('table_')) {
                // Handle table_10a and table_10b first
                if (key === 'table_10a') return 11;
                if (key === 'table_10b') return 12;
                // Handle table_12
                if (key === 'table_12') return 14;
                // Handle table_1 through table_9
                const numMatch = key.match(/table_(\d+)/);
                if (numMatch) {
                  const num = parseInt(numMatch[1], 10);
                  if (num >= 1 && num <= 9) return 1 + num; // table_1 = 2, table_2 = 3, ..., table_9 = 10
                }
                return 400;
              }
              
              if (key.startsWith('question_')) {
                const match = key.match(/question_(\d+)/);
                return match ? 300 + parseInt(match[1], 10) : 350;
              }
              
              return 500; // Unknown keys
            };
            
            // Separate system fields from content fields
            const systemFields = ['remarks', 'attachments', 'confirmingpartystatement', 'confirmingpartydetails', 'actions'];
            const contentEntries: [string, any][] = [];
            const systemEntries: [string, any][] = [];
            
            entries.forEach(([key, value]) => {
              if (systemFields.includes(key)) {
                systemEntries.push([key, value]);
              } else {
                contentEntries.push([key, value]);
              }
            });
            
            // Sort content entries by the defined order
            contentEntries.sort(([keyA], [keyB]) => {
              return getSortOrder(keyA) - getSortOrder(keyB);
            });
            
            // Combine: sorted content fields first, then system fields
            const sortedEntries = [...contentEntries, ...systemEntries];
            
            // Debug: Log the order of keys to verify order is correct
            const allKeys = sortedEntries.map(([key]) => key);
            const elementKeys = sortedEntries
              .filter(([key]) => !['remarks', 'attachments', 'confirmingpartystatement', 'confirmingpartydetails', 'actions'].includes(key))
              .map(([key]) => key);
            console.log('All template keys in order:', allKeys);
            console.log('Template element keys in order (will be rendered):', elementKeys);
            
            // Verify table order specifically
            const tableKeys = elementKeys.filter(k => k.startsWith('table_'));
            console.log('Table keys in order:', tableKeys);
            
            // Check for duplicates
            const keyCounts: Record<string, number> = {};
            elementKeys.forEach(key => {
              keyCounts[key] = (keyCounts[key] || 0) + 1;
            });
            const duplicates = Object.entries(keyCounts).filter(([_, count]) => count > 1);
            if (duplicates.length > 0) {
              console.warn('⚠️ Duplicate keys found:', duplicates);
            }
            
            // Create an array to hold rendered elements in order
            const renderedElements: JSX.Element[] = [];
            const processedKeys = new Set<string>(); // Track processed keys to prevent duplicates
            
            // Iterate through sorted entries in order and render each element type as we encounter it
            for (const [key, value] of sortedEntries) {
              // Skip non-element keys (remarks, attachments, confirmingpartystatement, confirmingpartydetails, actions)
              // These are handled separately by BaseConfirmationForm
              if (key === 'remarks' || key === 'attachments' || 
                  key === 'confirmingpartystatement' || key === 'confirmingpartydetails' ||
                  key === 'actions') {
                continue;
              }
              
              // Prevent duplicate rendering
              if (processedKeys.has(key)) {
                console.warn(`⚠️ Skipping duplicate key: ${key}`);
                continue;
              }
              processedKeys.add(key);
              
              // Render textboxes in order
              if (key.startsWith('textbox_')) {
                // Handle both string and object formats
                if (typeof value === 'string') {
                  // If string is empty, make it editable; otherwise display as read-only text
                  if (value === "" || !value.trim()) {
                    // Empty textbox - make it editable
                    console.log(`Rendering editable ${key} at position ${renderedElements.length}`);
                    renderedElements.push(
                      <div key={key} className="space-y-2">
                        <Textarea
                          value={textboxData[key] || ""}
                          onChange={(e) => setTextboxData(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="Enter your response..."
                          rows={4}
                        />
                      </div>
                    );
                  } else {
                    // Non-empty string - display as read-only text with placeholders replaced
                    console.log(`Rendering read-only ${key} at position ${renderedElements.length}`);
                    renderedElements.push(
                      <div key={key} className="space-y-2">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {value.replace(/\[Name of the Recipient\]/g, confirmation.recipientName || "[Name of the Recipient]")
                                .replace(/\[Recipientname\]/g, confirmation.recipientName || "[Recipient Name]")
                                .replace(/\[Period-end Date\]/g, confirmation.periodEndDate ? new Date(confirmation.periodEndDate).toLocaleDateString('en-IN') : "[Period-end Date]")
                                .replace(/\[Period end date\]/g, confirmation.periodEndDate ? new Date(confirmation.periodEndDate).toLocaleDateString('en-IN') : "[Period end date]")
                                .replace(/\[Period End Date\]/g, confirmation.periodEndDate ? new Date(confirmation.periodEndDate).toLocaleDateString('en-IN') : "[Period End Date]")
                                .replace(/\[Name of the Client\]/g, confirmation.confirmationFor || "[Name of the Client]")
                                .replace(/\[Name of Client Company\]/g, confirmation.confirmationFor || "[Name of Client Company]")
                                .replace(/\[Client Organization\]/g, confirmation.confirmationFor || "[Client Organization]")
                                .replace(/\[Client Organization name\]/g, confirmation.confirmationFor || "[Client Organization name]")
                                .replace(/\[Client Organization Name\]/g, confirmation.confirmationFor || "[Client Organization Name]")
                                .replace(/\[Confirming Party\]/g, confirmation.confirmingParty || confirmation.partydetails?.ConfirmingParty || "[Confirming Party]")}
                        </p>
                      </div>
                    );
                  }
                } else if (typeof value === 'object' && value !== null) {
                  // Handle textbox with heading/description (like textbox_interest)
                  const textboxObj = value as any;
                  console.log(`Rendering ${key} at position ${renderedElements.length}`);
                  renderedElements.push(
                    <div key={key} className="space-y-2">
                      {textboxObj.heading && (
                        <h3 className="font-semibold">{textboxObj.heading}</h3>
                      )}
                      {textboxObj.description && (
                        <p className="text-sm text-muted-foreground">{textboxObj.description}</p>
                      )}
                      {/* Always render textarea if it has heading or description (editable textbox) */}
                      {(textboxObj.heading || textboxObj.description) && (
                        <Textarea
                          value={textboxData[key] || textboxObj.value || ""}
                          onChange={(e) => setTextboxData(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={textboxObj.description || textboxObj.heading || "Enter your response..."}
                          rows={4}
                        />
                      )}
                    </div>
                  );
                }
                continue;
              }
              
              // Render tables in order
              if (key.startsWith('table_')) {
                const table = value as any;
                if (table && table.columns && Array.isArray(table.columns)) {
                  const currentRows = tableData[key] || table.rows || [];
                  
                  // If no rows, create one empty row with proper column structure
                  const rowsToDisplay = currentRows.length > 0 ? currentRows : 
                    [Object.fromEntries(table.columns.map((col: string) => [col || `Column ${table.columns.indexOf(col) + 1}`, ""]))];
                  
                  console.log(`Rendering ${key} at position ${renderedElements.length}`);
                  renderedElements.push(
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
                                {table.columns.map((col: string, colIdx: number) => {
                                  // Check if this cell has a type specification stored separately
                                  const cellValue = row[col];
                                  const cellType = row[`${col}_type`] || null;
                                  const actualValue = cellValue !== undefined ? cellValue : "";
                                  
                                  return (
                                    <TableCell key={colIdx}>
                                      {renderTableCell(key, rowIdx, col, actualValue, cellType)}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {table.addRow !== false && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTableRow(key, table.columns)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Row
                        </Button>
                      )}
                      {table.footnote && (
                        <p className="text-xs text-muted-foreground mt-2">{table.footnote}</p>
                      )}
                      {table.footnote_1 && (
                        <p className="text-xs text-muted-foreground mt-2">{table.footnote_1}</p>
                      )}
                    </div>
                  );
                }
                continue;
              }
              
              // Render questions in order
              if (key.startsWith('question_')) {
                const question = value as any;
                // Render question even if statement is empty (user might need to fill it)
                if (question) {
                  const questionKey = key;
                  // Get response value - check if question has response field with type, or use stored response
                  const storedResponse = questionResponses[questionKey] || question.response || "";
                  // If question.response is an object with type, extract the actual value
                  const response = typeof storedResponse === 'object' && storedResponse !== null && storedResponse.type 
                    ? questionResponses[questionKey] || "" 
                    : storedResponse;
                  
                  console.log(`Rendering ${key} at position ${renderedElements.length}`);
                  
                  // Determine question type - check response.type first, then question.type
                  const responseType = question.response && typeof question.response === 'object' && question.response.type 
                    ? question.response.type 
                    : null;
                  const questionType = question.type || (responseType ? null : "YesNo");
                  
                  // Render the question
                  renderedElements.push(
                    <div key={key} className="space-y-2">
                      {question.statement && (
                        <Label className="text-base font-medium">{question.statement}</Label>
                      )}
                      {/* Check if question has response with dropdown type */}
                      {responseType === "dropdown" && question.response.options && (
                        <Select
                          value={response}
                          onValueChange={(value) => {
                            setQuestionResponses(prev => ({ ...prev, [questionKey]: value }));
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {question.response.options.map((opt: string) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {/* Default to YesNo if no response type specified */}
                      {(questionType === "YesNo" || (!responseType && !questionType)) && (
                        <Select
                          value={response}
                          onValueChange={(value) => {
                            setQuestionResponses(prev => ({ ...prev, [questionKey]: value }));
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select Yes or No" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                  
                  // Render conditional tables if question response matches showIf
                  if (question.conditional && question.conditional.showIf) {
                    const shouldShow = response === question.conditional.showIf;
                    
                    if (shouldShow) {
                      // Render all conditional tables
                      Object.keys(question.conditional).forEach((conditionalKey) => {
                        if (conditionalKey !== 'showIf' && conditionalKey.startsWith('table_')) {
                          const conditionalTable = question.conditional[conditionalKey];
                          if (conditionalTable && conditionalTable.columns) {
                            const conditionalTableKey = conditionalKey;
                            // Initialize table data if it doesn't exist
                            if (!tableData[conditionalTableKey]) {
                              const initialRows = conditionalTable.rows && conditionalTable.rows.length > 0 
                                ? conditionalTable.rows.map((row: any) => {
                                    // Check if row is a string (empty string from new template format)
                                    if (typeof row === 'string') {
                                      // Empty string, create structure from columns
                                      return Object.fromEntries(conditionalTable.columns.map((col: string) => [col, ""]));
                                    }
                                    
                                    // Check if row is an empty object
                                    if (typeof row === 'object' && row !== null && !Array.isArray(row) && Object.keys(row).length === 0) {
                                      // Empty object, create structure from columns
                                      return Object.fromEntries(conditionalTable.columns.map((col: string) => [col, ""]));
                                    }
                                    
                                    const processedRow: any = {};
                                    conditionalTable.columns.forEach((col: string) => {
                                      if (row[col] !== undefined) {
                                        if (typeof row[col] === 'object' && row[col] !== null && !Array.isArray(row[col]) && row[col].type) {
                                          processedRow[col] = "";
                                          processedRow[`${col}_type`] = row[col];
                                        } else {
                                          processedRow[col] = row[col];
                                        }
                                      } else {
                                        processedRow[col] = "";
                                      }
                                    });
                                    return processedRow;
                                  })
                                : [Object.fromEntries(conditionalTable.columns.map((col: string) => [col, ""]))];
                              setTableData(prev => ({ ...prev, [conditionalTableKey]: initialRows }));
                            }
                            const conditionalRows = tableData[conditionalTableKey] || conditionalTable.rows || [];
                            const rowsToDisplay = conditionalRows.length > 0 ? conditionalRows :
                              [Object.fromEntries(conditionalTable.columns.map((col: string) => [col, ""]))];
                            
                            renderedElements.push(
                              <div key={conditionalTableKey} className="space-y-2 mt-4">
                                {conditionalTable.heading && (
                                  <h4 className="font-semibold">{conditionalTable.heading}</h4>
                                )}
                                {conditionalTable.subheading && (
                                  <p className="text-sm text-muted-foreground">{conditionalTable.subheading}</p>
                                )}
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        {conditionalTable.columns.map((col: string, idx: number) => (
                                          <TableHead key={idx}>{col}</TableHead>
                                        ))}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {rowsToDisplay.map((row: any, rowIdx: number) => (
                                        <TableRow key={rowIdx}>
                                          {conditionalTable.columns.map((col: string, colIdx: number) => {
                                            const cellValue = row[col];
                                            const cellType = row[`${col}_type`] || null;
                                            const actualValue = cellValue !== undefined ? cellValue : "";
                                            
                                            return (
                                              <TableCell key={colIdx}>
                                                {renderTableCell(conditionalTableKey, rowIdx, col, actualValue, cellType)}
                                              </TableCell>
                                            );
                                          })}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                {/* Hide Add Row button for specific conditional tables in question_1 and question_2 */}
                                {conditionalTable.addRow !== false && 
                                 conditionalTableKey !== 'table_loans_borrowed' &&
                                 conditionalTableKey !== 'table_loans_given' &&
                                 conditionalTableKey !== 'table_loans_borrowed_security' &&
                                 conditionalTableKey !== 'table_loans_given_security' && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addTableRow(conditionalTableKey, conditionalTable.columns)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Row
                                  </Button>
                                )}
                              </div>
                            );
                          }
                        }
                      });
                    }
                  }
                }
                continue;
              }
              
              // Render confirming party textboxes in order
              if (key.startsWith('ConfirmingPartyTextBox_')) {
                const textbox = value as any;
                if (Array.isArray(textbox) && textbox[0]) {
                  const item = textbox[0];
                  console.log(`Rendering ${key} at position ${renderedElements.length}`);
                  renderedElements.push(
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
                continue;
              }
              
              // Handle any other keys that might be in the template
              // This ensures we don't miss any elements
              console.log(`Unhandled template key: ${key}`, value);
            }
            
            console.log('Final rendered elements count:', renderedElements.length);
            // Return all rendered elements in the exact order they appeared in the JSON
            return renderedElements;
          })()}
        </div>
      </BaseConfirmationForm>
    );
  };

  // Component to render attachments with clickable links
  const AttachmentList = ({ attachments }: { attachments: any[] }) => {
    const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
    const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

    useEffect(() => {
      // Fetch URLs for string attachments that don't have URLs
      attachments.forEach((att: any) => {
        const attachmentName = typeof att === 'string' ? att : (att.originalFileName || att.name || att);
        const attachmentUrl = typeof att === 'object' && att !== null ? att.url : '';
        
        // If it's a string attachment without URL, fetch the URL
        if (typeof att === 'string' && !attachmentUrls[attachmentName] && !loadingUrls.has(attachmentName)) {
          setLoadingUrls(prev => new Set(prev).add(attachmentName));
          
          fetch('http://localhost:3002/api/get-attachment-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: attachmentName
            }),
          })
          .then(response => response.json())
          .then(data => {
            if (data.success && data.url) {
              setAttachmentUrls(prev => ({
                ...prev,
                [attachmentName]: data.url
              }));
            }
          })
          .catch(error => {
            console.error(`Error fetching URL for ${attachmentName}:`, error);
          })
          .finally(() => {
            setLoadingUrls(prev => {
              const newSet = new Set(prev);
              newSet.delete(attachmentName);
              return newSet;
            });
          });
        }
      });
    }, [attachments]);

    return (
      <div className="space-y-2">
        <h4 className="font-semibold">Attachments</h4>
        <ul className="list-disc list-inside space-y-1">
          {attachments.map((att: any, idx: number) => {
            // Handle both old format (string) and new format (object)
            const attachmentName = typeof att === 'string' ? att : (att.originalFileName || att.name || att);
            const attachmentUrl = typeof att === 'object' && att !== null ? att.url : (attachmentUrls[attachmentName] || '');
            
            return (
              <li key={idx} className="text-sm">
                {attachmentUrl ? (
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {attachmentName}
                  </a>
                ) : (
                  <span className={loadingUrls.has(attachmentName) ? "text-muted-foreground" : ""}>
                    {attachmentName}
                    {loadingUrls.has(attachmentName) && " (loading...)"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Read-only view for submitted confirmations
  const SubmittedConfirmationView = ({ templateDetails }: { templateDetails: any }) => {
    // Handle empty templateDetails - display blank template structure
    if (!templateDetails || Object.keys(templateDetails).length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Submitted Confirmation</CardTitle>
            <CardDescription>This confirmation was submitted with no data. Displaying blank template structure.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No data was submitted for this confirmation.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Submitted Confirmation</CardTitle>
          <CardDescription>This confirmation has been submitted and is read-only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Render textboxes */}
          {Object.keys(templateDetails)
            .filter(key => key.startsWith('textbox_'))
            .sort((a, b) => {
              const numA = parseInt(a.replace('textbox_', '')) || 0;
              const numB = parseInt(b.replace('textbox_', '')) || 0;
              return numA - numB;
            })
            .map(key => {
              const text = templateDetails[key];
              if (!text) return null;
              return (
                <div key={key} className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{text}</p>
                </div>
              );
            })}

          {/* Render tables */}
          {Object.keys(templateDetails)
            .filter(key => key.startsWith('table_'))
            .sort((a, b) => {
              const numA = parseInt(a.replace('table_', '')) || 0;
              const numB = parseInt(b.replace('table_', '')) || 0;
              return numA - numB;
            })
            .map(key => {
              const table = templateDetails[key];
              if (!table || !table.columns) return null;
              
              return (
                <div key={key} className="space-y-2">
                  {table.heading && (
                    <h3 className="text-lg font-semibold">{table.heading}</h3>
                  )}
                  {table.subheading && (
                    <p className="text-sm text-muted-foreground">{table.subheading}</p>
                  )}
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {table.columns.map((col: string, idx: number) => (
                            <TableHead key={idx}>{col || `Column ${idx + 1}`}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.rows && table.rows.length > 0 ? (
                          table.rows.map((row: any, rowIdx: number) => (
                            <TableRow key={rowIdx}>
                              {table.columns.map((col: string, colIdx: number) => (
                                <TableCell key={colIdx}>
                                  {row[col] !== undefined && row[col] !== null ? String(row[col]) : ""}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={table.columns.length} className="text-center text-muted-foreground">
                              No data
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {table.footnote_1 && (
                    <p className="text-xs text-muted-foreground mt-1">{table.footnote_1}</p>
                  )}
                </div>
              );
            })}

          {/* Render ConfirmingPartyTextBox */}
          {Object.keys(templateDetails)
            .filter(key => key.startsWith('ConfirmingPartyTextBox_'))
            .sort((a, b) => {
              const numA = parseInt(a.replace('ConfirmingPartyTextBox_', '')) || 0;
              const numB = parseInt(b.replace('ConfirmingPartyTextBox_', '')) || 0;
              return numA - numB;
            })
            .map(key => {
              const textbox = templateDetails[key];
              if (!textbox || !Array.isArray(textbox) || textbox.length === 0) return null;
              
              return textbox.map((item: any, idx: number) => (
                <div key={`${key}-${idx}`} className="space-y-2 border-l-4 border-primary pl-4">
                  {item.heading && (
                    <h4 className="font-semibold">{item.heading}</h4>
                  )}
                  {item.subheading && (
                    <p className="text-sm text-muted-foreground">{item.subheading}</p>
                  )}
                  {item.user_response && (
                    <p className="text-sm">{item.user_response}</p>
                  )}
                </div>
              ));
            })}

          {/* Render remarks */}
          {templateDetails.remarks && (
            <div className="space-y-2">
              <h4 className="font-semibold">Remarks</h4>
              <p className="text-sm whitespace-pre-wrap">{templateDetails.remarks}</p>
            </div>
          )}

          {/* Render attachments */}
          {templateDetails.attachments && templateDetails.attachments.length > 0 && (
            <AttachmentList attachments={templateDetails.attachments} />
          )}

          {/* Render confirming party statement */}
          {templateDetails.confirmingpartystatement && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold">Confirmation Statement</h4>
              {Array.isArray(templateDetails.confirmingpartystatement) ? (
                templateDetails.confirmingpartystatement.map((stmt: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-sm">{stmt.statement}</p>
                    {stmt.response && (
                      <p className="text-sm font-medium">Response: {stmt.response}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <p className="text-sm">{templateDetails.confirmingpartystatement.statement}</p>
                  {templateDetails.confirmingpartystatement.response && (
                    <p className="text-sm font-medium">Response: {templateDetails.confirmingpartystatement.response}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Render confirming party details */}
          {templateDetails.confirmingpartydetails && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold">Confirming Party Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {templateDetails.confirmingpartydetails.organizationName && (
                  <div>
                    <span className="font-medium">Organization: </span>
                    <span>{templateDetails.confirmingpartydetails.organizationName}</span>
                  </div>
                )}
                {templateDetails.confirmingpartydetails.name && (
                  <div>
                    <span className="font-medium">Name: </span>
                    <span>{templateDetails.confirmingpartydetails.name}</span>
                  </div>
                )}
                {templateDetails.confirmingpartydetails.designation && (
                  <div>
                    <span className="font-medium">Designation: </span>
                    <span>{templateDetails.confirmingpartydetails.designation}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render template form (standard or custom) loaded from SharePoint
  const renderCustomTemplate = () => {
    if (!customTemplate || !customTemplate.templateDetails) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Template not found.</p>
          </CardContent>
        </Card>
      );
    }

    return <CustomTemplateForm templateDetails={customTemplate.templateDetails} />;
  };

  const renderFormByArea = () => {
    // Check if we have confirmation data loaded from confirmation file
    // This applies to all confirmations, not just submitted ones
    if (loadingSubmittedData) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <LoadingSpinner size="lg" text="Loading confirmation data..." />
          </CardContent>
        </Card>
      );
    }
    
    // If templateDetails exists (even if empty), show it
    // Empty templateDetails will show blank template structure
    // For submitted confirmations, show read-only view
    // For other statuses, show editable view if needed
    if (submittedTemplateDetails !== null) {
      // Check if templateDetails is empty - if so, fetch blank template
      const isEmpty = !submittedTemplateDetails || (typeof submittedTemplateDetails === 'object' && Object.keys(submittedTemplateDetails).length === 0);
      
      if (isEmpty) {
        // If empty, we should have already fetched blank template, but if not, show loading
        if (loadingTemplate) {
          return (
            <Card>
              <CardContent className="p-8 text-center">
                <LoadingSpinner size="lg" text="Loading template..." />
              </CardContent>
            </Card>
          );
        }
        // If still empty after loading, show blank template from customTemplate
        if (customTemplate && customTemplate.templateDetails) {
          if (confirmation.status === "submitted") {
            return <SubmittedConfirmationView templateDetails={customTemplate.templateDetails} />;
          } else {
            return <CustomTemplateForm templateDetails={customTemplate.templateDetails} />;
          }
        }
      } else {
        // We have data, show it
        if (confirmation.status === "submitted") {
          return <SubmittedConfirmationView templateDetails={submittedTemplateDetails} />;
        } else {
          // For non-submitted confirmations, use the template data but allow editing
          return <CustomTemplateForm templateDetails={submittedTemplateDetails} />;
        }
      }
    }

    // Check if template was loaded from SharePoint (standard or custom)
    if (customTemplate && customTemplate.templateDetails) {
      // Template loaded from SharePoint, use unified template form
      return renderCustomTemplate();
    }

    // If template is still loading, show loading state
    if (loadingTemplate) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <LoadingSpinner size="lg" text="Loading template..." />
          </CardContent>
        </Card>
      );
    }

    // Fallback to hardcoded forms if template not found in SharePoint
    // This maintains backward compatibility
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
              <img src="/logo.png" alt="Verity AI" className="h-10" />
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

