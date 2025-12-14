import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, FileText, Trash2, Download, GripVertical, MoveUp, MoveDown, ScrollText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { MoreVertical, Split, Merge, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { formatIndianDate, parseIndianDate, formatIndianDateTime, cn } from "@/lib/utils";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

// Add template interfaces
interface AuthorizationTemplate {
  id: string;
  name: string;
  content: string;
  type: "inbuilt" | "custom";
  engagementId?: string; // For custom templates, tied to engagement
}

interface Sample {
  id: string;
  sampleSetId: string;
  confirmingParty: string;
  amount: string;
  recipientName: string;
  recipientEmail: string;
  selectedTemplateId?: string;
}

interface SamplingConfig {
  method: "random" | "mus";
  randomType?: "simple" | "stratified";
  simpleMethod?: "number" | "calculator";
  // For number method
  numberOfSamples?: number;
  confirmingPartyColumn?: string;
  amountColumn?: string;
  // For calculator method
  controlReliance?: "relying" | "not-relying";
  assessedRisk?: "lower" | "higher" | "significant";
  scope?: "positive" | "negative" | "all";
  performanceMateriality?: number;
}

interface SamplingLog {
  sampleSetId: string;
  method: "number" | "calculator" | "mus";
  dateTime: string;
  seed?: string; // Common field for all methods
  // For number method
  numberOfSamples?: number;
  // For calculator and MUS methods
  performanceMateriality?: number;
  assessedRisk?: "lower" | "higher" | "significant";
  relianceOnControls?: "relying" | "not-relying";
  amountColumn?: string;
  typeOfItems?: "positive" | "negative" | "all";
  totalAmount?: number;
  netPopulationSubjectToSampling?: number;
  calculatedNumberOfSamples?: number;
  // For MUS method only
  highValueSamples?: number;
}

interface SampleSet {
  id: string;
  name: string;
  fileName: string;
  samplingMethod: "random" | "mus";
  sampleSize: number;
  populationSize: number;
  status: "pending" | "generated";
  samples?: Sample[]; // Individual samples within the set
  samplingConfig?: SamplingConfig; // New sampling configuration
}

// Add new interface for template structure
interface TableCell {
  id: string;
  content: string;
  rowSpan: number;
  colSpan: number;
  cellType: "text" | "confirmingParty" | "calendar" | "customDropdown";
  customDropdownOptions?: string[];
  enteredByConfirmingParty: boolean;
  isHeader: boolean;
}

interface TableColumn {
  id: string;
  headerCell: TableCell;
  enteredByConfirmingParty: boolean;
  cellType: "text" | "calendar" | "customDropdown";
  customDropdownOptions?: string[];
}

interface TableRow {
  id: string;
  cells: TableCell[];
}

interface TableData {
  columns: number;
  rows: number;
  headerRow: TableRow;
  dataRows: TableRow[];
  canConfirmingPartyAddRows: boolean; // Calculated: true if ALL columns have enteredByConfirmingParty = true
}

// Add Footnote interface before TemplateElement
interface Footnote {
  id: string;
  symbol: string; // *, #, ^, **, etc.
  text: string; // The footnote text
  startIndex: number; // Start position in the text
  endIndex: number; // End position in the text
  elementId: string; // Which element this footnote belongs to
  fieldType: "textContent" | "heading" | "subheading" | "tableCell"; // Which field in the element
  cellId?: string; // For table cells, which cell
}

interface TemplateElement {
  id: string;
  type: "text" | "confirmingPartyTextBox" | "table" | "asteriskStatement";
  order: number;
  // Text element
  textContent?: string;
  // Confirming Party TextBox element
  heading?: string;
  subheading?: string;
  width?: string;
  height?: string;
  placeholder?: string;
  // Table element - updated structure
  tableData?: TableData;
  // Asterisk Statement element
  statement?: string;
  // Footnotes for this element
  footnotes?: Footnote[];
  tableName?: string; // Add this field
}

interface CustomTemplateStructure {
  id: string;
  name: string;
  elements: TemplateElement[];
  // Mandatory elements are always included
  remarks: boolean;
  attachments: boolean;
  confirmationStatement: string;
  confirmingPartyDetails: boolean;
  type: "custom";
  engagementId?: string;
}

// Inbuilt templates (static)
const INBUILT_TEMPLATES: AuthorizationTemplate[] = [];

// Sample Calculator Matrix
// Format: { multipleOfPM: { notRelying: { lower, higher, significant }, relying: { lower, higher, significant } } }
const SAMPLE_CALCULATOR_MATRIX: Record<number, {
  notRelying: { lower: number; higher: number; significant: number };
  relying: { lower: number; higher: number; significant: number };
}> = {
  1: { notRelying: { lower: 1, higher: 2, significant: 4 }, relying: { lower: 1, higher: 1, significant: 2 } },
  2: { notRelying: { lower: 2, higher: 3, significant: 6 }, relying: { lower: 1, higher: 1, significant: 2 } },
  3: { notRelying: { lower: 2, higher: 5, significant: 10 }, relying: { lower: 1, higher: 2, significant: 4 } },
  4: { notRelying: { lower: 3, higher: 6, significant: 12 }, relying: { lower: 1, higher: 2, significant: 4 } },
  5: { notRelying: { lower: 3, higher: 8, significant: 16 }, relying: { lower: 1, higher: 3, significant: 6 } },
  6: { notRelying: { lower: 4, higher: 9, significant: 18 }, relying: { lower: 2, higher: 3, significant: 6 } },
  7: { notRelying: { lower: 5, higher: 11, significant: 22 }, relying: { lower: 2, higher: 4, significant: 8 } },
  8: { notRelying: { lower: 5, higher: 12, significant: 24 }, relying: { lower: 2, higher: 4, significant: 8 } },
  9: { notRelying: { lower: 6, higher: 14, significant: 28 }, relying: { lower: 2, higher: 5, significant: 10 } },
  10: { notRelying: { lower: 6, higher: 15, significant: 30 }, relying: { lower: 2, higher: 5, significant: 10 } },
  15: { notRelying: { lower: 9, higher: 23, significant: 46 }, relying: { lower: 3, higher: 8, significant: 16 } },
  20: { notRelying: { lower: 12, higher: 30, significant: 60 }, relying: { lower: 4, higher: 10, significant: 20 } },
  25: { notRelying: { lower: 15, higher: 38, significant: 76 }, relying: { lower: 5, higher: 13, significant: 26 } },
  30: { notRelying: { lower: 18, higher: 45, significant: 90 }, relying: { lower: 6, higher: 15, significant: 30 } },
  40: { notRelying: { lower: 24, higher: 60, significant: 120 }, relying: { lower: 8, higher: 20, significant: 40 } },
  50: { notRelying: { lower: 30, higher: 75, significant: 150 }, relying: { lower: 10, higher: 25, significant: 50 } },
  100: { notRelying: { lower: 60, higher: 150, significant: 300 }, relying: { lower: 20, higher: 50, significant: 100 } },
};

// Helper function to calculate sample size from matrix
const calculateSampleSizeFromMatrix = (
  totalAmount: number,
  performanceMateriality: number,
  controlReliance: "relying" | "not-relying",
  assessedRisk: "lower" | "higher" | "significant"
): number => {
  if (performanceMateriality <= 0) return 0;
  
  const multipleOfPM = Math.ceil(totalAmount / performanceMateriality);
  
  // Find the closest multiple in the matrix
  const matrixKeys = Object.keys(SAMPLE_CALCULATOR_MATRIX).map(Number).sort((a, b) => a - b);
  let selectedMultiple = matrixKeys[0];
  
  for (const key of matrixKeys) {
    if (multipleOfPM <= key) {
      selectedMultiple = key;
      break;
    }
  }
  
  // If multiple is greater than max in matrix, use the max
  if (multipleOfPM > matrixKeys[matrixKeys.length - 1]) {
    selectedMultiple = matrixKeys[matrixKeys.length - 1];
  }
  
  const matrixEntry = SAMPLE_CALCULATOR_MATRIX[selectedMultiple];
  const relianceKey = controlReliance === "relying" ? "relying" : "notRelying";
  const riskKey = assessedRisk;
  
  return matrixEntry[relianceKey][riskKey];
};

const AUDIT_AREAS = [
  "Trade Receivables",
  "Trade Payables",
  "Cash & Cash Equivalents",
  "Inventory",
  "Fixed Assets",
  "Investments",
  "Loans & Advances",
  "Other Current Assets",
];

// Add a constant for all confirmation form names
const CONFIRMATION_FORM_NAMES = [
  "Cash & Cash Equivalents",
  "Trade Receivables",
  "Trade Payables",
  "Borrowings",
  "Inventory",
  "Fixed Assets",
  "Investments",
  "Litigations & Claims",
  "Related Party Disclosure",
  "Other Assets - Security Deposits",
  "Other Liabilities - Security Deposits",
  "Other Receivables - Advance to Supplier",
  "Other Receivables - Capital Advances",
  "Other Liabilities - Advance from Customer",
  "Other Liabilities - Capex Vendors",
  "Plan Assets",
  "Trustee"
];

export const SampleGeneration = () => {
  const { toast } = useToast();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [activeArea, setActiveArea] = useState("Trade Receivables");
  // State for locked sampling methods and selections
  const [lockedSamplingMethods, setLockedSamplingMethods] = useState<Record<string, { method: string; simpleMethod?: string; locked: boolean }>>({});
  const [lockedSelections, setLockedSelections] = useState<Record<string, Record<string, { recipientName: string; recipientEmail: string; templateName: string }>>>({});
  const [sampleSets, setSampleSets] = useState<Record<string, SampleSet[]>>({});

  const [newSetName, setNewSetName] = useState("");
  const [showNewSetForm, setShowNewSetForm] = useState(false);

  // Add state for new sample set details
  const [newSampleSetName, setNewSampleSetName] = useState("");
  const [newConfirmingPartyName, setNewConfirmingPartyName] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<Record<string, any>>({});
  const [isLoadingConfirmationData, setIsLoadingConfirmationData] = useState(false);
  const [samplesFromJson, setSamplesFromJson] = useState<Record<string, Sample[]>>({});
  
  // State for confirming party contacts from Access & Roles
  const [confirmingPartyContacts, setConfirmingPartyContacts] = useState<Array<{ name: string; email: string }>>([]);

  // Fetch confirming party contacts from SharePoint on component mount
  useEffect(() => {
    fetchConfirmingPartyContacts();
  }, []);

  const fetchConfirmingPartyContacts = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/get-people-data');
      if (!response.ok) {
        throw new Error('Failed to fetch people data');
      }
      const result = await response.json();
      const peopleData = result.data || { confirming_parties: [] };
      
      console.log('📥 Fetched confirming party contacts from SharePoint:', peopleData);
      
      // Convert SharePoint data to recipient format
      if (peopleData.confirming_parties && peopleData.confirming_parties.length > 0) {
        const recipients = peopleData.confirming_parties
          .filter((party: any) => {
            // Filter out entries without recipient name or email
            const hasName = party.recipient_name && party.recipient_name.trim() !== "";
            const hasEmail = (party.email && party.email.trim() !== "") || (party.recipient_email && party.recipient_email.trim() !== "");
            return hasName && hasEmail;
          })
          .map((party: any) => ({
            name: party.recipient_name || "",
            email: party.email || party.recipient_email || ""
          }));
        
        // Remove duplicates by email (case-insensitive)
        const recipientsMap = new Map<string, { name: string; email: string }>();
        recipients.forEach(r => {
          recipientsMap.set(r.email.toLowerCase(), r);
        });
        const uniqueRecipients: Array<{ name: string; email: string }> = Array.from(recipientsMap.values());
        
        setConfirmingPartyContacts(uniqueRecipients);
        console.log(`✅ Loaded ${uniqueRecipients.length} confirming party contacts for recipient dropdown`);
      } else {
        console.log('ℹ️ No confirming party contacts found in SharePoint');
      }
    } catch (error: any) {
      console.error('Error fetching confirming party contacts:', error);
      // Keep empty array if fetch fails
    }
  };

  // Function to get unique recipients from confirming party contacts
  const getRecipientsFromConfirmations = () => {
    return confirmingPartyContacts;
  };

  // New state for templates and template selection
  const [customTemplates, setCustomTemplates] = useState<AuthorizationTemplate[]>([]);
  const [templateSelectionDialogOpen, setTemplateSelectionDialogOpen] = useState(false);
  const [selectedSampleSetId, setSelectedSampleSetId] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [sampleTemplateSelections, setSampleTemplateSelections] = useState<Record<string, string>>({});
  const [showCustomTemplateForm, setShowCustomTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  // Update the state to track selected form name instead of template
  const [selectedFormName, setSelectedFormName] = useState<string>("");

  // Add state for custom form names (if not already present)
  const [customFormNames, setCustomFormNames] = useState<string[]>([]);

  // State for sampling configuration per sample set
  const [samplingConfigs, setSamplingConfigs] = useState<Record<string, SamplingConfig>>({});
  const [fileColumns, setFileColumns] = useState<Record<string, string[]>>({}); // Store columns for each file
  const [fileData, setFileData] = useState<Record<string, any[]>>({}); // Store parsed file data
  const [performanceMateriality, setPerformanceMateriality] = useState<number>(0); // This should come from main software
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [samplingLogs, setSamplingLogs] = useState<Record<string, SamplingLog>>({}); // Store sampling logs per sample set
  const [samplingLogDialogOpen, setSamplingLogDialogOpen] = useState<Record<string, boolean>>({}); // Track which log dialog is open
  const [samplingLogsFromSharePoint, setSamplingLogsFromSharePoint] = useState<Record<string, any[]>>({}); // Store sampling logs from SharePoint per sample set
  const [isLoadingSamplingLog, setIsLoadingSamplingLog] = useState(false); // Loading state for sampling log
  const [generatedSamples, setGeneratedSamples] = useState<Record<string, Sample[]>>({}); // Store generated samples per sample set
  const [addSampleManuallyDialogOpen, setAddSampleManuallyDialogOpen] = useState<Record<string, boolean>>({}); // Track add sample manually dialog
  const [manualSampleData, setManualSampleData] = useState<Record<string, { confirmingParty: string; amount: string; recipientName: string; recipientEmail: string }>>({}); // Store manual sample input data

  // Update state for template builder
  const [templateBuilderStep, setTemplateBuilderStep] = useState<"name" | "builder">("name");
  const [templateElements, setTemplateElements] = useState<TemplateElement[]>([]);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [confirmingPartyTextBoxContent, setConfirmingPartyTextBoxContent] = useState("");
  const [tableConfigs, setTableConfigs] = useState<Array<{id: string; headers: string[]; rows: number}>>([]);
  const [asteriskStatements, setAsteriskStatements] = useState<string[]>([]);

  // Add state for table editing
  const [tableInitializationMode, setTableInitializationMode] = useState<Record<string, boolean>>({});
  const [tableInitialCols, setTableInitialCols] = useState<Record<string, number>>({});
  const [tableInitialRows, setTableInitialRows] = useState<Record<string, number>>({});
  const [selectedCell, setSelectedCell] = useState<{elementId: string; rowId: string; cellId: string} | null>(null);
  const [customDropdownDialogOpen, setCustomDropdownDialogOpen] = useState(false);
  const [customDropdownOptions, setCustomDropdownOptions] = useState<string[]>([]);
  const [editingCellForDropdown, setEditingCellForDropdown] = useState<{elementId: string; rowId: string; cellId: string; isHeader: boolean} | null>(null);

  // Add state for selected cell configuration (around line 200, with other state declarations):
  const [selectedCellForConfig, setSelectedCellForConfig] = useState<{
    elementId: string;
    rowId: string;
    cellId: string;
    isHeader: boolean;
  } | null>(null);

  // Add state for footnote management
  const [footnotes, setFootnotes] = useState<Footnote[]>([]);
  const [selectedText, setSelectedText] = useState<{
    elementId: string;
    fieldType: "textContent" | "heading" | "subheading" | "tableCell";
    cellId?: string;
    startIndex: number;
    endIndex: number;
    text: string;
  } | null>(null);
  const [footnoteDialogOpen, setFootnoteDialogOpen] = useState(false);
  const [footnoteText, setFootnoteText] = useState("");

  // Footnote symbols in order
  const FOOTNOTE_SYMBOLS = ["*", "#", "^", "**", "##", "^^", "***", "###"];

  // Get next available footnote symbol for an element
  const getNextFootnoteSymbol = (elementId: string): string => {
    const elementFootnotes = footnotes.filter(f => f.elementId === elementId);
    const usedSymbols = elementFootnotes.map(f => f.symbol);
    
    for (const symbol of FOOTNOTE_SYMBOLS) {
      if (!usedSymbols.includes(symbol)) {
        return symbol;
      }
    }
    // If all symbols are used, generate a new one
    return `*${elementFootnotes.length + 1}`;
  };

  // Load audit areas when component mounts
  useEffect(() => {
    fetchAuditAreas();
    fetchLockedData();
  }, []); // Run once on mount

  // Reload audit areas when activeArea changes
  useEffect(() => {
    fetchAuditAreas();
    fetchLockedData();
  }, [activeArea]); // Reload when activeArea changes

  // Fetch locked sampling methods and selections
  const fetchLockedData = async () => {
    try {
      // Fetch locked sampling methods from audit_areas.json
      const response = await fetch('http://localhost:3002/api/get-audit-areas');
      if (response.ok) {
        const result = await response.json();
        const auditAreasData = result.data || {};
        const areaCode = AREA_MAP[activeArea] || "";
        
        if (areaCode && auditAreasData[areaCode] && Array.isArray(auditAreasData[areaCode])) {
          const lockedMethods: Record<string, { method: string; simpleMethod?: string; locked: boolean }> = {};
          auditAreasData[areaCode].forEach((item: any) => {
            if (typeof item === 'object' && item !== null) {
              // New format: array of objects like [{"Sample Set Name": {...}}]
              const sampleSetName = Object.keys(item)[0];
              const setData = item[sampleSetName];
              if (setData && typeof setData === 'object' && setData.locked) {
                // Find the sample set by name
                const sampleSet = Object.values(sampleSets).flat().find(s => s.name === sampleSetName);
                if (sampleSet) {
                  lockedMethods[sampleSet.id] = {
                    method: setData.samplingMethod || "",
                    simpleMethod: setData.simpleMethod,
                    locked: true
                  };
                }
              }
            }
          });
          setLockedSamplingMethods(lockedMethods);
          
          // Also initialize samplingConfigs with locked values
          Object.keys(lockedMethods).forEach(sampleSetId => {
            const locked = lockedMethods[sampleSetId];
            setSamplingConfigs(prev => ({
              ...prev,
              [sampleSetId]: {
                ...prev[sampleSetId],
                method: locked.method as "random" | "mus",
                simpleMethod: locked.simpleMethod as "number" | "calculator" | undefined,
                randomType: locked.method === "random" ? "simple" : undefined,
                scope: locked.method === "mus" ? "all" : undefined
              }
            }));
          });
        }
      }

      // Fetch locked selections from confirmation_{area_code}.json
      const confResponse = await fetch('http://localhost:3002/api/get-confirmation-by-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: activeArea })
      });
      if (confResponse.ok) {
        const confResult = await confResponse.json();
        const confData = confResult.data || {};
        const lockedSelectionsData: Record<string, Record<string, { recipientName: string; recipientEmail: string; templateName: string }>> = {};
        
        // Group by sample set name (extract from sample_id)
        Object.keys(confData).forEach(sampleId => {
          const sampleData = confData[sampleId];
          if (sampleData.selectionsLocked) {
            // Extract sample set name from sample_id (format: TR_Q4_001 -> Q4)
            const parts = sampleId.split('_');
            if (parts.length >= 2) {
              const sampleSetName = parts.slice(0, -1).join('_'); // Everything except last part
              const sampleSet = Object.values(sampleSets).flat().find(s => {
                // Match sample set name pattern
                return sampleId.startsWith(AREA_MAP[activeArea] || "") && 
                       sampleId.includes(sampleSet.name.replace(/\s+/g, '_'));
              });
              
              if (sampleSet) {
                if (!lockedSelectionsData[sampleSet.id]) {
                  lockedSelectionsData[sampleSet.id] = {};
                }
                lockedSelectionsData[sampleSet.id][sampleId] = {
                  recipientName: sampleData.recipientName || "",
                  recipientEmail: sampleData.recipientEmail || "",
                  templateName: sampleData.selectedTemplate || ""
                };
              }
            }
          }
        });
        setLockedSelections(lockedSelectionsData);
      }
    } catch (error) {
      console.error('Error fetching locked data:', error);
    }
  };

  const addArea = (area: string) => {
    if (!selectedAreas.includes(area)) {
      setSelectedAreas([...selectedAreas, area]);
      setSampleSets({ ...sampleSets, [area]: [] });
    }
  };

  const addSampleSet = async () => {
    if (newSetName && activeArea) {
      // Call backend API to append sample set to audit_areas.json
      try {
        const response = await fetch('http://localhost:3002/api/append-sample-set-to-area', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            area: activeArea,
            sampleSetName: newSetName,
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log('✅ Sample set added to audit_areas.json:', data);
          toast({
            title: "Success",
            description: `Sample set "${newSetName}" added successfully`,
          });
        } else {
          console.error('❌ Error adding sample set:', data.message);
          toast({
            title: "Warning",
            description: `Failed to save to SharePoint: ${data.message}`,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('❌ Error calling append-sample-set-to-area API:', error);
        // Check if it's a connection error (server not running)
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          toast({
            title: "Warning",
            description: `Sample set created locally. To save to SharePoint, please start the Python backend server (port 3002).`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Warning",
            description: `Sample set created but failed to save to SharePoint: ${error.message}`,
            variant: "destructive",
          });
        }
      }

      const newSet: SampleSet = {
        id: `SS-${Date.now()}`,
        name: newSetName,
        fileName: "",
        samplingMethod: "random",
        sampleSize: 0,
        populationSize: 0,
        status: "pending"
      };
      setSampleSets({
        ...sampleSets,
        [activeArea]: [...(sampleSets[activeArea] || []), newSet]
      });
      setNewSetName("");
      setShowNewSetForm(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (sampleSetId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Update the sample set with the file name
    setSampleSets(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(area => {
        updated[area] = updated[area].map(set => 
          set.id === sampleSetId 
            ? { ...set, fileName: file.name }
            : set
        );
      });
      return updated;
    });

    // Read file to extract columns (for Excel/CSV files)
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.csv')) {
          // For CSV files, parse the first row as headers
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length > 0) {
            // Handle CSV with quoted values
            const headers: string[] = [];
            let currentHeader = '';
            let inQuotes = false;
            
            for (let i = 0; i < lines[0].length; i++) {
              const char = lines[0][i];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                headers.push(currentHeader.trim());
                currentHeader = '';
              } else {
                currentHeader += char;
              }
            }
            headers.push(currentHeader.trim()); // Add the last header
            const columnHeaders = headers.filter(h => h.length > 0);
            
            // Parse all rows
            const rows: any[] = [];
            for (let i = 1; i < lines.length; i++) {
              const row: any = {};
              const values: string[] = [];
              let currentValue = '';
              let inQuotes = false;
              
              for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  values.push(currentValue.trim());
                  currentValue = '';
                } else {
                  currentValue += char;
                }
              }
              values.push(currentValue.trim()); // Add the last value
              
              columnHeaders.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              
              rows.push(row);
            }
            
            setFileColumns(prev => ({
              ...prev,
              [sampleSetId]: columnHeaders
            }));
            
            setFileData(prev => ({
              ...prev,
              [sampleSetId]: rows
            }));
            
            toast({
              title: "File Uploaded",
              description: `Successfully extracted ${columnHeaders.length} columns and ${rows.length} rows from ${file.name}`,
            });
          }
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // For Excel files, use xlsx library
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON to get headers (first row)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0 && Array.isArray(jsonData[0])) {
            const headers = (jsonData[0] as any[]).map((header: any) => 
              String(header || '').trim()
            ).filter((h: string) => h.length > 0);
            
            // Convert to array of objects with headers as keys
            const rows: any[] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row: any = {};
              const rowData = jsonData[i] as any[];
              headers.forEach((header, index) => {
                row[header] = rowData[index] || '';
              });
              rows.push(row);
            }
            
            setFileColumns(prev => ({
              ...prev,
              [sampleSetId]: headers
            }));
            
            setFileData(prev => ({
              ...prev,
              [sampleSetId]: rows
            }));
            
            toast({
              title: "File Uploaded",
              description: `Successfully extracted ${headers.length} columns and ${rows.length} rows from ${file.name}`,
            });
          } else {
            toast({
              title: "Error",
              description: "Could not extract column headers from Excel file",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        toast({
          title: "Error",
          description: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    };

    // Read file based on type
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
    }
  };

  // Trigger file input click
  const triggerFileInput = (sampleSetId: string) => {
    fileInputRefs.current[sampleSetId]?.click();
  };

  // Reset sample set status to pending when configuration changes
  const resetSampleSetStatus = (sampleSetId: string) => {
    setSampleSets(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(area => {
        updated[area] = updated[area].map(s => 
          s.id === sampleSetId 
            ? { ...s, status: "pending" as const }
            : s
        );
      });
      return updated;
    });
    // Also clear generated samples and logs when config changes
    setGeneratedSamples(prev => {
      const updated = { ...prev };
      delete updated[sampleSetId];
      return updated;
    });
    setSamplingLogs(prev => {
      const updated = { ...prev };
      delete updated[sampleSetId];
      return updated;
    });
  };

  // Generate samples based on configuration
  const handleGenerateSamples = async (sampleSetId: string) => {
    const config = samplingConfigs[sampleSetId];
    if (!config) {
      toast({
        title: "Error",
        description: "Please configure sampling method first",
        variant: "destructive",
      });
      return;
    }

    const dateTime = new Date().toISOString();
    let samples: Sample[] = [];
    let log: SamplingLog;

    if (config.method === "random") {
      if (config.simpleMethod === "number") {
        // Number method
        if (!config.numberOfSamples || config.numberOfSamples <= 0 || !config.confirmingPartyColumn || !config.amountColumn || !fileData[sampleSetId]) {
          toast({
            title: "Error",
            description: "Please fill in all required fields and upload a file",
            variant: "destructive",
          });
          return;
        }

        // Generate random samples from file data
        const data = fileData[sampleSetId];
        // Ensure we don't try to select more samples than available
        const maxSamples = Math.min(config.numberOfSamples, data.length);
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, maxSamples);

        samples = selected.map((row: any, index: number) => ({
          id: `S-${sampleSetId}-${index + 1}`,
          sampleSetId,
          confirmingParty: String(row[config.confirmingPartyColumn!] || ""),
          amount: String(row[config.amountColumn!] || ""),
          recipientName: "",
          recipientEmail: "",
        }));

        log = {
          sampleSetId,
          method: "number",
          dateTime,
          numberOfSamples: config.numberOfSamples,
        };
      } else if (config.simpleMethod === "calculator") {
        // Calculator method
        if (!config.controlReliance || !config.assessedRisk || !config.performanceMateriality || 
            !config.amountColumn || !config.scope || !config.confirmingPartyColumn || !fileData[sampleSetId]) {
          toast({
            title: "Error",
            description: "Please fill in all required fields and upload a file",
            variant: "destructive",
          });
          return;
        }

        const sampleSize = getCalculatedSampleSize(sampleSetId);
        if (!sampleSize) {
          toast({
            title: "Error",
            description: "Could not calculate sample size",
            variant: "destructive",
          });
          return;
        }

        const totalAmount = calculateTotalAmount(sampleSetId, config.amountColumn, config.scope);
        const data = fileData[sampleSetId];
        // Ensure we don't try to select more samples than available
        const maxSamples = Math.min(sampleSize, data.length);
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, maxSamples);

        samples = selected.map((row: any, index: number) => ({
          id: `S-${sampleSetId}-${index + 1}`,
          sampleSetId,
          confirmingParty: String(row[config.confirmingPartyColumn!] || ""),
          amount: String(row[config.amountColumn!] || ""),
          recipientName: "",
          recipientEmail: "",
        }));

        log = {
          sampleSetId,
          method: "calculator",
          dateTime,
          performanceMateriality: config.performanceMateriality,
          assessedRisk: config.assessedRisk,
          relianceOnControls: config.controlReliance,
          amountColumn: config.amountColumn,
          typeOfItems: config.scope,
          totalAmount,
          netPopulationSubjectToSampling: data.length,
          calculatedNumberOfSamples: sampleSize,
        };
      } else {
        toast({
          title: "Error",
          description: "Please select a sampling method",
          variant: "destructive",
        });
        return;
      }
    } else if (config.method === "mus") {
      // MUS method
      if (!config.controlReliance || !config.assessedRisk || !config.performanceMateriality || 
          !config.amountColumn || !config.scope || !config.confirmingPartyColumn || !fileData[sampleSetId]) {
        toast({
          title: "Error",
          description: "Please fill in all required fields and upload a file",
          variant: "destructive",
        });
        return;
      }

      const data = fileData[sampleSetId];
      const scope = config.scope || "all"; // Default to "all" if scope not set
      
      // First, filter items based on scope
      const scopeFilteredData = data.filter((row: any) => {
        const value = parseFloat(String(row[config.amountColumn!] || 0).replace(/,/g, '')) || 0;
        if (scope === "positive") return value > 0;
        if (scope === "negative") return value < 0;
        return true; // "all" - include all items
      });

      // Separate high value items (above PM) and regular items from scope-filtered data
      const highValueItems = scopeFilteredData.filter((row: any) => {
        const value = parseFloat(String(row[config.amountColumn!] || 0).replace(/,/g, '')) || 0;
        return Math.abs(value) >= config.performanceMateriality!;
      });

      const regularItems = scopeFilteredData.filter((row: any) => {
        const value = parseFloat(String(row[config.amountColumn!] || 0).replace(/,/g, '')) || 0;
        return Math.abs(value) < config.performanceMateriality!;
      });

      // Calculate sample size using scope-based total (same as Random Sampling calculator)
      // MUS uses the same calculator logic but also includes all items above PM
      const totalAmount = calculateTotalAmount(
        sampleSetId,
        config.amountColumn,
        scope
      );

      const sampleSize = calculateSampleSizeFromMatrix(
        totalAmount,
        config.performanceMateriality!,
        config.controlReliance,
        config.assessedRisk
      );

      console.log(`MUS Generation Debug:
        - Total data rows: ${data.length}
        - High value items (>= PM): ${highValueItems.length}
        - Regular items (< PM): ${regularItems.length}
        - Total amount (all items): ${totalAmount}
        - Calculated sample size: ${sampleSize}
        - Performance Materiality: ${config.performanceMateriality}`);

      // Generate random samples from regular items
      // For MUS, select the calculated number of samples from regular items
      // If we have fewer regular items than calculated sample size, select all available
      const numSamplesToSelect = Math.min(sampleSize, regularItems.length);
      const shuffled = [...regularItems].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, numSamplesToSelect);

      // Combine high value items and selected regular items
      const allSelected = [...highValueItems, ...selected];
      
      console.log(`MUS Selection:
        - Selected ${selected.length} regular items
        - High value items included: ${highValueItems.length}
        - Total samples: ${allSelected.length}`);
      
      // Log warning if calculated sample size exceeds available regular items
      if (sampleSize > regularItems.length) {
        console.warn(`MUS: Calculated sample size (${sampleSize}) exceeds available regular items (${regularItems.length}). Selected all ${regularItems.length} regular items plus ${highValueItems.length} high-value items. Total: ${allSelected.length} samples.`);
      }

      samples = allSelected.map((row: any, index: number) => ({
        id: `S-${sampleSetId}-${index + 1}`,
        sampleSetId,
        confirmingParty: String(row[config.confirmingPartyColumn!] || ""),
        amount: String(row[config.amountColumn!] || ""),
        recipientName: "",
        recipientEmail: "",
      }));

      log = {
        sampleSetId,
        method: "mus",
        dateTime,
        performanceMateriality: config.performanceMateriality,
        assessedRisk: config.assessedRisk,
        relianceOnControls: config.controlReliance,
        amountColumn: config.amountColumn,
        typeOfItems: scope, // MUS uses scope (same as Random Sampling)
        totalAmount,
        netPopulationSubjectToSampling: regularItems.length,
        highValueSamples: highValueItems.length,
        calculatedNumberOfSamples: sampleSize, // This is the calculated size for regular items only
      };
    } else {
      toast({
        title: "Error",
        description: "Invalid sampling method",
        variant: "destructive",
      });
      return;
    }

    // Store generated samples
    setGeneratedSamples(prev => ({
      ...prev,
      [sampleSetId]: samples
    }));

    // Store sampling log
    setSamplingLogs(prev => ({
      ...prev,
      [sampleSetId]: log
    }));

    // Update sample set status
    setSampleSets(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(area => {
        updated[area] = updated[area].map(set => 
          set.id === sampleSetId 
            ? { ...set, status: "generated" as const, sampleSize: samples.length }
            : set
        );
      });
      return updated;
    });

    // Call backend API to generate JSON and upload to SharePoint
    const sampleSet = Object.values(sampleSets).flat().find(s => s.id === sampleSetId);
    if (sampleSet) {
      try {
        const response = await fetch('http://localhost:3002/api/generate-and-upload-samples', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            samples: samples.map(s => ({
              confirmingParty: s.confirmingParty,
              recipientName: s.recipientName || "",
              recipientEmail: s.recipientEmail || "",
              amount: s.amount,
            })),
            auditArea: activeArea,
            sampleSetName: sampleSet.name, // This is the "name" parameter
          }),
        });
        
        const data = await response.json();
        
        if (data.success && data.generatedIds && data.generatedIds.length === samples.length) {
          console.log('✅ Samples generated and uploaded to SharePoint:', data.generatedIds);
          
          // Update sample IDs with the correct IDs from backend (format: TR_Q4_001)
          setGeneratedSamples(prev => {
            const updated = { ...prev };
            if (updated[sampleSetId]) {
              updated[sampleSetId] = updated[sampleSetId].map((sample, index) => ({
                ...sample,
                id: data.generatedIds[index] // Update with correct ID from backend
              }));
            }
            return updated;
          });
          
          // Save sampling log to SharePoint
          try {
            const logResponse = await fetch('http://localhost:3002/api/save-sampling-log', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                area: activeArea,
                sampleSetName: sampleSet.name,
                logData: log,
              }),
            });
            
            const logData = await logResponse.json();
            if (logData.success) {
              console.log('✅ Sampling log saved to SharePoint:', logData);
            } else {
              console.error('❌ Error saving sampling log:', logData.message);
            }
          } catch (logError) {
            console.error('❌ Error calling save-sampling-log API:', logError);
          }
          
          // Lock sampling method after successful generation
          try {
            const lockResponse = await fetch('http://localhost:3002/api/lock-sampling-method', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                area: activeArea,
                sampleSetName: sampleSet.name,
                samplingMethod: config.method,
                simpleMethod: config.simpleMethod
              })
            });
            
            if (lockResponse.ok) {
              const lockData = await lockResponse.json();
              console.log('✅ Sampling method locked:', lockData);
              // Update locked state
              setLockedSamplingMethods(prev => ({
                ...prev,
                [sampleSetId]: {
                  method: config.method,
                  simpleMethod: config.simpleMethod,
                  locked: true
                }
              }));
            }
          } catch (lockError) {
            console.error('Error locking sampling method:', lockError);
          }
          
          toast({
            title: "Success",
            description: `Generated ${samples.length} samples and saved to SharePoint (${data.filename})`,
          });
        } else {
          console.error('❌ Error generating/uploading samples:', data.message);
          toast({
            title: "Warning",
            description: `Samples generated but failed to save to SharePoint: ${data.message}`,
            variant: "destructive",
          });
          
          // Still try to lock the sampling method even if upload failed
          try {
            const lockResponse = await fetch('http://localhost:3002/api/lock-sampling-method', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                area: activeArea,
                sampleSetName: sampleSet.name,
                samplingMethod: config.method,
                simpleMethod: config.simpleMethod
              })
            });
            
            if (lockResponse.ok) {
              const lockData = await lockResponse.json();
              console.log('✅ Sampling method locked:', lockData);
              setLockedSamplingMethods(prev => ({
                ...prev,
                [sampleSetId]: {
                  method: config.method,
                  simpleMethod: config.simpleMethod,
                  locked: true
                }
              }));
            }
          } catch (lockError) {
            console.error('Error locking sampling method:', lockError);
          }
        }
      } catch (error: any) {
        console.error('❌ Error calling generate-and-upload-samples API:', error);
        // Check if it's a connection error (server not running)
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          toast({
            title: "Warning",
            description: `Samples generated locally. To save to SharePoint, please start the Python backend server (port 3002).`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Warning",
            description: `Samples generated but failed to save to SharePoint: ${error.message}`,
            variant: "destructive",
          });
        }
        
        // Still try to lock the sampling method even if API call failed
        try {
          const lockResponse = await fetch('http://localhost:3002/api/lock-sampling-method', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              area: activeArea,
              sampleSetName: sampleSet.name,
              samplingMethod: config.method,
              simpleMethod: config.simpleMethod
            })
          });
          
          if (lockResponse.ok) {
            const lockData = await lockResponse.json();
            console.log('✅ Sampling method locked:', lockData);
            setLockedSamplingMethods(prev => ({
              ...prev,
              [sampleSetId]: {
                method: config.method,
                simpleMethod: config.simpleMethod,
                locked: true
              }
            }));
          }
        } catch (lockError) {
          console.error('Error locking sampling method:', lockError);
        }
      }
    } else {
      // Lock sampling method even if no sample set found
      try {
        const lockResponse = await fetch('http://localhost:3002/api/lock-sampling-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            area: activeArea,
            sampleSetName: "Unknown",
            samplingMethod: config.method,
            simpleMethod: config.simpleMethod
          })
        });
        
        if (lockResponse.ok) {
          const lockData = await lockResponse.json();
          console.log('✅ Sampling method locked:', lockData);
          setLockedSamplingMethods(prev => ({
            ...prev,
            [sampleSetId]: {
              method: config.method,
              simpleMethod: config.simpleMethod,
              locked: true
            }
          }));
        }
      } catch (lockError) {
        console.error('Error locking sampling method:', lockError);
      }
      
      toast({
        title: "Success",
        description: `Generated ${samples.length} samples successfully`,
      });
    }
  };

  // Calculate total amount from file data based on selected amount column and scope
  const calculateTotalAmount = (
    sampleSetId: string,
    amountColumn: string | undefined,
    scope: "positive" | "negative" | "all" | undefined
  ): number => {
    if (!amountColumn || !fileData[sampleSetId]) return 0;

    const data = fileData[sampleSetId];
    let total = 0;

    data.forEach((row: any) => {
      const value = parseFloat(String(row[amountColumn] || 0).replace(/,/g, '')) || 0;
      
      if (scope === "positive" && value > 0) {
        total += value;
      } else if (scope === "negative" && value < 0) {
        total += Math.abs(value);
      } else if (scope === "all") {
        total += Math.abs(value);
      } else if (!scope) {
        // Default: sum all values
        total += value;
      }
    });

    return total;
  };

  // Calculate sample size for a given sample set
  const getCalculatedSampleSize = (sampleSetId: string): number | null => {
    const config = samplingConfigs[sampleSetId];
    if (!config || !config.performanceMateriality || !config.amountColumn) {
      return null;
    }

    // For MUS, calculate based on TOTAL amount (all items), same as Random Sampling calculator
    // But MUS will automatically include all items above PM in addition to the calculated samples
    if (config.method === "mus") {
      if (!fileData[sampleSetId]) return null;
      
      const data = fileData[sampleSetId];
      // Calculate total for ALL items (MUS uses same calculator as Random Sampling)
      const totalAmount = data.reduce((sum: number, row: any) => {
        const value = parseFloat(String(row[config.amountColumn!] || 0).replace(/,/g, '')) || 0;
        return sum + Math.abs(value);
      }, 0);

      if (totalAmount === 0 || !config.controlReliance || !config.assessedRisk) {
        return null;
      }

      return calculateSampleSizeFromMatrix(
        totalAmount,
        config.performanceMateriality,
        config.controlReliance,
        config.assessedRisk
      );
    }

    // For Random Sampling calculator method
    const totalAmount = calculateTotalAmount(
      sampleSetId,
      config.amountColumn,
      config.scope
    );

    if (totalAmount === 0 || !config.controlReliance || !config.assessedRisk) {
      return null;
    }

    return calculateSampleSizeFromMatrix(
      totalAmount,
      config.performanceMateriality,
      config.controlReliance,
      config.assessedRisk
    );
  };

  // Add handler for creating new sample set with details
  const handleAddSampleSetWithDetails = async () => {
    // Validate all required fields
    if (!newSampleSetName || !activeArea || !newConfirmingPartyName || !newRecipientName || !newRecipientEmail || !newAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call backend API
      const response = await fetch('http://localhost:3001/api/create-sample-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audit_area: activeArea,
          sample_set_name: newSampleSetName,
          confirming_party_name: newConfirmingPartyName,
          recipient_name: newRecipientName,
          email_id: newRecipientEmail,
          amount: newAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create sample set');
      }

      const result = await response.json();

      // Add the new sample set to the UI
      const newSet: SampleSet = {
        id: result.sampleId || `SS-${Date.now()}`,
        name: newSampleSetName,
        fileName: "",
        samplingMethod: "random",
        sampleSize: 0,
        populationSize: 0,
        status: "pending",
        samples: [{
          id: `S-${Date.now()}`,
          sampleSetId: result.sampleId || `SS-${Date.now()}`,
          confirmingParty: newConfirmingPartyName,
          amount: newAmount,
          recipientName: newRecipientName,
          recipientEmail: newRecipientEmail
        }]
      };

      setSampleSets({
        ...sampleSets,
        [activeArea]: [...(sampleSets[activeArea] || []), newSet]
      });

      // Reset form fields
      setNewSampleSetName("");
      setNewConfirmingPartyName("");
      setNewRecipientName("");
      setNewRecipientEmail("");
      setNewAmount("");

      toast({
        title: "Success",
        description: `Sample set created successfully with ID: ${result.sampleId}`,
      });
    } catch (error: any) {
      console.error('Error creating sample set:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create sample set. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate mock samples for a sample set when it's generated
  const generateSamplesForSet = (sampleSet: SampleSet): Sample[] => {
    if (sampleSet.status !== "generated") return [];
    // Mock sample generation - in real app, this would come from actual sample data
    const samples: Sample[] = [];
    for (let i = 0; i < sampleSet.sampleSize; i++) {
      samples.push({
        id: `SMPL-${sampleSet.id}-${i + 1}`,
        sampleSetId: sampleSet.id,
        confirmingParty: `Sample Party ${i + 1}`,
        amount: `$${(Math.random() * 100000).toFixed(2)}`,
        recipientName: `Recipient ${i + 1}`,
        recipientEmail: `recipient${i + 1}@example.com`
      });
    }
    return samples;
  };

  // Get all available templates (inbuilt + custom for this engagement)
  const getAllTemplates = (): AuthorizationTemplate[] => {
    // In real app, filter custom templates by engagement ID
    return [...INBUILT_TEMPLATES, ...customTemplates];
  };

  // Area mapping (same as backend)
  const AREA_MAP: Record<string, string> = {
    "Trade Receivables": "TR",
    "Cash & Cash Equivalents": "CCE",
    "Trade Payables": "TP",
    "Other Current Assets": "OCA",
    "Inventory": "INV",
    "Fixed Assets": "FA",
    "Investments": "INST",
    "Loans & Advances": "LA"
  };

  // Fetch audit areas JSON from SharePoint
  const fetchAuditAreas = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3002/api/get-audit-areas');
      if (!response.ok) {
        throw new Error('Failed to fetch audit areas');
      }
      const result = await response.json();
      const auditAreasData = result.data || {};
      
      console.log('📥 Fetched audit_areas.json from SharePoint:', auditAreasData);
      
      // Convert audit areas JSON to sampleSets format
      const newSampleSets: Record<string, SampleSet[]> = {};
      
      // Iterate through each area code in the JSON
      Object.keys(auditAreasData).forEach((areaCode) => {
        // Find the full area name from AREA_MAP
        const areaName = Object.keys(AREA_MAP).find(
          key => AREA_MAP[key] === areaCode
        );
        
        if (areaName && auditAreasData[areaCode]) {
          // Handle both old string array and new object array formats
          let sampleSetData: Array<{name: string, locked: boolean}> = [];
          if (Array.isArray(auditAreasData[areaCode])) {
            sampleSetData = auditAreasData[areaCode].map((item: any) => {
              if (typeof item === 'string') {
                // Old format: array of strings
                return { name: item, locked: false };
              } else if (typeof item === 'object' && item !== null) {
                // New format: array of objects like [{"Sample Set Name": {...}}]
                const setName = Object.keys(item)[0] || "";
                const setData = item[setName] || {};
                return { name: setName, locked: setData.locked || false };
              }
              return { name: "", locked: false };
            }).filter((data: {name: string, locked: boolean}) => data.name !== "");
          }
          
          // Convert each sample set name to a SampleSet object
          const sets: SampleSet[] = sampleSetData.map((data: {name: string, locked: boolean}, index: number) => ({
            id: `${areaCode}-${index + 1}`, // Generate a unique ID
            name: data.name,
            fileName: "",
            samplingMethod: "random" as const,
            sampleSize: 0,
            populationSize: 0,
            // If locked is true, samples have been generated, so status should be "generated"
            status: data.locked ? "generated" as const : "pending" as const,
          }));
          
          newSampleSets[areaName] = sets;
        }
      });
      
      // Merge with existing sampleSets (preserve any local changes)
      setSampleSets(prev => {
        const merged: Record<string, SampleSet[]> = { ...prev };
        
        // Update each area with data from SharePoint
        Object.keys(newSampleSets).forEach(areaName => {
          // Merge sample sets, avoiding duplicates by name
          const existingSets = merged[areaName] || [];
          const sharePointSets = newSampleSets[areaName];
          
          // Create a map of existing sets by name
          const existingByName = new Map(existingSets.map(set => [set.name, set]));
          
          // Add or update sets from SharePoint
          const mergedSets: SampleSet[] = sharePointSets.map(spSet => {
            const existing = existingByName.get(spSet.name);
            if (existing) {
              // Preserve existing set with its current state
              return existing;
            }
            return spSet;
          });
          
          merged[areaName] = mergedSets;
        });
        
        return merged;
      });
      
      // Also update selectedAreas to include all areas that have sample sets
      setSelectedAreas(prev => {
        const allAreas = Object.keys(newSampleSets);
        const uniqueAreas = Array.from(new Set([...prev, ...allAreas]));
        return uniqueAreas;
      });
      
    } catch (error: any) {
      console.error('Error fetching audit areas:', error);
      toast({
        title: "Warning",
        description: "Failed to fetch sample sets from SharePoint. Using local data.",
        variant: "destructive",
      });
    }
  };

  // Fetch sampling log from SharePoint
  const fetchSamplingLog = async (): Promise<void> => {
    setIsLoadingSamplingLog(true);
    try {
      const response = await fetch('http://localhost:3002/api/get-sampling-log');
      if (!response.ok) {
        throw new Error('Failed to fetch sampling log');
      }
      const result = await response.json();
      const samplingLogData = result.data || {};
      
      console.log('📥 Fetched sampling_log.json from SharePoint:', samplingLogData);
      
      // Convert SharePoint log data to local format for display
      const logsBySampleSet: Record<string, any[]> = {};
      
      // Iterate through areas and sample sets
      Object.keys(samplingLogData).forEach((area) => {
        const areaData = samplingLogData[area];
        if (typeof areaData === 'object' && areaData !== null) {
          Object.keys(areaData).forEach((sampleSetName) => {
            const logs = areaData[sampleSetName];
            if (Array.isArray(logs)) {
              // Find the sample set ID by name
              const sampleSet = Object.values(sampleSets).flat().find(s => s.name === sampleSetName);
              if (sampleSet) {
                logsBySampleSet[sampleSet.id] = logs;
              }
            }
          });
        }
      });
      
      setSamplingLogsFromSharePoint(logsBySampleSet);
      
    } catch (error: any) {
      console.error('Error fetching sampling log:', error);
      toast({
        title: "Warning",
        description: "Failed to fetch sampling log from SharePoint. Using local data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSamplingLog(false);
    }
  };

  // Fetch confirmation data from SharePoint by area
  const fetchConfirmationData = async (area: string): Promise<Record<string, any>> => {
    setIsLoadingConfirmationData(true);
    try {
      const response = await fetch('http://localhost:3002/api/get-confirmation-by-area', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: area,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch confirmation data');
      }
      const result = await response.json();
      const data = result.data || {};
      console.log('📥 Fetched confirmation data from SharePoint:', data);
      setConfirmationData(data);
      setIsLoadingConfirmationData(false);
      return data;
    } catch (error: any) {
      console.error('Error fetching confirmation data:', error);
      setIsLoadingConfirmationData(false);
      toast({
        title: "Error",
        description: "Failed to fetch confirmation data from SharePoint.",
        variant: "destructive",
      });
      return {};
    }
  };

  // Helper function to abbreviate text (same logic as backend)
  const abbreviate = (text: string): string => {
    if (!text) return "";
    const parts = text.split(" ");
    if (parts[0].match(/^[A-Za-z0-9]+$/) && /\d/.test(parts[0])) {
      return parts[0].toUpperCase();
    }
    return parts.map((p) => p[0].toUpperCase()).join("");
  };

  // Helper function to get sample set name abbreviation (first 2 chars after removing spaces)
  const getSampleSetAbbr = (sampleSetName: string): string => {
    if (!sampleSetName) return "";
    const cleaned = sampleSetName.replace(/\s+/g, "");
    return cleaned.substring(0, 2).toUpperCase();
  };

  // Convert confirmation JSON data to Sample format - ALL DATA FROM JSON ONLY
  const convertConfirmationDataToSamples = (sampleSetId: string, data?: Record<string, any>): Sample[] => {
    const samples: Sample[] = [];
    const confirmationDataToUse = data || confirmationData;
    
    console.log('🔄 Converting confirmation data to samples for sample set:', sampleSetId);
    console.log('📊 Available data keys:', Object.keys(confirmationDataToUse || {}));
    console.log('📊 Full data:', confirmationDataToUse);
    
    // If no data available, return empty array
    if (!confirmationDataToUse || Object.keys(confirmationDataToUse).length === 0) {
      console.log('⚠️ No confirmation data available');
      return samples;
    }
    
    // Get the sample set to find its name and audit area
    const sampleSet = Object.values(sampleSets)
      .flat()
      .find(set => set.id === sampleSetId);
    
    if (!sampleSet) {
      console.log('⚠️ Sample set not found:', sampleSetId);
      return samples;
    }
    
    // Find the audit area for this sample set from state
    const auditArea = Object.keys(sampleSets).find(area => 
      sampleSets[area].some(set => set.id === sampleSetId)
    ) || activeArea;
    
    // Get area code from AREA_MAP
    const areaCode = AREA_MAP[auditArea] || "";
    
    // Get sample set name abbreviation (first 2 chars after removing spaces)
    const sampleSetAbbr = getSampleSetAbbr(sampleSet.name);
    
    // Create the pattern to match: {AREA_CODE}_{SAMPLE_SET_ABBR}_*
    // Example: "TR_Q4_001", "TR_Q4_002" for "Q4 Receivables Sample" in "Trade Receivables"
    const expectedPrefix = `${areaCode}_${sampleSetAbbr}_`;
    
    console.log('📍 Audit area:', auditArea, 'Area code:', areaCode, 'Sample set name:', sampleSet.name, 'Sample set abbr:', sampleSetAbbr, 'Expected prefix:', expectedPrefix);
    
    // Filter samples that match the pattern {AREA_CODE}_{SAMPLE_SET_ABBR}_*
    Object.keys(confirmationDataToUse).forEach((sampleId) => {
      const sampleData = confirmationDataToUse[sampleId];
      const partyDetails = sampleData?.partydetails || {};
      let matches = false;
      
      // Pattern 1: Match samples with pattern {AREA_CODE}_{SAMPLE_SET_ABBR}_*
      // Example: "TR_Q4_001", "TR_Q4_002" for "Q4 Receivables Sample" in "Trade Receivables"
      if (sampleId.startsWith(expectedPrefix)) {
        matches = true;
        console.log(`✅ Pattern match: ${sampleId} -> matches prefix ${expectedPrefix}`);
      }
      
      // Pattern 2: "SMPL-SS-001-X" format - extract sample set ID from sample ID (legacy support)
      // Example: "SMPL-SS-001-1" and "SMPL-SS-001-2" match sample set "SS-001"
      if (!matches) {
        const smplMatch = sampleId.match(/^SMPL-(SS-\d+)-(\d+)$/);
        if (smplMatch && smplMatch[1] === sampleSetId) {
          matches = true;
          console.log(`✅ Pattern 1 match: ${sampleId} -> ${sampleSetId}`);
        }
      }
      
      // If matched, extract data from JSON
      if (matches) {
        // Extract ALL data from JSON - no hardcoded values
        // Handle both field name formats: "ConfirmingParty" and "Confirming Party"
        const confirmingParty = partyDetails.ConfirmingParty || partyDetails["Confirming Party"] || "";
        const recipientName = partyDetails.Recipientname || "";
        const amount = partyDetails.amount || "";
        const recipientEmail = partyDetails.RecipientEmail || "";
        
        console.log(`✅ Adding sample: ${sampleId}`, {
          confirmingParty,
          recipientName,
          amount,
          recipientEmail,
          partyDetails
        });
        
        samples.push({
          id: sampleId, // From JSON key (sample_id)
          sampleSetId: sampleSetId,
          confirmingParty, // From JSON only
          amount, // From JSON only
          recipientName, // From JSON only
          recipientEmail, // From JSON only
          selectedTemplateId: sampleData.selectedTemplate || "",
        });
        
        // If selections are locked, update locked selections state
        if (sampleData.selectionsLocked) {
          setLockedSelections(prev => {
            const updated = { ...prev };
            if (!updated[sampleSetId]) {
              updated[sampleSetId] = {};
            }
            updated[sampleSetId][sampleId] = {
              recipientName: sampleData.recipientName || "",
              recipientEmail: sampleData.recipientEmail || "",
              templateName: sampleData.selectedTemplate || ""
            };
            return updated;
          });
          
          // Also update sampleTemplateSelections
          if (sampleData.selectedTemplate) {
            setSampleTemplateSelections(prev => ({
              ...prev,
              [sampleId]: sampleData.selectedTemplate
            }));
          }
        }
      } else {
        console.log(`❌ Sample ${sampleId} did not match sample set ${sampleSetId}`);
      }
    });
    
    console.log(`📋 Total samples matched: ${samples.length} out of ${Object.keys(confirmationDataToUse).length}`);
    // Sort samples by ID to maintain consistent order
    return samples.sort((a, b) => a.id.localeCompare(b.id));
  };

  // Handle "Generate Authorization Letter" button click
  const handleGenerateAuthorizationLetter = async (sampleSetId: string) => {
    console.log('🚀 Generate Authorization Letter clicked for sample set:', sampleSetId);
    setSelectedSampleSetId(sampleSetId);
    setTemplateSelectionDialogOpen(true);
    
    // Clear any existing samples for this set first
    setSamplesFromJson(prev => {
      const updated = { ...prev };
      delete updated[sampleSetId];
      return updated;
    });
    
    // Find the audit area for this sample set
    const auditArea = Object.keys(sampleSets).find(area => 
      sampleSets[area].some(set => set.id === sampleSetId)
    ) || activeArea;
    
    // Always fetch fresh confirmation data from SharePoint for the specific area
    console.log('📥 Fetching confirmation data from SharePoint for area:', auditArea);
    const data = await fetchConfirmationData(auditArea);
    console.log('✅ Fetched data:', data);
    
    // Also fetch locked data to update locked selections
    await fetchLockedData();
    
    // Get samples from confirmation data ONLY (no fallback to hardcoded data)
    const samples = convertConfirmationDataToSamples(sampleSetId, data);
    console.log('✅ Converted samples:', samples);
    
    // Store samples from JSON separately to ensure we always use JSON data
    setSamplesFromJson(prev => ({
      ...prev,
      [sampleSetId]: samples
    }));
    
    // Also update sample sets with samples from confirmation data
    setSampleSets(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(area => {
        updated[area] = updated[area].map(set => 
          set.id === sampleSetId 
            ? { ...set, samples }
            : set
        );
      });
      return updated;
    });
  };

  // Get samples for a sample set - from generated samples or JSON
  const getSamplesForSet = (sampleSetId: string): Sample[] => {
    // First check if samples were generated in this session
    if (generatedSamples[sampleSetId] && generatedSamples[sampleSetId].length > 0) {
      return generatedSamples[sampleSetId];
    }
    // Otherwise return samples from JSON
    const samples = samplesFromJson[sampleSetId] || [];
    return samples;
  };

  // Handle template selection for a sample
  const handleTemplateSelection = (sampleId: string, templateId: string) => {
    setSampleTemplateSelections(prev => ({
      ...prev,
      [sampleId]: templateId
    }));
  };

  // Update handleAutofillTemplate to handle form name
  const handleAutofillFormName = (formName: string) => {
    if (!selectedSampleSetId) return;
    const samples = getSamplesForSet(selectedSampleSetId);
    const newSelections: Record<string, string> = {};
    samples.forEach(sample => {
      newSelections[sample.id] = formName;
    });
    setSampleTemplateSelections(prev => ({
      ...prev,
      ...newSelections
    }));
  };

  // Update handleTemplateSelection to handle form name
  const handleFormNameSelection = (sampleId: string, formName: string) => {
    setSampleTemplateSelections(prev => ({
      ...prev,
      [sampleId]: formName
    }));
  };

  // Create custom template
  const handleCreateCustomTemplate = () => {
    if (!newTemplateName) {
      alert("Please enter a template name.");
      return;
    }

    // Build template structure
    const templateStructure: CustomTemplateStructure = {
      id: `TMPL-CUSTOM-${Date.now()}`,
      name: newTemplateName,
      elements: templateElements,
      remarks: true,
      attachments: true,
      confirmationStatement: "We certify that the above particulars (read alongwith the attachments if any) are full and correct.",
      confirmingPartyDetails: true,
      type: "custom",
      engagementId: "ENG-001"
    };

    // Add to custom templates
    setCustomTemplates(prev => [...prev, templateStructure as any]);
    
    // Add to custom form names dropdown
    setCustomFormNames(prev => [...prev, newTemplateName]);

    // Reset form
    setNewTemplateName("");
    setTemplateElements([]);
    setEditingElementId(null);
    setTemplateBuilderStep("name");
    setShowCustomTemplateForm(false);
  };

  // Add function to add table
  const addTable = () => {
    setTableConfigs(prev => [...prev, {
      id: `table-${Date.now()}`,
      headers: ["Column 1", "Column 2"],
      rows: 1
    }]);
  };

  // Add function to add asterisk statement
  const addAsteriskStatement = () => {
    setAsteriskStatements(prev => [...prev, ""]);
  };

  // Add new functions for element management
  const addElement = (type: "text" | "confirmingPartyTextBox" | "table" | "asteriskStatement", insertAfterId?: string) => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}-${Math.random()}`,
      type,
      order: insertAfterId 
        ? (templateElements.find(e => e.id === insertAfterId)?.order ?? templateElements.length) + 1
        : templateElements.length,
      ...(type === "text" && { textContent: "" }),
      ...(type === "confirmingPartyTextBox" && { 
        heading: "",
        subheading: "",
        width: "100%",
        height: "100px",
        placeholder: ""
      }),
      ...(type === "table" && { 
        tableData: undefined, // Will be initialized after user enters cols/rows
      }),
      ...(type === "asteriskStatement" && { statement: "" })
    };

    // Reorder existing elements if inserting
    let updatedElements = [...templateElements];
    if (insertAfterId) {
      const insertIndex = updatedElements.findIndex(e => e.id === insertAfterId);
      updatedElements = [
        ...updatedElements.slice(0, insertIndex + 1),
        newElement,
        ...updatedElements.slice(insertIndex + 1).map(e => ({ ...e, order: e.order + 1 }))
      ];
    } else {
      updatedElements.push(newElement);
    }

    setTemplateElements(updatedElements);
    setEditingElementId(newElement.id);
    
    // For tables, enter initialization mode
    if (type === "table") {
      setTableInitializationMode(prev => ({ ...prev, [newElement.id]: true }));
      setTableInitialCols(prev => ({ ...prev, [newElement.id]: 2 }));
      setTableInitialRows(prev => ({ ...prev, [newElement.id]: 1 }));
    }
  };

  const removeElement = (id: string) => {
    setTemplateElements(prev => {
      const filtered = prev.filter(e => e.id !== id);
      // Reorder remaining elements
      return filtered.map((e, index) => ({ ...e, order: index }));
    });
    setEditingElementId(null);
  };

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setTemplateElements(prev => 
      prev.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  };

  const moveElement = (id: string, direction: "up" | "down") => {
    setTemplateElements(prev => {
      const index = prev.findIndex(e => e.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newElements = [...prev];
      [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
      
      // Update orders
      return newElements.map((e, i) => ({ ...e, order: i }));
    });
  };

  // Initialize table after user enters columns and rows
  const initializeTable = (elementId: string, columns: number, rows: number) => {
    const createCell = (
      id: string,
      isHeader: boolean,
      rowSpan: number = 1,
      colSpan: number = 1,
      enteredByConfirmingParty: boolean = false
    ): TableCell => ({
      id,
      content: "",
      rowSpan,
      colSpan,
      cellType: "text",
      enteredByConfirmingParty,
      isHeader
    });

    // Create header row
    const headerCells: TableCell[] = [];
    for (let i = 0; i < columns; i++) {
      headerCells.push(createCell(`header-cell-${i}`, true));
    }
    const headerRow: TableRow = {
      id: "header-row",
      cells: headerCells
    };

    // Create data rows
    const dataRows: TableRow[] = [];
    for (let r = 0; r < rows; r++) {
      const rowCells: TableCell[] = [];
      for (let c = 0; c < columns; c++) {
        rowCells.push(createCell(`cell-${r}-${c}`, false));
      }
      dataRows.push({
        id: `row-${r}`,
        cells: rowCells
      });
    }

    const tableData: TableData = {
      columns,
      rows,
      headerRow,
      dataRows,
      canConfirmingPartyAddRows: false
    };

    updateElement(elementId, { tableData });
    setTableInitializationMode(prev => ({ ...prev, [elementId]: false }));
  };

  // Table manipulation functions
  const addTableRow = (elementId: string, insertAfterRowId?: string) => {
    const element = templateElements.find(e => e.id === elementId);
    if (!element?.tableData) return;

    const newRowId = `row-${Date.now()}`;
    const columns = element.tableData.columns;
    const newCells: TableCell[] = [];
    
    for (let c = 0; c < columns; c++) {
      newCells.push({
        id: `${newRowId}-cell-${c}`,
        content: "",
        rowSpan: 1,
        colSpan: 1,
        cellType: "text",
        enteredByConfirmingParty: false,
        isHeader: false
      });
    }

    const newRow: TableRow = { id: newRowId, cells: newCells };
    
    let updatedDataRows = [...element.tableData.dataRows];
    if (insertAfterRowId) {
      const insertIndex = updatedDataRows.findIndex(r => r.id === insertAfterRowId);
      updatedDataRows = [
        ...updatedDataRows.slice(0, insertIndex + 1),
        newRow,
        ...updatedDataRows.slice(insertIndex + 1)
      ];
    } else {
      updatedDataRows.push(newRow);
    }

    updateElement(elementId, {
      tableData: {
        ...element.tableData,
        rows: element.tableData.rows + 1,
        dataRows: updatedDataRows
      }
    });
  };

  const addTableColumn = (elementId: string, insertAfterColIndex?: number) => {
    const element = templateElements.find(e => e.id === elementId);
    if (!element?.tableData) return;

    const newColId = `col-${Date.now()}`;
    
    // Add header cell
    const newHeaderCell: TableCell = {
      id: `header-${newColId}`,
      content: "",
      rowSpan: 1,
      colSpan: 1,
      cellType: "text",
      enteredByConfirmingParty: false,
      isHeader: true
    };

    let updatedHeaderCells = [...element.tableData.headerRow.cells];
    if (insertAfterColIndex !== undefined) {
      updatedHeaderCells.splice(insertAfterColIndex + 1, 0, newHeaderCell);
    } else {
      updatedHeaderCells.push(newHeaderCell);
    }

    // Add cell to each data row
    const updatedDataRows = element.tableData.dataRows.map(row => {
      const newCell: TableCell = {
        id: `${row.id}-${newColId}`,
        content: "",
        rowSpan: 1,
        colSpan: 1,
        cellType: "text",
        enteredByConfirmingParty: false,
        isHeader: false
      };
      const updatedCells = [...row.cells];
      if (insertAfterColIndex !== undefined) {
        updatedCells.splice(insertAfterColIndex + 1, 0, newCell);
      } else {
        updatedCells.push(newCell);
      }
      return { ...row, cells: updatedCells };
    });

    updateElement(elementId, {
      tableData: {
        ...element.tableData,
        columns: element.tableData.columns + 1,
        headerRow: { ...element.tableData.headerRow, cells: updatedHeaderCells },
        dataRows: updatedDataRows
      }
    });
  };

  const updateTableCell = (
    elementId: string,
    rowId: string,
    cellId: string,
    updates: Partial<TableCell>
  ) => {
    const element = templateElements.find(e => e.id === elementId);
    if (!element?.tableData) return;

    const updateCellInRow = (row: TableRow): TableRow => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        cells: row.cells.map(cell =>
          cell.id === cellId ? { ...cell, ...updates } : cell
        )
      };
    };

    const isHeader = rowId === "header-row";
    const updatedHeaderRow = isHeader ? updateCellInRow(element.tableData.headerRow) : element.tableData.headerRow;
    const updatedDataRows = isHeader ? element.tableData.dataRows : element.tableData.dataRows.map(updateCellInRow);

    // Recalculate canConfirmingPartyAddRows
    const allColumnsConfirmingParty = updatedHeaderRow.cells.every(cell => cell.enteredByConfirmingParty);

    updateElement(elementId, {
      tableData: {
        ...element.tableData,
        headerRow: updatedHeaderRow,
        dataRows: updatedDataRows,
        canConfirmingPartyAddRows: allColumnsConfirmingParty
      }
    });
  };

  const removeTableRow = (elementId: string, rowId: string) => {
    const element = templateElements.find(e => e.id === elementId);
    if (!element?.tableData || element.tableData.dataRows.length <= 1) return;

    updateElement(elementId, {
      tableData: {
        ...element.tableData,
        rows: element.tableData.rows - 1,
        dataRows: element.tableData.dataRows.filter(r => r.id !== rowId)
      }
    });
  };

  const removeTableColumn = (elementId: string, colIndex: number) => {
    const element = templateElements.find(e => e.id === elementId);
    if (!element?.tableData || element.tableData.columns <= 1) return;

    const updatedHeaderCells = element.tableData.headerRow.cells.filter((_, i) => i !== colIndex);
    const updatedDataRows = element.tableData.dataRows.map(row => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== colIndex)
    }));

    updateElement(elementId, {
      tableData: {
        ...element.tableData,
        columns: element.tableData.columns - 1,
        headerRow: { ...element.tableData.headerRow, cells: updatedHeaderCells },
        dataRows: updatedDataRows
      }
    });
  };

  // Generate authorization letters after template selection
  const handleGenerateLetters = async () => {
    if (!selectedSampleSetId) return;
    
    const samples = getSamplesForSet(selectedSampleSetId);
    const templates = getAllTemplates();
    
    // Validate all samples have templates selected
    const samplesWithoutTemplates = samples.filter(
      sample => !sampleTemplateSelections[sample.id]
    );
    
    if (samplesWithoutTemplates.length > 0) {
      toast({
        title: "Error",
        description: "Please select a template for all samples before generating letters.",
        variant: "destructive",
      });
      return;
    }

    // Find the sample set to get area and other details
    const sampleSet = Object.values(sampleSets).flat().find(s => s.id === selectedSampleSetId);
    if (!sampleSet) {
      toast({
        title: "Error",
        description: "Sample set not found",
        variant: "destructive",
      });
      return;
    }

    // Create authorization letters from samples
    const letters = samples.map((sample, index) => {
      // Use sample ID as the letter ID (same as sample set ID format)
      const letterId = sample.id;
      
      // Get the selected template name for this sample
      // Priority: 1) Locked selections, 2) Current template selections state, 3) Sample's selectedTemplateId (which is actually template name from JSON), 4) activeArea
      let templateName = activeArea; // Default fallback
      
      // Check if selections are locked for this sample (locked selections store template name directly)
      if (lockedSelections[selectedSampleSetId] && lockedSelections[selectedSampleSetId][sample.id]) {
        templateName = lockedSelections[selectedSampleSetId][sample.id].templateName || activeArea;
      } else if (sampleTemplateSelections[sample.id]) {
        // If not locked, check current template selection state (stores template name directly, not ID)
        templateName = sampleTemplateSelections[sample.id] || activeArea;
      } else if (sample.selectedTemplateId) {
        // Fallback to sample's selectedTemplateId property (from JSON - this is actually the template name, not ID)
        templateName = sample.selectedTemplateId || activeArea;
      }
      
      console.log(`📋 Sample ${sample.id}: templateName=${templateName}, selection=${sampleTemplateSelections[sample.id] || sample.selectedTemplateId || 'none'}`);
      
      return {
        id: letterId,
        area: templateName, // Use selected template name as area
        confirmingParty: sample.confirmingParty || "",
        amount: sample.amount || "",
        recipientName: sample.recipientName || "",
        recipientOrg: sample.confirmingParty || "",
        recipientEmail: sample.recipientEmail || "",
        clientName: "", // Leave empty - user must select a client
        clientEmail: "", // Leave empty - user must select a client
        status: "draft",
        activityLog: [
          {
            timestamp: new Date().toISOString(),
            stage: "Creation",
            action: "Confirmation request created",
            performedBy: "System",
            details: `Initial confirmation request generated for ${templateName} - ${sample.confirmingParty || "Unknown"}`,
            status: "completed"
          }
        ]
      };
    });

    try {
      const response = await fetch('http://localhost:3002/api/create-authorization-letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letters: letters
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Authorization letters created:", result);
        
        // Lock recipient and template selections after successful generation
        const sampleSet = Object.values(sampleSets).flat().find(s => s.id === selectedSampleSetId);
        if (sampleSet) {
          const selections = samples.map(sample => ({
            sampleId: sample.id,
            recipientName: sample.recipientName || "",
            recipientEmail: sample.recipientEmail || "",
            templateName: sampleTemplateSelections[sample.id] || ""
          }));
          
          try {
            const lockResponse = await fetch('http://localhost:3002/api/lock-recipient-template-selections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                area: activeArea,
                sampleSetName: sampleSet.name,
                selections: selections
              })
            });
            
            if (lockResponse.ok) {
              const lockData = await lockResponse.json();
              console.log('✅ Recipient/template selections locked:', lockData);
              // Update locked state
              setLockedSelections(prev => ({
                ...prev,
                [selectedSampleSetId]: selections.reduce((acc, sel) => {
                  acc[sel.sampleId] = {
                    recipientName: sel.recipientName,
                    recipientEmail: sel.recipientEmail,
                    templateName: sel.templateName
                  };
                  return acc;
                }, {} as Record<string, { recipientName: string; recipientEmail: string; templateName: string }>)
              }));
            }
          } catch (lockError) {
            console.error('Error locking selections:', lockError);
          }
        }
        
        // Add Stage 1: Creation activity log entry for each letter
        const performedBy = "Auditor"; // TODO: Get actual auditor name from auth context
        for (const letter of letters) {
          try {
            await fetch('http://localhost:3002/api/add-activity-log', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                letterId: letter.id,
                stage: "Creation",
                action: "Confirmation request created",
                performedBy: performedBy,
                details: `Initial confirmation request generated for ${activeArea} - ${letter.confirmingParty || "Unknown"}`,
                status: "completed"
              }),
            });
            console.log(`✅ Added Creation activity log for letter ${letter.id}`);
          } catch (logError: any) {
            console.error('Error adding activity log:', logError);
          }
        }
        
        toast({
          title: "Success",
          description: `Successfully created ${letters.length} authorization letter(s)`,
        });
        
        // Close dialog and reset
        setTemplateSelectionDialogOpen(false);
        setSelectedSampleSetId(null);
        setSampleTemplateSelections({});
      } else {
        throw new Error(result.message || 'Failed to create authorization letters');
      }
    } catch (error: any) {
      console.error('Error creating authorization letters:', error);
      toast({
        title: "Error",
        description: `Failed to create authorization letters: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Add functions for footnote management
  const handleTextSelection = (
    elementId: string,
    fieldType: "textContent" | "heading" | "subheading" | "tableCell",
    cellId?: string
  ) => {
    const checkSelection = (target: HTMLTextAreaElement | HTMLInputElement) => {
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      
      if (start !== end && start >= 0 && end > start) {
        const selectedText = target.value.substring(start, end);
        setSelectedText({
          elementId,
          fieldType,
          cellId,
          startIndex: start,
          endIndex: end,
          text: selectedText
        });
      } else {
        setSelectedText(null);
      }
    };

    return {
      onMouseUp: (e: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const target = e.target as HTMLTextAreaElement | HTMLInputElement;
        checkSelection(target);
      },
      onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const target = e.target as HTMLTextAreaElement | HTMLInputElement;
        checkSelection(target);
      }
    };
  };

  const handleAddFootnote = () => {
    if (!selectedText || !footnoteText.trim()) {
      alert("Please enter footnote text.");
      return;
    }

    const element = templateElements.find(e => e.id === selectedText.elementId);
    if (!element) return;

    const symbol = getNextFootnoteSymbol(selectedText.elementId);
    const newFootnote: Footnote = {
      id: `footnote-${Date.now()}`,
      symbol,
      text: footnoteText.trim(),
      startIndex: selectedText.startIndex,
      endIndex: selectedText.endIndex,
      elementId: selectedText.elementId,
      fieldType: selectedText.fieldType,
      cellId: selectedText.cellId
    };

    // Add footnote to footnotes array
    setFootnotes(prev => [...prev, newFootnote]);

    // Update element to include footnote
    const elementFootnotes = (element.footnotes || []).concat(newFootnote);
    updateElement(selectedText.elementId, { footnotes: elementFootnotes });

    // Insert footnote symbol into the text
    const fieldValue = 
      selectedText.fieldType === "textContent" ? element.textContent || "" :
      selectedText.fieldType === "heading" ? element.heading || "" :
      selectedText.fieldType === "subheading" ? element.subheading || "" :
      "";

    if (selectedText.fieldType === "tableCell" && selectedText.cellId && element.tableData) {
      // Handle table cell separately
      const updatedContent = insertFootnoteSymbol(
        getTableCellContent(element.tableData, selectedText.cellId),
        selectedText.startIndex,
        selectedText.endIndex,
        symbol
      );
      updateTableCell(selectedText.elementId, "", selectedText.cellId, { content: updatedContent });
    } else {
      const updatedContent = insertFootnoteSymbol(
        fieldValue,
        selectedText.startIndex,
        selectedText.endIndex,
        symbol
      );

      if (selectedText.fieldType === "textContent") {
        updateElement(selectedText.elementId, { textContent: updatedContent });
      } else if (selectedText.fieldType === "heading") {
        updateElement(selectedText.elementId, { heading: updatedContent });
      } else if (selectedText.fieldType === "subheading") {
        updateElement(selectedText.elementId, { subheading: updatedContent });
      }
    }

    // Reset
    setSelectedText(null);
    setFootnoteText("");
    setFootnoteDialogOpen(false);
  };

  const insertFootnoteSymbol = (
    text: string,
    startIndex: number,
    endIndex: number,
    symbol: string
  ): string => {
    const selectedText = text.substring(startIndex, endIndex);
    return text.substring(0, endIndex) + symbol + text.substring(endIndex);
  };

  const getTableCellContent = (tableData: TableData, cellId: string): string => {
    // Search in header row
    const headerCell = tableData.headerRow.cells.find(c => c.id === cellId);
    if (headerCell) return headerCell.content;

    // Search in data rows
    for (const row of tableData.dataRows) {
      const cell = row.cells.find(c => c.id === cellId);
      if (cell) return cell.content;
    }
    return "";
  };

  const renderTextWithFootnotes = (
    text: string,
    elementId: string,
    fieldType: "textContent" | "heading" | "subheading" | "tableCell",
    cellId?: string
  ): React.ReactNode => {
    if (!text) return text;

    const elementFootnotes = footnotes.filter(
      f => f.elementId === elementId && 
      f.fieldType === fieldType && 
      (fieldType !== "tableCell" || f.cellId === cellId)
    );

    if (elementFootnotes.length === 0) return text;

    // Sort footnotes by position
    const sortedFootnotes = [...elementFootnotes].sort((a, b) => a.startIndex - b.startIndex);

    // Build array of text parts and footnote symbols
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedFootnotes.forEach((footnote, index) => {
      // Add text before footnote
      if (footnote.startIndex > lastIndex) {
        parts.push(text.substring(lastIndex, footnote.endIndex));
      }
      // Add footnote symbol
      parts.push(
        <sup key={`footnote-${footnote.id}`} className="text-blue-600 font-semibold cursor-help" title={footnote.text}>
          {footnote.symbol}
        </sup>
      );
      lastIndex = footnote.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  // Handle saving custom dropdown options
  const handleSaveCustomDropdownOptions = () => {
    if (!editingCellForDropdown || customDropdownOptions.length === 0) {
      alert("Please add at least one option.");
      return;
    }

    // Update the cell with the options
    const element = templateElements.find(e => e.id === editingCellForDropdown.elementId);
    if (!element?.tableData) return;

    const updateCellOptions = (row: TableRow): TableRow => {
      if (row.id !== editingCellForDropdown.rowId) return row;
      return {
        ...row,
        cells: row.cells.map(cell =>
          cell.id === editingCellForDropdown.cellId 
            ? { 
                ...cell, 
                customDropdownOptions: customDropdownOptions,
                cellType: "customDropdown" as const
              } 
            : cell
        )
      };
    };

    const isHeader = editingCellForDropdown.rowId === "header-row";
    const updatedHeaderRow = isHeader ? updateCellOptions(element.tableData.headerRow) : element.tableData.headerRow;
    const updatedDataRows = isHeader ? element.tableData.dataRows : element.tableData.dataRows.map(updateCellOptions);

    // If it's a header, propagate to all cells in that column
    if (isHeader) {
      const colIndex = element.tableData.headerRow.cells.findIndex(c => c.id === editingCellForDropdown.cellId);
      if (colIndex !== -1) {
        const finalDataRows = updatedDataRows.map(row => ({
          ...row,
          cells: row.cells.map((dataCell, idx) => {
            if (idx === colIndex) {
              return {
                ...dataCell,
                cellType: "customDropdown" as const,
                customDropdownOptions: customDropdownOptions
              };
            }
            return dataCell;
          })
        }));

        updateElement(editingCellForDropdown.elementId, {
          tableData: {
            ...element.tableData,
            headerRow: updatedHeaderRow,
            dataRows: finalDataRows
          }
        });
      } else {
        updateElement(editingCellForDropdown.elementId, {
          tableData: {
            ...element.tableData,
            headerRow: updatedHeaderRow,
            dataRows: updatedDataRows
          }
        });
      }
    } else {
      updateElement(editingCellForDropdown.elementId, {
        tableData: {
          ...element.tableData,
          headerRow: updatedHeaderRow,
          dataRows: updatedDataRows
        }
      });
    }

    // Reset state
    setCustomDropdownOptions([]);
    setEditingCellForDropdown(null);
    setCustomDropdownDialogOpen(false);
  };

  // Handle adding a new option to the custom dropdown
  const handleAddDropdownOption = () => {
    setCustomDropdownOptions([...customDropdownOptions, ""]);
  };

  // Handle removing an option from the custom dropdown
  const handleRemoveDropdownOption = (index: number) => {
    setCustomDropdownOptions(customDropdownOptions.filter((_, i) => i !== index));
  };

  // Handle updating an option value
  const handleUpdateDropdownOption = (index: number, value: string) => {
    const updated = [...customDropdownOptions];
    updated[index] = value;
    setCustomDropdownOptions(updated);
  };

  // Add a new state for the preview dialog (around line 220, with other state declarations):
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Add a function to render the template preview (after handleCreateCustomTemplate, around line 424):

  // Render template preview
  const renderTemplatePreview = () => {
    if (templateElements.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No elements added yet. Add elements to preview your template.</p>
        </div>
      );
    }

    const renderTextWithFootnotes = (text: string, footnotes: Footnote[] = [], fieldType: "textContent" | "heading" | "subheading" | "tableCell") => {
      if (!footnotes || footnotes.length === 0) {
        return <span>{text}</span>;
      }

      const relevantFootnotes = footnotes.filter(f => f.fieldType === fieldType);
      if (relevantFootnotes.length === 0) {
        return <span>{text}</span>;
      }

      // Sort footnotes by start index
      const sortedFootnotes = [...relevantFootnotes].sort((a, b) => a.startIndex - b.startIndex);
      
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      sortedFootnotes.forEach((footnote) => {
        // Add text before footnote
        if (footnote.startIndex > lastIndex) {
          parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, footnote.startIndex)}</span>);
        }
        // Add text with footnote symbol
        parts.push(
          <span key={`text-${footnote.startIndex}`}>
            {text.substring(footnote.startIndex, footnote.endIndex)}
            <sup className="text-blue-600 font-semibold">{footnote.symbol}</sup>
          </span>
        );
        lastIndex = footnote.endIndex;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
      }

      return <span>{parts}</span>;
    };

    return (
      <div className="space-y-6">
        {/* Render all template elements */}
        {templateElements
          .sort((a, b) => a.order - b.order)
          .map((element) => (
            <div key={element.id} className="space-y-4">
              {/* Text Element */}
              {element.type === "text" && (
                <div className="space-y-2">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">
                      {renderTextWithFootnotes(element.textContent || "", element.footnotes, "textContent")}
                    </p>
                  </div>
                  {/* Display footnotes */}
                  {element.footnotes && element.footnotes.filter(f => f.fieldType === "textContent").length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {element.footnotes
                        .filter(f => f.fieldType === "textContent")
                        .map(footnote => (
                          <div key={footnote.id} className="text-sm text-muted-foreground flex gap-2">
                            <span className="font-semibold">{footnote.symbol}</span>
                            <span>{footnote.text}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Confirming Party Text Box Element */}
              {element.type === "confirmingPartyTextBox" && (
                <div className="space-y-2">
                  {element.heading && (
                    <h3 className="font-semibold text-base">
                      {renderTextWithFootnotes(element.heading, element.footnotes, "heading")}
                    </h3>
                  )}
                  {element.subheading && (
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {renderTextWithFootnotes(element.subheading, element.footnotes, "subheading")}
                    </h4>
                  )}
                  <div 
                    className="border rounded-md p-4 bg-muted/30"
                    style={{
                      width: element.width || "100%",
                      height: element.height || "100px",
                      minHeight: element.height || "100px"
                    }}
                  >
                    <p className="text-sm text-muted-foreground italic">
                      {element.placeholder || "(Form fields will be filled by confirming party)"}
                    </p>
                  </div>
                  {/* Display footnotes */}
                  {element.footnotes && element.footnotes.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {element.footnotes.map(footnote => (
                        <div key={footnote.id} className="text-sm text-muted-foreground flex gap-2">
                          <span className="font-semibold">{footnote.symbol}</span>
                          <span>{footnote.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Table Element */}
              {element.type === "table" && element.tableData && (
                <div className="space-y-2">
                  <div className="border-2 border-gray-300 rounded-md overflow-x-auto">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr>
                          {element.tableData.headerRow.cells.map((cell) => (
                            <th
                              key={cell.id}
                              className="border border-gray-400 p-2 bg-gray-100 font-semibold text-left"
                              colSpan={cell.colSpan}
                              rowSpan={cell.rowSpan}
                            >
                              {renderTextWithFootnotes(cell.content, element.footnotes?.filter(f => f.cellId === cell.id), "tableCell")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {element.tableData.dataRows.map((row) => (
                          <tr key={row.id}>
                            {row.cells.map((cell) => (
                              <td
                                key={cell.id}
                                className="border border-gray-400 p-2"
                                colSpan={cell.colSpan}
                                rowSpan={cell.rowSpan}
                              >
                                {cell.enteredByConfirmingParty ? (
                                  <span className="text-sm text-muted-foreground italic">
                                    (Form fields will be filled by confirming party)
                                  </span>
                                ) : cell.cellType === "calendar" ? (
                                  <span className="text-sm text-muted-foreground">[Date]</span>
                                ) : cell.cellType === "customDropdown" ? (
                                  <span className="text-sm text-muted-foreground">[Select from dropdown]</span>
                                ) : (
                                  <span className="text-sm">{cell.content || "-"}</span>
                                )}
                              </td>
                            ))}
                            <td className="border border-gray-400 p-1 w-10 align-middle">
                              <div className="flex flex-col gap-1">
                                {/* Only show Add Row button if NOT all headers have "Entered by Confirming Party" checked */}
                                {!element.tableData.canConfirmingPartyAddRows && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => addTableRow(element.id, row.id)}
                                    title="Add row below"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => removeTableRow(element.id, row.id)}
                                  disabled={element.tableData.dataRows.length <= 1}
                                  title="Delete row"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Display footnotes for table cells */}
                  {element.footnotes && element.footnotes.filter(f => f.fieldType === "tableCell").length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {element.footnotes
                        .filter(f => f.fieldType === "tableCell")
                        .map(footnote => (
                          <div key={footnote.id} className="text-sm text-muted-foreground flex gap-2">
                            <span className="font-semibold">{footnote.symbol}</span>
                            <span>{footnote.text}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Asterisk Statement Element */}
              {element.type === "asteriskStatement" && (
                <div className="space-y-2">
                  <p className="text-sm italic text-muted-foreground">
                    {element.statement || ""}
                  </p>
                </div>
              )}
            </div>
          ))}

        {/* Mandatory Elements Preview */}
        <div className="space-y-4 border-t pt-6 mt-6">
          {/* Remarks Section */}
          <div className="space-y-2">
            <Label className="font-semibold">Remarks</Label>
            <Textarea
              placeholder="Enter any remarks or additional information..."
              rows={4}
              disabled
              className="bg-muted/30"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <Label className="font-semibold">Attachments</Label>
            <Input
              type="file"
              multiple
              disabled
              className="cursor-pointer bg-muted/30"
            />
          </div>

          {/* Certification Statement */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-start gap-2">
              <Checkbox disabled className="mt-1" />
              <p className="text-sm">
                We certify that the above particulars (read alongwith the attachments if any) are full and correct and do not exclude any other financial relationship of the entity with us.
              </p>
            </div>
          </div>

          {/* Confirming Party Details */}
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-1">
              <Label>Organization Name (if any)</Label>
              <Input placeholder="Organization name" disabled className="max-w-md bg-muted/30" />
            </div>
            <div className="space-y-1">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input placeholder="Your name" disabled className="max-w-md bg-muted/30" />
            </div>
            <div className="space-y-1">
              <Label>Designation <span className="text-red-500">*</span></Label>
              <Input placeholder="Your designation" disabled className="max-w-md bg-muted/30" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel - Areas */}
      <div className="w-64 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Audit Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={activeArea} onValueChange={(value) => {
              setActiveArea(value);
              // Automatically add the area to selectedAreas if not already present
              if (!selectedAreas.includes(value)) {
                setSelectedAreas([...selectedAreas, value]);
                if (!sampleSets[value]) {
                  setSampleSets({ ...sampleSets, [value]: [] });
                }
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Area" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Sample Sets */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{activeArea}</h2>
            <p className="text-muted-foreground text-sm">Manage sample sets for this area</p>
          </div>
          <Button onClick={() => setShowNewSetForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sample Set
          </Button>
        </div>

        {showNewSetForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Sample Set</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sample Set Name</Label>
                <Input
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="e.g., Q4 Trade Receivables"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addSampleSet}>Create</Button>
                <Button variant="outline" onClick={() => setShowNewSetForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Sets List */}
        <div className="space-y-4">
          {(sampleSets[activeArea] || []).map((set) => (
            <Card key={set.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{set.name}</CardTitle>
                    <CardDescription>Sample Set ID: {set.id}</CardDescription>
                  </div>
                  <Badge variant={set.status === "generated" ? "default" : "secondary"}>
                    {set.status === "generated" ? "Generated" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Upload Data File</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="file"
                        ref={(el) => {
                          fileInputRefs.current[set.id] = el;
                        }}
                        onChange={(e) => {
                          resetSampleSetStatus(set.id);
                          handleFileUpload(set.id, e);
                        }}
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        id={`file-input-${set.id}`}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => triggerFileInput(set.id)}
                        type="button"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {set.fileName || "Choose File"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Sampling Method</Label>
                    {lockedSamplingMethods[set.id]?.locked ? (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <p className="text-sm font-medium">
                          {lockedSamplingMethods[set.id].method === "random" ? "Random Sampling" : "Monetary Unit Sampling (MUS)"}
                        </p>
                      </div>
                    ) : (
                      <Select 
                        value={samplingConfigs[set.id]?.method || ""}
                        disabled={set.status === "generated" || lockedSamplingMethods[set.id]?.locked}
                        onValueChange={(value: "random" | "mus") => {
                          setSamplingConfigs(prev => {
                            const currentConfig = prev[set.id];
                            // If switching methods, clear all previous configuration and reset status
                            if (currentConfig?.method && currentConfig.method !== value) {
                              resetSampleSetStatus(set.id);
                              return {
                                ...prev,
                                [set.id]: {
                                  method: value,
                                  // Clear all other fields when switching methods
                                  // For random, automatically set randomType to "simple"
                                  randomType: value === "random" ? "simple" : undefined,
                                  // For MUS, set default scope to "all"
                                  scope: value === "mus" ? "all" : undefined,
                                  // Explicitly clear all other fields
                                  simpleMethod: undefined,
                                  numberOfSamples: undefined,
                                  controlReliance: undefined,
                                  assessedRisk: undefined,
                                  performanceMateriality: undefined,
                                  amountColumn: undefined,
                                  confirmingPartyColumn: undefined,
                                }
                              };
                            }
                            // If same method or new config, just update method and reset status
                            resetSampleSetStatus(set.id);
                            return {
                              ...prev,
                              [set.id]: {
                                ...prev[set.id],
                                method: value,
                                randomType: value === "random" ? "simple" : undefined,
                                // For MUS, ensure scope is set to "all" if not already set
                                scope: value === "mus" ? (prev[set.id]?.scope || "all") : prev[set.id]?.scope,
                              }
                            };
                          });
                        }}
                        disabled={set.status === "generated" || lockedSamplingMethods[set.id]?.locked}
                      >
                      <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random Sampling</SelectItem>
                        <SelectItem value="mus">Monetary Unit Sampling (MUS)</SelectItem>
                      </SelectContent>
                    </Select>
                    )}
                  </div>
                </div>

                {/* Sampling Configuration UI */}
                {samplingConfigs[set.id]?.method === "random" && !lockedSamplingMethods[set.id]?.locked && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-4">
                    <div>
                        <Label>Simple Random Sampling Method</Label>
                        {lockedSamplingMethods[set.id]?.locked && lockedSamplingMethods[set.id].simpleMethod ? (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            <p className="text-sm font-medium">
                              {lockedSamplingMethods[set.id].simpleMethod === "number" ? "Number of Samples" : "Sample Calculator"}
                            </p>
                    </div>
                        ) : (
                          <Select 
                            value={samplingConfigs[set.id]?.simpleMethod || ""}
                            onValueChange={(value: "number" | "calculator") => {
                              setSamplingConfigs(prev => {
                                const currentConfig = prev[set.id];
                                // If switching between number and calculator, clear the other method's fields
                                if (currentConfig?.simpleMethod && currentConfig.simpleMethod !== value) {
                                  if (value === "number") {
                                    // Switching to number - clear calculator fields
                                    return {
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        method: "random",
                                        randomType: "simple",
                                        simpleMethod: value,
                                        // Clear calculator-specific fields
                                        controlReliance: undefined,
                                        assessedRisk: undefined,
                                        performanceMateriality: undefined,
                                        scope: undefined,
                                      }
                                    };
                                  } else {
                                    // Switching to calculator - clear number fields
                                    return {
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        method: "random",
                                        randomType: "simple",
                                        simpleMethod: value,
                                        // Clear number-specific fields
                                        numberOfSamples: undefined,
                                      }
                                    };
                                  }
                                }
                                // If same method or new config, just update
                                return {
                                  ...prev,
                                  [set.id]: {
                                    ...prev[set.id],
                                    method: "random",
                                    randomType: "simple",
                                    simpleMethod: value,
                                  }
                                };
                              });
                            }}
                            disabled={set.status === "generated" || lockedSamplingMethods[set.id]?.locked}
                          >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose an option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="number">Number of Samples</SelectItem>
                                <SelectItem value="calculator">Sample Calculator</SelectItem>
                              </SelectContent>
                            </Select>
                        )}
                    </div>

                        {samplingConfigs[set.id]?.simpleMethod === "number" && (
                          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                              <Label>Number of Samples *</Label>
                              <Input
                                type="number"
                                value={samplingConfigs[set.id]?.numberOfSamples ?? ""}
                                onChange={(e) => {
                                  resetSampleSetStatus(set.id);
                                  const value = e.target.value;
                                  if (value === "") {
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        method: "random",
                                        randomType: "simple",
                                        simpleMethod: "number",
                                        numberOfSamples: undefined,
                                      }
                                    }));
                                    return;
                                  }
                                  const numValue = parseInt(value, 10);
                                  if (!isNaN(numValue) && numValue > 0) {
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        method: "random",
                                        randomType: "simple",
                                        simpleMethod: "number",
                                        numberOfSamples: numValue,
                                      }
                                    }));
                                  }
                                }}
                                className="mt-2"
                                placeholder="Enter number of samples"
                                min="1"
                              />
                    </div>
                            <div className="grid grid-cols-2 gap-4">
                    <div>
                                <Label>Confirming Party Name Column *</Label>
                                <Select 
                                  value={samplingConfigs[set.id]?.confirmingPartyColumn || ""}
                                  onValueChange={(value) => {
                                    resetSampleSetStatus(set.id);
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        confirmingPartyColumn: value,
                                      }
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fileColumns[set.id]?.map((col) => (
                                      <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Amount Column *</Label>
                                <Select 
                                  value={samplingConfigs[set.id]?.amountColumn || ""}
                                  onValueChange={(value) => {
                                    resetSampleSetStatus(set.id);
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        amountColumn: value,
                                      }
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fileColumns[set.id]?.map((col) => (
                                      <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}

                        {samplingConfigs[set.id]?.simpleMethod === "calculator" && (
                          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Control Reliance *</Label>
                                <Select 
                                  value={samplingConfigs[set.id]?.controlReliance || ""}
                                  onValueChange={(value: "relying" | "not-relying") => {
                                    resetSampleSetStatus(set.id);
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        controlReliance: value,
                                      }
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="relying">Relying on Controls</SelectItem>
                                    <SelectItem value="not-relying">Not Relying on Controls</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Assessed Risk *</Label>
                                <Select 
                                  value={samplingConfigs[set.id]?.assessedRisk || ""}
                                  onValueChange={(value: "lower" | "higher" | "significant") => {
                                    resetSampleSetStatus(set.id);
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        assessedRisk: value,
                                      }
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="lower">Lower</SelectItem>
                                    <SelectItem value="higher">Higher</SelectItem>
                                    <SelectItem value="significant">Significant</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Amount Column *</Label>
                                <Select 
                                  value={samplingConfigs[set.id]?.amountColumn || ""}
                                  onValueChange={(value) => {
                                    resetSampleSetStatus(set.id);
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        amountColumn: value,
                                      }
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fileColumns[set.id]?.map((col) => (
                                      <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Performance Materiality *</Label>
                                <Input
                                  type="number"
                                  value={samplingConfigs[set.id]?.performanceMateriality || performanceMateriality || ""}
                                  onChange={(e) => {
                                    resetSampleSetStatus(set.id);
                                    const value = parseFloat(e.target.value) || 0;
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        performanceMateriality: value,
                                      }
                                    }));
                                    setPerformanceMateriality(value);
                                  }}
                                  className="mt-2"
                                  placeholder="Enter performance materiality"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Scope *</Label>
                          <Select 
                            value={samplingConfigs[set.id]?.scope || ""}
                            onValueChange={(value: "positive" | "negative" | "all") => {
                              resetSampleSetStatus(set.id);
                              setSamplingConfigs(prev => ({
                                ...prev,
                                [set.id]: {
                                  ...prev[set.id],
                                  scope: value,
                                }
                              }));
                            }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="positive">Positive Value Items</SelectItem>
                                    <SelectItem value="negative">Negative Value Items</SelectItem>
                                    <SelectItem value="all">All Items (Absolute)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Confirming Party Name Column *</Label>
                                <Select 
                                  value={samplingConfigs[set.id]?.confirmingPartyColumn || ""}
                                  onValueChange={(value) => {
                                    resetSampleSetStatus(set.id);
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        confirmingPartyColumn: value,
                                      }
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fileColumns[set.id]?.map((col) => (
                                      <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {samplingConfigs[set.id]?.controlReliance && 
                             samplingConfigs[set.id]?.assessedRisk && 
                             samplingConfigs[set.id]?.performanceMateriality && 
                             samplingConfigs[set.id]?.amountColumn && 
                             samplingConfigs[set.id]?.scope && 
                             samplingConfigs[set.id]?.confirmingPartyColumn && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <Label className="text-sm font-semibold">Calculated Sample Size:</Label>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                  {(() => {
                                    const sampleSize = getCalculatedSampleSize(set.id);
                                    if (sampleSize !== null) {
                                      return sampleSize;
                                    }
                                    return fileData[set.id] ? "Please select all required fields" : "Calculate after file upload";
                                  })()}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* MUS Configuration UI */}
                {samplingConfigs[set.id]?.method === "mus" && !lockedSamplingMethods[set.id]?.locked && (
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Monetary Unit Sampling uses the same calculator as Simple Random Sampling, 
                      but also includes all items above Performance Materiality.
                    </p>
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Control Reliance *</Label>
                          <Select 
                            value={samplingConfigs[set.id]?.controlReliance || ""}
                            onValueChange={(value: "relying" | "not-relying") => {
                              resetSampleSetStatus(set.id);
                              setSamplingConfigs(prev => ({
                                ...prev,
                                [set.id]: {
                                  ...prev[set.id],
                                  method: "mus",
                                  controlReliance: value,
                                }
                              }));
                            }}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="relying">Relying on Controls</SelectItem>
                              <SelectItem value="not-relying">Not Relying on Controls</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Assessed Risk *</Label>
                          <Select 
                            value={samplingConfigs[set.id]?.assessedRisk || ""}
                            onValueChange={(value: "lower" | "higher" | "significant") => {
                              resetSampleSetStatus(set.id);
                              setSamplingConfigs(prev => ({
                                ...prev,
                                [set.id]: {
                                  ...prev[set.id],
                                  assessedRisk: value,
                                }
                              }));
                            }}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lower">Lower</SelectItem>
                              <SelectItem value="higher">Higher</SelectItem>
                              <SelectItem value="significant">Significant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Amount Column *</Label>
                          <Select 
                            value={samplingConfigs[set.id]?.amountColumn || ""}
                            onValueChange={(value) => {
                              resetSampleSetStatus(set.id);
                              setSamplingConfigs(prev => ({
                                ...prev,
                                [set.id]: {
                                  ...prev[set.id],
                                  amountColumn: value,
                                }
                              }));
                            }}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {fileColumns[set.id]?.map((col) => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Performance Materiality *</Label>
                          <Input
                            type="number"
                            value={samplingConfigs[set.id]?.performanceMateriality || performanceMateriality || ""}
                            onChange={(e) => {
                              resetSampleSetStatus(set.id);
                              const value = parseFloat(e.target.value) || 0;
                              setSamplingConfigs(prev => ({
                                ...prev,
                                [set.id]: {
                                  ...prev[set.id],
                                  performanceMateriality: value,
                                }
                              }));
                              setPerformanceMateriality(value);
                            }}
                            className="mt-2"
                            placeholder="Enter performance materiality"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                                <Label>Scope *</Label>
                                <Select
                                  value={samplingConfigs[set.id]?.scope || "all"}
                                  onValueChange={(value: "positive" | "negative" | "all") => {
                                    resetSampleSetStatus(set.id);
                                    setSamplingConfigs(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id],
                                        scope: value,
                                      }
                                    }));
                                  }}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="positive">Positive Value Items</SelectItem>
                              <SelectItem value="negative">Negative Value Items</SelectItem>
                              <SelectItem value="all">All Items (Absolute)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Confirming Party Name Column *</Label>
                          <Select 
                            value={samplingConfigs[set.id]?.confirmingPartyColumn || ""}
                            onValueChange={(value) => {
                              resetSampleSetStatus(set.id);
                              setSamplingConfigs(prev => ({
                                ...prev,
                                [set.id]: {
                                  ...prev[set.id],
                                  confirmingPartyColumn: value,
                                }
                              }));
                            }}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {fileColumns[set.id]?.map((col) => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {samplingConfigs[set.id]?.controlReliance && 
                       samplingConfigs[set.id]?.assessedRisk && 
                       samplingConfigs[set.id]?.performanceMateriality && 
                       samplingConfigs[set.id]?.performanceMateriality > 0 &&
                       samplingConfigs[set.id]?.amountColumn && 
                       samplingConfigs[set.id]?.scope &&
                       samplingConfigs[set.id]?.confirmingPartyColumn && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <Label className="text-sm font-semibold">Calculated Sample Size (excluding items above PM):</Label>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {(() => {
                              const sampleSize = getCalculatedSampleSize(set.id);
                              if (sampleSize !== null) {
                                return sampleSize;
                              }
                              return fileData[set.id] ? "Please select all required fields" : "Calculate after file upload";
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Items above Performance Materiality will be automatically included.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleGenerateSamples(set.id)}
                      disabled={set.status === "generated" || lockedSamplingMethods[set.id]?.locked || (() => {
                        const config = samplingConfigs[set.id];
                        const hasFileData = fileData[set.id] && Array.isArray(fileData[set.id]) && fileData[set.id].length > 0;
                        
                        if (!config?.method || !hasFileData) {
                          console.log('Button disabled: method or fileData missing', { method: config?.method, hasFileData });
                          return true;
                        }
                        
                        if (config.method === "random") {
                          if (config.simpleMethod === "number") {
                            const isValid = config.numberOfSamples && 
                                          config.numberOfSamples > 0 && 
                                          config.confirmingPartyColumn && 
                                          config.amountColumn;
                            console.log('Random number method validation:', { isValid, config });
                            return !isValid;
                          } else if (config.simpleMethod === "calculator") {
                            const isValid = config.controlReliance && 
                                          config.assessedRisk && 
                                          config.performanceMateriality && 
                                          config.performanceMateriality > 0 &&
                                          config.amountColumn && 
                                          config.scope && 
                                          config.confirmingPartyColumn;
                            console.log('Random calculator method validation:', { isValid, config });
                            return !isValid;
                          }
                          return true; // simpleMethod not selected
                        } else if (config.method === "mus") {
                          const isValid = config.controlReliance && 
                                        config.assessedRisk && 
                                        config.performanceMateriality && 
                                        config.performanceMateriality > 0 &&
                                        config.amountColumn && 
                                        config.scope &&
                                        config.confirmingPartyColumn;
                          console.log('MUS validation:', { 
                            isValid, 
                            controlReliance: config.controlReliance,
                            assessedRisk: config.assessedRisk,
                            performanceMateriality: config.performanceMateriality,
                            amountColumn: config.amountColumn,
                            scope: config.scope,
                            confirmingPartyColumn: config.confirmingPartyColumn,
                            hasFileData
                          });
                          return !isValid;
                        }
                        return true;
                      })()}
                    >
                        <Download className="h-4 w-4 mr-2" />
                      Generate Sample
                      </Button>
                    <Dialog 
                          open={templateSelectionDialogOpen && selectedSampleSetId === set.id}
                          onOpenChange={(open) => {
                            setTemplateSelectionDialogOpen(open);
                            if (!open) {
                              setSelectedSampleSetId(null);
                              setSampleTemplateSelections({});
                              setShowCustomTemplateForm(false);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              className="flex-1"
                              onClick={() => handleGenerateAuthorizationLetter(set.id)}
                            >
                        <FileText className="h-4 w-4 mr-2" />
                              View Sample
                      </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                            <DialogTitle>Select Authorization Letter Templates</DialogTitle>
                            <DialogDescription>
                              Choose templates for each sample in "{set.name}". 
                              You can select individually or autofill to all samples in this set.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6 py-4">
                            {/* Form Name Selection Section */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Select Confirmation Form</h3>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCustomTemplateForm(true)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Custom Template
                                </Button>
                              </div>

                              {/* Custom Template Creation Dialog */}
                              <Dialog open={showCustomTemplateForm} onOpenChange={(open) => {
                                setShowCustomTemplateForm(open);
                                if (!open) {
                                  // Reset when closing
                                  setNewTemplateName("");
                                  setTemplateElements([]);
                                  setEditingElementId(null);
                                  setTemplateBuilderStep("name");
                                }
                              }}>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Create Custom Template</DialogTitle>
                                    <DialogDescription>
                                      {templateBuilderStep === "name" 
                                        ? "Enter a name for your custom template."
                                        : "Select elements to include in your template. The last 4 elements are mandatory and will be included automatically."}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  {templateBuilderStep === "name" ? (
                                    <div className="space-y-4 py-4">
                                      <div>
                                        <Label>Template Name *</Label>
                                        <Input
                                          value={newTemplateName}
                                          onChange={(e) => setNewTemplateName(e.target.value)}
                                          placeholder="e.g., Custom Bank Confirmation Template"
                                          className="mt-2"
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setShowCustomTemplateForm(false);
                                            setNewTemplateName("");
                                            setTemplateBuilderStep("name");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            if (newTemplateName.trim()) {
                                              setTemplateBuilderStep("builder");
                                            } else {
                                              alert("Please enter a template name.");
                                            }
                                          }}
                                        >
                                          Next: Build Template
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-6 py-4">
                                      <div className="space-y-4">
                                        <h4 className="font-semibold text-sm">Build Your Template</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Add elements in the order you want them to appear. You can add multiple elements of any type.
                                        </p>

                                        {/* Existing Elements */}
                                        <div className="space-y-4">
                                          {templateElements
                                            .sort((a, b) => a.order - b.order)
                                            .map((element, index) => (
                                              <Card key={element.id} className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                  <div className="flex items-center gap-2">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                      {element.type === "text" && "Text"}
                                                      {element.type === "confirmingPartyTextBox" && "Confirming Party Text Box"}
                                                      {element.type === "table" && "Table"}
                                                      {element.type === "asteriskStatement" && "Asterisk Statement"}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => moveElement(element.id, "up")}
                                                      disabled={index === 0}
                                                    >
                                                      <MoveUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => moveElement(element.id, "down")}
                                                      disabled={index === templateElements.length - 1}
                                                    >
                                                      <MoveDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => removeElement(element.id)}
                                                    >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                                                  </div>
                                                </div>

                                                {/* Element Editor */}
                                                {element.type === "text" && (
                                                  <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                      <Label className="text-xs">Text Content (Rich Text Editor)</Label>
                                                      {selectedText?.elementId === element.id && selectedText.fieldType === "textContent" && (
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          onClick={() => setFootnoteDialogOpen(true)}
                                                          className="h-7 text-xs"
                                                        >
                                                          <BookOpen className="h-3 w-3 mr-1" />
                                                          Add Footnote
                                                        </Button>
                                                      )}
                                                    </div>
                                                    <Textarea
                                                      value={element.textContent || ""}
                                                      onChange={(e) => updateElement(element.id, { textContent: e.target.value })}
                                                      {...handleTextSelection(element.id, "textContent")}
                                                      placeholder="Select text and click 'Add Footnote' to add a footnote..."
                                                      rows={6}
                                                      className="font-mono text-sm"
                                                    />
                                                    {selectedText?.elementId === element.id && selectedText.fieldType === "textContent" && (
                                                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                                        Selected: "{selectedText.text}" - Click "Add Footnote" to add a footnote
                                                      </div>
                                                    )}
                                                    {/* Display footnotes for this element */}
                                                    {element.footnotes && element.footnotes.filter(f => f.fieldType === "textContent").length > 0 && (
                                                      <div className="mt-3 pt-3 border-t space-y-1">
                                                        <Label className="text-xs font-semibold">Footnotes:</Label>
                                                        {element.footnotes
                                                          .filter(f => f.fieldType === "textContent")
                                                          .map(footnote => (
                                                            <div key={footnote.id} className="text-xs text-muted-foreground flex gap-2">
                                                              <span className="font-semibold">{footnote.symbol}</span>
                                                              <span>{footnote.text}</span>
                                                            </div>
                                                          ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}

                                                {element.type === "confirmingPartyTextBox" && (
                                                  <div className="space-y-3">
                                                    <div>
                                                      <div className="flex items-center justify-between mb-1">
                                                        <Label className="text-xs">Heading *</Label>
                                                        {selectedText?.elementId === element.id && selectedText.fieldType === "heading" && (
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setFootnoteDialogOpen(true)}
                                                            className="h-7 text-xs"
                                                          >
                                                            <BookOpen className="h-3 w-3 mr-1" />
                                                            Add Footnote
                                                          </Button>
                                                        )}
                                                      </div>
                                                      <Input
                                                        value={element.heading || ""}
                                                        onChange={(e) => updateElement(element.id, { heading: e.target.value })}
                                                        {...handleTextSelection(element.id, "heading")}
                                                        placeholder="Enter heading (required). Select text to add footnote."
                                                        className="text-sm"
                                                      />
                                                      {selectedText?.elementId === element.id && selectedText.fieldType === "heading" && (
                                                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-1">
                                                          Selected: "{selectedText.text}" - Click "Add Footnote" to add a footnote
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div>
                                                      <div className="flex items-center justify-between mb-1">
                                                        <Label className="text-xs">Subheading (Optional)</Label>
                                                        {selectedText?.elementId === element.id && selectedText.fieldType === "subheading" && (
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setFootnoteDialogOpen(true)}
                                                            className="h-7 text-xs"
                                                          >
                                                            <BookOpen className="h-3 w-3 mr-1" />
                                                            Add Footnote
                                                          </Button>
                                                        )}
                                                      </div>
                                                      <Input
                                                        value={element.subheading || ""}
                                                        onChange={(e) => updateElement(element.id, { subheading: e.target.value })}
                                                        {...handleTextSelection(element.id, "subheading")}
                                                        placeholder="Enter subheading (optional). Select text to add footnote."
                                                        className="text-sm"
                                                      />
                                                      {selectedText?.elementId === element.id && selectedText.fieldType === "subheading" && (
                                                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-1">
                                                          Selected: "{selectedText.text}" - Click "Add Footnote" to add a footnote
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                      <div>
                                                        <Label className="text-xs">Width</Label>
                                                        <Input
                                                          value={element.width || "100%"}
                                                          onChange={(e) => updateElement(element.id, { width: e.target.value })}
                                                          placeholder="e.g., 100%, 500px"
                                                          className="text-xs"
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs">Height</Label>
                                                        <Input
                                                          value={element.height || "100px"}
                                                          onChange={(e) => updateElement(element.id, { height: e.target.value })}
                                                          placeholder="e.g., 100px, 200px"
                                                          className="text-xs"
                                                        />
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <Label className="text-xs">Placeholder Text</Label>
                                                      <Input
                                                        value={element.placeholder || ""}
                                                        onChange={(e) => updateElement(element.id, { placeholder: e.target.value })}
                                                        placeholder="Placeholder text for the textbox"
                                                        className="text-sm"
                                                      />
                                                    </div>
                                                    {/* Display footnotes for this element */}
                                                    {element.footnotes && element.footnotes.length > 0 && (
                                                      <div className="mt-3 pt-3 border-t space-y-1">
                                                        <Label className="text-xs font-semibold">Footnotes:</Label>
                                                        {element.footnotes.map(footnote => (
                                                          <div key={footnote.id} className="text-xs text-muted-foreground flex gap-2">
                                                            <span className="font-semibold">{footnote.symbol}</span>
                                                            <span>{footnote.text}</span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}

                                                {element.type === "table" && (
                                                  <div className="space-y-4">
                                                    {tableInitializationMode[element.id] ? (
                                                      // Initial table setup
                                                      <div className="space-y-3 p-4 border rounded-md">
                                                        <Label className="text-sm font-medium">Initialize Table</Label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                          <div>
                                                            <Label className="text-xs">Number of Columns</Label>
                                                            <Input
                                                              type="number"
                                                              min="1"
                                                              value={tableInitialCols[element.id] || 2}
                                                              onChange={(e) => setTableInitialCols(prev => ({
                                                                ...prev,
                                                                [element.id]: parseInt(e.target.value) || 2
                                                              }))}
                                                              className="text-sm"
                                                            />
                                                          </div>
                                                          <div>
                                                            <Label className="text-xs">Number of Rows</Label>
                                                            <Input
                                                              type="number"
                                                              min="1"
                                                              value={tableInitialRows[element.id] || 1}
                                                              onChange={(e) => setTableInitialRows(prev => ({
                                                                ...prev,
                                                                [element.id]: parseInt(e.target.value) || 1
                                                              }))}
                                                              className="text-sm"
                                                            />
                                                          </div>
                                                        </div>
                                                        <Button
                                                          onClick={() => initializeTable(
                                                            element.id,
                                                            tableInitialCols[element.id] || 2,
                                                            tableInitialRows[element.id] || 1
                                                          )}
                                                          className="w-full"
                                                        >
                                                          Create Table
                                                        </Button>
                                                      </div>
                                                    ) : element.tableData ? (
                                                      // Table editor
                                                      <div className="space-y-3">
                                                        {/* Table Name Input */}
                                                        <div className="space-y-1">
                                                          <Label className="text-sm font-medium">Table Name</Label>
                                                          <Input
                                                            value={element.tableName || ""}
                                                            onChange={(e) => updateElement(element.id, { tableName: e.target.value })}
                                                            placeholder="Enter table name (e.g., Balance Details)"
                                                            className="max-w-md"
                                                          />
                                                        </div>

                                                        {/* Table Controls */}
                                                        <div className="flex gap-2 flex-wrap items-center justify-between p-2 bg-muted rounded">
                                                          <div className="flex gap-2">
                                                            {/* Only show Add Row if NOT all headers have "Entered by Confirming Party" checked */}
                                                            {!element.tableData.canConfirmingPartyAddRows && (
                                                              <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => addTableRow(element.id)}
                                                              >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Add Row
                                                              </Button>
                                                            )}
                                                            <Button
                                                              variant="outline"
                                                              size="sm"
                                                              onClick={() => addTableColumn(element.id)}
                                                            >
                                                              <Plus className="h-3 w-3 mr-1" />
                                                              Add Column
                                                            </Button>
                                                          </div>
                                                          <div className="text-xs text-muted-foreground">
                                                            {element.tableData.columns} columns × {element.tableData.rows} rows
                                                            {element.tableData.canConfirmingPartyAddRows && (
                                                              <span className="ml-2 text-green-600">✓ Confirming party can add rows</span>
                                                            )}
                                                          </div>
                                                        </div>

                                                        {/* Table Grid - MS Word Style */}
                                                        <div className="border-2 border-gray-300 rounded-md overflow-x-auto">
                                                          <table className="w-full border-collapse bg-white">
                                                            {/* Header Row */}
                                                            <thead>
                                                              <tr>
                                                                {element.tableData.headerRow.cells.map((cell, colIndex) => {
                                                                  const isHeaderSelected = selectedCellForConfig?.elementId === element.id && 
                                                                                           selectedCellForConfig?.cellId === cell.id && 
                                                                                           selectedCellForConfig?.isHeader;
                                                                  return (
                                                                    <th
                                                                      key={cell.id}
                                                                      className="border border-gray-400 p-2 bg-gray-100 min-w-[120px] align-top relative"
                                                                      colSpan={cell.colSpan}
                                                                      rowSpan={cell.rowSpan}
                                                                      onClick={() => setSelectedCellForConfig({
                                                                        elementId: element.id,
                                                                        rowId: "header-row",
                                                                        cellId: cell.id,
                                                                        isHeader: true
                                                                      })}
                                                                      style={{
                                                                        backgroundColor: selectedCellForConfig?.cellId === cell.id ? "#dbeafe" : undefined
                                                                      }}
                                                                    >
                                                                      <div className="space-y-2">
                                                                        {/* Plus and Delete buttons in header - top right */}
                                                                        <div className="flex justify-end gap-1 mb-1">
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-5 w-5 p-0"
                                                                            onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              addTableColumn(element.id, colIndex);
                                                                            }}
                                                                            title="Add column after"
                                                                          >
                                                                            <Plus className="h-3 w-3" />
                                                                          </Button>
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-5 w-5 p-0"
                                                                            onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              removeTableColumn(element.id, colIndex);
                                                                            }}
                                                                            disabled={element.tableData.headerRow.cells.length <= 1}
                                                                            title="Delete column"
                                                                          >
                                                                            <Trash2 className="h-3 w-3" />
                                                                          </Button>
                                                                        </div>
                                                                        
                                                                        <Input
                                                                          value={cell.content}
                                                                          onChange={(e) => updateTableCell(
                                                                            element.id,
                                                                            "header-row",
                                                                            cell.id,
                                                                            { content: e.target.value }
                                                                          )}
                                                                          {...handleTextSelection(element.id, "tableCell", cell.id)}
                                                                          placeholder={`Header ${colIndex + 1}`}
                                                                          className="text-xs font-semibold border-0 focus-visible:ring-0 bg-transparent p-0 h-auto"
                                                                          onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                        {selectedText?.elementId === element.id && 
                                                                         selectedText.fieldType === "tableCell" && 
                                                                         selectedText.cellId === cell.id && (
                                                                          <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              setFootnoteDialogOpen(true);
                                                                            }}
                                                                            className="h-5 text-xs"
                                                                          >
                                                                            <BookOpen className="h-3 w-3 mr-1" />
                                                                            Footnote
                                                                          </Button>
                                                                        )}
                                                                        
                                                                        {/* Dropdown indicator - bottom right, doesn't collide with + and delete */}
                                                                        <div className="absolute bottom-1 right-1">
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-5 w-5 p-0 hover:bg-transparent"
                                                                            onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              if (isHeaderSelected) {
                                                                                setSelectedCellForConfig(null);
                                                                              } else {
                                                                                setSelectedCellForConfig({
                                                                                  elementId: element.id,
                                                                                  rowId: "header-row",
                                                                                  cellId: cell.id,
                                                                                  isHeader: true
                                                                                });
                                                                              }
                                                                            }}
                                                                            title={isHeaderSelected ? "Close configuration" : "Open configuration"}
                                                                          >
                                                                            <ChevronDown className={`h-4 w-4 ${isHeaderSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                                                          </Button>
                                                                        </div>
                                                                        
                                                                        {/* Configuration Panel - Inside Header */}
                                                                        {isHeaderSelected && (
                                                                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                              <Label className="text-xs font-semibold">Configure Header</Label>
                                                                              <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-4 w-4 p-0"
                                                                                onClick={(e) => {
                                                                                  e.stopPropagation();
                                                                                  setSelectedCellForConfig(null);
                                                                                }}
                                                                              >
                                                                                ✕
                                                                              </Button>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                              <Checkbox
                                                                                checked={cell.enteredByConfirmingParty}
                                                                                onCheckedChange={(checked) => {
                                                                                  const isChecked = checked as boolean;
                                                                                  
                                                                                  // Get current element state
                                                                                  const currentElement = templateElements.find(e => e.id === element.id);
                                                                                  if (!currentElement?.tableData) return;
                                                                                  
                                                                                  // Find the column index
                                                                                  const colIndex = currentElement.tableData.headerRow.cells.findIndex(c => c.id === cell.id);
                                                                                  if (colIndex === -1) return;
                                                                                  
                                                                                  // Update header cell
                                                                                  const updatedHeaderCells = currentElement.tableData.headerRow.cells.map(c =>
                                                                                    c.id === cell.id ? { ...c, enteredByConfirmingParty: isChecked } : c
                                                                                  );
                                                                                  
                                                                                  // Propagate to all data cells in this column
                                                                                  const updatedDataRows = currentElement.tableData.dataRows.map(row => ({
                                                                                    ...row,
                                                                                    cells: row.cells.map((dataCell, idx) => {
                                                                                      if (idx === colIndex) {
                                                                                        return { ...dataCell, enteredByConfirmingParty: isChecked };
                                                                                      }
                                                                                      return dataCell;
                                                                                    })
                                                                                  }));
                                                                                  
                                                                                  // Recalculate canConfirmingPartyAddRows
                                                                                  const allColumnsConfirmingParty = updatedHeaderCells.every(c => c.enteredByConfirmingParty);
                                                                                  
                                                                                  // Update element with all changes at once
                                                                                  updateElement(element.id, {
                                                                                    tableData: {
                                                                                      ...currentElement.tableData,
                                                                                      headerRow: { ...currentElement.tableData.headerRow, cells: updatedHeaderCells },
                                                                                      dataRows: updatedDataRows,
                                                                                      canConfirmingPartyAddRows: allColumnsConfirmingParty
                                                                                    }
                                                                                  });
                                                                                }}
                                                                              />
                                                                              <Label className="text-xs">Entered by Confirming Party?</Label>
                                                                            </div>
                                                                            <div>
                                                                              <Label className="text-xs mb-1 block">Cell Type</Label>
                                                                              <Select
                                                                                value={cell.cellType}
                                                                                onValueChange={(value: "text" | "calendar" | "customDropdown") => {
                                                                                  // Update header cell
                                                                                  updateTableCell(
                                                                                    element.id,
                                                                                    "header-row",
                                                                                    cell.id,
                                                                                    { cellType: value }
                                                                                  );
                                                                                  
                                                                                  // Propagate to all cells in this column
                                                                                  const currentElement = templateElements.find(e => e.id === element.id);
                                                                                  if (currentElement?.tableData) {
                                                                                    const updatedDataRows = currentElement.tableData.dataRows.map(row => ({
                                                                                      ...row,
                                                                                      cells: row.cells.map((dataCell, idx) => {
                                                                                        if (idx === colIndex) {
                                                                                          return { 
                                                                                            ...dataCell, 
                                                                                            cellType: value,
                                                                                            // Clear custom dropdown options if changing away from customDropdown
                                                                                            customDropdownOptions: value === "customDropdown" ? dataCell.customDropdownOptions : undefined
                                                                                          };
                                                                                        }
                                                                                        return dataCell;
                                                                                      })
                                                                                    }));
                                                                                    
                                                                                    updateElement(element.id, {
                                                                                      tableData: {
                                                                                        ...currentElement.tableData,
                                                                                        dataRows: updatedDataRows
                                                                                      }
                                                                                    });
                                                                                  }
                                                                                  
                                                                                  if (value === "customDropdown") {
                                                                                    setEditingCellForDropdown({
                                                                                      elementId: element.id,
                                                                                      rowId: "header-row",
                                                                                      cellId: cell.id,
                                                                                      isHeader: true
                                                                                    });
                                                                                    setCustomDropdownDialogOpen(true);
                                                                                  }
                                                                                }}
                                                                              >
                                                                                <SelectTrigger className="h-7 text-xs">
                                                                                  <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                  <SelectItem value="text">Text Field</SelectItem>
                                                                                  <SelectItem value="calendar">Calendar Dropdown</SelectItem>
                                                                                  <SelectItem value="customDropdown">Custom Dropdown</SelectItem>
                                                                                </SelectContent>
                                                                              </Select>
                                                                            </div>
                                                                            {cell.cellType === "customDropdown" && cell.customDropdownOptions && (
                                                                              <div className="text-xs text-muted-foreground">
                                                                                Options: {cell.customDropdownOptions.join(", ")}
                                                                              </div>
                                                                            )}
                                                                            <Button
                                                                              variant="ghost"
                                                                              size="sm"
                                                                              className="h-6 text-xs w-full"
                                                                              onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                removeTableColumn(element.id, colIndex);
                                                                              }}
                                                                            >
                                                                              <Trash2 className="h-3 w-3 mr-1" />
                                                                              Delete Column
                                                                            </Button>
                                                                          </div>
                                                                        )}
                                                                        
                                                                      </div>
                                                                    </th>
                                                                  );
                                                                })}
                                                              </tr>
                                                            </thead>
                                                            {/* Data Rows */}
                                                            <tbody>
                                                              {element.tableData.dataRows.map((row, rowIndex) => (
                                                                <tr key={row.id} className="group">
                                                                  {row.cells.map((cell, colIndex) => {
                                                                    const isCellSelected = selectedCellForConfig?.elementId === element.id && 
                                                                                           selectedCellForConfig?.cellId === cell.id && 
                                                                                           selectedCellForConfig?.rowId === row.id &&
                                                                                           !selectedCellForConfig?.isHeader;
                                                                    return (
                                                                      <td
                                                                        key={cell.id}
                                                                        className="border border-gray-400 p-2 min-w-[120px] align-top relative"
                                                                        colSpan={cell.colSpan}
                                                                        rowSpan={cell.rowSpan}
                                                                        onClick={() => setSelectedCellForConfig({
                                                                          elementId: element.id,
                                                                          rowId: row.id,
                                                                          cellId: cell.id,
                                                                          isHeader: false
                                                                        })}
                                                                        style={{
                                                                          backgroundColor: selectedCellForConfig?.cellId === cell.id && selectedCellForConfig?.rowId === row.id ? "#dbeafe" : undefined
                                                                        }}
                                                                      >
                                                                        <div className="space-y-2">
                                                                          {/* Dropdown indicator - top right for data cells */}
                                                                          <div className="absolute top-1 right-1">
                                                                            <Button
                                                                              variant="ghost"
                                                                              size="sm"
                                                                              className="h-5 w-5 p-0 hover:bg-transparent"
                                                                              onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (isCellSelected) {
                                                                                  setSelectedCellForConfig(null);
                                                                                } else {
                                                                                  setSelectedCellForConfig({
                                                                                    elementId: element.id,
                                                                                    rowId: row.id,
                                                                                    cellId: cell.id,
                                                                                    isHeader: false
                                                                                  });
                                                                                }
                                                                              }}
                                                                              title={isCellSelected ? "Close configuration" : "Open configuration"}
                                                                            >
                                                                              <ChevronDown className={`h-4 w-4 ${isCellSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                                                            </Button>
                                                                          </div>
                                                                          
                                                                          {/* Render input based on cellType */}
                                                                          {cell.cellType === "text" && (
                                                                            <Input
                                                                              value={cell.content}
                                                                              onChange={(e) => updateTableCell(
                                                                                element.id,
                                                                                row.id,
                                                                                cell.id,
                                                                                { content: e.target.value }
                                                                              )}
                                                                              {...handleTextSelection(element.id, "tableCell", cell.id)}
                                                                              placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                                                                              className="text-xs border-0 focus-visible:ring-0 bg-transparent p-0 h-auto"
                                                                              onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                          )}
                                                                          
                                                                          {cell.cellType === "calendar" && (
                                                                            <Popover>
                                                                              <PopoverTrigger asChild>
                                                                                <Button
                                                                                  variant="outline"
                                                                                  className={cn(
                                                                                    "w-full justify-start text-left font-normal text-xs h-auto py-1 px-2",
                                                                                    !cell.content && "text-muted-foreground"
                                                                                  )}
                                                                                  onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                                                                  {cell.content ? (
                                                                                    formatIndianDate(parseIndianDate(cell.content) || new Date())
                                                                                  ) : (
                                                                                    <span>dd-mm-yyyy</span>
                                                                                  )}
                                                                                </Button>
                                                                              </PopoverTrigger>
                                                                              <PopoverContent className="w-auto p-0" align="start">
                                                                                <Calendar
                                                                                  mode="single"
                                                                                  selected={cell.content ? parseIndianDate(cell.content) || undefined : undefined}
                                                                                  onSelect={(date) => {
                                                                                    if (date) {
                                                                                      const formatted = formatIndianDate(date);
                                                                                      updateTableCell(
                                                                                        element.id,
                                                                                        row.id,
                                                                                        cell.id,
                                                                                        { content: formatted }
                                                                                      );
                                                                                    }
                                                                                  }}
                                                                                  initialFocus
                                                                                />
                                                                              </PopoverContent>
                                                                            </Popover>
                                                                          )}
                                                                          
                                                                          {cell.cellType === "customDropdown" && cell.customDropdownOptions && (
                                                                            <Select
                                                                              value={cell.content}
                                                                              onValueChange={(value) => {
                                                                                updateTableCell(
                                                                                  element.id,
                                                                                  row.id,
                                                                                  cell.id,
                                                                                  { content: value }
                                                                                );
                                                                              }}
                                                                            >
                                                                              <SelectTrigger className="h-auto py-1 px-2 text-xs border-0 focus:ring-0 bg-transparent">
                                                                                <SelectValue placeholder="Select..." />
                                                                              </SelectTrigger>
                                                                              <SelectContent>
                                                                                {cell.customDropdownOptions.map((option) => (
                                                                                  <SelectItem key={option} value={option}>
                                                                                    {option}
                                                                                  </SelectItem>
                                                                                ))}
                                                                              </SelectContent>
                                                                            </Select>
                                                                          )}

                                                                          {selectedText?.elementId === element.id && 
                                                                           selectedText.fieldType === "tableCell" && 
                                                                           selectedText.cellId === cell.id && (
                                                                            <Button
                                                                              size="sm"
                                                                              variant="outline"
                                                                              onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setFootnoteDialogOpen(true);
                                                                              }}
                                                                              className="h-5 text-xs mt-1"
                                                                            >
                                                                              <BookOpen className="h-3 w-3 mr-1" />
                                                                              Footnote
                                                                            </Button>
                                                                          )}
                                                                          
                                                                          {/* Configuration Panel - Inside Data Cell */}
                                                                          {isCellSelected && (
                                                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                                                                              {/* ... existing configuration panel code ... */}
                                                                            </div>
                                                                          )}
                                                                          
                                                                        </div>
                                                                      </td>
                                                                    );
                                                                  })}
                                                                  <td className="border border-gray-400 p-1 w-10 align-middle">
                                                                    <div className="flex flex-col gap-1">
                                                                      {/* Only show Add Row button if NOT all headers have "Entered by Confirming Party" checked */}
                                                                      {!element.tableData.canConfirmingPartyAddRows && (
                                                                        <Button
                                                                          variant="ghost"
                                                                          size="sm"
                                                                          className="h-6 w-6 p-0"
                                                                          onClick={() => addTableRow(element.id, row.id)}
                                                                          title="Add row below"
                                                                        >
                                                                          <Plus className="h-3 w-3" />
                                                                        </Button>
                                                                      )}
                                                                      <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={() => removeTableRow(element.id, row.id)}
                                                                        disabled={element.tableData.dataRows.length <= 1}
                                                                        title="Delete row"
                                                                      >
                                                                        <Trash2 className="h-3 w-3" />
                                                                      </Button>
                                                                    </div>
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                )}

                                                {element.type === "asteriskStatement" && (
                                                  <div className="space-y-2">
                                                    <Label className="text-xs">Asterisk Statement</Label>
                                                    <Input
                                                      value={element.statement || ""}
                                                      onChange={(e) => updateElement(element.id, { statement: e.target.value })}
                                                      placeholder="Enter asterisk statement"
                                                      className="text-sm"
                                                    />
                                                  </div>
                                                )}

                                                {/* Add Element Options After This Element */}
                                                <div className="mt-4 pt-4 border-t">
                                                  <Label className="text-xs text-muted-foreground mb-2 block">Add another element:</Label>
                                                  <div className="flex gap-2 flex-wrap">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => addElement("text", element.id)}
                                                    >
                                                      <Plus className="h-3 w-3 mr-1" />
                                                      Text
                                                    </Button>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => addElement("confirmingPartyTextBox", element.id)}
                                                    >
                                                      <Plus className="h-3 w-3 mr-1" />
                                                      Confirming Party Text Box
                                                    </Button>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => addElement("table", element.id)}
                                                    >
                                                      <Plus className="h-3 w-3 mr-1" />
                                                      Table
                                                    </Button>
                                                  </div>
                                                </div>
                                              </Card>
                                            ))}
                                        </div>

                                        {/* Initial Add Element Section (if no elements yet) */}
                                        {templateElements.length === 0 && (
                                          <Card className="p-4 border-dashed">
                                            <Label className="text-sm font-medium mb-3 block">Add your first element:</Label>
                                            <div className="flex gap-2 flex-wrap">
                                              <Button
                                                variant="outline"
                                                onClick={() => addElement("text")}
                                              >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Text
                                              </Button>
                                              <Button
                                                variant="outline"
                                                onClick={() => addElement("confirmingPartyTextBox")}
                                              >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Confirming Party Text Box
                                              </Button>
                                              <Button
                                                variant="outline"
                                                onClick={() => addElement("table")}
                                              >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Table
                                              </Button>
                                            </div>
                                          </Card>
                                        )}

                                        {/* Mandatory Elements Section */}
                                        <div className="space-y-4 border-t pt-4 mt-6">
                                          <h4 className="font-semibold text-sm">Mandatory Elements (Always Included at the End):</h4>
                                          <div className="space-y-2 ml-6">
                                            <div className="flex items-center space-x-2">
                                              <Checkbox id="mandatory-remarks" checked={true} disabled />
                                              <Label htmlFor="mandatory-remarks" className="font-normal text-muted-foreground">
                                                5. Remarks Section
                                              </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox id="mandatory-attachments" checked={true} disabled />
                                              <Label htmlFor="mandatory-attachments" className="font-normal text-muted-foreground">
                                                6. Attachments Section
                                              </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox id="mandatory-confirmation" checked={true} disabled />
                                              <Label htmlFor="mandatory-confirmation" className="font-normal text-muted-foreground">
                                                7. Confirming Party Confirmation Statement
                                              </Label>
                                            </div>
                                            <div className="text-sm text-muted-foreground ml-6 mb-2">
                                              "We certify that the above particulars (read alongwith the attachments if any) are full and correct."
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox id="mandatory-details" checked={true} disabled />
                                              <Label htmlFor="mandatory-details" className="font-normal text-muted-foreground">
                                                8. Confirming Party Details
                                              </Label>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-between gap-2 pt-4 border-t">
                                          <Button
                                            variant="outline"
                                            onClick={() => setTemplateBuilderStep("name")}
                                          >
                                            Back
                                          </Button>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setShowCustomTemplateForm(false);
                                                setNewTemplateName("");
                                                setTemplateElements([]);
                                                setEditingElementId(null);
                                                setTemplateBuilderStep("name");
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                            <Button 
                                              onClick={() => setShowTemplatePreview(true)}
                                              disabled={templateElements.length === 0}
                                            >
                                              View Template
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {/* Template Preview Dialog */}
                              <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Template Preview: {newTemplateName || "Untitled Template"}</DialogTitle>
                                    <DialogDescription>
                                      Preview how your template will appear to the confirming party. This is a read-only view.
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="py-4">
                                    {renderTemplatePreview()}
                                  </div>

                                  <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button
                                      variant="outline"
                                      onClick={() => setShowTemplatePreview(false)}
                                    >
                                      Close Preview
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        handleCreateCustomTemplate();
                                        setShowTemplatePreview(false);
                                      }}
                                      disabled={templateElements.length === 0}
                                    >
                                      Create Template
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* Footnote Dialog */}
                              <Dialog open={footnoteDialogOpen} onOpenChange={setFootnoteDialogOpen}>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Add Footnote</DialogTitle>
                                    <DialogDescription>
                                      Enter the footnote text for the selected text: "{selectedText?.text}"
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <Label>Footnote Text *</Label>
                                      <Textarea
                                        value={footnoteText}
                                        onChange={(e) => setFootnoteText(e.target.value)}
                                        placeholder="Enter footnote text..."
                                        rows={4}
                                      />
                                    </div>
                                    {selectedText && (
                                      <div className="text-xs text-muted-foreground">
                                        Symbol: {getNextFootnoteSymbol(selectedText.elementId)}
                                      </div>
                                    )}
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setFootnoteDialogOpen(false);
                                          setFootnoteText("");
                                          setSelectedText(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleAddFootnote}
                                        disabled={!footnoteText.trim()}
                                      >
                                        Add Footnote
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* Custom Dropdown Options Dialog */}
                              <Dialog open={customDropdownDialogOpen} onOpenChange={(open) => {
                                setCustomDropdownDialogOpen(open);
                                if (!open) {
                                  // Reset when closing
                                  setCustomDropdownOptions([]);
                                  setEditingCellForDropdown(null);
                                } else if (editingCellForDropdown) {
                                  // Load existing options when opening
                                  const element = templateElements.find(e => e.id === editingCellForDropdown.elementId);
                                  if (element?.tableData) {
                                    const cell = editingCellForDropdown.isHeader
                                      ? element.tableData.headerRow.cells.find(c => c.id === editingCellForDropdown.cellId)
                                      : element.tableData.dataRows
                                          .find(r => r.id === editingCellForDropdown.rowId)
                                          ?.cells.find(c => c.id === editingCellForDropdown.cellId);
                                    
                                    if (cell?.customDropdownOptions && cell.customDropdownOptions.length > 0) {
                                      setCustomDropdownOptions([...cell.customDropdownOptions]);
                                    } else {
                                      setCustomDropdownOptions([""]);
                                    }
                                  } else {
                                    setCustomDropdownOptions([""]);
                                  }
                                }
                              }}>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Configure Custom Dropdown</DialogTitle>
                                    <DialogDescription>
                                      Add options for the custom dropdown. These will be available as selections in the cell.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Dropdown Options *</Label>
                                      {customDropdownOptions.map((option, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                          <Input
                                            value={option}
                                            onChange={(e) => handleUpdateDropdownOption(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className="flex-1"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveDropdownOption(index)}
                                            disabled={customDropdownOptions.length === 1}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddDropdownOption}
                                        className="w-full"
                                      >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Add Option
                                      </Button>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setCustomDropdownDialogOpen(false);
                                          setCustomDropdownOptions([]);
                                          setEditingCellForDropdown(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleSaveCustomDropdownOptions}
                                        disabled={customDropdownOptions.length === 0 || customDropdownOptions.some(opt => !opt.trim())}
                                      >
                                        Save Options
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* Form Name Dropdown */}
                              <div className="space-y-2">
                                <Label>Choose a confirmation form:</Label>
                                <div className="flex gap-2">
                                  <Select 
                                    value={selectedFormName}
                                    onValueChange={(value) => {
                                      setSelectedFormName(value);
                                      if (!selectedSampleId) {
                                        // If no sample is selected, enable autofill
                                        handleAutofillFormName(value);
                                      } else {
                                        // If a sample is selected, assign to that sample
                                        handleFormNameSelection(selectedSampleId, value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select a confirmation form..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CONFIRMATION_FORM_NAMES.map((formName) => (
                                        <SelectItem key={formName} value={formName}>
                                          {formName}
                                        </SelectItem>
                                      ))}
                                      {customFormNames.map((formName) => (
                                        <SelectItem key={formName} value={formName}>
                                          {formName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      if (selectedFormName) {
                                        handleAutofillFormName(selectedFormName);
                                      }
                                    }}
                                    disabled={!selectedFormName}
                                    className="whitespace-nowrap"
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Autofill
                                  </Button>
                                </div>
                                {!selectedSampleId && selectedFormName && (
                                  <p className="text-sm text-muted-foreground">
                                    This form will be applied to all samples in this set.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Samples List */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Samples in This Set</h3>
                                {isLoadingConfirmationData && (
                                  <p className="text-sm text-muted-foreground">Loading samples from SharePoint...</p>
                                )}
                              </div>
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Sample ID</TableHead>
                                      <TableHead>Confirming Party</TableHead>
                                      <TableHead>Recipient</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead>Selected Template</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {isLoadingConfirmationData ? (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                          Loading samples from SharePoint...
                                        </TableCell>
                                      </TableRow>
                                    ) : getSamplesForSet(set.id).length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                          No samples found for this sample set.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      getSamplesForSet(set.id).map((sample) => {
                                      const selectedFormNameForSample = sampleTemplateSelections[sample.id];
                                      
                                      return (
                                        <TableRow 
                                          key={sample.id}
                                          className={selectedSampleId === sample.id ? "bg-muted" : ""}
                                          onClick={() => {
                                            setSelectedSampleId(sample.id);
                                            setSelectedFormName(selectedFormNameForSample || "");
                                          }}
                                        >
                                          <TableCell className="font-medium">{sample.id}</TableCell>
                                          <TableCell>{sample.confirmingParty}</TableCell>
                                          <TableCell>
                                            {lockedSelections[set.id]?.[sample.id] ? (
                                              <div className="p-2 bg-muted rounded-md">
                                                <p className="text-sm font-medium">{lockedSelections[set.id][sample.id].recipientName}</p>
                                                <p className="text-xs text-muted-foreground">{lockedSelections[set.id][sample.id].recipientEmail}</p>
                                              </div>
                                            ) : (
                                              <Select
                                                value={sample.recipientEmail || ""}
                                                onValueChange={(value) => {
                                                  // Find the selected recipient from confirmation requests
                                                  const selectedRecipient = getRecipientsFromConfirmations().find(
                                                    r => r.email === value
                                                  );
                                                  if (selectedRecipient) {
                                                    // Update the sample's recipient
                                                    setGeneratedSamples(prev => {
                                                      const updated = { ...prev };
                                                      if (updated[set.id]) {
                                                        updated[set.id] = updated[set.id].map(s =>
                                                          s.id === sample.id
                                                            ? { ...s, recipientName: selectedRecipient.name, recipientEmail: selectedRecipient.email }
                                                            : s
                                                        );
                                                      }
                                                      return updated;
                                                    });
                                                    // Also update samplesFromJson if it exists
                                                    setSamplesFromJson(prev => {
                                                      const updated = { ...prev };
                                                      if (updated[set.id]) {
                                                        updated[set.id] = updated[set.id].map(s =>
                                                          s.id === sample.id
                                                            ? { ...s, recipientName: selectedRecipient.name, recipientEmail: selectedRecipient.email }
                                                            : s
                                                        );
                                                      }
                                                      return updated;
                                                    });
                                                  }
                                                }}
                                              >
                                                <SelectTrigger 
                                                  className="w-[280px]"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                  }}
                                                >
                                                  <SelectValue placeholder="Select recipient...">
                                                    {sample.recipientEmail 
                                                      ? sample.recipientName
                                                      : "Select recipient..."
                                                    }
                                                  </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent className="w-[280px]">
                                                  {getRecipientsFromConfirmations().map((recipient) => (
                                                    <SelectItem key={recipient.email} value={recipient.email} className="py-2">
                                                      <div className="flex flex-col items-start text-left w-full">
                                                        <span className="font-medium text-sm leading-tight">{recipient.name}</span>
                                                        <span className="text-xs text-muted-foreground leading-tight">{recipient.email}</span>
                                                      </div>
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            )}
                                          </TableCell>
                                          <TableCell>{sample.amount}</TableCell>
                                          <TableCell>
                                            {lockedSelections[set.id]?.[sample.id] ? (
                                              <div className="p-2 bg-muted rounded-md">
                                                <p className="text-sm font-medium">{lockedSelections[set.id][sample.id].templateName}</p>
                                              </div>
                                            ) : (
                                              <Select
                                                value={selectedFormNameForSample || ""}
                                                onValueChange={(value) => {
                                                  handleFormNameSelection(sample.id, value);
                                                }}
                                              >
                                                <SelectTrigger 
                                                  className="w-[280px]"
                                                  onClick={(e) => {
                                                    // Prevent row click when clicking on dropdown
                                                    e.stopPropagation();
                                                  }}
                                                >
                                                  <SelectValue placeholder="Select a form..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {CONFIRMATION_FORM_NAMES.map((formName) => (
                                                    <SelectItem key={formName} value={formName}>
                                                      {formName}
                                                    </SelectItem>
                                                  ))}
                                                  {customFormNames.map((formName) => (
                                                    <SelectItem key={formName} value={formName}>
                                                      {formName}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    }))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-4 border-t">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setTemplateSelectionDialogOpen(false);
                                  setSelectedSampleSetId(null);
                                  setSampleTemplateSelections({});
                                  setShowCustomTemplateForm(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleGenerateLetters}>
                                Generate Authorization Letters
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log('🗑️ Delete button clicked for sample set:', set.name);
                          if (window.confirm(`Are you sure you want to delete "${set.name}"? This action cannot be undone.`)) {
                            try {
                              // Call backend API to delete sample set from audit_areas.json
                              const response = await fetch('http://localhost:3002/api/delete-sample-set-from-area', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  area: activeArea,
                                  sampleSetName: set.name,
                                }),
                              });

                              const data = await response.json();

                              if (data.success) {
                                console.log('✅ Sample set deleted from audit_areas.json:', data);
                                
                                // Remove from local state
                                setSampleSets(prev => {
                                  const updated = { ...prev };
                                  if (updated[activeArea]) {
                                    updated[activeArea] = updated[activeArea].filter(s => s.id !== set.id);
                                  }
                                  return updated;
                                });
                                
                                // Clean up related state
                                setGeneratedSamples(prev => {
                                  const updated = { ...prev };
                                  delete updated[set.id];
                                  return updated;
                                });
                                setSamplingLogs(prev => {
                                  const updated = { ...prev };
                                  delete updated[set.id];
                                  return updated;
                                });
                                setSamplesFromJson(prev => {
                                  const updated = { ...prev };
                                  delete updated[set.id];
                                  return updated;
                                });
                                setSamplingConfigs(prev => {
                                  const updated = { ...prev };
                                  delete updated[set.id];
                                  return updated;
                                });
                                setFileData(prev => {
                                  const updated = { ...prev };
                                  delete updated[set.id];
                                  return updated;
                                });
                                setFileColumns(prev => {
                                  const updated = { ...prev };
                                  delete updated[set.id];
                                  return updated;
                                });
                                
                                // Show success message with sample deletion info
                                const deletedCount = data.deletedSamplesCount || 0;
                                const message = deletedCount > 0 
                                  ? `Sample set "${set.name}" and ${deletedCount} related sample(s) deleted successfully`
                                  : `Sample set "${set.name}" deleted successfully`;
                                
                                toast({
                                  title: "Success",
                                  description: message,
                                });
                              } else {
                                console.error('❌ Error deleting sample set:', data.message);
                                toast({
                                  title: "Error",
                                  description: `Failed to delete from SharePoint: ${data.message}`,
                                  variant: "destructive",
                                });
                              }
                            } catch (error: any) {
                              console.error('❌ Error calling delete-sample-set-from-area API:', error);
                              toast({
                                title: "Error",
                                description: `Failed to delete sample set: ${error.message}`,
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      </div>
                      <Dialog 
                        open={samplingLogDialogOpen[set.id] || false}
                        onOpenChange={(open) => {
                          setSamplingLogDialogOpen(prev => ({
                            ...prev,
                            [set.id]: open
                          }));
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={async () => {
                              setSamplingLogDialogOpen(prev => ({
                                ...prev,
                                [set.id]: true
                              }));
                              // Fetch sampling log from SharePoint when dialog opens
                              await fetchSamplingLog();
                            }}
                          >
                            <ScrollText className="h-4 w-4 mr-2" />
                            View Sampling Log
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Sampling Log - {set.name}</DialogTitle>
                            <DialogDescription>
                              View the sampling log for this sample set
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {isLoadingSamplingLog ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                                <p>Loading sampling log from SharePoint...</p>
                              </div>
                            ) : (samplingLogsFromSharePoint[set.id] && samplingLogsFromSharePoint[set.id].length > 0) ? (
                              // Display logs from SharePoint (most recent first)
                              samplingLogsFromSharePoint[set.id].slice().reverse().map((logEntry: any, index: number) => {
                                // Determine if this is a "number" method log (Simple Random Sampling with only number_of_samples, no performance_materiality)
                                const isNumberMethod = logEntry["sampling type"] === "Simple Random Sampling" && 
                                                      !logEntry["performance_materiality"] && 
                                                      logEntry["number_of_samples"] !== undefined;
                                
                                return (
                                  <div key={index} className="border rounded-lg p-4 space-y-3">
                                    <h3 className="font-semibold text-lg mb-4">
                                      {logEntry["sampling type"] || "Sampling Log"} - Entry {samplingLogsFromSharePoint[set.id].length - index}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      {isNumberMethod ? (
                                        // For "Number of Samples" method, show only these 4 fields
                                        <>
                                          <div>
                                            <Label className="text-sm text-muted-foreground">Random Sampling</Label>
                                            <p className="font-medium">Simple Random Sampling</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm text-muted-foreground">Date & Time</Label>
                                            <p className="font-medium">{logEntry["date_time"] || "N/A"}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm text-muted-foreground">Number of samples</Label>
                                            <p className="font-medium">{logEntry["number_of_samples"] || "N/A"}</p>
                                          </div>
                                        </>
                                      ) : (
                                        // For "Calculator" and "MUS" methods, show all relevant fields
                                        <>
                                          <div>
                                            <Label className="text-sm text-muted-foreground">Date & Time</Label>
                                            <p className="font-medium">{logEntry["date_time"] || "N/A"}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm text-muted-foreground">Sampling Type</Label>
                                            <p className="font-medium">{logEntry["sampling type"] || "N/A"}</p>
                                          </div>
                                          {logEntry["performance_materiality"] !== undefined && logEntry["performance_materiality"] > 0 && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">Performance Materiality</Label>
                                              <p className="font-medium">
                                                {logEntry["performance_materiality"] 
                                                  ? `₹${Number(logEntry["performance_materiality"]).toLocaleString('en-IN')}` 
                                                  : "N/A"}
                                              </p>
                                            </div>
                                          )}
                                          {logEntry["assessed_risk"] && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">Assessed Risk</Label>
                                              <p className="font-medium capitalize">{logEntry["assessed_risk"] || "N/A"}</p>
                                            </div>
                                          )}
                                          {logEntry["reliance_on_controls"] && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">Reliance on Controls</Label>
                                              <p className="font-medium">{logEntry["reliance_on_controls"] || "N/A"}</p>
                                            </div>
                                          )}
                                          {logEntry["amount_column"] && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">Amount Column</Label>
                                              <p className="font-medium">{logEntry["amount_column"] || "N/A"}</p>
                                            </div>
                                          )}
                                          {logEntry["type_of_items"] && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">Type of Items</Label>
                                              <p className="font-medium capitalize">{logEntry["type_of_items"] || "N/A"}</p>
                                            </div>
                                          )}
                                          {logEntry["total_amount"] !== undefined && logEntry["total_amount"] > 0 && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">Total Amount</Label>
                                              <p className="font-medium">
                                                {logEntry["total_amount"] 
                                                  ? `₹${Number(logEntry["total_amount"]).toLocaleString('en-IN')}` 
                                                  : "N/A"}
                                              </p>
                                            </div>
                                          )}
                                          {logEntry["net_population_subject_to_sampling"] !== undefined && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">Net Population Subject to Sampling</Label>
                                              <p className="font-medium">
                                                {logEntry["net_population_subject_to_sampling"] !== undefined
                                                  ? Number(logEntry["net_population_subject_to_sampling"]).toLocaleString('en-IN')
                                                  : "N/A"}
                                              </p>
                                            </div>
                                          )}
                                          {logEntry["number_of_samples"] !== undefined && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">Number of Samples</Label>
                                              <p className="font-medium text-lg">{logEntry["number_of_samples"] || "N/A"}</p>
                                            </div>
                                          )}
                                          {logEntry["high_value_samples"] !== undefined && logEntry["high_value_samples"] > 0 && (
                                            <div>
                                              <Label className="text-sm text-muted-foreground">High Value Samples</Label>
                                              <p className="font-medium">{logEntry["high_value_samples"] || "N/A"}</p>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : samplingLogs[set.id] ? (
                              // Fallback to local log if SharePoint log not available
                              <div className="space-y-4">
                                <div className="border rounded-lg p-4 space-y-3">
                                  <h3 className="font-semibold text-lg mb-4">
                                    {samplingLogs[set.id].method === "mus" 
                                      ? "Monetary Unit Sampling Log" 
                                      : "Simple Random Sampling Log"}
                                  </h3>
                                  
                                  {samplingLogs[set.id].method === "number" ? (
                                    // Number method log - show only these 4 fields
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Random Sampling</Label>
                                          <p className="font-medium">Simple Random Sampling</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Date & Time</Label>
                                          <p className="font-medium">{formatIndianDateTime(samplingLogs[set.id].dateTime)}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Number of samples</Label>
                                          <p className="font-medium">{samplingLogs[set.id].numberOfSamples || "N/A"}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : samplingLogs[set.id].method === "calculator" ? (
                                    // Calculator method log
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Random Sampling</Label>
                                          <p className="font-medium">Simple Random Sampling</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Date & Time</Label>
                                          <p className="font-medium">{formatIndianDateTime(samplingLogs[set.id].dateTime)}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Performance materiality</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].performanceMateriality 
                                              ? `₹${samplingLogs[set.id].performanceMateriality.toLocaleString('en-IN')}` 
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Assessed Risk</Label>
                                          <p className="font-medium capitalize">
                                            {samplingLogs[set.id].assessedRisk || "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Reliance on controls</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].relianceOnControls === "relying" 
                                              ? "Relying on Controls" 
                                              : samplingLogs[set.id].relianceOnControls === "not-relying"
                                              ? "Not Relying on Controls"
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Amount Column</Label>
                                          <p className="font-medium">{samplingLogs[set.id].amountColumn || "N/A"}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Type of items</Label>
                                          <p className="font-medium capitalize">
                                            {samplingLogs[set.id].typeOfItems === "positive"
                                              ? "Positive"
                                              : samplingLogs[set.id].typeOfItems === "negative"
                                              ? "Negative"
                                              : samplingLogs[set.id].typeOfItems === "all"
                                              ? "All (Absolute)"
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Total Amount</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].totalAmount 
                                              ? `₹${samplingLogs[set.id].totalAmount.toLocaleString('en-IN')}` 
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Net population subject to sampling</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].netPopulationSubjectToSampling !== undefined
                                              ? samplingLogs[set.id].netPopulationSubjectToSampling.toLocaleString('en-IN')
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Number of samples</Label>
                                          <p className="font-medium text-lg">
                                            {samplingLogs[set.id].calculatedNumberOfSamples || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : samplingLogs[set.id].method === "mus" ? (
                                    // MUS method log
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Monetary Unit Sampling</Label>
                                          <p className="font-medium">Monetary Unit Sampling</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Date & Time</Label>
                                          <p className="font-medium">{formatIndianDateTime(samplingLogs[set.id].dateTime)}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Performance materiality</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].performanceMateriality 
                                              ? `₹${samplingLogs[set.id].performanceMateriality.toLocaleString('en-IN')}` 
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Assessed Risk</Label>
                                          <p className="font-medium capitalize">
                                            {samplingLogs[set.id].assessedRisk || "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Reliance on controls</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].relianceOnControls === "relying" 
                                              ? "Relying on Controls" 
                                              : samplingLogs[set.id].relianceOnControls === "not-relying"
                                              ? "Not Relying on Controls"
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Amount Column</Label>
                                          <p className="font-medium">{samplingLogs[set.id].amountColumn || "N/A"}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Type of items</Label>
                                          <p className="font-medium capitalize">
                                            {samplingLogs[set.id].typeOfItems === "positive"
                                              ? "Positive"
                                              : samplingLogs[set.id].typeOfItems === "negative"
                                              ? "Negative"
                                              : samplingLogs[set.id].typeOfItems === "all"
                                              ? "All (Absolute)"
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Total Amount</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].totalAmount 
                                              ? `₹${samplingLogs[set.id].totalAmount.toLocaleString('en-IN')}` 
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Net population subject to sampling</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].netPopulationSubjectToSampling !== undefined
                                              ? samplingLogs[set.id].netPopulationSubjectToSampling.toLocaleString('en-IN')
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">High value samples</Label>
                                          <p className="font-medium">
                                            {samplingLogs[set.id].highValueSamples !== undefined
                                              ? samplingLogs[set.id].highValueSamples
                                              : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm text-muted-foreground">Number of samples</Label>
                                          <p className="font-medium text-lg">
                                            {samplingLogs[set.id].calculatedNumberOfSamples || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No sampling log available for this sample set.</p>
                                <p className="text-sm mt-2">Generate samples to create a sampling log.</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog 
                        open={addSampleManuallyDialogOpen[set.id] || false}
                        onOpenChange={(open) => {
                          setAddSampleManuallyDialogOpen(prev => ({
                            ...prev,
                            [set.id]: open
                          }));
                          if (!open) {
                            setManualSampleData(prev => ({
                              ...prev,
                              [set.id]: { confirmingParty: "", amount: "", recipientName: "", recipientEmail: "" }
                            }));
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full" 
                            variant="secondary"
                            disabled={lockedSamplingMethods[set.id]?.locked}
                            onClick={() => {
                              setAddSampleManuallyDialogOpen(prev => ({
                                ...prev,
                                [set.id]: true
                              }));
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Sample Manually
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add Sample Manually</DialogTitle>
                            <DialogDescription>
                              Add a sample manually to this sample set
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Confirming Party Name *</Label>
                              <Input
                                value={manualSampleData[set.id]?.confirmingParty || ""}
                                onChange={(e) => {
                                  setManualSampleData(prev => ({
                                    ...prev,
                                    [set.id]: {
                                      ...prev[set.id] || { confirmingParty: "", amount: "", recipientName: "", recipientEmail: "" },
                                      confirmingParty: e.target.value
                                    }
                                  }));
                                }}
                                className="mt-2"
                                placeholder="Enter confirming party name"
                              />
                            </div>
                            <div>
                              <Label>Amount</Label>
                              <Input
                                type="number"
                                value={manualSampleData[set.id]?.amount || ""}
                                onChange={(e) => {
                                  setManualSampleData(prev => ({
                                    ...prev,
                                    [set.id]: {
                                      ...prev[set.id] || { confirmingParty: "", amount: "", recipientName: "", recipientEmail: "" },
                                      amount: e.target.value
                                    }
                                  }));
                                }}
                                className="mt-2"
                                placeholder="Enter amount (optional)"
                              />
                            </div>
                            <div>
                              <Label>Recipient *</Label>
                              <Select
                                value={manualSampleData[set.id]?.recipientEmail || ""}
                                onValueChange={(value) => {
                                  const selectedRecipient = getRecipientsFromConfirmations().find(
                                    r => r.email === value
                                  );
                                  if (selectedRecipient) {
                                    setManualSampleData(prev => ({
                                      ...prev,
                                      [set.id]: {
                                        ...prev[set.id] || { confirmingParty: "", amount: "", recipientName: "", recipientEmail: "" },
                                        recipientName: selectedRecipient.name,
                                        recipientEmail: selectedRecipient.email
                                      }
                                    }));
                                  }
                                }}
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Select recipient..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {getRecipientsFromConfirmations().map((recipient) => (
                                    <SelectItem key={recipient.email} value={recipient.email}>
                                      <div className="flex flex-col items-start">
                                        <span className="font-medium">{recipient.name}</span>
                                        <span className="text-xs text-muted-foreground">{recipient.email}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setAddSampleManuallyDialogOpen(prev => ({
                                    ...prev,
                                    [set.id]: false
                                  }));
                                  setManualSampleData(prev => ({
                                    ...prev,
                                    [set.id]: { confirmingParty: "", amount: "", recipientName: "", recipientEmail: "" }
                                  }));
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={async () => {
                                  const data = manualSampleData[set.id];
                                  if (!data || !data.confirmingParty || !data.recipientName || !data.recipientEmail) {
                                    toast({
                                      title: "Validation Error",
                                      description: "Please fill in confirming party name and select a recipient",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  // Find the audit area for this sample set
                                  const auditArea = Object.keys(sampleSets).find(area => 
                                    sampleSets[area].some(s => s.id === set.id)
                                  ) || activeArea;

                                  try {
                                    // Call backend API to generate sample ID and upload to SharePoint
                                    const response = await fetch('http://localhost:3002/api/generate-and-upload-samples', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        samples: [{
                                          confirmingParty: data.confirmingParty,
                                          recipientName: data.recipientName,
                                          recipientEmail: data.recipientEmail,
                                          amount: data.amount || "0"
                                        }],
                                        auditArea: auditArea,
                                        sampleSetName: set.name,
                                      }),
                                    });

                                    const result = await response.json();

                                    if (result.success && result.generatedIds && result.generatedIds.length > 0) {
                                      const generatedSampleId = result.generatedIds[0];
                                      
                                      // Create sample object with the generated ID
                                      const newSample: Sample = {
                                        id: generatedSampleId,
                                        sampleSetId: set.id,
                                        confirmingParty: data.confirmingParty,
                                        amount: data.amount || "",
                                        recipientName: data.recipientName,
                                        recipientEmail: data.recipientEmail,
                                      };

                                      // Update local state
                                      setGeneratedSamples(prev => {
                                        const updated = {
                                          ...prev,
                                          [set.id]: [...(prev[set.id] || []), newSample]
                                        };
                                        
                                        // Update sample set with new sample count
                                        setSampleSets(prevSets => {
                                          const updatedSets = { ...prevSets };
                                          Object.keys(updatedSets).forEach(area => {
                                            updatedSets[area] = updatedSets[area].map(s => 
                                              s.id === set.id 
                                                ? { ...s, sampleSize: updated[set.id].length }
                                                : s
                                            );
                                          });
                                          return updatedSets;
                                        });
                                        
                                        return updated;
                                      });

                                      // Also update samplesFromJson to ensure it appears in "View Sample"
                                      // Refresh confirmation data for this area
                                      const updatedConfirmationData = await fetchConfirmationData(auditArea);
                                      
                                      // Convert the updated confirmation data to samples and update samplesFromJson
                                      const updatedSamples = convertConfirmationDataToSamples(set.id, updatedConfirmationData);
                                      setSamplesFromJson(prev => ({
                                        ...prev,
                                        [set.id]: updatedSamples
                                      }));

                                      setAddSampleManuallyDialogOpen(prev => ({
                                        ...prev,
                                        [set.id]: false
                                      }));
                                      setManualSampleData(prev => ({
                                        ...prev,
                                        [set.id]: { confirmingParty: "", amount: "", recipientName: "", recipientEmail: "" }
                                      }));

                                      toast({
                                        title: "Success",
                                        description: `Sample added successfully with ID: ${generatedSampleId}`,
                                      });
                                    } else {
                                      throw new Error(result.message || 'Failed to add sample');
                                    }
                                  } catch (error: any) {
                                    console.error('Error adding manual sample:', error);
                                    toast({
                                      title: "Error",
                                      description: `Failed to add sample: ${error.message || 'Unknown error'}`,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Add Sample
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!sampleSets[activeArea] || sampleSets[activeArea].length === 0) && !showNewSetForm && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Sample Sets</h3>
            <p className="text-muted-foreground mb-4">Create a sample set to get started</p>
            <Button onClick={() => setShowNewSetForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Sample Set
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
