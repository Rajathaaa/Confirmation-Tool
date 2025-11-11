import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, FileText, Trash2, Download, GripVertical, MoveUp, MoveDown } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { MoreVertical, Split, Merge, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { formatIndianDate, parseIndianDate, cn } from "@/lib/utils";

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

interface SampleSet {
  id: string;
  name: string;
  fileName: string;
  samplingMethod: "random" | "mus";
  sampleSize: number;
  populationSize: number;
  status: "pending" | "generated";
  samples?: Sample[]; // Individual samples within the set
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
const INBUILT_TEMPLATES: AuthorizationTemplate[] = [
  {
    id: "TMPL-001",
    name: "Standard Authorization Template",
    content: "This is a standard authorization letter template for confirmation requests...",
    type: "inbuilt"
  },
  {
    id: "TMPL-002",
    name: "Formal Authorization Template",
    content: "This is a formal authorization letter template...",
    type: "inbuilt"
  },
  {
    id: "TMPL-003",
    name: "Brief Authorization Template",
    content: "This is a brief authorization letter template...",
    type: "inbuilt"
  }
];

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
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Trade Receivables"]);
  const [activeArea, setActiveArea] = useState("Trade Receivables");
  const [sampleSets, setSampleSets] = useState<Record<string, SampleSet[]>>({
    "Trade Receivables": [
      {
        id: "SS-001",
        name: "Q4 Receivables Sample",
        fileName: "receivables_data.xlsx",
        samplingMethod: "mus",
        sampleSize: 45,
        populationSize: 1250,
        status: "generated"
      }
    ]
  });

  const [newSetName, setNewSetName] = useState("");
  const [showNewSetForm, setShowNewSetForm] = useState(false);

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

  const addArea = (area: string) => {
    if (!selectedAreas.includes(area)) {
      setSelectedAreas([...selectedAreas, area]);
      setSampleSets({ ...sampleSets, [area]: [] });
    }
  };

  const addSampleSet = () => {
    if (newSetName && activeArea) {
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

  // Handle "Generate Authorization Letter" button click
  const handleGenerateAuthorizationLetter = (sampleSetId: string) => {
    setSelectedSampleSetId(sampleSetId);
    setTemplateSelectionDialogOpen(true);
    
    // Ensure samples are generated for this set
    const sampleSet = Object.values(sampleSets)
      .flat()
      .find(set => set.id === sampleSetId);
    
    if (sampleSet && sampleSet.status === "generated") {
      const samples = generateSamplesForSet(sampleSet);
      // Update sample sets with generated samples
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
    }
  };

  // Get samples for a sample set
  const getSamplesForSet = (sampleSetId: string): Sample[] => {
    const sampleSet = Object.values(sampleSets)
      .flat()
      .find(set => set.id === sampleSetId);
    return sampleSet?.samples || [];
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
  const handleGenerateLetters = () => {
    if (!selectedSampleSetId) return;
    
    const samples = getSamplesForSet(selectedSampleSetId);
    const templates = getAllTemplates();
    
    // Validate all samples have templates selected
    const samplesWithoutTemplates = samples.filter(
      sample => !sampleTemplateSelections[sample.id]
    );
    
    if (samplesWithoutTemplates.length > 0) {
      alert("Please select a template for all samples before generating letters.");
      return;
    }

    // Generate authorization letters (in real app, this would create the letters)
    console.log("Generating authorization letters with templates:", sampleTemplateSelections);
    
    // Close dialog and reset
    setTemplateSelectionDialogOpen(false);
    setSelectedSampleSetId(null);
    setSampleTemplateSelections({});
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
            {selectedAreas.map((area) => (
              <Button
                key={area}
                variant={activeArea === area ? "default" : "outline"}
                className="w-full justify-start text-sm"
                onClick={() => setActiveArea(area)}
              >
                {area}
              </Button>
            ))}
            <Select onValueChange={addArea}>
              <SelectTrigger>
                <SelectValue placeholder="Add Area" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_AREAS.filter(area => !selectedAreas.includes(area)).map((area) => (
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
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        {set.fileName || "Choose File"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Sampling Method</Label>
                    <Select defaultValue={set.samplingMethod}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random Sampling</SelectItem>
                        <SelectItem value="mus">Monetary Unit Sampling (MUS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {set.status === "generated" && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-muted-foreground">Population Size</Label>
                      <p className="text-lg font-semibold">{set.populationSize}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Sample Size</Label>
                      <p className="text-lg font-semibold">{set.sampleSize}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Sampling %</Label>
                      <p className="text-lg font-semibold">
                        {((set.sampleSize / set.populationSize) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {set.status === "pending" ? (
                    <Button className="w-full">Generate Samples</Button>
                  ) : (
                    <>
                      <Button className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample
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
                            Generate Authorization Letter
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
                                                                {element.tableData.headerRow.cells.map((cell, colIndex) => (
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
                                                                      
                                                                      {/* Configuration Panel - Inside Header */}
                                                                      {selectedCellForConfig?.elementId === element.id && 
                                                                       selectedCellForConfig?.cellId === cell.id && 
                                                                       selectedCellForConfig?.isHeader && (
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
                                                                ))}
                                                              </tr>
                                                            </thead>
                                                            {/* Data Rows */}
                                                            <tbody>
                                                              {element.tableData.dataRows.map((row, rowIndex) => (
                                                                <tr key={row.id} className="group">
                                                                  {row.cells.map((cell, colIndex) => (
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
                                                                        {selectedCellForConfig?.elementId === element.id && 
                                                                         selectedCellForConfig?.cellId === cell.id && 
                                                                         selectedCellForConfig?.rowId === row.id &&
                                                                         !selectedCellForConfig?.isHeader && (
                                                                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                              <Label className="text-xs font-semibold">Configure Cell</Label>
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
                                                                            <div>
                                                                              <Label className="text-xs mb-1 block">Cell Type</Label>
                                                                              <Select
                                                                                value={cell.cellType}
                                                                                onValueChange={(value: "text" | "calendar" | "customDropdown") => {
                                                                                  updateTableCell(
                                                                                    element.id,
                                                                                    row.id,
                                                                                    cell.id,
                                                                                    { cellType: value }
                                                                                  );
                                                                                  if (value === "customDropdown") {
                                                                                    setEditingCellForDropdown({
                                                                                      elementId: element.id,
                                                                                      rowId: row.id,
                                                                                      cellId: cell.id,
                                                                                      isHeader: false
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
                                                                          </div>
                                                                        )}
                                                                        
                                                                        {/* Visual Indicators - only show when not selected */}

                                                                      </div>
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

                            {/* Samples List - KEEP AS IS */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Samples in This Set</h3>
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
                                    {getSamplesForSet(set.id).map((sample) => {
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
                                            <div>
                                              <p className="font-medium">{sample.recipientName}</p>
                                              <p className="text-xs text-muted-foreground">{sample.recipientEmail}</p>
                                            </div>
                                          </TableCell>
                                          <TableCell>{sample.amount}</TableCell>
                                          <TableCell>
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
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
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
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
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
