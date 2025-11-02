import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, FileText, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";

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

  // Handle autofill template to all samples in the sample set
  const handleAutofillTemplate = (templateId: string) => {
    if (!selectedSampleSetId) return;
    const samples = getSamplesForSet(selectedSampleSetId);
    const newSelections: Record<string, string> = {};
    samples.forEach(sample => {
      newSelections[sample.id] = templateId;
    });
    setSampleTemplateSelections(prev => ({
      ...prev,
      ...newSelections
    }));
  };

  // Create custom template
  const handleCreateCustomTemplate = () => {
    if (newTemplateName && newTemplateContent) {
      const newTemplate: AuthorizationTemplate = {
        id: `TMPL-CUSTOM-${Date.now()}`,
        name: newTemplateName,
        content: newTemplateContent,
        type: "custom",
        engagementId: "ENG-001" // In real app, get from engagement context
      };
      setCustomTemplates(prev => [...prev, newTemplate]);
      setNewTemplateName("");
      setNewTemplateContent("");
      setShowCustomTemplateForm(false);
    }
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
                            {/* Template Selection Section */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Available Templates</h3>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCustomTemplateForm(!showCustomTemplateForm)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Custom Template
                                </Button>
                              </div>

                              {/* Custom Template Creation Form */}
                              {showCustomTemplateForm && (
                                <Card className="border-2 border-primary">
                                  <CardHeader>
                                    <CardTitle className="text-base">Create Custom Template</CardTitle>
                                    <CardDescription>
                                      This template will be available for all confirmations in this engagement.
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <Label>Template Name</Label>
                                      <Input
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder="e.g., Formal Bank Confirmation Template"
                                      />
                                    </div>
                                    <div>
                                      <Label>Template Content</Label>
                                      <Textarea
                                        value={newTemplateContent}
                                        onChange={(e) => setNewTemplateContent(e.target.value)}
                                        placeholder="Enter the template content here..."
                                        rows={8}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button onClick={handleCreateCustomTemplate}>
                                        Create Template
                                      </Button>
                                      <Button 
                                        variant="outline"
                                        onClick={() => {
                                          setShowCustomTemplateForm(false);
                                          setNewTemplateName("");
                                          setNewTemplateContent("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Templates List */}
                              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                                {getAllTemplates().map((template) => (
                                  <div 
                                    key={template.id}
                                    className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted"
                                  >
                                    <RadioGroup
                                      value={selectedSampleId && sampleTemplateSelections[selectedSampleId] === template.id ? template.id : undefined}
                                      onValueChange={(value) => {
                                        if (selectedSampleId) {
                                          handleTemplateSelection(selectedSampleId, value);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value={template.id} id={template.id} />
                                        <Label htmlFor={template.id} className="cursor-pointer flex-1">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">{template.name}</span>
                                              <Badge variant={template.type === "inbuilt" ? "default" : "secondary"}>
                                                {template.type === "inbuilt" ? "Inbuilt" : "Custom"}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                              {template.content}
                                            </p>
                                          </div>
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                    {!selectedSampleId && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAutofillTemplate(template.id)}
                                      >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Autofill to All
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Samples List */}
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
                                      const selectedTemplateId = sampleTemplateSelections[sample.id];
                                      const selectedTemplate = selectedTemplateId 
                                        ? getAllTemplates().find(t => t.id === selectedTemplateId)
                                        : null;
                                      
                                      return (
                                        <TableRow 
                                          key={sample.id}
                                          className={selectedSampleId === sample.id ? "bg-muted" : ""}
                                          onClick={() => setSelectedSampleId(sample.id)}
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
                                            {selectedTemplate ? (
                                              <Badge variant="outline">{selectedTemplate.name}</Badge>
                                            ) : (
                                              <span className="text-sm text-muted-foreground">Not selected</span>
                                            )}
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
